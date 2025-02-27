'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Pencil, Trash2, User } from 'lucide-react'
import { User as UserType, Unit, NurseView } from '@/types'
import { supabase } from '@/lib/supabase'
import { NurseDialog } from '@/components/dialogs/NurseDialog'
import { toast } from '@/components/ui/use-toast'
import { DeleteAlertDialog } from '@/components/ui/delete-alert-dialog'
import { useUser } from '@/contexts/UserContext'

export function NursesTab() {
  const { currentUser } = useUser()
  const [showDialog, setShowDialog] = useState(false)
  const [unidades, setUnidades] = useState<Unit[]>([])
  const [nurses, setNurses] = useState<NurseView[]>([])
  const [selectedNurse, setSelectedNurse] = useState<UserType | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [nurseToDelete, setNurseToDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchUnidades()
    fetchNurses()
  }, [])

  const fetchUnidades = async () => {
    const { data, error } = await supabase
      .from('unidade')
      .select('*')
      .eq('status', true)
      .order('nome')

    if (error) {
      console.error('Erro ao buscar unidades:', error)
      return
    }

    if (data) {
      setUnidades(data)
    }
  }

  const fetchNurses = async () => {
    try {
      const { data, error } = await supabase
        .from('user_unidade_view')
        .select('*')
        .order('user_name')

      if (error) {
        console.error('Erro detalhado:', error)
        throw error
      }

      if (data) {
        console.log('Enfermeiras com unidades:', data)
        setNurses(data)
      }
    } catch (error) {
      console.error('Erro completo:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar enfermeiras"
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      if (!currentUser?.id) {
        throw new Error('Usuário não autenticado')
      }

      // Usa a função RPC que vai excluir do auth.users e depois da tabela user
      const { error: deleteError } = await supabase.rpc('delete_user_if_admin', {
        p_admin_id: currentUser.id,
        p_user_id: id
      })

      if (deleteError) {
        console.error('Erro ao deletar:', deleteError)
        throw new Error(deleteError.message || 'Erro ao remover enfermeira')
      }

      toast({
        title: "Sucesso",
        description: "Enfermeira removida com sucesso"
      })

      fetchNurses()
    } catch (error: any) {
      console.error('Erro completo:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover enfermeira"
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Gerenciar Enfermeiras</h2>
        <Button onClick={() => setShowDialog(true)}>
              <PlusCircle className="h-5 w-5 mr-2" />
              Adicionar Enfermeira
            </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Unidades</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {nurses.map((nurse) => (
              <TableRow key={nurse.user_id}>
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    {nurse.user_name}
                  </div>
                </TableCell>
                <TableCell>{nurse.user_email}</TableCell>
                <TableCell>
                  {nurse.unidade_names?.join(', ') || '-'}
                </TableCell>
                <TableCell>
                  {nurse.user_is_active }
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedNurse({
                          id: nurse.user_id,
                          nome: nurse.user_name,
                          email: nurse.user_email,
                          role: 'enfermeira',
                          is_active: nurse.user_is_active === 'Ativo',
                          units: nurse.units || [],
                          user_role_id: nurse.role_id
                        } as UserType)
                        setShowDialog(true)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setNurseToDelete(nurse.user_id)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <NurseDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onSuccess={fetchNurses}
        units={unidades}
        nurse={selectedNurse}
      />

      <DeleteAlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open)
          if (!open) setNurseToDelete(null)
        }}
        onConfirm={() => {
          if (nurseToDelete) {
            handleDelete(nurseToDelete)
            setDeleteDialogOpen(false)
            setNurseToDelete(null)
          }
        }}
        title="Excluir Enfermeira"
        description="Tem certeza que deseja excluir esta enfermeira? Esta ação não pode ser desfeita."
      />
    </div>
  )
}

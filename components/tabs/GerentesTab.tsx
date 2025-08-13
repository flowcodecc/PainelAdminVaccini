'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Briefcase, Pencil, Trash2 } from 'lucide-react'
import { User as UserType, NurseView } from '@/types'
import { supabase } from '@/lib/supabase'
import { GerenteDialog } from '@/components/dialogs/GerenteDialog'
import { toast } from '@/components/ui/use-toast'
import { DeleteAlertDialog } from "@/components/ui/delete-alert-dialog"
import { useUser } from '@/contexts/UserContext'
import { useUserUnitsFilter } from '@/hooks/useUserUnitsFilter'

export function GerentesTab() {
  const [showDialog, setShowDialog] = useState(false)
  const [gerentes, setGerentes] = useState<NurseView[]>([])
  const [selectedGerente, setSelectedGerente] = useState<UserType | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [gerenteToDelete, setGerenteToDelete] = useState<string | null>(null)
  const { currentUser } = useUser()
  const { getUnitsFilter } = useUserUnitsFilter()

  useEffect(() => {
    fetchGerentes()
  }, [])

  const fetchGerentes = async () => {
    try {
      // Primeiro busca os gerentes básicos da view
      const { data, error } = await supabase
        .from('user_unidadegerente_view')
        .select('user_id, user_name, user_email, user_is_active, unidade_names')
        .order('user_name')

      if (error) {
        console.error('Erro detalhado:', error)
        throw error
      }

      if (data) {
        // Agora busca os units de cada gerente da tabela user
        const gerentesWithUnits = await Promise.all(
          data.map(async (gerente) => {
            const { data: userData, error: userError } = await supabase
              .from('user')
              .select('units')
              .eq('id', gerente.user_id)
              .single()

            if (userError) {
              console.error('Erro ao buscar units do gerente:', userError)
              return null
            }

            return {
              user_id: gerente.user_id,
              user_name: gerente.user_name,
              user_email: gerente.user_email,
              user_is_active: gerente.user_is_active,
              role_id: 3,
              unidade_names: gerente.unidade_names ? [gerente.unidade_names] : [],
              units: userData?.units || []
            }
          })
        )

        // Remove gerentes que não puderam ser carregados
        const validGerentes = gerentesWithUnits.filter(g => g !== null)

        // Aplica filtro de unidades para gerentes (um gerente só vê outros gerentes das suas unidades)
        const unitsFilter = getUnitsFilter()
        let filteredGerentes = validGerentes
        
        if (unitsFilter) {
          filteredGerentes = validGerentes.filter(gerente => {
            // Verifica se o gerente gerencia pelo menos uma das unidades permitidas
            return gerente.units && gerente.units.some((unitId: number) => 
              unitsFilter.in.includes(unitId)
            )
          })
        }

        console.log('Gerentes filtrados:', filteredGerentes)
        setGerentes(filteredGerentes)
      }
    } catch (error) {
      console.error('Erro completo:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar gerentes"
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      if (!currentUser?.id) {
        throw new Error('Usuário não autenticado')
      }

      // Primeiro exclui do auth usando a função RPC
      const { error: authError } = await supabase.rpc('delete_user_if_admin', {
        p_admin_id: currentUser.id,
        p_user_id: id
      })

      if (authError) {
        console.error('Erro ao deletar do auth:', authError)
        throw authError
      }

      // Depois exclui da tabela user
      const { error: userError } = await supabase
        .from('user')
        .delete()
        .eq('id', id)

      if (userError) {
        console.error('Erro ao deletar da tabela user:', userError)
        throw userError
      }

      toast({
        title: "Sucesso",
        description: "Gerente removido com sucesso"
      })

      fetchGerentes()
    } catch (error: any) {
      console.error('Erro completo ao deletar:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover gerente"
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Gerenciar Gerentes</h2>
        <Button onClick={() => setShowDialog(true)}>
          Adicionar Gerente
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
            {gerentes.map((gerente) => (
              <TableRow key={gerente.user_id}>
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    <Briefcase className="h-5 w-5 mr-2" />
                    {gerente.user_name}
                  </div>
                </TableCell>
                <TableCell>{gerente.user_email}</TableCell>
                <TableCell>
                  {gerente.unidade_names.join(', ') || '-'}
                </TableCell>
                <TableCell>
                  {gerente.user_is_active}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedGerente({
                          id: gerente.user_id,
                          nome: gerente.user_name,
                          email: gerente.user_email,
                          role: 'gerente',
                          is_active: gerente.user_is_active === 'Ativo',
                          units: [],
                          user_role_id: 3
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
                        setGerenteToDelete(gerente.user_id)
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

      <GerenteDialog
        isOpen={showDialog}
        onClose={() => {
          setShowDialog(false)
          setSelectedGerente(null)
        }}
        onSuccess={() => {
          setShowDialog(false)
          setSelectedGerente(null)
          fetchGerentes()
        }}
        gerente={selectedGerente}
      />

      <DeleteAlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => {
          if (gerenteToDelete) {
            handleDelete(gerenteToDelete)
            setDeleteDialogOpen(false)
            setGerenteToDelete(null)
          }
        }}
        title="Excluir Gerente"
        description="Tem certeza que deseja excluir este gerente? Esta ação não pode ser desfeita."
      />
    </div>
  )
} 
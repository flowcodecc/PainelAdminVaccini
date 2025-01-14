'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { VaccineDialog } from "../dialogs/VaccineDialog"
import { supabase } from "@/lib/supabase"
import { User } from '@/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Pencil, Trash2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { DeleteAlertDialog } from "@/components/ui/alert-dialog"

interface VaccinesTabProps {
  currentUser: User
}

interface Vaccine {
  vacina_id: number
  vacina_nome: string
  preco: number
  valor_plano: number
  valor_protecao: number
  status: string
  total_doses: number
  esquema_id: number | null
  percentual: number
}

export function VaccinesTab({ currentUser }: VaccinesTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [vaccines, setVaccines] = useState<Vaccine[]>([])
  const [selectedVaccine, setSelectedVaccine] = useState<Vaccine | undefined>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [vaccineToDelete, setVaccineToDelete] = useState<number | null>(null)

  useEffect(() => {
    fetchVaccines()
  }, [])

  const fetchVaccines = async () => {
    const { data } = await supabase
      .from('vw_vacinas_esquemas')
      .select('*')
      .order('vacina_id', { ascending: true })
    
    if (data) {
      setVaccines(data)
    }
  }

  const handleSuccess = () => {
    fetchVaccines()
  }

  const handleDelete = async (id: number) => {
    try {
      // Verificar se existem agendamentos nas duas tabelas
      const { data: agendamentos1 } = await supabase
        .from('agendamento')
        .select('id')
        .eq('vacina_id', id)
        .limit(1)

      const { data: agendamentos2 } = await supabase
        .from('agendamento_paciente_vacinas')
        .select('id')
        .eq('vacina_id', id)
        .limit(1)

      if ((agendamentos1?.length ?? 0) > 0 || (agendamentos2?.length ?? 0) > 0) {
        throw new Error('Não é possível excluir esta vacina pois existem agendamentos relacionados.')
      }

      // Verificar e excluir esquema
      const { data: esquema } = await supabase
        .from('esquema')
        .select('id')
        .eq('vacina_id', id)

      if (esquema && esquema.length > 0) {
        const { error: esquemaError } = await supabase
          .from('esquema')
          .delete()
          .eq('vacina_id', id)

        if (esquemaError) throw esquemaError
      }

      // Excluir a vacina
      const { error: vacinaError } = await supabase
        .from('ref_vacinas')
        .delete()
        .eq('ref_vacinasID', id)

      if (vacinaError) throw vacinaError

      toast({
        title: "Sucesso!",
        description: "Vacina excluída com sucesso",
      })

      fetchVaccines()
    } catch (error: any) {
      console.error('Erro completo:', error)
      const errorMessage = error.message || error.details || error.hint || "Erro ao excluir vacina. Tente novamente."
      toast({
        title: "Erro",
        description: errorMessage
      })
    }
  }

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h2 className="text-2xl font-bold">Vacinas</h2>
        <Button onClick={() => setIsDialogOpen(true)}>
          Adicionar Vacina
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Preço</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Valor do Plano</TableHead>
            <TableHead>Doses</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vaccines.map((vaccine) => (
            <TableRow key={vaccine.vacina_id}>
              <TableCell>{vaccine.vacina_nome}</TableCell>
              <TableCell>R$ {vaccine.preco.toFixed(2)}</TableCell>
              <TableCell>{vaccine.status}</TableCell>
              <TableCell>
                {vaccine.valor_plano 
                  ? `R$ ${vaccine.valor_plano.toFixed(2)}` 
                  : 'Não aplicável'
                }
              </TableCell>
              <TableCell>
                {vaccine.total_doses > 0 ? `${vaccine.total_doses} doses` : 'Não'}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedVaccine(vaccine)
                      setIsDialogOpen(true)
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      setVaccineToDelete(vaccine.vacina_id)
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

      <VaccineDialog 
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          setSelectedVaccine(undefined)
        }}
        onSuccess={handleSuccess}
        vaccine={selectedVaccine}
      />

      <DeleteAlertDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false)
          setVaccineToDelete(null)
        }}
        onConfirm={() => {
          if (vaccineToDelete) {
            handleDelete(vaccineToDelete)
            setDeleteDialogOpen(false)
            setVaccineToDelete(null)
          }
        }}
        title="Excluir Vacina"
        description="Tem certeza que deseja excluir esta vacina? Esta ação não pode ser desfeita."
      />
    </div>
  )
}


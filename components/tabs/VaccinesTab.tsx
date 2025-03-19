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
  currentUser?: User
  onPriceChange?: () => void
}

interface Vaccine {
  vacina_id: number
  vacina_nome: string
  preco: number
  status: string
  total_doses?: number
}

export function VaccinesTab({ currentUser, onPriceChange }: VaccinesTabProps = {}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [vaccines, setVaccines] = useState<Vaccine[]>([])
  const [selectedVaccine, setSelectedVaccine] = useState<Vaccine | undefined>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [vaccineToDelete, setVaccineToDelete] = useState<number | null>(null)
  const [vaccinesToUpdate, setVaccinesToUpdate] = useState<Vaccine[]>([])

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

  const handleSuccess = async () => {
    try {
      await fetchVaccines()
      onPriceChange?.()
    } catch (error) {
      console.error('Erro:', error)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      // Como temos ON DELETE CASCADE, só precisamos deletar a vacina
      const { error: vacinaError } = await supabase
        .from('ref_vacinas')
        .delete()
        .eq('ref_vacinasID', id)

      if (vacinaError) {
        console.error('Erro ao excluir vacina:', vacinaError)
        throw new Error('Erro ao excluir vacina')
      }

      toast({
        title: "Sucesso!",
        description: "Vacina excluída com sucesso",
      })

      fetchVaccines()
    } catch (error: any) {
      console.error('Erro:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir vacina. Tente novamente.",
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
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vaccines.map((vaccine) => (
            <TableRow key={vaccine.vacina_id}>
              <TableCell>{vaccine.vacina_nome}</TableCell>
              <TableCell>R$ {vaccine.preco.toFixed(2)}</TableCell>
              <TableCell>{vaccine.status === 'Ativo' ? 'Ativo' : 'Inativo'}</TableCell>
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
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open)
          if (!open) setVaccineToDelete(null)
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


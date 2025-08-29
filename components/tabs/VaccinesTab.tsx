'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { VaccineDialog } from "../dialogs/VaccineDialog"
import { supabase } from "@/lib/supabase"
import { User } from '@/types'
import { useUserUnitsFilter } from '@/hooks/useUserUnitsFilter'
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
import { Checkbox } from "@/components/ui/checkbox"

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
  const { getUnitsFilter } = useUserUnitsFilter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [vaccines, setVaccines] = useState<Vaccine[]>([])
  const [selectedVaccine, setSelectedVaccine] = useState<Vaccine | undefined>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [vaccineToDelete, setVaccineToDelete] = useState<number | null>(null)
  const [vaccinesToUpdate, setVaccinesToUpdate] = useState<Vaccine[]>([])
  const [selectedVaccines, setSelectedVaccines] = useState<number[]>([])
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [forceDeleteDialogOpen, setForceDeleteDialogOpen] = useState(false)
  const [vaccineToForceDelete, setVaccineToForceDelete] = useState<{id: number, dependencies: string[]} | null>(null)

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
      // Primeiro, verificar se a vacina está sendo usada em listas
      const { data: listDependencies, error: listDepError } = await supabase
        .from('vaccine_list_items')
        .select(`
          id,
          vaccine_list:vaccine_lists(nome)
        `)
        .eq('vaccine_id', id)

      if (listDepError) {
        console.error('Erro ao verificar dependências de lista:', listDepError)
        throw new Error('Erro ao verificar dependências da vacina')
      }

      // Segundo, verificar se a vacina está sendo usada em unidades
      const { data: unitDependencies, error: unitDepError } = await supabase
        .from('unit_vaccines')
        .select(`
          id,
          unidade:unidade(nome)
        `)
        .eq('vaccine_id', id)

      if (unitDepError) {
        console.error('Erro ao verificar dependências de unidade:', unitDepError)
        throw new Error('Erro ao verificar dependências da vacina')
      }

      const allDependencies: string[] = []
      
      if (listDependencies && listDependencies.length > 0) {
        const listNames = listDependencies
          .map((dep: any) => dep.vaccine_list?.nome)
          .filter((name: any): name is string => Boolean(name))
        allDependencies.push(...listNames.map(name => `Lista: ${name}`))
      }

      if (unitDependencies && unitDependencies.length > 0) {
        const unitNames = unitDependencies
          .map((dep: any) => dep.unidade?.nome)
          .filter((name: any): name is string => Boolean(name))
        allDependencies.push(...unitNames.map(name => `Unidade: ${name}`))
      }

      if (allDependencies.length > 0) {
        setVaccineToForceDelete({ id, dependencies: allDependencies })
        setForceDeleteDialogOpen(true)
        return
      }

      // Se não há dependências, excluir a vacina
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

  const handleForceDelete = async (id: number) => {
    try {
      // Primeiro, remover a vacina de todas as listas
      const { error: removeListError } = await supabase
        .from('vaccine_list_items')
        .delete()
        .eq('vaccine_id', id)

      if (removeListError) {
        console.error('Erro ao remover vacina das listas:', removeListError)
        throw new Error('Erro ao remover vacina das listas')
      }

      // Segundo, remover todas as referências em unit_vaccines
      const { error: removeUnitError } = await supabase
        .from('unit_vaccines')
        .delete()
        .eq('vaccine_id', id)

      if (removeUnitError) {
        console.error('Erro ao remover vacina das unidades:', removeUnitError)
        throw new Error('Erro ao remover vacina das unidades')
      }

      // Terceiro, excluir a vacina
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
        description: "Vacina removida das listas e excluída com sucesso",
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

  const handleSelectAll = () => {
    if (selectedVaccines.length === vaccines.length) {
      setSelectedVaccines([])
    } else {
      setSelectedVaccines(vaccines.map(vaccine => vaccine.vacina_id))
    }
  }

  const handleSelectVaccine = (vaccineId: number) => {
    if (selectedVaccines.includes(vaccineId)) {
      setSelectedVaccines(selectedVaccines.filter(id => id !== vaccineId))
    } else {
      setSelectedVaccines([...selectedVaccines, vaccineId])
    }
  }

  const handleBulkDelete = async () => {
    try {
      const vaccinesToDelete = []
      const vaccinesWithDependencies = []

      // Verificar dependências de todas as vacinas selecionadas
      for (const vaccineId of selectedVaccines) {
        // Verificar dependências em listas
        const { data: listDependencies, error: listDepError } = await supabase
          .from('vaccine_list_items')
          .select(`
            id,
            vaccine_list:vaccine_lists(nome)
          `)
          .eq('vaccine_id', vaccineId)

        // Verificar dependências em unidades
        const { data: unitDependencies, error: unitDepError } = await supabase
          .from('unit_vaccines')
          .select(`
            id,
            unidade:unidade(nome)
          `)
          .eq('vaccine_id', vaccineId)

        if (listDepError || unitDepError) {
          console.error('Erro ao verificar dependências:', listDepError || unitDepError)
          continue
        }

        const allDependencies: string[] = []
        if (listDependencies && listDependencies.length > 0) {
          const listNames = listDependencies
            .map((dep: any) => dep.vaccine_list?.nome)
            .filter((name: any): name is string => Boolean(name))
          allDependencies.push(...listNames.map(name => `Lista: ${name}`))
        }
        if (unitDependencies && unitDependencies.length > 0) {
          const unitNames = unitDependencies
            .map((dep: any) => dep.unidade?.nome)
            .filter((name: any): name is string => Boolean(name))
          allDependencies.push(...unitNames.map(name => `Unidade: ${name}`))
        }

        if (allDependencies.length > 0) {
          const vaccine = vaccines.find(v => v.vacina_id === vaccineId)
          vaccinesWithDependencies.push({
            name: vaccine?.vacina_nome || `ID ${vaccineId}`,
            lists: allDependencies
          })
        } else {
          vaccinesToDelete.push(vaccineId)
        }
      }

      // Mostrar aviso se algumas vacinas não podem ser excluídas
      if (vaccinesWithDependencies.length > 0) {
        const warningMessage = vaccinesWithDependencies
          .map(v => `${v.name} (listas: ${v.lists.join(', ')})`)
          .join('\n')
        
        toast({
          title: "Algumas vacinas não podem ser excluídas",
          description: `As seguintes vacinas estão em uso:\n${warningMessage}`,
        })
      }

      // Excluir apenas as vacinas sem dependências
      if (vaccinesToDelete.length > 0) {
        for (const vaccineId of vaccinesToDelete) {
          const { error: vacinaError } = await supabase
            .from('ref_vacinas')
            .delete()
            .eq('ref_vacinasID', vaccineId)

          if (vacinaError) {
            console.error('Erro ao excluir vacina:', vacinaError)
            throw new Error(`Erro ao excluir vacina ${vaccineId}`)
          }
        }

        toast({
          title: "Sucesso!",
          description: `${vaccinesToDelete.length} vacina(s) excluída(s) com sucesso`,
        })
      }

      setSelectedVaccines([])
      fetchVaccines()
    } catch (error: any) {
      console.error('Erro:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir vacinas. Tente novamente.",
      })
    }
  }

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h2 className="text-2xl font-bold">Vacinas</h2>
        <div className="flex gap-2">
          {selectedVaccines.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={() => setBulkDeleteDialogOpen(true)}
            >
              Excluir Selecionadas ({selectedVaccines.length})
            </Button>
          )}
          <Button onClick={() => setIsDialogOpen(true)}>
            Adicionar Vacina
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={selectedVaccines.length === vaccines.length && vaccines.length > 0}
                onCheckedChange={handleSelectAll}
                aria-label="Selecionar todas as vacinas"
              />
            </TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Preço</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vaccines.map((vaccine) => (
            <TableRow key={vaccine.vacina_id}>
              <TableCell>
                <Checkbox
                  checked={selectedVaccines.includes(vaccine.vacina_id)}
                  onCheckedChange={() => handleSelectVaccine(vaccine.vacina_id)}
                  aria-label={`Selecionar ${vaccine.vacina_nome}`}
                />
              </TableCell>
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

      <DeleteAlertDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={(open) => {
          setBulkDeleteDialogOpen(open)
        }}
        onConfirm={() => {
          handleBulkDelete()
          setBulkDeleteDialogOpen(false)
        }}
        title="Excluir Vacinas Selecionadas"
        description={`Tem certeza que deseja excluir ${selectedVaccines.length} vacina(s) selecionada(s)? Esta ação não pode ser desfeita.`}
      />

      <DeleteAlertDialog
        open={forceDeleteDialogOpen}
        onOpenChange={(open) => {
          setForceDeleteDialogOpen(open)
          if (!open) setVaccineToForceDelete(null)
        }}
        onConfirm={() => {
          if (vaccineToForceDelete) {
            handleForceDelete(vaccineToForceDelete.id)
            setForceDeleteDialogOpen(false)
            setVaccineToForceDelete(null)
          }
        }}
        title="Vacina em uso - Excluir mesmo assim?"
        description={vaccineToForceDelete ? 
          `Esta vacina está sendo usada em: ${vaccineToForceDelete.dependencies.join(', ')}. 
           
          Se continuar, a vacina será removida de todas as listas e unidades onde está sendo usada, e depois excluída permanentemente. 
          
          Esta ação não pode ser desfeita. Deseja continuar?` : ''}
      />
    </div>
  )
}


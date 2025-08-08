'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"
import type { User, Unit } from "@/types"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Pencil, Trash2, Clock } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ScheduleDialog } from "@/components/dialogs/ScheduleDialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { UnitDialog } from "@/components/dialogs/UnitDialog"

interface UnitsTabProps {
  currentUser: User
}

export function UnitsTab({ currentUser }: UnitsTabProps) {
  const [units, setUnits] = useState<Unit[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)

  useEffect(() => {
    fetchUnits()
  }, [])



  const fetchUnits = async () => {
    console.log('Buscando unidades...')
    const { data, error } = await supabase
      .from('unidade')
      .select('*')
      .order('id')
    
    if (error) {
      console.error('Erro ao buscar unidades:', error)
      return
    }
    
    if (data) {
      console.log('Unidades encontradas:', data)
      setUnits(data)
    }
  }





  const handleDelete = async (id: number) => {
    try {
      // Primeiro exclui os horários
      const { error: scheduleError } = await supabase
        .from('unit_schedules')
        .delete()
        .eq('unit_id', id)

      if (scheduleError) throw scheduleError

      // Depois exclui a unidade
      const { error: unitError } = await supabase
        .from('unidade')
        .delete()
        .eq('id', id)

      if (unitError) throw unitError

      toast({
        title: "Sucesso!",
        description: "Unidade excluída com sucesso",
      })

      fetchUnits()
    } catch (error: any) {
      console.error('Erro ao excluir:', error)
      toast({
        title: "Erro",
        description: "Erro ao excluir unidade. Tente novamente.",
      })
    }
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="border-b bg-gray-50/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-gray-800">
              Gerenciamento de Unidades
            </CardTitle>
            <Button onClick={() => {
              setSelectedUnit(null)
              setIsDialogOpen(true)
            }}>
              Adicionar Unidade
            </Button>
      </div>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="list">
            <TabsList>
              <TabsTrigger value="list">Lista de Unidades</TabsTrigger>
            </TabsList>

            <TabsContent value="list">
        <Table>
          <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Nome Interno</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {units.map((unit) => (
              <TableRow key={unit.id}>
                      <TableCell>{unit.nome}</TableCell>
                      <TableCell>{unit.nome_interno}</TableCell>
                      <TableCell>{unit.email}</TableCell>
                      <TableCell>{unit.telefone}</TableCell>
                <TableCell>
                        {`${unit.logradouro}, ${unit.numero}${unit.complemento ? `, ${unit.complemento}` : ''} - ${unit.bairro}, ${unit.cidade}/${unit.estado} - CEP: ${unit.cep}`}
                </TableCell>
                      <TableCell>{unit.status ? 'Ativo' : 'Inativo'}</TableCell>
                  <TableCell>
                        <div className="flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedUnit(unit)
                                  setIsDialogOpen(true)
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Editar unidade</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                      <Button 
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedUnit(unit)
                                  setIsScheduleDialogOpen(true)
                                }}
                              >
                                <Clock className="h-4 w-4" />
                      </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Configurar horários</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                      <Button 
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (confirm('Tem certeza que deseja excluir esta unidade?')) {
                                    handleDelete(unit.id)
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Excluir unidade</p>
                            </TooltipContent>
                          </Tooltip>
                    </div>
                  </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
            </TabsContent>
          </Tabs>

          <UnitDialog 
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open)
              if (!open) setSelectedUnit(null)
            }}
            unit={selectedUnit}
            onSuccess={() => {
              fetchUnits()
              setSelectedUnit(null)
            }}
            healthPlans={[]}
          />

          <ScheduleDialog
            open={isScheduleDialogOpen}
            onOpenChange={setIsScheduleDialogOpen}
            unit={selectedUnit}
            onSuccess={fetchUnits}
          />
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}


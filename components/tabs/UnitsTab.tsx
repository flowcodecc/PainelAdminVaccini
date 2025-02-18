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
  const [formData, setFormData] = useState({
    nome: '',
    nome_interno: '',
    email: '',
    telefone: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    status: true,
    atende_aplicativo: true,
    mostra_precos_unidades: true,
    qtd_agendamento_por_faixa: 0,
    qtd_vacinas_por_faixa: 0
  })
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)

  useEffect(() => {
    fetchUnits()
  }, [])

  useEffect(() => {
    if (selectedUnit) {
      setFormData({
        nome: selectedUnit.nome || '',
        nome_interno: selectedUnit.nome_interno || '',
        email: selectedUnit.email || '',
        telefone: selectedUnit.telefone || '',
        cep: selectedUnit.cep || '',
        logradouro: selectedUnit.logradouro || '',
        numero: selectedUnit.numero || '',
        complemento: selectedUnit.complemento || '',
        bairro: selectedUnit.bairro || '',
        cidade: selectedUnit.cidade || '',
        estado: selectedUnit.estado || '',
        status: selectedUnit.status || false,
        atende_aplicativo: selectedUnit.atende_aplicativo || false,
        mostra_precos_unidades: selectedUnit.mostra_precos_unidades || false,
        qtd_agendamento_por_faixa: selectedUnit.qtd_agendamento_por_faixa || 0,
        qtd_vacinas_por_faixa: selectedUnit.qtd_vacinas_por_faixa || 0
      })
    }
  }, [selectedUnit])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const cleanedCep = formData.cep.replace(/\D/g, '')
      const cleanedPhone = formData.telefone.replace(/\D/g, '')
      
      const dataToSave = {
        nome: String(formData.nome).trim(),
        nome_interno: String(formData.nome_interno).trim(),
        email: String(formData.email).trim(),
        telefone: String(cleanedPhone),
        cep: String(cleanedCep),
        logradouro: String(formData.logradouro).trim(),
        numero: String(formData.numero).trim(),
        complemento: formData.complemento ? String(formData.complemento).trim() : '',
        bairro: String(formData.bairro).trim(),
        cidade: String(formData.cidade).trim(),
        estado: String(formData.estado).trim(),
        status: Boolean(formData.status),
        atende_aplicativo: Boolean(formData.atende_aplicativo),
        mostra_precos_unidades: Boolean(formData.mostra_precos_unidades),
        qtd_agendamento_por_faixa: formData.qtd_agendamento_por_faixa,
        qtd_vacinas_por_faixa: formData.qtd_vacinas_por_faixa
      }

      let error;

      if (selectedUnit) {
        const { error: updateError } = await supabase
          .from('unidade')
          .update(dataToSave)
          .eq('id', selectedUnit.id)
        error = updateError
      } else {
        const { error: insertError } = await supabase
          .from('unidade')
          .insert([dataToSave])
        error = insertError
      }

      if (error) throw error

      toast({
        title: "Sucesso!",
        description: selectedUnit ? "Unidade atualizada com sucesso" : "Unidade criada com sucesso",
      })
      
      await fetchUnits()
      setIsDialogOpen(false)
      setSelectedUnit(null)
      resetForm()
    } catch (error: any) {
      console.error('Erro completo:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar unidade. Verifique os dados e tente novamente.",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      nome: '',
      nome_interno: '',
      email: '',
      telefone: '',
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      status: true,
      atende_aplicativo: true,
      mostra_precos_unidades: true,
      qtd_agendamento_por_faixa: 0,
      qtd_vacinas_por_faixa: 0
    })
  }

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    let formatted = cleaned

    if (cleaned.length <= 11) {
      if (cleaned.length > 2) formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`
      if (cleaned.length > 7) formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
    }

    return formatted
  }

  const formatCep = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    let formatted = cleaned

    if (cleaned.length > 5) {
      formatted = `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`
    }

    return formatted
  }

  const fetchAddressByCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '')
    
    if (cleanCep.length !== 8) return

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      const data = await response.json()

      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          logradouro: data.logradouro || prev.logradouro,
          bairro: data.bairro || prev.bairro,
          cidade: data.localidade || prev.cidade,
          estado: data.uf || prev.estado,
        }))
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
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
            <Button onClick={() => setIsDialogOpen(true)}>
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
            onOpenChange={setIsDialogOpen}
            unit={selectedUnit}
            onSuccess={fetchUnits}
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


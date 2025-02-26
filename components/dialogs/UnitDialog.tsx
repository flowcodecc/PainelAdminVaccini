import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { MultiSelect } from "@/components/ui/multi-select"
import { Unit, HealthPlan, UnitSchedule } from '../../types'
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { PlusCircle, X } from "lucide-react"

interface UnitDialogProps {
  unit: Unit | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  healthPlans: HealthPlan[]
}

const DAYS = [
  { name: 'Domingo', field: 'domingo' },
  { name: 'Segunda', field: 'segunda_feira' },
  { name: 'Terça', field: 'terca_feira' },
  { name: 'Quarta', field: 'quarta_feira' },
  { name: 'Quinta', field: 'quinta_feira' },
  { name: 'Sexta', field: 'sexta_feira' },
  { name: 'Sábado', field: 'sabado' }
] as const

export function UnitDialog({ open, onOpenChange, unit, onSuccess, healthPlans }: UnitDialogProps) {
  const [newUnit, setNewUnit] = useState<Unit>({
    id: 0,
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
    qtd_vacinas_por_faixa: 0,
    cep_ranges: [],
    blocked_ceps: []
  })

  const [schedules, setSchedules] = useState<UnitSchedule>({
    id: 0,
    unit_id: 0,
    dia_da_semana: '',
    horario_inicio: '',
    horario_fim: ''
  })

  const [cepRanges, setCepRanges] = useState<{
    cep_start: string;
    cep_end: string;
    faixa_nao_atende: string[];
    faixa_nao_atende_text?: string;
    id: string;
  }[]>([])
  const [newBlockedCep, setNewBlockedCep] = useState('')
  const [blockedCeps, setBlockedCeps] = useState<string[]>([])

  useEffect(() => {
    if (unit?.id) {
      console.log('Carregando dados da unidade para edição:', unit.id)
      setNewUnit(unit)
      fetchCepRanges(unit.id)
    } else {
      setCepRanges([])
    }
  }, [unit])

  useEffect(() => {
    console.log('newUnit:', newUnit)
  }, [newUnit])

  const handleNewUnitChange = (field: keyof Unit, value: any) => {
    setNewUnit((prev: Unit) => ({ ...prev, [field]: value }))
  }

  const handleScheduleChange = (field: keyof UnitSchedule, value: string | null) => {
    setSchedules(prev => ({ ...prev, [field]: value }))
  }

  const handleAddCepRange = () => {
    setCepRanges([...cepRanges, { cep_start: '', cep_end: '', faixa_nao_atende: [], id: Date.now().toString() }])
  }

  const handleRemoveCepRange = (index: number, id: string) => {
    const newRanges = cepRanges.filter((range) => range.id !== id)
    setCepRanges(newRanges)
  }

  const handleAddBlockedCep = () => {
    if (newBlockedCep.length === 8) {
      setBlockedCeps([...blockedCeps, newBlockedCep])
      setNewBlockedCep('')
    }
  }

  const handleRemoveBlockedCep = (index: number, cep: string) => {
    const newCeps = blockedCeps.filter((c) => c !== cep)
    setBlockedCeps(newCeps)
  }

  const fetchCepRanges = async (unitId: number) => {
    try {
      console.log('Buscando CEPs da unidade:', unitId)
      
      const { data, error } = await supabase
        .from('unidade_ceps_atende')
        .select('*')
        .eq('"unidade_id (FK)"', unitId)

      if (error) {
        console.error('Erro ao buscar CEPs:', error.message)
        return
      }

      console.log('CEPs encontrados:', data)

      if (data && data.length > 0) {
        const formattedRanges = data.map(range => ({
          id: range.id.toString(),
          cep_start: range.cep_inicial,
          cep_end: range.cep_final,
          faixa_nao_atende: range.faixa_nao_atende || [],
        }))

        console.log('CEPs formatados:', formattedRanges)
        setCepRanges(formattedRanges)
      } else {
        console.log('Nenhum CEP cadastrado para esta unidade')
        setCepRanges([])
      }
    } catch (error) {
      console.error('Erro completo:', error)
      setCepRanges([])
    }
  }

  const fetchBlockedCeps = async (unitId: number) => {
    const { data, error } = await supabase
      .from('unit_blocked_ceps')
      .select('*')
      .eq('unit_id', unitId)

    if (!error && data) {
      setBlockedCeps(data.map(item => item.cep))
    }
  }

  const handleSave = async () => {
    try {
      let unitId: number;

      // 1. Primeiro salva/atualiza a unidade
      if (newUnit.id) {
        // Atualiza unidade existente
        const { error } = await supabase
          .from('unidade')
          .update({
            nome: newUnit.nome,
            nome_interno: newUnit.nome_interno,
            email: newUnit.email,
            telefone: newUnit.telefone,
            cep: newUnit.cep,
            logradouro: newUnit.logradouro,
            numero: newUnit.numero,
            complemento: newUnit.complemento,
            bairro: newUnit.bairro,
            cidade: newUnit.cidade,
            estado: newUnit.estado,
            status: newUnit.status,
            atende_aplicativo: newUnit.atende_aplicativo,
            mostra_precos_unidades: newUnit.mostra_precos_unidades,
            qtd_agendamento_por_faixa: newUnit.qtd_agendamento_por_faixa,
            qtd_vacinas_por_faixa: newUnit.qtd_vacinas_por_faixa
          })
          .eq('id', newUnit.id)

        if (error) throw error
        unitId = newUnit.id

        console.log('Deletando CEPs antigos da unidade:', unitId)
        const { error: deleteError } = await supabase
          .from('unidade_ceps_atende')
          .delete()
          .eq('"unidade_id (FK)"', unitId)

        if (deleteError) {
          console.error('Erro ao deletar CEPs antigos:', deleteError)
          throw deleteError
        }
      } else {
        // Cria nova unidade
        const { data, error } = await supabase
          .from('unidade')
          .insert({
            nome: newUnit.nome,
            nome_interno: newUnit.nome_interno,
            email: newUnit.email,
            telefone: newUnit.telefone,
            cep: newUnit.cep,
            logradouro: newUnit.logradouro,
            numero: newUnit.numero,
            complemento: newUnit.complemento,
            bairro: newUnit.bairro,
            cidade: newUnit.cidade,
            estado: newUnit.estado,
            status: newUnit.status,
            atende_aplicativo: newUnit.atende_aplicativo,
            mostra_precos_unidades: newUnit.mostra_precos_unidades,
            qtd_agendamento_por_faixa: newUnit.qtd_agendamento_por_faixa,
            qtd_vacinas_por_faixa: newUnit.qtd_vacinas_por_faixa
          })
          .select()
          .single()

        if (error) throw error
        unitId = data.id
      }

      // 2. Depois salva os CEPs na tabela unidade_ceps_atende
      if (cepRanges.length > 0) {
        console.log('CEPs a serem salvos:', cepRanges)
        
        const cepsToSave = cepRanges.map(range => ({
          'unidade_id (FK)': unitId,
          cep_inicial: range.cep_start,
          cep_final: range.cep_end,
          faixa_nao_atende: range.faixa_nao_atende
        }))
        
        console.log('Dados formatados para salvar:', cepsToSave)

        const { data: savedCeps, error: rangesError } = await supabase
          .from('unidade_ceps_atende')
          .insert(cepsToSave)
          .select()

        if (rangesError) {
          console.error('Erro ao salvar CEPs:', rangesError)
          throw rangesError
        }

        console.log('CEPs salvos com sucesso:', savedCeps)
      }

      toast({
        title: "Sucesso",
        description: newUnit.id ? "Unidade atualizada com sucesso" : "Unidade criada com sucesso",
      })

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Erro completo ao salvar:', error)
      toast({
        title: "Erro",
        description: "Erro ao salvar unidade e CEPs",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{unit ? 'Editar Unidade' : 'Nova Unidade'}</DialogTitle>
        </DialogHeader>

        <form className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={newUnit.nome}
                onChange={(e) => handleNewUnitChange('nome', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="nome_interno">Nome Interno</Label>
              <Input
                id="nome_interno"
                value={newUnit.nome_interno}
                onChange={(e) => handleNewUnitChange('nome_interno', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={newUnit.email}
                onChange={(e) => handleNewUnitChange('email', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={newUnit.telefone}
                onChange={(e) => handleNewUnitChange('telefone', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                value={newUnit.cep}
                onChange={(e) => handleNewUnitChange('cep', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="logradouro">Logradouro</Label>
              <Input
                id="logradouro"
                value={newUnit.logradouro}
                onChange={(e) => handleNewUnitChange('logradouro', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="numero">Número</Label>
              <Input
                id="numero"
                value={newUnit.numero}
                onChange={(e) => handleNewUnitChange('numero', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="complemento">Complemento</Label>
              <Input
                id="complemento"
                value={newUnit.complemento}
                onChange={(e) => handleNewUnitChange('complemento', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="bairro">Bairro</Label>
              <Input
                id="bairro"
                value={newUnit.bairro}
                onChange={(e) => handleNewUnitChange('bairro', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={newUnit.cidade}
                onChange={(e) => handleNewUnitChange('cidade', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="estado">Estado</Label>
              <Input
                id="estado"
                value={newUnit.estado}
                onChange={(e) => handleNewUnitChange('estado', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="qtd_agendamento_por_faixa">Agendamentos por Faixa</Label>
              <Input
                id="qtd_agendamento_por_faixa"
                type="number"
                value={newUnit.qtd_agendamento_por_faixa || 0}
                onChange={(e) => handleNewUnitChange('qtd_agendamento_por_faixa', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="qtd_vacinas_por_faixa">Vacinas por Faixa</Label>
              <Input
                id="qtd_vacinas_por_faixa"
                type="number"
                value={newUnit.qtd_vacinas_por_faixa || 0}
                onChange={(e) => handleNewUnitChange('qtd_vacinas_por_faixa', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="status"
                checked={newUnit.status}
                onCheckedChange={(checked) => handleNewUnitChange('status', checked === true)}
              />
              <Label htmlFor="status">Ativo</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="atende_aplicativo"
                checked={newUnit.atende_aplicativo}
                onCheckedChange={(checked) => handleNewUnitChange('atende_aplicativo', checked === true)}
              />
              <Label htmlFor="atende_aplicativo">Atende Aplicativo</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="mostra_precos_unidades"
                checked={newUnit.mostra_precos_unidades}
                onCheckedChange={(checked) => handleNewUnitChange('mostra_precos_unidades', checked === true)}
              />
              <Label htmlFor="mostra_precos_unidades">Mostra Preços</Label>
            </div>
          </div>

          {/* Faixas de CEP atendidas */}
          <div>
            <h2 className="text-lg font-bold mb-4">CEPs atendidos</h2>
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              {cepRanges.map((range, index) => (
                <div key={range.id} className="p-4 bg-white rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Faixa {index + 1}</span>
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleRemoveCepRange(index, range.id)}
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>CEP Inicial</Label>
                      <Input
                        value={range.cep_start}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 8)
                          const newRanges = [...cepRanges]
                          newRanges[index] = {
                            ...newRanges[index],
                            cep_start: value
                          }
                          setCepRanges(newRanges)
                        }}
                        maxLength={8}
                        placeholder="00000000"
                      />
                    </div>
                    <div>
                      <Label>CEP Final</Label>
                      <Input
                        value={range.cep_end}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 8)
                          const newRanges = [...cepRanges]
                          newRanges[index] = {
                            ...newRanges[index],
                            cep_end: value
                          }
                          setCepRanges(newRanges)
                        }}
                        maxLength={8}
                        placeholder="00000000"
                      />
                    </div>
                    <div>
                      <Label>Faixa Não Atende</Label>
                      <Input
                        value={range.faixa_nao_atende_text || range.faixa_nao_atende?.join(', ') || ''}
                        onChange={(e) => {
                          const newRanges = [...cepRanges]
                          newRanges[index] = {
                            ...newRanges[index],
                            faixa_nao_atende_text: e.target.value
                          }
                          setCepRanges(newRanges)
                        }}
                        onBlur={(e) => {
                          const value = e.target.value
                            .split(',')
                            .map(num => num.trim())
                            .filter(num => /^\d{1,3}$/.test(num))
                            .map(num => num.padStart(3, '0'))
                          
                          const newRanges = [...cepRanges]
                          newRanges[index] = {
                            ...newRanges[index],
                            faixa_nao_atende: value,
                            faixa_nao_atende_text: value.join(', ')
                          }
                          setCepRanges(newRanges)
                        }}
                        placeholder="Ex: 001, 002, 003"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button 
                type="button"
                variant="ghost" 
                className="w-full flex items-center justify-center gap-2 text-gray-600"
                onClick={handleAddCepRange}
              >
                <PlusCircle className="h-4 w-4" />
                Adicionar Faixa de CEP
              </Button>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" onClick={handleSave}>
              {unit ? 'Salvar Alterações' : 'Criar Unidade'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
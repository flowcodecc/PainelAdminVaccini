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

interface UnitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  unit: Unit | null
  onSave: (unit: Unit) => void
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

export function UnitDialog({ open, onOpenChange, unit, onSave, healthPlans }: UnitDialogProps) {
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
    qtd_vacinas_por_faixa: 0
  })

  const [schedule, setSchedule] = useState<UnitSchedule>({
    id: 0,
    unit_id: 0,
    dia_da_semana: '',
    horario_inicio: '',
    horario_fim: '',
    qtd_agendamentos: 0
  })

  useEffect(() => {
    if (unit) {
      setNewUnit(unit)
    }
  }, [unit])

  useEffect(() => {
    console.log('newUnit:', newUnit)
  }, [newUnit])

  const handleNewUnitChange = (field: keyof Unit, value: any) => {
    setNewUnit((prev: Unit) => ({ ...prev, [field]: value }))
  }

  const handleScheduleChange = (field: keyof UnitSchedule, value: string | null) => {
    setSchedule(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      // Se tiver um ID, é update, senão é insert
      if (newUnit.id) {
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
      } else {
        const { error } = await supabase
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

        if (error) throw error
      }

      toast({
        title: "Sucesso",
        description: newUnit.id ? "Unidade atualizada com sucesso" : "Unidade criada com sucesso",
      })

      onSave(newUnit)
      onOpenChange(false)
    } catch (error) {
      console.error('Erro:', error)
      toast({
        title: "Erro",
        description: "Erro ao salvar unidade",
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
          {/* Dados Pessoais */}
          <div>
            <h2 className="text-lg font-bold mb-4">Dados Pessoais</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={newUnit.nome}
                  onChange={(e) => handleNewUnitChange('nome', e.target.value)}
                  required
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
            </div>
          </div>

          {/* Endereço */}
          <div>
            <h2 className="text-lg font-bold mb-4">Endereço</h2>
            <div className="grid grid-cols-2 gap-4">
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
            </div>
          </div>

          {/* Agendamentos */}
          <div>
            <h2 className="text-lg font-bold mb-4">Agendamentos</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="qtd_agendamento_por_faixa">Agendamentos por Faixa</Label>
                  <Input
                    id="qtd_agendamento_por_faixa"
                    type="number"
                    placeholder="Ex: 10"
                    value={newUnit.qtd_agendamento_por_faixa || 0}
                    onChange={(e) => handleNewUnitChange('qtd_agendamento_por_faixa', parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="qtd_vacinas_por_faixa">Vacinas por Faixa</Label>
                  <Input
                    id="qtd_vacinas_por_faixa"
                    type="number"
                    placeholder="Ex: 20"
                    value={newUnit.qtd_vacinas_por_faixa || 0}
                    onChange={(e) => handleNewUnitChange('qtd_vacinas_por_faixa', parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="status"
                    checked={newUnit.status}
                    onCheckedChange={(checked) =>
                      handleNewUnitChange('status', checked === true)
                    }
                  />
                  <Label htmlFor="status">Ativo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="atende_aplicativo"
                    checked={newUnit.atende_aplicativo}
                    onCheckedChange={(checked) =>
                      handleNewUnitChange('atende_aplicativo', checked === true)
                    }
                  />
                  <Label htmlFor="atende_aplicativo">Atende Aplicativo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mostra_precos_unidades"
                    checked={newUnit.mostra_precos_unidades}
                    onCheckedChange={(checked) =>
                      handleNewUnitChange('mostra_precos_unidades', checked === true)
                    }
                  />
                  <Label htmlFor="mostra_precos_unidades">Mostra Preços</Label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {unit ? 'Salvar Alterações' : 'Criar Unidade'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
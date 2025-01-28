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
    mostra_precos_unidades: true
  })

  const [schedule, setSchedule] = useState<UnitSchedule>({
    id: 0,
    unit_id: 0,
    segunda_feira: null,
    terca_feira: null,
    quarta_feira: null,
    quinta_feira: null,
    sexta_feira: null,
    sabado: null,
    domingo: null
  })

  useEffect(() => {
    if (unit) {
      setNewUnit(unit)
    }
  }, [unit])

  const handleNewUnitChange = (field: keyof Unit, value: any) => {
    setNewUnit((prev: Unit) => ({ ...prev, [field]: value }))
  }

  const handleScheduleChange = (field: keyof UnitSchedule, value: string | null) => {
    setSchedule(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    // Apenas salva a unidade básica
    onSave(newUnit)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{unit ? 'Editar Unidade' : 'Nova Unidade'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome da Unidade</Label>
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

          <div className="flex items-center">
            <Checkbox
              id="atende_aplicativo"
              checked={newUnit.atende_aplicativo}
              onCheckedChange={(checked) => 
                handleNewUnitChange('atende_aplicativo', checked === true)
              }
            />
            <Label htmlFor="atende_aplicativo" className="ml-2">
              Atende pelo aplicativo
            </Label>
          </div>

          <div className="flex items-center">
            <Checkbox
              id="mostra_precos_unidades"
              checked={newUnit.mostra_precos_unidades}
              onCheckedChange={(checked) =>
                handleNewUnitChange('mostra_precos_unidades', checked === true)
              }
            />
            <Label htmlFor="mostra_precos_unidades" className="ml-2">
              Mostra preços
            </Label>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            {unit ? 'Salvar Alterações' : 'Criar Unidade'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
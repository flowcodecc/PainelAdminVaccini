import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { MultiSelect } from "@/components/ui/multi-select"
import { Unit, HealthPlan } from '../../types'

interface UnitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  unit: Unit | null
  onSave: (unit: Unit) => void
  healthPlans: HealthPlan[]
}

const availableEsquemas = ['1', '2', '3', '4', '5', '6']

export function UnitDialog({ open, onOpenChange, unit, onSave, healthPlans }: UnitDialogProps) {
  const [newUnit, setNewUnit] = useState<Unit>({
    id: 0,
    name: '',
    address: '',
    cepRange: '',
    excludedCeps: [],
    availability: [],
    notAvailableApp: false,
    noPriceDisplay: false,
    vaccinesPerTimeSlot: 1,
    esquemas: [],
    healthPlans: []
  })

  useEffect(() => {
    if (unit) {
      setNewUnit(unit)
    } else {
      setNewUnit({
        id: 0,
        name: '',
        address: '',
        cepRange: '',
        excludedCeps: [],
        availability: [],
        notAvailableApp: false,
        noPriceDisplay: false,
        vaccinesPerTimeSlot: 1,
        esquemas: [],
        healthPlans: []
      })
    }
  }, [unit])

  const handleNewUnitChange = (field: keyof Unit, value: any) => {
    setNewUnit((prev: Unit) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    onSave(newUnit)
    onOpenChange(false)
  }

  const handleEsquemaChange = (esquema: string) => {
    setNewUnit((prev: Unit) => ({
      ...prev,
      esquemas: prev.esquemas.includes(esquema)
        ? prev.esquemas.filter(e => e !== esquema)
        : [...prev.esquemas, esquema]
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>{unit ? 'Editar Unidade' : 'Adicionar Nova Unidade'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="unit-name">Nome da Unidade</Label>
            <Input
              id="unit-name"
              value={newUnit.name}
              onChange={(e) => handleNewUnitChange('name', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="unit-address">Endereço</Label>
            <Input
              id="unit-address"
              value={newUnit.address}
              onChange={(e) => handleNewUnitChange('address', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="unit-cep-range">Faixa de CEP</Label>
            <Input
              id="unit-cep-range"
              value={newUnit.cepRange}
              onChange={(e) => handleNewUnitChange('cepRange', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="unit-excluded-ceps">CEPS não atendidos</Label>
            <Input
              id="unit-excluded-ceps"
              value={newUnit.excludedCeps.join(', ')}
              onChange={(e) => handleNewUnitChange('excludedCeps', e.target.value.split(', '))}
            />
          </div>
          <div>
            <Label htmlFor="vaccines-per-timeslot">Quantidade de vacinas por faixa de horário</Label>
            <Input
              id="vaccines-per-timeslot"
              type="number"
              min="1"
              value={newUnit.vaccinesPerTimeSlot}
              onChange={(e) => handleNewUnitChange('vaccinesPerTimeSlot', parseInt(e.target.value))}
            />
          </div>
          <div>
            <Label>Esquemas</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {availableEsquemas.map((esquema) => (
                <div key={esquema} className="flex items-center">
                  <Checkbox
                    id={`esquema-${esquema}`}
                    checked={newUnit.esquemas.includes(esquema)}
                    onCheckedChange={() => handleEsquemaChange(esquema)}
                  />
                  <Label htmlFor={`esquema-${esquema}`} className="ml-2">
                    {esquema}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="health-plans">Planos de Saúde</Label>
            <MultiSelect
              id="health-plans"
              options={healthPlans ? healthPlans.map(plan => ({ value: plan.id.toString(), label: plan.name })) : []}
              selected={newUnit.healthPlans.map(id => id.toString())}
              onChange={(selected) => handleNewUnitChange('healthPlans', selected.map(Number))}
            />
          </div>
          <div className="flex items-center">
            <Checkbox
              id="not-available-app"
              checked={newUnit.notAvailableApp}
              onCheckedChange={(checked) => handleNewUnitChange('notAvailableApp', checked === true)}
            />
            <Label htmlFor="not-available-app" className="ml-2">
              Essa unidade não atende pelo aplicativo
            </Label>
          </div>
          <div className="flex items-center">
            <Checkbox
              id="no-price-display"
              checked={newUnit.noPriceDisplay}
              onCheckedChange={(checked) =>
                handleNewUnitChange('noPriceDisplay', checked === true)
              }
            />
            <Label htmlFor="no-price-display" className="ml-2">
              Essa unidade não mostra preço
            </Label>
          </div>
          <Button onClick={handleSave} className="w-full bg-vaccini-primary text-white hover:bg-vaccini-primary/90">
            {unit ? 'Atualizar Unidade' : 'Adicionar Unidade'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
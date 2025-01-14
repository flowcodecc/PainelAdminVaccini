import { useState } from 'react'
import { Unit } from '../types'
import { toast } from "@/components/ui/use-toast"

export function useUnits() {
  const [units, setUnits] = useState<Unit[]>([
    {
      id: 1,
      name: 'Unidade Central',
      address: 'Rua Principal, 123',
      cepRange: '12345-000 a 12345-999',
      excludedCeps: [],
      availability: [
        { day: 'Segunda', timeSlots: [{ start: '08:00', end: '18:00' }] },
        { day: 'Terça', timeSlots: [{ start: '08:00', end: '18:00' }] },
        { day: 'Quarta', timeSlots: [{ start: '08:00', end: '18:00' }] },
        { day: 'Quinta', timeSlots: [{ start: '08:00', end: '18:00' }] },
        { day: 'Sexta', timeSlots: [{ start: '08:00', end: '18:00' }] },
      ],
      notAvailableApp: false,
      noPriceDisplay: false,
      vaccinesPerTimeSlot: 1,
      esquemas: ['1', '2', '3'],
      healthPlans: [1, 2],
    },
  ])

  const addUnit = (newUnit: Unit) => {
    setUnits(prev => [...prev, { ...newUnit, id: Date.now() }])
    toast({
      title: "Unidade criada com sucesso",
      description: `${newUnit.name} foi
adicionada à lista de unidades.`,
      duration: 3000,
    })
  }

  const updateUnit = (updatedUnit: Unit) => {
    setUnits(prev => prev.map(unit => unit.id === updatedUnit.id ? updatedUnit : unit))
    toast({
      title: "Unidade atualizada com sucesso",
      description: `${updatedUnit.name} foi atualizada.`,
      duration: 3000,
    })
  }

  const deleteUnit = (id: number) => {
    setUnits(prev => prev.filter(unit => unit.id !== id))
    toast({
      title: "Unidade excluída com sucesso",
      description: "A unidade foi removida da lista.",
      duration: 3000,
    })
  }

  return { units, addUnit, updateUnit, deleteUnit }
}


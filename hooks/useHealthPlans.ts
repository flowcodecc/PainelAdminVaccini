import { useState } from 'react'
import { HealthPlan } from '../types'
import { toast } from "@/components/ui/use-toast"

export function useHealthPlans() {
  const [healthPlans, setHealthPlans] = useState<HealthPlan[]>([
    { id: 1, name: 'Plano Básico', discount: 10 },
    { id: 2, name: 'Plano Intermediário', discount: 15 },
    { id: 3, name: 'Plano Premium', discount: 20 },
  ])

  const addHealthPlan = (newPlan: Omit<HealthPlan, 'id'>) => {
    setHealthPlans(prev => [...prev, { ...newPlan, id: Date.now() }])
    toast({
      title: "Plano de saúde criado com sucesso",
      description: `${newPlan.name} foi adicionado à lista de planos.`,
      duration: 3000,
    })
  }

  const updateHealthPlan = (updatedPlan: HealthPlan) => {
setHealthPlans(prev => prev.map(plan => plan.id === updatedPlan.id ? updatedPlan : plan))
    toast({
      title: "Plano de saúde atualizado com sucesso",
      description: `${updatedPlan.name} foi atualizado.`,
      duration: 3000,
    })
  }

  const deleteHealthPlan = (id: number) => {
    setHealthPlans(prev => prev.filter(plan => plan.id !== id))
    toast({
      title: "Plano de saúde excluído com sucesso",
      description: "O plano foi removido da lista.",
      duration: 3000,
    })
  }

  return { healthPlans, addHealthPlan, updateHealthPlan, deleteHealthPlan }
}


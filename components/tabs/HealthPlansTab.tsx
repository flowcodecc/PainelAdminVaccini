import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Trash2 } from 'lucide-react'

interface HealthPlan {
  id: number
  name: string
  discount: number
}

export function HealthPlansTab() {
  const [healthPlans, setHealthPlans] = useState<HealthPlan[]>([
    { id: 1, name: 'Plano Básico', discount: 10 },
    { id: 2, name: 'Plano Intermediário', discount: 15 },
    { id: 3, name: 'Plano Premium', discount: 20 },
  ])
  const [newPlan, setNewPlan] = useState<Omit<HealthPlan, 'id'>>({ name: '', discount: 0 })

  const handleAddPlan = () => {
    if (newPlan.name && newPlan.discount > 0) {
      setHealthPlans(prev => [...prev, { ...newPlan, id: Date.now() }])
      setNewPlan({ name: '', discount: 0 })
    }
  }

  const handleUpdatePlan = (id: number, field: keyof HealthPlan, value: string | number) => {
    setHealthPlans(prev => prev.map(plan => 
      plan.id === id ? { ...plan, [field]: value } : plan
    ))
  }

  const handleDeletePlan = (id: number) => {
    setHealthPlans(prev => prev.filter(plan => plan.id !== id))
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-[#191C1A] font-comfortaa">Gerenciar Planos de Saúde</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
        <div>
          <Label htmlFor="plan-name">Nome do Plano</Label>
          <Input
            id="plan-name"
            value={newPlan.name}
            onChange={(e) => setNewPlan(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Nome do novo plano"
            className="bg-white border-gray-200"
          />
        </div>
        <div>
          <Label htmlFor="plan-discount">Desconto (%)</Label>
          <Input
            id="plan-discount"
            type="number"
            value={newPlan.discount}
            onChange={(e) => setNewPlan(prev => ({ ...prev, discount: Number(e.target.value) }))}
            placeholder="Desconto em %"
            className="bg-white border-gray-200"
          />
        </div>
        <Button 
          onClick={handleAddPlan} 
          className="bg-[#008FA2] hover:bg-[#007A8A] text-white rounded-lg h-12 px-6 flex items-center gap-2"
        >
          <PlusCircle className="h-5 w-5" />
          Adicionar Plano
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-comfortaa">Nome do Plano</TableHead>
              <TableHead className="font-comfortaa">Desconto (%)</TableHead>
              <TableHead className="font-comfortaa w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {healthPlans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell>
                  <Input
                    value={plan.name}
                    onChange={(e) => handleUpdatePlan(plan.id, 'name', e.target.value)}
                    className="bg-white border-gray-200"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={plan.discount}
                    onChange={(e) => handleUpdatePlan(plan.id, 'discount', Number(e.target.value))}
                    className="bg-white border-gray-200"
                  />
                </TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDeletePlan(plan.id)}
                    className="hover:bg-gray-100"
                  >
                    <Trash2 className="h-5 w-5 text-gray-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}


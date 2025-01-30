import { useState } from 'react'
import { Unit } from '@/types'
import { toast } from "@/components/ui/use-toast"

export function useUnits() {
  const [units, setUnits] = useState<Unit[]>([
    {
      id: 1,
      nome: 'Unidade Central',
      nome_interno: 'Central',
      email: 'central@vaccini.com',
      telefone: '(11) 1234-5678',
      cep: '12345-000',
      logradouro: 'Rua Principal',
      numero: '123',
      complemento: '',
      bairro: 'Centro',
      cidade: 'São Paulo',
      estado: 'SP',
      status: true,
      atende_aplicativo: true,
      mostra_precos_unidades: true
    }
  ])

  const addUnit = (newUnit: Unit) => {
    setUnits(prev => [...prev, { ...newUnit, id: Date.now() }])
    toast({
      title: "Unidade criada com sucesso",
      description: `${newUnit.nome} foi
adicionada à lista de unidades.`,
      duration: 3000,
    })
  }

  const updateUnit = (updatedUnit: Unit) => {
    setUnits(prev => prev.map(unit => unit.id === updatedUnit.id ? updatedUnit : unit))
    toast({
      title: "Unidade atualizada com sucesso",
      description: `${updatedUnit.nome} foi atualizada.`,
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


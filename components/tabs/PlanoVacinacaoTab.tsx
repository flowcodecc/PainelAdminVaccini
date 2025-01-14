'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Vacina {
  vacina_id: number
  vacina_nome: string
  preco: number
  percentual: number | null
  tem_percentual?: boolean // Para controlar se já tem percentual salvo
}

export function PlanoVacinacaoTab() {
  const [vacinas, setVacinas] = useState<Vacina[]>([])
  const [percentuais, setPercentuais] = useState<{[key: number]: string}>({})
  const [loading, setLoading] = useState<{[key: number]: boolean}>({})
  const [vacinasEditadas, setVacinasEditadas] = useState<{[key: number]: boolean}>({})
  const [percentuaisOriginais, setPercentuaisOriginais] = useState<{[key: number]: string}>({})

  useEffect(() => {
    fetchVacinas()
  }, [])

  const fetchVacinas = async () => {
    const { data } = await supabase
      .from('vw_vacinas_esquemas')
      .select('vacina_id, vacina_nome, preco, percentual')
      .order('vacina_nome')
    
    if (data) {
      setVacinas(data.map(v => ({
        ...v,
        tem_percentual: v.percentual !== null
      })))
      
      const initialPercentuais: {[key: number]: string} = {}
      data.forEach(v => {
        initialPercentuais[v.vacina_id] = v.percentual?.toString() || ''
      })
      setPercentuais(initialPercentuais)
      setPercentuaisOriginais(initialPercentuais)
    }
  }

  const handlePercentualChange = (vacinaId: number, value: string) => {
    setPercentuais(prev => ({
      ...prev,
      [vacinaId]: value
    }))
  }

  const handleAplicar = async (vacinaId: number) => {
    try {
      setLoading(prev => ({ ...prev, [vacinaId]: true }))
      const percentualNumber = percentuais[vacinaId] === '' ? null : Number(percentuais[vacinaId])
      const vacina = vacinas.find(v => v.vacina_id === vacinaId)
      
      if (!vacina) throw new Error('Vacina não encontrada')

      // Verificar se já existe um registro
      const { data: existingData } = await supabase
        .from('vacina_percentual')
        .select('*')
        .eq('vacina_id', vacinaId)

      // Se o percentual for 0, excluir o registro
      if (percentualNumber === 0) {
        if (existingData && existingData.length > 0) {
          // Excluir o registro
          const { error: deleteError } = await supabase
            .from('vacina_percentual')
            .delete()
            .eq('vacina_id', vacinaId)

          if (deleteError) throw deleteError

          toast({
            title: "Sucesso!",
            description: "Percentual removido com sucesso",
          })
        }
      } else {
        const novoValorPlano = percentualNumber ? vacina.preco - (vacina.preco * percentualNumber / 100) : null

        if (existingData && existingData.length > 0) {
          // Atualizar
          const { error: updateError } = await supabase
            .from('vacina_percentual')
            .update({
              percentual: percentualNumber,
              valor_plano: novoValorPlano
            })
            .eq('vacina_id', vacinaId)

          if (updateError) throw updateError
        } else {
          // Criar novo
          const { error: insertError } = await supabase
            .from('vacina_percentual')
            .insert({
              vacina_id: vacinaId,
              percentual: percentualNumber,
              valor_plano: novoValorPlano
            })

          if (insertError) throw insertError
        }

        toast({
          title: "Sucesso!",
          description: "Percentual salvo com sucesso",
        })
      }

      fetchVacinas()
    } catch (error: any) {
      console.error('Erro completo:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar. Tente novamente.",
      })
    } finally {
      setLoading(prev => ({ ...prev, [vacinaId]: false }))
    }
  }

  const calcularValorComDesconto = (preco: number, percentual: string) => {
    const percentualNumber = Number(percentual)
    if (!percentual || isNaN(percentualNumber)) return null
    return preco - (preco * (percentualNumber / 100))
  }

  const percentualAlterado = (vacinaId: number) => {
    return percentuais[vacinaId] !== percentuaisOriginais[vacinaId]
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Plano de Vacinação</h2>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vacina</TableHead>
            <TableHead>Preço Base</TableHead>
            <TableHead>Desconto (%)</TableHead>
            <TableHead>Valor do Plano</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vacinas.map((vacina) => {
            const valorPlano = calcularValorComDesconto(vacina.preco, percentuais[vacina.vacina_id])

            return (
              <TableRow key={vacina.vacina_id}>
                <TableCell>{vacina.vacina_nome}</TableCell>
                <TableCell>R$ {vacina.preco.toFixed(2)}</TableCell>
                <TableCell className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={percentuais[vacina.vacina_id]}
                    onChange={(e) => handlePercentualChange(vacina.vacina_id, e.target.value)}
                    className="w-24"
                    placeholder="0"
                  />
                </TableCell>
                <TableCell>
                  {valorPlano 
                    ? `R$ ${valorPlano.toFixed(2)}` 
                    : 'Não aplicável'
                  }
                </TableCell>
                <TableCell>
                  <Button 
                    size="sm"
                    onClick={() => handleAplicar(vacina.vacina_id)}
                    disabled={loading[vacina.vacina_id] || !percentualAlterado(vacina.vacina_id)}
                  >
                    {loading[vacina.vacina_id] 
                      ? 'Salvando...' 
                      : vacina.tem_percentual
                        ? 'Atualizar'
                        : 'Aplicar'
                    }
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
} 
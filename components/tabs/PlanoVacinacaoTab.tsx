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
import { Edit2, Save } from 'lucide-react'

interface Vacina {
  vacina_id: number
  vacina_nome: string
  preco: number
  total_doses: number
  valor_plano: number
  status: string
  desconto?: number
}

export function PlanoVacinacaoTab() {
  const [vacinas, setVacinas] = useState<Vacina[]>([])
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [descontoTemp, setDescontoTemp] = useState<number>(0)

  useEffect(() => {
    fetchVacinas()
  }, [])

  const fetchVacinas = async () => {
    try {
      // Busca todas as vacinas sem filtro de status
      const { data: vacinasData, error: vacinasError } = await supabase
        .from('vw_vacinas_esquemas')
        .select('*')
        .order('vacina_nome')

      if (vacinasError) throw vacinasError

      // Busca os percentuais
      const { data: percentuaisData, error: percentuaisError } = await supabase
        .from('vacina_percentual')
        .select('*')

      if (percentuaisError) throw percentuaisError

      // Combina os dados
      if (vacinasData) {
        const vacinasComDesconto = vacinasData.map(vacina => {
          const percentualExistente = percentuaisData?.find(p => p.vacina_id === vacina.vacina_id)
          return {
            ...vacina,
            desconto: percentualExistente?.percentual || 0,
            valor_plano: percentualExistente?.valor_plano || vacina.preco
          }
        })
        setVacinas(vacinasComDesconto)
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar vacinas e percentuais"
      })
    }
  }

  const handleEditarDesconto = (vacina: Vacina) => {
    setEditandoId(vacina.vacina_id)
    setDescontoTemp(vacina.desconto || 0)
  }

  const handleSalvarDesconto = async (vacina: Vacina) => {
    try {
      // Calcula o valor do plano com o desconto
      const valorPlano = calcularValorComDesconto(vacina.preco, descontoTemp)

      // Verifica se já existe um registro para esta vacina
      const { data: existingData } = await supabase
        .from('vacina_percentual')
        .select('id')
        .eq('vacina_id', vacina.vacina_id)
        .single()

      let error;

      if (existingData?.id) {
        // Se existe, faz update
        const { error: updateError } = await supabase
          .from('vacina_percentual')
          .update({
            percentual: descontoTemp,
            valor_plano: valorPlano
          })
          .eq('id', existingData.id)
        
        error = updateError
      } else {
        // Se não existe, faz insert
        const { error: insertError } = await supabase
          .from('vacina_percentual')
          .insert({
            vacina_id: vacina.vacina_id,
            percentual: descontoTemp,
            valor_plano: valorPlano
          })
        
        error = insertError
      }

      if (error) throw error

      // Atualiza o estado local
      setVacinas(vacinas.map(v => 
        v.vacina_id === vacina.vacina_id 
          ? { 
              ...v, 
              desconto: descontoTemp,
              valor_plano: valorPlano
            }
          : v
      ))

      setEditandoId(null)
      toast({
        title: "Sucesso",
        description: "Percentual e valor do plano atualizados com sucesso"
      })
    } catch (error) {
      console.error('Erro ao salvar percentual:', error)
      toast({
        title: "Erro",
        description: "Erro ao salvar percentual e valor do plano"
      })
    }
  }

  const calcularValorComDesconto = (preco: number, desconto: number = 0) => {
    if (!preco) return 0
    return preco * (1 - desconto / 100)
  }

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h2 className="text-2xl font-bold">Plano de Vacinação</h2>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Preço</TableHead>
            <TableHead>Doses</TableHead>
            <TableHead>Desconto (%)</TableHead>
            <TableHead>Valor do Plano</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vacinas.map((vacina) => (
            <TableRow key={vacina.vacina_id}>
              <TableCell>{vacina.vacina_nome}</TableCell>
              <TableCell>R$ {vacina.preco.toFixed(2)}</TableCell>
              <TableCell>{vacina.total_doses > 0 ? `${vacina.total_doses} doses` : 'Não aplicável'}</TableCell>
              <TableCell className="flex items-center gap-2">
                {editandoId === vacina.vacina_id ? (
                  <>
                    <Input
                      type="number"
                      value={descontoTemp}
                      onChange={(e) => setDescontoTemp(Number(e.target.value))}
                      className="w-20"
                      min="0"
                      max="100"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSalvarDesconto(vacina)}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    {vacina.desconto || 0}%
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditarDesconto(vacina)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </TableCell>
              <TableCell>
                R$ {calcularValorComDesconto(
                  vacina.preco,
                  editandoId === vacina.vacina_id ? descontoTemp : vacina.desconto
                ).toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 
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
  total_doses: number
  valor_plano: number
  status: string
}

export function PlanoVacinacaoTab() {
  const [vacinas, setVacinas] = useState<Vacina[]>([])

  useEffect(() => {
    fetchVacinas()
  }, [])

  const fetchVacinas = async () => {
    const { data } = await supabase
      .from('vw_vacinas_esquemas')
      .select('*')
      .eq('status', 'Ativo')
      .order('vacina_nome')
    
    if (data) {
      setVacinas(data)
    }
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
            <TableHead>Valor do Plano</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vacinas.map((vacina) => (
            <TableRow key={vacina.vacina_id}>
              <TableCell>{vacina.vacina_nome}</TableCell>
              <TableCell>R$ {vacina.preco.toFixed(2)}</TableCell>
              <TableCell>{vacina.total_doses > 0 ? `${vacina.total_doses} doses` : 'Não aplicável'}</TableCell>
              <TableCell>
                {vacina.valor_plano 
                  ? `R$ ${vacina.valor_plano.toFixed(2)}` 
                  : 'Não aplicável'
                }
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 
'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { VaccineList, VaccineListItem } from '@/types'
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface VaccineListViewDialogProps {
  isOpen: boolean
  onClose: () => void
  vaccineListId?: number
}

export function VaccineListViewDialog({ isOpen, onClose, vaccineListId }: VaccineListViewDialogProps) {
  const [loading, setLoading] = useState(true)
  const [vaccineList, setVaccineList] = useState<VaccineList | null>(null)
  const [listItems, setListItems] = useState<VaccineListItem[]>([])

  useEffect(() => {
    if (isOpen && vaccineListId) {
      fetchVaccineListDetails()
    }
  }, [isOpen, vaccineListId])

  const fetchVaccineListDetails = async () => {
    if (!vaccineListId) return

    try {
      setLoading(true)

      // Buscar detalhes da lista
      const { data: listData, error: listError } = await supabase
        .from('vaccine_lists')
        .select('*')
        .eq('id', vaccineListId)
        .single()

      if (listError) {
        console.error('Erro ao buscar lista:', listError)
        return
      }

      // Buscar itens da lista com detalhes das vacinas
      const { data: itemsData, error: itemsError } = await supabase
        .from('vaccine_list_items')
        .select(`
          *,
          vaccine:ref_vacinas!vaccine_id(
            ref_vacinasID,
            nome,
            preco,
            status
          )
        `)
        .eq('vaccine_list_id', vaccineListId)
        .order('created_at')

      if (itemsError) {
        console.error('Erro ao buscar itens:', itemsError)
        return
      }

      // Buscar nome do criador separadamente
      const { data: userData } = await supabase
        .from('user')
        .select('nome')
        .eq('id', listData.created_by)
        .single()

      const listWithCreator = {
        ...listData,
        creator_name: userData?.nome || 'Usuário desconhecido'
      }

      setVaccineList(listWithCreator)
      setListItems(itemsData || [])
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTotal = () => {
    return listItems.reduce((total, item) => {
      const price = item.preco_customizado || item.vaccine?.preco || 0
      return total + price
    }, 0)
  }

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex items-center justify-center p-8">
            <div>Carregando...</div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!vaccineList) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex items-center justify-center p-8">
            <div>Lista não encontrada</div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Lista de Vacinas</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações da Lista */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {vaccineList.nome}
                <Badge variant={vaccineList.is_template ? "default" : "secondary"}>
                  {vaccineList.is_template ? 'Template' : 'Privada'}
                </Badge>
              </CardTitle>
              <CardDescription>
                {vaccineList.descricao || 'Sem descrição'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Criado por:</strong> {vaccineList.creator_name}
                </div>
                <div>
                  <strong>Data de criação:</strong> {new Date(vaccineList.created_at).toLocaleDateString('pt-BR')}
                </div>
                <div>
                  <strong>Última atualização:</strong> {new Date(vaccineList.updated_at).toLocaleDateString('pt-BR')}
                </div>
                <div>
                  <strong>Status:</strong> {vaccineList.status ? 'Ativa' : 'Inativa'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Vacinas */}
          <Card>
            <CardHeader>
              <CardTitle>Vacinas na Lista</CardTitle>
              <CardDescription>
                Total de {listItems.length} vacina(s) - Valor total: R$ {calculateTotal().toFixed(2)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome da Vacina</TableHead>
                    <TableHead>Preço Padrão</TableHead>
                    <TableHead>Preço na Lista</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listItems.map((item) => {
                    const vaccine = item.vaccine
                    const listPrice = item.preco_customizado || vaccine?.preco || 0
                    const standardPrice = vaccine?.preco || 0
                    const hasCustomPrice = item.preco_customizado && item.preco_customizado !== standardPrice

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {vaccine?.nome || 'Vacina não encontrada'}
                        </TableCell>
                        <TableCell>
                          R$ {standardPrice.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            R$ {listPrice.toFixed(2)}
                            {hasCustomPrice && (
                              <Badge variant="outline" className="text-xs">
                                Customizado
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={vaccine?.status ? "default" : "secondary"}>
                            {vaccine?.status ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {listItems.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma vacina encontrada nesta lista
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

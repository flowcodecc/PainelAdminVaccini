'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase } from "@/lib/supabase"
import { VaccineList, Vaccine } from '@/types'
import { toast } from "@/components/ui/use-toast"
import { useUser } from '@/contexts/UserContext'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface VaccineListDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  vaccineList?: VaccineList
}

export function VaccineListDialog({ isOpen, onClose, onSuccess, vaccineList }: VaccineListDialogProps) {
  const { currentUser } = useUser()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    is_template: false
  })
  const [availableVaccines, setAvailableVaccines] = useState<Vaccine[]>([])
  const [selectedVaccines, setSelectedVaccines] = useState<number[]>([])
  const [customPrices, setCustomPrices] = useState<{ [key: number]: number }>({})

  useEffect(() => {
    if (isOpen) {
      fetchAvailableVaccines()
      if (vaccineList) {
        setFormData({
          nome: vaccineList.nome,
          descricao: vaccineList.descricao || '',
          is_template: vaccineList.is_template
        })
        // TODO: Carregar vacinas já selecionadas na lista
      } else {
        setFormData({
          nome: '',
          descricao: '',
          is_template: false
        })
        setSelectedVaccines([])
        setCustomPrices({})
      }
    }
  }, [isOpen, vaccineList])

  const fetchAvailableVaccines = async () => {
    try {
      const { data, error } = await supabase
        .from('ref_vacinas')
        .select('*')
        .eq('status', true)
        .order('nome')

      if (error) {
        console.error('Erro ao buscar vacinas:', error)
        return
      }

      const vaccines = data?.map(v => ({
        ref_vacinasID: v.ref_vacinasID,
        nome: v.nome,
        preco: v.preco,
        status: v.status
      })) || []

      setAvailableVaccines(vaccines)
    } catch (error) {
      console.error('Erro:', error)
    }
  }

  const handleVaccineToggle = (vaccineId: number, isChecked: boolean) => {
    if (isChecked) {
      setSelectedVaccines(prev => [...prev, vaccineId])
    } else {
      setSelectedVaccines(prev => prev.filter(id => id !== vaccineId))
      setCustomPrices(prev => {
        const newPrices = { ...prev }
        delete newPrices[vaccineId]
        return newPrices
      })
    }
  }

  const handleCustomPriceChange = (vaccineId: number, price: string) => {
    const numericPrice = parseFloat(price) || 0
    setCustomPrices(prev => ({
      ...prev,
      [vaccineId]: numericPrice
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUser) {
      toast({
        title: "Erro",
        description: "Usuário não encontrado",
      })
      return
    }

    if (!formData.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome da lista é obrigatório",
      })
      return
    }

    if (selectedVaccines.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos uma vacina",
      })
      return
    }

    setLoading(true)

    try {
      let vaccineListId: number

      if (vaccineList) {
        // Atualizar lista existente
        const { error: updateError } = await supabase
          .from('vaccine_lists')
          .update({
            nome: formData.nome,
            descricao: formData.descricao,
            is_template: formData.is_template,
            updated_at: new Date().toISOString()
          })
          .eq('id', vaccineList.id)

        if (updateError) {
          console.error('Erro ao atualizar lista:', updateError)
          throw new Error('Erro ao atualizar lista de vacinas')
        }

        vaccineListId = vaccineList.id

        // Remover itens existentes
        const { error: deleteError } = await supabase
          .from('vaccine_list_items')
          .delete()
          .eq('vaccine_list_id', vaccineListId)

        if (deleteError) {
          console.error('Erro ao remover itens:', deleteError)
          throw new Error('Erro ao atualizar itens da lista')
        }
      } else {
        // Criar nova lista
        const { data: newList, error: insertError } = await supabase
          .from('vaccine_lists')
          .insert({
            nome: formData.nome,
            descricao: formData.descricao,
            created_by: currentUser.id,
            is_template: formData.is_template
          })
          .select('id')
          .single()

        if (insertError || !newList) {
          console.error('Erro ao criar lista:', insertError)
          throw new Error('Erro ao criar lista de vacinas')
        }

        vaccineListId = newList.id
      }

      // Inserir itens da lista
      const items = selectedVaccines.map(vaccineId => ({
        vaccine_list_id: vaccineListId,
        vaccine_id: vaccineId,
        preco_customizado: customPrices[vaccineId] || null
      }))

      const { error: itemsError } = await supabase
        .from('vaccine_list_items')
        .insert(items)

      if (itemsError) {
        console.error('Erro ao inserir itens:', itemsError)
        throw new Error('Erro ao adicionar vacinas à lista')
      }

      toast({
        title: "Sucesso!",
        description: vaccineList ? "Lista atualizada com sucesso" : "Lista criada com sucesso",
      })

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Erro:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar lista de vacinas",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {vaccineList ? 'Editar Lista de Vacinas' : 'Criar Nova Lista de Vacinas'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info">Informações da Lista</TabsTrigger>
              <TabsTrigger value="vaccines">Selecionar Vacinas</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Básicas</CardTitle>
                  <CardDescription>
                    Configure as informações básicas da lista de vacinas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome da Lista*</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Ex: Lista Básica de Vacinas"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                      placeholder="Descrição opcional da lista de vacinas"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_template"
                      checked={formData.is_template}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_template: checked }))}
                    />
                    <Label htmlFor="is_template">
                      Disponibilizar como template para gerentes
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vaccines" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Selecionar Vacinas</CardTitle>
                  <CardDescription>
                    Escolha as vacinas que farão parte desta lista. Você pode definir preços customizados.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">Selecionar</TableHead>
                        <TableHead>Nome da Vacina</TableHead>
                        <TableHead>Preço Padrão</TableHead>
                        <TableHead>Preço Customizado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {availableVaccines.map((vaccine) => (
                        <TableRow key={vaccine.ref_vacinasID}>
                          <TableCell>
                            <Checkbox
                              checked={selectedVaccines.includes(vaccine.ref_vacinasID)}
                              onCheckedChange={(checked) => 
                                handleVaccineToggle(vaccine.ref_vacinasID, checked as boolean)
                              }
                            />
                          </TableCell>
                          <TableCell>{vaccine.nome}</TableCell>
                          <TableCell>R$ {vaccine.preco.toFixed(2)}</TableCell>
                          <TableCell>
                            {selectedVaccines.includes(vaccine.ref_vacinasID) && (
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={customPrices[vaccine.ref_vacinasID] || ''}
                                onChange={(e) => handleCustomPriceChange(vaccine.ref_vacinasID, e.target.value)}
                                placeholder="Preço personalizado"
                                className="w-32"
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : (vaccineList ? 'Atualizar Lista' : 'Criar Lista')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

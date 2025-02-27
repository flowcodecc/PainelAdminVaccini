'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Pencil, Trash2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DeleteAlertDialog } from "@/components/ui/alert-dialog"

interface Protecao {
  id: number
  nome: string
  valor_total: number
  vacinas: number[]
  created_at: string
}

interface Vacina {
  vacina_id: number
  vacina_nome: string
  preco: number
}

export function ProtecaoVacinasTab() {
  const [protecoes, setProtecoes] = useState<Protecao[]>([])
  const [vacinas, setVacinas] = useState<Vacina[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedVacinas, setSelectedVacinas] = useState<number[]>([])
  const [selectedProtecao, setSelectedProtecao] = useState<Protecao | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    vacinas: [] as number[],
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [protecaoToDelete, setProtecaoToDelete] = useState<number | null>(null)

  useEffect(() => {
    fetchProtecoes()
    fetchVacinas()
  }, [])

  useEffect(() => {
    if (selectedProtecao) {
      setFormData({
        nome: selectedProtecao.nome,
        vacinas: selectedProtecao.vacinas,
      })
      setSelectedVacinas(selectedProtecao.vacinas)
    }
  }, [selectedProtecao])

  const fetchProtecoes = async () => {
    const { data } = await supabase
      .from('ref_protecao')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) {
      setProtecoes(data)
    }
  }

  const fetchVacinas = async () => {
    try {
      const { data, error } = await supabase
        .from('vw_vacinas_esquemas')
        .select('vacina_id, vacina_nome, preco')
        .eq('status', 'Ativo')
        .order('vacina_nome')
      
      console.log('Dados das vacinas:', data)
      console.log('Erro:', error)

      if (error) throw error
      
      if (data) {
        const vacinasFormatadas = data.map(v => ({
          vacina_id: v.vacina_id,
          vacina_nome: v.vacina_nome,
          preco: v.preco || 0
        }))
        
        console.log('Vacinas formatadas:', vacinasFormatadas)
        setVacinas(vacinasFormatadas)
      }
    } catch (error) {
      console.error('Erro ao buscar vacinas:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar vacinas. Tente novamente.",
      })
    }
  }

  const calcularPrecoTotal = (vacinasIds: number[]) => {
    return vacinas
      .filter(v => vacinasIds.includes(v.vacina_id))
      .reduce((total, v) => total + v.preco, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (selectedVacinas.length === 0) {
        throw new Error('Selecione pelo menos uma vacina')
      }

      const valor_total = calcularPrecoTotal(selectedVacinas)
      
      const dataToSave = {
        nome: formData.nome.trim(),
        vacinas: selectedVacinas,
        valor_total,
        created_at: new Date().toISOString()
      }

      console.log('Dados a serem salvos:', dataToSave)

      if (selectedProtecao) {
        const { data, error } = await supabase
          .from('ref_protecao')
          .update(dataToSave)
          .eq('id', selectedProtecao.id)
          .select()

        if (error) {
          console.error('Erro ao atualizar:', error)
          throw error
        }

        console.log('Dados atualizados:', data)
      } else {
        const { data, error } = await supabase
          .from('ref_protecao')
          .insert([dataToSave])
          .select()

        if (error) {
          console.error('Erro ao inserir:', error)
          throw error
        }

        console.log('Dados inseridos:', data)
      }

      toast({
        title: "Sucesso!",
        description: selectedProtecao ? "Proteção atualizada com sucesso" : "Proteção criada com sucesso",
      })
      
      fetchProtecoes()
      setIsDialogOpen(false)
      resetForm()
    } catch (error: any) {
      console.error('Erro completo:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar proteção. Tente novamente.",
      })
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase
        .from('ref_protecao')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Sucesso!",
        description: "Proteção excluída com sucesso",
      })

      fetchProtecoes()
    } catch (error: any) {
      console.error('Erro ao excluir:', error)
      toast({
        title: "Erro",
        description: "Erro ao excluir proteção. Tente novamente.",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      nome: '',
      vacinas: [],
    })
    setSelectedVacinas([])
    setSelectedProtecao(null)
  }

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h2 className="text-2xl font-bold">Proteções</h2>
        <Button onClick={() => setIsDialogOpen(true)}>
          Adicionar Proteção
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Valor Total</TableHead>
            <TableHead>Vacinas</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {protecoes.map((protecao) => (
            <TableRow key={protecao.id}>
              <TableCell>{protecao.nome}</TableCell>
              <TableCell>R$ {protecao.valor_total?.toFixed(2)}</TableCell>
              <TableCell>
                {vacinas
                  .filter(v => protecao.vacinas.includes(v.vacina_id))
                  .map(v => v.vacina_nome)
                  .join(', ')}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedProtecao(protecao)
                      setIsDialogOpen(true)
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setProtecaoToDelete(protecao.id)
                      setDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedProtecao ? 'Editar Proteção' : 'Nova Proteção'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome da Proteção</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label>Selecione as Vacinas</Label>
              <Select
                onValueChange={(value) => {
                  const vacinaId = parseInt(value)
                  if (!selectedVacinas.includes(vacinaId)) {
                    setSelectedVacinas(prev => [...prev, vacinaId])
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma vacina" />
                </SelectTrigger>
                <SelectContent>
                  {vacinas
                    .filter(v => !selectedVacinas.includes(v.vacina_id))
                    .map((vacina) => (
                      <SelectItem 
                        key={vacina.vacina_id} 
                        value={vacina.vacina_id.toString()}
                      >
                        {vacina.vacina_nome} - R$ {vacina.preco.toFixed(2)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <div className="mt-4 space-y-2">
                {selectedVacinas.map(id => {
                  const vacina = vacinas.find(v => v.vacina_id === id)
                  if (!vacina) return null
                  
                  return (
                    <div key={id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div>{vacina.vacina_nome}</div>
                        <div className="text-sm text-gray-500">R$ {vacina.preco.toFixed(2)}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedVacinas(prev => prev.filter(v => v !== id))}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>

            <div>
              <Label>Valor Total</Label>
              <div className="text-lg font-semibold">
                R$ {calcularPrecoTotal(selectedVacinas).toFixed(2)}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {selectedProtecao ? 'Salvar Alterações' : 'Criar Proteção'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteAlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open)
          if (!open) setProtecaoToDelete(null)
        }}
        onConfirm={() => {
          if (protecaoToDelete) {
            handleDelete(protecaoToDelete)
            setDeleteDialogOpen(false)
            setProtecaoToDelete(null)
          }
        }}
        title="Excluir Proteção"
        description="Tem certeza que deseja excluir esta proteção? Esta ação não pode ser desfeita."
      />
    </div>
  )
} 
'use client'

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from 'next/navigation'

interface Vaccine {
  vacina_id: number
  vacina_nome: string
  preco: number
  status: string
  total_doses?: number
}

interface VaccineDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  vaccine?: Vaccine
}

export function VaccineDialog({ isOpen, onClose, onSuccess, vaccine }: VaccineDialogProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    vacina_nome: '',
    preco: '',
    status: true,
    temDoses: false,
    numeroDoses: '',
    esquema_id: null as number | null
  })

  useEffect(() => {
    if (vaccine) {
      const buscarEsquema = async () => {
        const { data: esquema } = await supabase
          .from('esquema')
          .select('*')
          .eq('vacina_fk', vaccine.vacina_id)
          .single()

        setFormData({
          vacina_nome: vaccine.vacina_nome,
          preco: vaccine.preco.toString(),
          status: vaccine.status === 'Ativo',
          temDoses: !!esquema,
          numeroDoses: esquema ? contarDoses(esquema) : '',
          esquema_id: null
        })
      }

      buscarEsquema()
    }
  }, [vaccine])

  const contarDoses = (esquema: any) => {
    let total = 0
    if (esquema.dose_1) total++
    if (esquema.dose_2) total++
    if (esquema.dose_3) total++
    if (esquema.dose_4) total++
    if (esquema.dose_5) total++
    return total.toString()
  }

  const carregarDoses = async (vacina_id: number) => {
    const { data } = await supabase
      .from('esquema')
      .select('*')
      .eq('vacina_fk', vacina_id)
      .single()

    if (data) {
      setFormData(prev => ({
        ...prev,
        numeroDoses: contarDoses(data)
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (vaccine) {
        const mudouNome = formData.vacina_nome !== vaccine.vacina_nome
        const mudouPreco = Number(formData.preco) !== vaccine.preco
        const mudouStatus = (formData.status ? 'Ativo' : 'Inativo') !== vaccine.status
        const mudouDoses = formData.temDoses !== !!vaccine.total_doses || 
                          (formData.temDoses && Number(formData.numeroDoses) !== vaccine.total_doses)

        if (!mudouNome && !mudouPreco && !mudouStatus && !mudouDoses) {
          onClose()
          return
        }

        // 1. Atualizar a vacina
        const { error: vacinaError } = await supabase
          .from('ref_vacinas')
          .update({
            nome: formData.vacina_nome,
            preco: Number(formData.preco),
            status: formData.status
          })
          .eq('ref_vacinasID', vaccine.vacina_id)

        if (vacinaError) throw vacinaError

        // Se houve mudanças, continua com a atualização
        if (formData.temDoses && formData.numeroDoses) {
          const esquemaData = {
            vacina_fk: vaccine.vacina_id,
            dose_1: true,
            dose_2: Number(formData.numeroDoses) >= 2,
            dose_3: Number(formData.numeroDoses) >= 3,
            dose_4: Number(formData.numeroDoses) >= 4,
            dose_5: Number(formData.numeroDoses) >= 5
          }

          // Buscar esquema existente
          const { data: esquemaExistente } = await supabase
            .from('esquema')
            .select('id')
            .eq('vacina_fk', vaccine.vacina_id)
            .single()

          if (esquemaExistente) {
            // Atualizar esquema existente
            const { error: esquemaError } = await supabase
              .from('esquema')
              .update(esquemaData)
              .eq('id', esquemaExistente.id)
              .select('*')
              .single()

            if (esquemaError) {
              console.error('Erro ao atualizar esquema:', esquemaError)
              throw esquemaError
            }

            console.log('Esquema atualizado')
          } else {
            // Criar novo esquema apenas se não existir
            const { data: esquema, error: esquemaError } = await supabase
              .from('esquema')
              .insert([esquemaData])
              .select('*')
              .single()

            if (esquemaError) {
              console.error('Erro ao criar esquema:', esquemaError)
              throw esquemaError
            }

            console.log('Novo esquema criado:', esquema)
          }
        }

        toast({
          title: "Sucesso!",
          description: "Vacina atualizada com sucesso"
        })

        onSuccess()
        onClose()
      } else {
        // Validações antes de criar
        if (!formData.vacina_nome || !formData.preco) {
          toast({
            title: "Erro",
            description: "Preencha todos os campos obrigatórios"
          })
          return
        }

        // Criar nova vacina
        const vacinaData = {
          nome: formData.vacina_nome,
          preco: Number(formData.preco),
          status: !!formData.status
        }

        console.log('Dados para criar vacina:', vacinaData)

        // Primeiro criar a vacina
        const { data: novaVacina, error: vacinaError } = await supabase
          .from('ref_vacinas')
          .insert(vacinaData)
          .select('"ref_vacinasID", nome, preco, status')
          .single()

        if (vacinaError) {
          console.error('Erro ao criar vacina:', vacinaError)
          throw vacinaError
        }

        if (!novaVacina) {
          throw new Error('Vacina não foi criada corretamente')
        }

        console.log('Vacina criada:', novaVacina)

        // Se tem doses, criar o esquema usando o ID da vacina criada
        if (formData.temDoses && formData.numeroDoses) {
          const esquemaData = {
            vacina_fk: novaVacina.ref_vacinasID,
            dose_1: true,
            dose_2: Number(formData.numeroDoses) >= 2,
            dose_3: Number(formData.numeroDoses) >= 3,
            dose_4: Number(formData.numeroDoses) >= 4,
            dose_5: Number(formData.numeroDoses) >= 5
          }

          console.log('Dados para criar esquema:', esquemaData)

          // Criar o esquema com o ID da vacina
          const { data: esquema, error: esquemaError } = await supabase
            .from('esquema')
            .insert([esquemaData])
            .select('id, vacina_fk')
            .single()

          if (esquemaError) {
            console.error('Erro ao criar esquema:', esquemaError)
            throw esquemaError
          }

          if (!esquema) {
            throw new Error('Esquema não foi criado corretamente')
          }

          console.log('Esquema criado:', esquema)
        }

        toast({
          title: "Sucesso!",
          description: "Vacina criada com sucesso"
        })

        onSuccess()
        onClose()
      }
    } catch (error: any) {
      console.error('Erro ao salvar:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar vacina"
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{vaccine ? 'Editar Vacina' : 'Nova Vacina'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={formData.vacina_nome}
              onChange={(e) => setFormData({ ...formData, vacina_nome: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="preco">Preço</Label>
            <Input
              id="preco"
              type="number"
              step="0.01"
              min="0"
              value={formData.preco}
              onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="status"
              checked={!!formData.status}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, status: checked ? true : false }))}
            />
            <Label htmlFor="status">Ativo</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="temDoses"
              checked={formData.temDoses}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, temDoses: checked as boolean, numeroDoses: '' })}
            />
            <Label htmlFor="temDoses">Tem doses?</Label>
          </div>

          {formData.temDoses && (
            <div className="space-y-2">
              <Label>Número de Doses</Label>
              <Select
                value={formData.numeroDoses}
                onValueChange={(value) => setFormData({ ...formData, numeroDoses: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o número de doses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Dose</SelectItem>
                  <SelectItem value="2">2 Doses</SelectItem>
                  <SelectItem value="3">3 Doses</SelectItem>
                  <SelectItem value="4">4 Doses</SelectItem>
                  <SelectItem value="5">5 Doses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {vaccine ? 'Salvar Alterações' : 'Criar Vacina'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}


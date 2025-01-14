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

interface Vaccine {
  vacina_id: number
  vacina_nome: string
  preco: number
  status: string
  esquema_id: number | null
}

interface VaccineDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  vaccine?: Vaccine
}

export function VaccineDialog({ isOpen, onClose, onSuccess, vaccine }: VaccineDialogProps) {
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
      setFormData({
        vacina_nome: vaccine.vacina_nome,
        preco: vaccine.preco.toString(),
        status: vaccine.status === 'Ativo',
        temDoses: !!vaccine.esquema_id,
        numeroDoses: '',
        esquema_id: vaccine.esquema_id
      })

      if (vaccine.esquema_id) {
        carregarDoses(vaccine.esquema_id)
      }
    }
  }, [vaccine])

  const carregarDoses = async (esquemaId: number) => {
    const { data } = await supabase
      .from('esquemas')
      .select('*')
      .eq('id', esquemaId)
      .single()

    if (data) {
      setFormData(prev => ({
        ...prev,
        dose_1: data.dose_1,
        dose_2: data.dose_2,
        dose_3: data.dose_3,
        dose_4: data.dose_4,
        dose_5: data.dose_5
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // 1. Primeiro criar a vacina
      const vacinaData = {
        nome: formData.vacina_nome,
        codigo: null,
        preco: Number(formData.preco),
        status: formData.status,
        esquema_id: null
      }

      const { data: novaVacina, error: vacinaError } = await supabase
        .from('ref_vacinas')
        .insert([vacinaData])
        .select()
        .single()

      if (vacinaError) {
        console.error('Erro ao criar vacina:', vacinaError)
        throw new Error('Erro ao criar vacina')
      }

      // 2. Se tem doses, criar o esquema vinculado à vacina
      if (formData.temDoses && formData.numeroDoses) {
        const esquemaData = {
          vacina_fk: novaVacina.ref_vacinasID,
          created_at: new Date().toISOString(),
          dose_1: true,
          dose_2: Number(formData.numeroDoses) >= 2,
          dose_3: Number(formData.numeroDoses) >= 3,
          dose_4: Number(formData.numeroDoses) >= 4,
          dose_5: Number(formData.numeroDoses) >= 5
        }

        const { data: esquema, error: esquemaError } = await supabase
          .from('esquema')
          .insert([esquemaData])
          .select()
          .single()

        if (esquemaError) {
          console.error('Erro ao criar esquema:', esquemaError)
          throw new Error('Erro ao criar esquema de doses')
        }

        // 3. Atualizar a vacina com o esquema_id
        const { error: updateError } = await supabase
          .from('ref_vacinas')
          .update({ esquema_id: esquema.id })
          .eq('ref_vacinasID', novaVacina.ref_vacinasID)

        if (updateError) {
          console.error('Erro ao vincular esquema:', updateError)
          throw new Error('Erro ao vincular esquema à vacina')
        }
      }

      toast({
        title: "Sucesso!",
        description: "Vacina criada com sucesso"
      })

      onSuccess()
      onClose()
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
              checked={formData.status}
              onCheckedChange={(checked) => setFormData({ ...formData, status: checked as boolean })}
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


'use client'

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"
import { User as UserType, Unit } from "@/types"

interface NurseDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  units: Unit[]
  nurse?: UserType | null
}

export function NurseDialog({ isOpen, onClose, onSuccess, units, nurse }: NurseDialogProps) {
  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    email: '',
    senha: '',
    units: [] as number[],
    is_active: true
  })

  useEffect(() => {
    if (nurse) {
      setFormData({
        nome: nurse.nome || '',
        sobrenome: nurse.sobrenome || '',
        email: nurse.email,
        senha: '',
        units: nurse.units || [],
        is_active: nurse.is_active
      })
    } else {
      setFormData({
        nome: '',
        sobrenome: '',
        email: '',
        senha: '',
        units: [],
        is_active: true
      })
    }
  }, [nurse])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (nurse) {
        const { error: userError } = await supabase
          .from('user')
          .update({
            nome: formData.nome,
            sobrenome: formData.sobrenome,
            units: formData.units,
            is_active: formData.is_active
          })
          .eq('id', nurse.id)

        if (userError) {
          console.error('Erro ao atualizar:', userError)
          throw userError
        }

        onSuccess()
        onClose()
      } else {
        // Criar nova enfermeira (código existente)
      }

      toast({
        title: "Sucesso!",
        description: nurse ? "Enfermeira atualizada com sucesso" : "Enfermeira cadastrada com sucesso",
      })

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Erro:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar enfermeira",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {nurse ? 'Editar Enfermeira' : 'Nova Enfermeira'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required={!nurse}
              />
            </div>
            <div>
              <Label htmlFor="sobrenome">Sobrenome</Label>
              <Input
                id="sobrenome"
                value={formData.sobrenome}
                onChange={(e) => setFormData({ ...formData, sobrenome: e.target.value })}
              />
            </div>

            {nurse ? (
              <div className="col-span-2">
                <Label>Email</Label>
                <div className="p-2 border rounded bg-gray-50">{nurse.email}</div>
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="senha">Senha</Label>
                  <Input
                    id="senha"
                    type="password"
                    value={formData.senha}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    required
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="status"
              checked={formData.is_active}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, is_active: checked as boolean }))
              }
            />
            <Label htmlFor="status">Ativo</Label>
          </div>

          <div>
            <Label>Unidades</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {units.map((unit) => (
                <div key={unit.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`unit-${unit.id}`}
                    checked={formData.units.includes(unit.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData(prev => ({
                          ...prev,
                          units: [...prev.units, unit.id]
                        }))
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          units: prev.units.filter(id => id !== unit.id)
                        }))
                      }
                    }}
                  />
                  <Label htmlFor={`unit-${unit.id}`}>{unit.name}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Cadastrar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 
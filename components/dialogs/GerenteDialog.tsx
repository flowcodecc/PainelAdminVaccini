'use client'

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { MultiSelect } from "@/components/ui/multi-select"
import { supabase } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"
import { User as UserType, Unit } from "@/types"
import { useUser } from '@/contexts/UserContext'

interface SimpleUnit {
  id: number
  nome: string
}

interface GerenteDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  gerente?: UserType | null
}

export function GerenteDialog({ isOpen, onClose, onSuccess, gerente }: GerenteDialogProps) {
  const { currentUser } = useUser()
  const [units, setUnits] = useState<SimpleUnit[]>([])
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    is_active: true,
    selectedUnits: [] as number[]
  })

  useEffect(() => {
    fetchUnits()
  }, [])

  useEffect(() => {
    if (gerente) {
      setFormData({
        nome: gerente.nome || '',
        email: gerente.email,
        senha: '',
        is_active: gerente.is_active,
        selectedUnits: gerente.units || []
      })
    } else {
      setFormData({
        nome: '',
        email: '',
        senha: '',
        is_active: true,
        selectedUnits: []
      })
    }
  }, [gerente])

  const fetchUnits = async () => {
    try {
      const { data, error } = await supabase
        .from('unidade')
        .select('id, nome')
        .eq('status', true)
        .order('nome')

      if (error) throw error
      if (data) setUnits(data)
    } catch (error) {
      console.error('Erro ao carregar unidades:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (gerente) {
        if (formData.senha) {
          const { error: resetError } = await supabase.rpc('reset_password_if_admin', {
            p_admin_id: currentUser?.id,
            p_new_password: formData.senha,
            p_user_id: gerente.id
          })

          if (resetError) {
            console.error('Erro ao resetar senha:', resetError)
            throw new Error(resetError.message)
          }
        }

        const { error: userError } = await supabase
          .from('user')
          .update({
            nome: formData.nome,
            is_active: formData.is_active,
            units: formData.selectedUnits
          })
          .eq('id', gerente.id)

        if (userError) throw userError

        toast({
          title: "Sucesso!",
          description: "Gerente atualizado com sucesso",
        })

        onSuccess()
        onClose()
      } else {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.senha,
        })

        if (authError) throw authError

        if (authData.user) {
          const { error: userError } = await supabase
            .from('user')
            .insert({
              id: authData.user.id,
              email: formData.email,
              nome: formData.nome,
              user_role_id: 3,
              is_active: formData.is_active,
              units: formData.selectedUnits
            })

          if (userError) throw userError

          toast({
            title: "Sucesso!",
            description: "Gerente cadastrado com sucesso",
          })

          onSuccess()
          onClose()
        }
      }
    } catch (error: any) {
      console.error('Erro completo:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar gerente. Tente novamente."
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {gerente ? 'Editar Gerente' : 'Novo Gerente'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
            />
          </div>

          {gerente ? (
            <>
              <div>
                <Label>Email</Label>
                <div className="p-2 border rounded bg-gray-50">{gerente.email}</div>
              </div>
              <div>
                <Label htmlFor="senha">Nova Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  placeholder="Digite para alterar a senha"
                />
              </div>
            </>
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

          <div>
            <Label htmlFor="units">Unidades</Label>
            <MultiSelect
              options={units.map(unit => ({
                label: unit.nome,
                value: unit.id.toString()
              }))}
              onChange={(values) => 
                setFormData(prev => ({ 
                  ...prev, 
                  selectedUnits: values.map(v => parseInt(v)) 
                }))
              }
              selected={formData.selectedUnits.map(id => id.toString())}
            />
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

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {gerente ? 'Salvar Alterações' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 
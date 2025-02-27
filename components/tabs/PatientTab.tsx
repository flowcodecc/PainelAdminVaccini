'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { toast } from "@/components/ui/use-toast"
import { DeleteAlertDialog } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Patient {
  id: string
  created_at?: string
  nome: string | null
  email: string | null
  sobrenome: string | null
  logradouro: string | null
  cidade: string | null
  estado: string | null
  numero: string | null
  bairro: string | null
  sexo: string | null
  nascimento: string | null
  complemento: string | null
  celular: string | null
  units: string[] | null
  user_role_id: number | null
  is_active: boolean
  cep: string | null
}

export function PatientTab() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [patientToDelete, setPatientToDelete] = useState<string | null>(null)
  const [formData, setFormData] = useState<Omit<Patient, 'id' | 'created_at'> & { senha?: string }>({
    nome: '',
    email: '',
    senha: '',
    sobrenome: '',
    logradouro: '',
    cidade: '',
    estado: '',
    numero: '',
    bairro: '',
    sexo: '',
    nascimento: '',
    complemento: '',
    celular: '',
    units: [],
    user_role_id: null,
    is_active: true,
    cep: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState("list")
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('user')
        .select('*')
        .is('user_role_id', null) // Filtra apenas pacientes (user_role_id null)
        .order('nome')

      if (error) throw error

      if (data) {
        console.log('Pacientes:', data)
        setPatients(data)
      }
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar pacientes"
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (selectedPatient) {
        // Atualizar paciente existente - validar apenas nome
        if (!formData.nome) {
          throw new Error('Nome é obrigatório')
        }

        const editableFields = {
          nome: formData.nome,
          sobrenome: formData.sobrenome,
          logradouro: formData.logradouro,
          cidade: formData.cidade,
          estado: formData.estado,
          numero: formData.numero,
          bairro: formData.bairro,
          sexo: formData.sexo,
          nascimento: formData.nascimento,
          complemento: formData.complemento,
          celular: formData.celular,
          is_active: formData.is_active,
          cep: formData.cep
        }

        const { error } = await supabase
          .from('user')
          .update(editableFields)
          .eq('id', selectedPatient.id)

        if (error) throw error

        toast({
          title: "Sucesso",
          description: "Paciente atualizado com sucesso"
        })

        setEditDialogOpen(false)
        resetForm()
        fetchPatients()
      } else {
        // Criar novo paciente - validar todos os campos obrigatórios
        if (!formData.email || !formData.senha || !formData.nome) {
          throw new Error('Nome, email e senha são obrigatórios')
        }

        // Verificar se email já existe
        const { data: existingUser, error: checkError } = await supabase
          .from('user')
          .select('id')
          .eq('email', formData.email)
          .single()

        if (existingUser) {
          throw new Error('Este email já está cadastrado')
        }

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError
        }

        // 1. Criar usuário no Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.senha,
          options: {
            data: {
              role: 'patient'
            }
          }
        })

        if (authError) throw authError

        if (!authData.user?.id) {
          throw new Error('Erro ao criar usuário no Auth')
        }

        // 2. Criar usuário na tabela user com CEP
        const { senha, ...userData } = formData
        const { error: userError } = await supabase
          .from('user')
          .insert({
            ...userData,
            id: authData.user.id,
            user_role_id: null,
            created_at: new Date().toISOString(),
            cep: formData.cep
          })

        if (userError) {
          await supabase.auth.admin.deleteUser(authData.user.id)
          throw userError
        }

        toast({
          title: "Sucesso",
          description: "Paciente cadastrado com sucesso"
        })

        resetForm()
        setActiveTab("list")
        fetchPatients()
      }
    } catch (error: any) {
      console.error('Erro completo:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar paciente"
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error: userError } = await supabase
        .from('user')
        .delete()
        .eq('id', id)

      if (userError) throw userError

      toast({
        title: "Sucesso",
        description: "Paciente removido com sucesso"
      })

      fetchPatients()
    } catch (error: any) {
      console.error('Erro:', error)
      toast({
        title: "Erro",
        description: error.message
      })
    }
  }

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      senha: '',
      sobrenome: '',
      logradouro: '',
      cidade: '',
      estado: '',
      numero: '',
      bairro: '',
      sexo: '',
      nascimento: '',
      complemento: '',
      celular: '',
      units: [],
      user_role_id: null,
      is_active: true,
      cep: '',
    })
    setSelectedPatient(null)
  }

  const handleCancel = () => {
    resetForm()
    setSelectedPatient(null)
    setActiveTab("list")
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    try {
      return format(new Date(dateString + 'T00:00:00'), 'dd/MM/yyyy')
    } catch {
      return dateString
    }
  }

  // Adicionar a função de formatação de CEP
  const formatCep = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    let formatted = cleaned

    if (cleaned.length > 5) {
      formatted = `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`
    }

    return formatted
  }

  // Adicionar a função de busca de endereço
  const fetchAddressByCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '')
    
    if (cleanCep.length !== 8) {
      toast({
        title: "Erro",
        description: "CEP deve ter 8 dígitos"
      })
      return
    }

    try {
      toast({
        title: "Buscando...",
        description: "Consultando endereço"
      })

      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      const data = await response.json()

      console.log('Resposta da API:', data) // Debug

      if (data.erro) {
        toast({
          title: "Erro",
          description: "CEP não encontrado"
        })
        return
      }

      // Garantir que todos os campos sejam atualizados
      const updatedFormData = {
        ...formData,
        logradouro: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        estado: data.uf || '',
        cep: cleanCep,
        numero: formData.numero || '', // Mantém o número se existir
        complemento: formData.complemento || '' // Mantém o complemento se existir
      }

      console.log('Dados atualizados:', updatedFormData) // Debug
      setFormData(updatedFormData)

      toast({
        title: "Sucesso",
        description: "Endereço encontrado e preenchido automaticamente"
      })

    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
      toast({
        title: "Erro",
        description: "Erro ao buscar endereço"
      })
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="border-b bg-gray-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-gray-800">
            Gerenciamento de Pacientes
          </CardTitle>
          <Button 
            onClick={() => setActiveTab("add")}
            className="bg-[#0AB2B3] hover:bg-[#099999] text-white"
          >
            Adicionar Paciente
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsContent value="list">
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold text-gray-600">Nome Completo</TableHead>
                    <TableHead className="font-semibold text-gray-600">Email</TableHead>
                    <TableHead className="font-semibold text-gray-600">Celular</TableHead>
                    <TableHead className="font-semibold text-gray-600">Endereço</TableHead>
                    <TableHead className="font-semibold text-gray-600">Data Nasc.</TableHead>
                    <TableHead className="font-semibold text-gray-600">Sexo</TableHead>
                    <TableHead className="font-semibold text-gray-600">Status</TableHead>
                    <TableHead className="w-[100px] font-semibold text-gray-600">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell>{`${patient.nome} ${patient.sobrenome || ''}`}</TableCell>
                      <TableCell>{patient.email || '-'}</TableCell>
                      <TableCell>{patient.celular || '-'}</TableCell>
                      <TableCell>
                        {patient.logradouro 
                          ? `${patient.logradouro}, ${patient.numero || 'S/N'}${patient.complemento ? `, ${patient.complemento}` : ''} - ${patient.bairro || ''} - ${patient.cidade || ''} - ${patient.estado || ''} - CEP: ${patient.cep || ''}`
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        {formatDate(patient.nascimento)}
                      </TableCell>
                      <TableCell>
                        {patient.sexo || '-'}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          patient.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {patient.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedPatient(patient)
                              setFormData({
                                ...patient,
                                senha: ''
                              })
                              setEditDialogOpen(true)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setPatientToDelete(patient.id)
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
            </div>
          </TabsContent>

          <TabsContent value="add">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold mb-4">
                {selectedPatient ? 'Editar Paciente' : 'Novo Paciente'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Dados Pessoais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="nome">Nome</Label>
                        <Input
                          id="nome"
                          value={formData.nome || ''}
                          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="sobrenome">Sobrenome</Label>
                        <Input
                          id="sobrenome"
                          value={formData.sobrenome || ''}
                          onChange={(e) => setFormData({ ...formData, sobrenome: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="celular">Celular</Label>
                        <Input
                          id="celular"
                          value={formData.celular || ''}
                          onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="nascimento">Data de Nascimento</Label>
                      <Input
                          id="nascimento"
                          type="date"
                          value={formData.nascimento || ''}
                          onChange={(e) => setFormData({ ...formData, nascimento: e.target.value })}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="is_active"
                          checked={formData.is_active}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
                        />
                        <Label htmlFor="is_active">Ativo</Label>
                      </div>

                      <div>
                        <Label htmlFor="sexo">Sexo</Label>
                        <Select
                          value={formData.sexo || ''}
                          onValueChange={(value) => setFormData({ ...formData, sexo: value })}
                        >
                          <SelectTrigger id="sexo">
                            <SelectValue placeholder="Selecione o sexo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Masculino">Masculino</SelectItem>
                            <SelectItem value="Feminino">Feminino</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Endereço</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cep">CEP</Label>
                        <div className="flex gap-2">
                          <Input
                            id="cep"
                            value={formatCep(formData.cep || '')}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '')
                              setFormData({ ...formData, cep: value })
                              if (value.length === 8) {
                                fetchAddressByCep(value)
                              }
                            }}
                            maxLength={9}
                            placeholder="00000-000"
                            className="flex-1"
                          />
                          <Button 
                            type="button"
                            className="bg-[#0AB2B3] hover:bg-[#099999] text-white"
                            onClick={() => fetchAddressByCep(formData.cep || '')}
                            disabled={!formData.cep || formData.cep.length !== 8}
                          >
                            Buscar
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="logradouro">Logradouro</Label>
                        <Input
                          id="logradouro"
                          value={formData.logradouro || ''}
                          onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="numero">Número</Label>
                        <Input
                          id="numero"
                          value={formData.numero || ''}
                          onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="complemento">Complemento</Label>
                        <Input
                          id="complemento"
                          value={formData.complemento || ''}
                          onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                        />
                      </div>

                    <div>
                        <Label htmlFor="bairro">Bairro</Label>
                        <Input
                          id="bairro"
                          value={formData.bairro || ''}
                          onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                        />
                      </div>

                    <div>
                        <Label htmlFor="cidade">Cidade</Label>
                      <Input
                          id="cidade"
                          value={formData.cidade || ''}
                          onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                      />
                    </div>

                    <div>
                        <Label htmlFor="estado">Estado</Label>
                      <Input
                          id="estado"
                          value={formData.estado || ''}
                          onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Dados de Acesso</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="email" className="text-gray-700">Email</Label>
                        {selectedPatient ? (
                          <div className="p-2 border rounded bg-gray-50">
                            {selectedPatient.email}
                          </div>
                        ) : (
                      <Input
                        id="email"
                        type="email"
                            className="mt-1"
                            value={formData.email || ''}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                        )}
                    </div>
                      {!selectedPatient && (
                    <div>
                          <Label htmlFor="senha" className="text-gray-700">Senha</Label>
                          <div className="relative mt-1">
                      <Input
                              id="senha"
                              type={showPassword ? "text" : "password"}
                              value={formData.senha || ''}
                              onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                        required
                              className="pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-500" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-500" />
                              )}
                            </Button>
                          </div>
                    </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCancel}
                    className="border-[#0AB2B3] text-[#0AB2B3] hover:bg-[#0AB2B3]/10"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-[#0AB2B3] hover:bg-[#099999] text-white"
                  >
                    {selectedPatient ? 'Salvar Alterações' : 'Cadastrar Paciente'}
                  </Button>
                </div>
                </form>
            </div>
          </TabsContent>
        </Tabs>

        <DeleteAlertDialog
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open)
            if (!open) setPatientToDelete(null)
          }}
          onConfirm={() => {
            if (patientToDelete) {
              handleDelete(patientToDelete)
              setDeleteDialogOpen(false)
              setPatientToDelete(null)
            }
          }}
          title="Excluir Paciente"
          description="Tem certeza que deseja excluir este paciente? Esta ação não pode ser desfeita."
        />

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Paciente</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={formData.nome || ''}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="sobrenome">Sobrenome</Label>
                  <Input
                    id="sobrenome"
                    value={formData.sobrenome || ''}
                    onChange={(e) => setFormData({ ...formData, sobrenome: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="celular">Celular</Label>
                  <Input
                    id="celular"
                    value={formData.celular || ''}
                    onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="nascimento">Data de Nascimento</Label>
                  <Input
                    id="nascimento"
                    type="date"
                    value={formData.nascimento || ''}
                    onChange={(e) => setFormData({ ...formData, nascimento: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="sexo">Sexo</Label>
                  <Select
                    value={formData.sexo || ''}
                    onValueChange={(value) => setFormData({ ...formData, sexo: value })}
                  >
                    <SelectTrigger id="sexo">
                      <SelectValue placeholder="Selecione o sexo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Feminino">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Email</Label>
                  <div className="p-2 border rounded bg-gray-50">
                    {selectedPatient?.email}
                  </div>
                </div>

                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cep"
                      value={formatCep(formData.cep || '')}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '')
                        setFormData({ ...formData, cep: value })
                        if (value.length === 8) {
                          fetchAddressByCep(value)
                        }
                      }}
                      maxLength={9}
                      placeholder="00000-000"
                      className="flex-1"
                    />
                    <Button 
                      type="button"
                      className="bg-[#0AB2B3] hover:bg-[#099999] text-white"
                      onClick={() => fetchAddressByCep(formData.cep || '')}
                      disabled={!formData.cep || formData.cep.length !== 8}
                    >
                      Buscar
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="logradouro">Logradouro</Label>
                  <Input
                    id="logradouro"
                    value={formData.logradouro || ''}
                    onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    value={formData.numero || ''}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input
                    id="complemento"
                    value={formData.complemento || ''}
                    onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    value={formData.bairro || ''}
                    onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade || ''}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    value={formData.estado || ''}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
                  />
                  <Label htmlFor="is_active">Ativo</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => {
                  setEditDialogOpen(false)
                  resetForm()
                }}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}


'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Edit, Trash2, DollarSign, Building2, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface Convenio {
  id: number
  nome: string
  ativo: boolean
  created_at: string
  updated_at: string
}

interface ConvenioVacinaPreco {
  id: number
  convenio_id: number
  vacina_id: number
  preco: number
  ativo: boolean
  convenio: Convenio
  vacina: {
    ref_vacinasID: number
    nome: string
  }
}

interface UnidadeConvenio {
  id: number
  unidade_id: number
  convenio_id: number
  aceita: boolean
  convenio: Convenio
  unidade: {
    id: number
    nome: string
  }
}

export function ConveniosTab() {
  const [convenios, setConvenios] = useState<Convenio[]>([])
  const [precos, setPrecos] = useState<ConvenioVacinaPreco[]>([])
  const [unidadeConvenios, setUnidadeConvenios] = useState<UnidadeConvenio[]>([])
  const [vacinas, setVacinas] = useState<any[]>([])
  const [unidades, setUnidades] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('convenios')
  
  // Estados para paginação e filtros
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(50)
  const [filterConvenio, setFilterConvenio] = useState('')
  const [filterVacina, setFilterVacina] = useState('')
  
  // Estados para filtros da aba unidades
  const [filterUnidade, setFilterUnidade] = useState('')
  const [filterConvenioUnidade, setFilterConvenioUnidade] = useState('')
  const [searchTermUnidades, setSearchTermUnidades] = useState('')
  
  // Estados para modais
  const [isConvenioModalOpen, setIsConvenioModalOpen] = useState(false)
  const [isPrecoModalOpen, setIsPrecoModalOpen] = useState(false)
  const [isUnidadeModalOpen, setIsUnidadeModalOpen] = useState(false)
  const [editingConvenio, setEditingConvenio] = useState<Convenio | null>(null)
  const [editingPreco, setEditingPreco] = useState<ConvenioVacinaPreco | null>(null)
  const [editingUnidade, setEditingUnidade] = useState<UnidadeConvenio | null>(null)
  
  // Estados para formulários
  const [formData, setFormData] = useState({
    nome: '',
    ativo: true,
    convenio_id: '',
    vacina_id: '',
    preco: '',
    unidade_id: '',
    aceita: true
  })

  useEffect(() => {
    fetchData()
  }, [])

  // Resetar página quando mudar de aba
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      
      // Buscar convênios
      const { data: conveniosData, error: conveniosError } = await supabase
        .from('convenios')
        .select('*')
        .order('nome')

      if (conveniosError) throw conveniosError

      // Buscar preços com joins
      const { data: precosData, error: precosError } = await supabase
        .from('convenio_vacina_precos')
        .select(`
          *,
          convenio:convenios(*),
          vacina:ref_vacinas(ref_vacinasID, nome)
        `)
        .order('convenio_id')

      if (precosError) throw precosError

      // Buscar relações unidade-convênio
      const { data: unidadeConveniosData, error: unidadeConveniosError } = await supabase
        .from('unidade_convenios')
        .select(`
          *,
          convenio:convenios(*),
          unidade:unidade(id, nome)
        `)
        .order('unidade_id')

      if (unidadeConveniosError) throw unidadeConveniosError

      // Buscar vacinas
      const { data: vacinasData, error: vacinasError } = await supabase
        .from('ref_vacinas')
        .select('ref_vacinasID, nome')
        .eq('status', true)
        .order('nome')

      if (vacinasError) throw vacinasError

      // Buscar unidades
      const { data: unidadesData, error: unidadesError } = await supabase
        .from('unidade')
        .select('id, nome')
        .eq('status', true)
        .order('nome')

      if (unidadesError) throw unidadesError

      setConvenios(conveniosData || [])
      setPrecos(precosData || [])
      setUnidadeConvenios(unidadeConveniosData || [])
      setVacinas(vacinasData || [])
      setUnidades(unidadesData || [])

    } catch (error) {
      console.error('Erro ao buscar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveConvenio = async () => {
    try {
      if (editingConvenio) {
        // Atualizar
        const { error } = await supabase
          .from('convenios')
          .update({
            nome: formData.nome,
            ativo: formData.ativo
          })
          .eq('id', editingConvenio.id)

        if (error) throw error
        toast.success('Convênio atualizado com sucesso!')
      } else {
        // Criar
        const { error } = await supabase
          .from('convenios')
          .insert({
            nome: formData.nome,
            ativo: formData.ativo
          })

        if (error) throw error
        toast.success('Convênio criado com sucesso!')
      }

      setIsConvenioModalOpen(false)
      setEditingConvenio(null)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Erro ao salvar convênio:', error)
      toast.error('Erro ao salvar convênio')
    }
  }

  const handleSavePreco = async () => {
    try {
      if (editingPreco) {
        // Atualizar
        const { error } = await supabase
          .from('convenio_vacina_precos')
          .update({
            convenio_id: parseInt(formData.convenio_id),
            vacina_id: parseInt(formData.vacina_id),
            preco: parseFloat(formData.preco),
            ativo: true
          })
          .eq('id', editingPreco.id)

        if (error) throw error
        toast.success('Preço atualizado com sucesso!')
      } else {
        // Criar
        const { error } = await supabase
          .from('convenio_vacina_precos')
          .insert({
            convenio_id: parseInt(formData.convenio_id),
            vacina_id: parseInt(formData.vacina_id),
            preco: parseFloat(formData.preco),
            ativo: true
          })

        if (error) throw error
        toast.success('Preço criado com sucesso!')
      }

      setIsPrecoModalOpen(false)
      setEditingPreco(null)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Erro ao salvar preço:', error)
      toast.error('Erro ao salvar preço')
    }
  }

  const handleSaveUnidade = async () => {
    try {
      if (editingUnidade) {
        // Atualizar
        const { error } = await supabase
          .from('unidade_convenios')
          .update({
            unidade_id: parseInt(formData.unidade_id),
            convenio_id: parseInt(formData.convenio_id),
            aceita: formData.aceita
          })
          .eq('id', editingUnidade.id)

        if (error) throw error
        toast.success('Relação unidade-convênio atualizada com sucesso!')
      } else {
        // Criar
        const { error } = await supabase
          .from('unidade_convenios')
          .insert({
            unidade_id: parseInt(formData.unidade_id),
            convenio_id: parseInt(formData.convenio_id),
            aceita: formData.aceita
          })

        if (error) throw error
        toast.success('Relação unidade-convênio criada com sucesso!')
      }

      setIsUnidadeModalOpen(false)
      setEditingUnidade(null)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Erro ao salvar relação unidade-convênio:', error)
      toast.error('Erro ao salvar relação unidade-convênio')
    }
  }

  const handleDeleteConvenio = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este convênio?')) return

    try {
      const { error } = await supabase
        .from('convenios')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Convênio excluído com sucesso!')
      fetchData()
    } catch (error) {
      console.error('Erro ao excluir convênio:', error)
      toast.error('Erro ao excluir convênio')
    }
  }

  const resetForm = () => {
    setFormData({
      nome: '',
      ativo: true,
      convenio_id: '',
      vacina_id: '',
      preco: '',
      unidade_id: '',
      aceita: true
    })
  }

  const openConvenioModal = (convenio?: Convenio) => {
    if (convenio) {
      setEditingConvenio(convenio)
      setFormData({
        nome: convenio.nome,
        ativo: convenio.ativo,
        convenio_id: '',
        vacina_id: '',
        preco: '',
        unidade_id: '',
        aceita: true
      })
    } else {
      setEditingConvenio(null)
      resetForm()
    }
    setIsConvenioModalOpen(true)
  }

  const openPrecoModal = (preco?: ConvenioVacinaPreco) => {
    if (preco) {
      setEditingPreco(preco)
      setFormData({
        nome: '',
        ativo: true,
        convenio_id: preco.convenio_id.toString(),
        vacina_id: preco.vacina_id.toString(),
        preco: preco.preco.toString(),
        unidade_id: '',
        aceita: true
      })
    } else {
      setEditingPreco(null)
      resetForm()
    }
    setIsPrecoModalOpen(true)
  }

  const openUnidadeModal = (unidade?: UnidadeConvenio) => {
    if (unidade) {
      setEditingUnidade(unidade)
      setFormData({
        nome: '',
        ativo: true,
        convenio_id: unidade.convenio_id.toString(),
        vacina_id: '',
        preco: '',
        unidade_id: unidade.unidade_id.toString(),
        aceita: unidade.aceita
      })
    } else {
      setEditingUnidade(null)
      resetForm()
    }
    setIsUnidadeModalOpen(true)
  }

  const filteredConvenios = convenios.filter(convenio =>
    convenio.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredPrecos = precos.filter(preco => {
    const matchesSearch = searchTerm === '' || 
      preco.convenio.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      preco.vacina.nome.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesConvenio = filterConvenio === '' || 
      preco.convenio_id.toString() === filterConvenio
    
    const matchesVacina = filterVacina === '' || 
      preco.vacina_id.toString() === filterVacina
    
    return matchesSearch && matchesConvenio && matchesVacina
  })

  const filteredUnidadeConvenios = unidadeConvenios.filter(uc => {
    const matchesSearch = searchTermUnidades === '' || 
      uc.convenio.nome.toLowerCase().includes(searchTermUnidades.toLowerCase()) ||
      uc.unidade.nome.toLowerCase().includes(searchTermUnidades.toLowerCase())
    
    const matchesUnidade = filterUnidade === '' || 
      uc.unidade_id.toString() === filterUnidade
    
    const matchesConvenio = filterConvenioUnidade === '' || 
      uc.convenio_id.toString() === filterConvenioUnidade
    
    return matchesSearch && matchesUnidade && matchesConvenio
  })

  // Paginação para preços
  const totalPages = Math.ceil(filteredPrecos.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedPrecos = filteredPrecos.slice(startIndex, endIndex)

  // Paginação para unidades
  const totalPagesUnidades = Math.ceil(filteredUnidadeConvenios.length / itemsPerPage)
  const startIndexUnidades = (currentPage - 1) * itemsPerPage
  const endIndexUnidades = startIndexUnidades + itemsPerPage
  const paginatedUnidadeConvenios = filteredUnidadeConvenios.slice(startIndexUnidades, endIndexUnidades)

  // Função para resetar filtros
  const resetFilters = () => {
    setFilterConvenio('')
    setFilterVacina('')
    setSearchTerm('')
    setCurrentPage(1)
  }

  // Função para resetar filtros das unidades
  const resetFiltersUnidades = () => {
    setFilterUnidade('')
    setFilterConvenioUnidade('')
    setSearchTermUnidades('')
    setCurrentPage(1)
  }

  // Função para mudar página
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-vaccini-primary">Convênios</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="convenios" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Convênios
          </TabsTrigger>
          <TabsTrigger value="precos" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Preços
          </TabsTrigger>
          <TabsTrigger value="unidades" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Unidades
          </TabsTrigger>
        </TabsList>

        <TabsContent value="convenios" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Lista de Convênios</CardTitle>
                <Button onClick={() => openConvenioModal()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Convênio
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConvenios.map((convenio) => (
                    <TableRow key={convenio.id}>
                      <TableCell className="font-medium">{convenio.nome}</TableCell>
                      <TableCell>
                        <Badge variant={convenio.ativo ? "default" : "secondary"}>
                          {convenio.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(convenio.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openConvenioModal(convenio)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteConvenio(convenio.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="precos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Preços por Convênio</CardTitle>
                <Button onClick={() => openPrecoModal()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Preço
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filtros */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="h-4 w-4" />
                  <span className="font-medium">Filtros</span>
                  {(filterConvenio || filterVacina || searchTerm) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetFilters}
                      className="ml-auto"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Limpar
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="filter-convenio">Convênio</Label>
                    <select
                      id="filter-convenio"
                      value={filterConvenio}
                      onChange={(e) => {
                        setFilterConvenio(e.target.value)
                        setCurrentPage(1)
                      }}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="">Todos os convênios</option>
                      {convenios.map((convenio) => (
                        <option key={convenio.id} value={convenio.id}>
                          {convenio.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="filter-vacina">Vacina</Label>
                    <select
                      id="filter-vacina"
                      value={filterVacina}
                      onChange={(e) => {
                        setFilterVacina(e.target.value)
                        setCurrentPage(1)
                      }}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="">Todas as vacinas</option>
                      {vacinas.map((vacina) => (
                        <option key={vacina.ref_vacinasID} value={vacina.ref_vacinasID}>
                          {vacina.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="search-precos">Buscar</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="search-precos"
                        placeholder="Buscar por convênio ou vacina..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value)
                          setCurrentPage(1)
                        }}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-gray-600">
                  Mostrando {paginatedPrecos.length} de {filteredPrecos.length} preços
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Convênio</TableHead>
                    <TableHead>Vacina</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPrecos.map((preco) => (
                    <TableRow key={preco.id}>
                      <TableCell className="font-medium">{preco.convenio.nome}</TableCell>
                      <TableCell>{preco.vacina.nome}</TableCell>
                      <TableCell>
                        {preco.preco === 0 ? (
                          <span className="text-gray-500 italic">Não configurado</span>
                        ) : (
                          `R$ ${preco.preco.toFixed(2)}`
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPrecoModal(preco)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-600">
                    Página {currentPage} de {totalPages}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unidades" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Convênios por Unidade</CardTitle>
                <Button onClick={() => openUnidadeModal()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Relação
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filtros para Unidades */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="h-4 w-4" />
                  <span className="font-medium">Filtros</span>
                  {(filterUnidade || filterConvenioUnidade || searchTermUnidades) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetFiltersUnidades}
                      className="ml-auto"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Limpar
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="filter-unidade">Unidade</Label>
                    <select
                      id="filter-unidade"
                      value={filterUnidade}
                      onChange={(e) => {
                        setFilterUnidade(e.target.value)
                        setCurrentPage(1)
                      }}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="">Todas as unidades</option>
                      {unidades.map((unidade) => (
                        <option key={unidade.id} value={unidade.id}>
                          {unidade.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="filter-convenio-unidade">Convênio</Label>
                    <select
                      id="filter-convenio-unidade"
                      value={filterConvenioUnidade}
                      onChange={(e) => {
                        setFilterConvenioUnidade(e.target.value)
                        setCurrentPage(1)
                      }}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="">Todos os convênios</option>
                      {convenios.map((convenio) => (
                        <option key={convenio.id} value={convenio.id}>
                          {convenio.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="search-unidades">Buscar</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="search-unidades"
                        placeholder="Buscar por unidade ou convênio..."
                        value={searchTermUnidades}
                        onChange={(e) => {
                          setSearchTermUnidades(e.target.value)
                          setCurrentPage(1)
                        }}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-gray-600">
                  Mostrando {paginatedUnidadeConvenios.length} de {filteredUnidadeConvenios.length} relações
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Convênio</TableHead>
                    <TableHead>Aceita</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUnidadeConvenios.map((uc) => (
                    <TableRow key={uc.id}>
                      <TableCell className="font-medium">{uc.unidade.nome}</TableCell>
                      <TableCell>{uc.convenio.nome}</TableCell>
                      <TableCell>
                        <Badge variant={uc.aceita ? "default" : "secondary"}>
                          {uc.aceita ? "Sim" : "Não"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openUnidadeModal(uc)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginação para Unidades */}
              {totalPagesUnidades > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-600">
                    Página {currentPage} de {totalPagesUnidades}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, totalPagesUnidades) }, (_, i) => {
                        let pageNum;
                        if (totalPagesUnidades <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPagesUnidades - 2) {
                          pageNum = totalPagesUnidades - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPagesUnidades}
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Convênio */}
      <Dialog open={isConvenioModalOpen} onOpenChange={setIsConvenioModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingConvenio ? 'Editar Convênio' : 'Novo Convênio'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome do convênio"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
              <Label htmlFor="ativo">Ativo</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsConvenioModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveConvenio}>
                {editingConvenio ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Preço */}
      <Dialog open={isPrecoModalOpen} onOpenChange={setIsPrecoModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPreco ? 'Editar Preço' : 'Novo Preço'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="convenio_id">Convênio</Label>
              <select
                id="convenio_id"
                value={formData.convenio_id}
                onChange={(e) => setFormData({ ...formData, convenio_id: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Selecione um convênio</option>
                {convenios.map((convenio) => (
                  <option key={convenio.id} value={convenio.id}>
                    {convenio.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="vacina_id">Vacina</Label>
              <select
                id="vacina_id"
                value={formData.vacina_id}
                onChange={(e) => setFormData({ ...formData, vacina_id: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Selecione uma vacina</option>
                {vacinas.map((vacina) => (
                  <option key={vacina.ref_vacinasID} value={vacina.ref_vacinasID}>
                    {vacina.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="preco">Preço</Label>
              <Input
                id="preco"
                type="number"
                step="0.01"
                value={formData.preco}
                onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsPrecoModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSavePreco}>
                {editingPreco ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Unidade */}
      <Dialog open={isUnidadeModalOpen} onOpenChange={setIsUnidadeModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUnidade ? 'Editar Relação' : 'Nova Relação'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="unidade_id">Unidade</Label>
              <select
                id="unidade_id"
                value={formData.unidade_id}
                onChange={(e) => setFormData({ ...formData, unidade_id: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Selecione uma unidade</option>
                {unidades.map((unidade) => (
                  <option key={unidade.id} value={unidade.id}>
                    {unidade.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="convenio_id">Convênio</Label>
              <select
                id="convenio_id"
                value={formData.convenio_id}
                onChange={(e) => setFormData({ ...formData, convenio_id: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Selecione um convênio</option>
                {convenios.map((convenio) => (
                  <option key={convenio.id} value={convenio.id}>
                    {convenio.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="aceita"
                checked={formData.aceita}
                onCheckedChange={(checked) => setFormData({ ...formData, aceita: checked })}
              />
              <Label htmlFor="aceita">Aceita este convênio</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsUnidadeModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveUnidade}>
                {editingUnidade ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

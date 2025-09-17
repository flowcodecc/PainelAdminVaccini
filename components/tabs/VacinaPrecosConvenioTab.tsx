'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Search, Edit, DollarSign, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface Convenio {
  id: number
  nome: string
  ativo: boolean
}

interface Vacina {
  ref_vacinasID: number
  nome: string
  status: boolean
}

interface ConvenioVacinaPreco {
  id: number
  convenio_id: number
  vacina_id: number
  preco: number
  ativo: boolean
  convenio: Convenio
  vacina: Vacina
}

export function VacinaPrecosConvenioTab() {
  const [precos, setPrecos] = useState<ConvenioVacinaPreco[]>([])
  const [convenios, setConvenios] = useState<Convenio[]>([])
  const [vacinas, setVacinas] = useState<Vacina[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Estados para filtros e paginação
  const [searchTerm, setSearchTerm] = useState('')
  const [filterConvenio, setFilterConvenio] = useState('')
  const [filterVacina, setFilterVacina] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(50)
  
  // Estados para modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPreco, setEditingPreco] = useState<ConvenioVacinaPreco | null>(null)
  const [formData, setFormData] = useState({
    convenio_id: '',
    vacina_id: '',
    preco: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      
      // Buscar preços com joins
      const { data: precosData, error: precosError } = await supabase
        .from('convenio_vacina_precos')
        .select(`
          *,
          convenio:convenios(*),
          vacina:ref_vacinas(ref_vacinasID, nome, status)
        `)
        .order('vacina_id, convenio_id')

      if (precosError) throw precosError

      // Buscar convênios
      const { data: conveniosData, error: conveniosError } = await supabase
        .from('convenios')
        .select('*')
        .eq('ativo', true)
        .order('nome')

      if (conveniosError) throw conveniosError

      // Buscar vacinas
      const { data: vacinasData, error: vacinasError } = await supabase
        .from('ref_vacinas')
        .select('ref_vacinasID, nome, status')
        .eq('status', true)
        .order('nome')

      if (vacinasError) throw vacinasError

      setPrecos(precosData || [])
      setConvenios(conveniosData || [])
      setVacinas(vacinasData || [])

    } catch (error) {
      console.error('Erro ao buscar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSavePreco = async () => {
    try {
      if (!formData.convenio_id || !formData.vacina_id || !formData.preco) {
        toast.error('Preencha todos os campos')
        return
      }

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

      setIsModalOpen(false)
      setEditingPreco(null)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Erro ao salvar preço:', error)
      toast.error('Erro ao salvar preço')
    }
  }

  const resetForm = () => {
    setFormData({
      convenio_id: '',
      vacina_id: '',
      preco: ''
    })
  }

  const openModal = (preco?: ConvenioVacinaPreco) => {
    if (preco) {
      setEditingPreco(preco)
      setFormData({
        convenio_id: preco.convenio_id.toString(),
        vacina_id: preco.vacina_id.toString(),
        preco: preco.preco.toString()
      })
    } else {
      setEditingPreco(null)
      resetForm()
    }
    setIsModalOpen(true)
  }

  // Filtros e paginação
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

  const totalPages = Math.ceil(filteredPrecos.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedPrecos = filteredPrecos.slice(startIndex, endIndex)

  const resetFilters = () => {
    setFilterConvenio('')
    setFilterVacina('')
    setSearchTerm('')
    setCurrentPage(1)
  }

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Preços no Convênio
            </CardTitle>
            <Button onClick={() => openModal()}>
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
                <Label htmlFor="search-precos">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search-precos"
                    placeholder="Buscar por vacina ou convênio..."
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
                <TableHead>Vacina</TableHead>
                <TableHead>Convênio</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPrecos.map((preco) => (
                <TableRow key={preco.id}>
                  <TableCell className="font-medium">{preco.vacina.nome}</TableCell>
                  <TableCell>{preco.convenio.nome}</TableCell>
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
                        onClick={() => openModal(preco)}
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

      {/* Modal para Editar/Criar Preço */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPreco ? 'Editar Preço' : 'Novo Preço'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="vacina_id">Vacina</Label>
              <select
                id="vacina_id"
                value={formData.vacina_id}
                onChange={(e) => setFormData({ ...formData, vacina_id: e.target.value })}
                className="w-full p-2 border rounded-md"
                disabled={!!editingPreco}
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
              <Label htmlFor="convenio_id">Convênio</Label>
              <select
                id="convenio_id"
                value={formData.convenio_id}
                onChange={(e) => setFormData({ ...formData, convenio_id: e.target.value })}
                className="w-full p-2 border rounded-md"
                disabled={!!editingPreco}
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
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSavePreco}>
                {editingPreco ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

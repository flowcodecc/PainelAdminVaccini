'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { VaccineList, UnitVaccineList, UnitVaccine, User } from '@/types'
import { useUser } from '@/contexts/UserContext'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Pencil, Trash2, Download, Upload, Eye } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { DeleteAlertDialog } from "@/components/ui/alert-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { VaccineListDialog } from "@/components/dialogs/VaccineListDialog"
import { VaccineListViewDialog } from "@/components/dialogs/VaccineListViewDialog"

interface VaccineListsTabProps {
  currentUser?: User
}

export function VaccineListsTab({ currentUser: propCurrentUser }: VaccineListsTabProps) {
  const { currentUser: contextUser } = useUser()
  const currentUser = propCurrentUser || contextUser
  
  const [vaccineLists, setVaccineLists] = useState<VaccineList[]>([])
  const [unitVaccineLists, setUnitVaccineLists] = useState<UnitVaccineList[]>([])
  const [unitVaccines, setUnitVaccines] = useState<UnitVaccine[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [listToDelete, setListToDelete] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedList, setSelectedList] = useState<VaccineList | undefined>()
  const [viewListId, setViewListId] = useState<number | undefined>()

  const isAdmin = currentUser?.role === 'admin'
  const isManager = currentUser?.role === 'gerente'



  useEffect(() => {
    if (currentUser) {
      fetchVaccineLists()
      if (isManager || isAdmin) {
        fetchUnitVaccineLists()
        fetchUnitVaccines()
      }
    }
  }, [currentUser])

  const fetchVaccineLists = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('vaccine_lists')
        .select('*')
        .eq('status', true)
        .order('created_at', { ascending: false })

      // Se for gerente, buscar apenas templates (listas públicas criadas pelo admin)
      if (isManager) {
        query = query.eq('is_template', true)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar listas de vacinas:', error)
        toast({
          title: "Erro",
          description: "Erro ao carregar listas de vacinas",
        })
        return
      }

      // Buscar nomes dos criadores separadamente
      const listsWithCreator = await Promise.all(
        (data || []).map(async (list) => {
          const { data: userData } = await supabase
            .from('user')
            .select('nome')
            .eq('id', list.created_by)
            .single()

          return {
            ...list,
            creator_name: userData?.nome || 'Usuário desconhecido'
          }
        })
      )

      setVaccineLists(listsWithCreator)
    } catch (error) {
      console.error('Erro:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar listas de vacinas",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchUnitVaccineLists = async () => {
    try {
      let query = supabase
        .from('unit_vaccine_lists')
        .select(`
          *,
          vaccine_list:vaccine_lists(*),
          unidade:unidade(nome)
        `)
        .eq('is_active', true)
        .order('imported_at', { ascending: false })

      // Se for gerente, filtrar por suas unidades
      if (isManager && currentUser?.units?.length) {
        query = query.in('unidade_id', currentUser.units)
      }
      // Se for admin, mostrar todas as importações
      
      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar listas importadas:', error)
        return
      }

      // Buscar nomes dos usuários que importaram separadamente
      const listsWithDetails = await Promise.all(
        (data || []).map(async (item) => {
          const { data: userData } = await supabase
            .from('user')
            .select('nome')
            .eq('id', item.imported_by)
            .single()

          return {
            ...item,
            unit_name: item.unidade?.nome || 'Unidade desconhecida',
            imported_by_name: userData?.nome || 'Usuário desconhecido'
          }
        })
      )

      setUnitVaccineLists(listsWithDetails)
    } catch (error) {
      console.error('Erro:', error)
    }
  }

  const fetchUnitVaccines = async () => {
    try {
      let query = supabase
        .from('unit_vaccines')
        .select(`
          *,
          vaccine:ref_vacinas!vaccine_id(
            ref_vacinasID,
            nome,
            preco,
            status
          ),
          unidade:unidade(nome)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      // Se for gerente, filtrar por suas unidades
      if (isManager && currentUser?.units?.length) {
        query = query.in('unidade_id', currentUser.units)
      }
      // Se for admin, mostrar todas as vacinas de unidades
      
      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar vacinas da unidade:', error)
        return
      }

      const vaccinesWithDetails = data?.map(item => ({
        ...item,
        unit_name: item.unidade?.nome || 'Unidade desconhecida'
      })) || []

      setUnitVaccines(vaccinesWithDetails)
    } catch (error) {
      console.error('Erro:', error)
    }
  }

  const handleImportList = async (listId: number) => {
    console.log('Tentando importar lista:', listId)
    console.log('Current user:', currentUser)
    console.log('isAdmin:', isAdmin)
    console.log('isManager:', isManager)
    
    try {
      let unitId: number

      if (isAdmin) {
        // Se for admin, buscar a primeira unidade disponível no sistema para teste
        const { data: units } = await supabase
          .from('unidade')
          .select('id')
          .eq('status', true)
          .limit(1)
        
        if (!units?.length) {
          toast({
            title: "Erro",
            description: "Nenhuma unidade ativa encontrada no sistema",
          })
          return
        }
        unitId = units[0].id
        console.log('Admin - usando unidade:', unitId)
      } else {
        // Para gerentes, usar suas unidades
        console.log('Verificando unidades do gerente...')
        console.log('currentUser.units:', currentUser?.units)
        
        if (!currentUser?.units?.length) {
          // Buscar unidades diretamente do banco se não estiver no contexto
          console.log('Buscando unidades do banco...')
          const { data: userFromDB } = await supabase
            .from('user')
            .select('units')
            .eq('id', currentUser?.id)
            .single()
          
          console.log('Unidades do banco:', userFromDB?.units)
          
          if (!userFromDB?.units?.length) {
            console.log('Gerente sem unidades associadas no banco')
            toast({
              title: "Erro",
              description: "Você não possui unidades associadas",
            })
            return
          }
          
          // Converter para número se for string
          const firstUnit = userFromDB.units[0]
          unitId = typeof firstUnit === 'string' ? parseInt(firstUnit) : firstUnit
        } else {
          // Converter para número se for string
          const firstUnit = currentUser.units[0]
          unitId = typeof firstUnit === 'string' ? parseInt(firstUnit) : firstUnit
        }
        console.log('Gerente - usando unidade:', unitId, 'tipo:', typeof unitId)
      }

      // Verificar se já foi importada
      const { data: existing } = await supabase
        .from('unit_vaccine_lists')
        .select('id')
        .eq('unidade_id', unitId)
        .eq('vaccine_list_id', listId)
        .eq('is_active', true)

      if (existing?.length) {
        toast({
          title: "Aviso",
          description: "Esta lista já foi importada para sua unidade",
        })
        return
      }

      // Primeiro, importar a lista
      const { data: importedList, error } = await supabase
        .from('unit_vaccine_lists')
        .insert({
          unidade_id: unitId,
          vaccine_list_id: listId,
          imported_by: currentUser.id
        })
        .select('id')
        .single()

      if (error) {
        console.error('Erro ao importar lista:', error)
        toast({
          title: "Erro",
          description: "Erro ao importar lista de vacinas",
        })
        return
      }

      // Depois, buscar as vacinas da lista e criar cópias para a unidade
      const { data: listItems, error: itemsError } = await supabase
        .from('vaccine_list_items')
        .select('*')
        .eq('vaccine_list_id', listId)

      if (itemsError) {
        console.error('Erro ao buscar itens da lista:', itemsError)
        toast({
          title: "Erro",
          description: "Erro ao buscar vacinas da lista",
        })
        return
      }

      // Criar vacinas individuais para a unidade
      if (listItems && listItems.length > 0) {
        const unitVaccines = listItems.map(item => ({
          unidade_id: unitId,
          vaccine_list_id: listId,
          vaccine_id: item.vaccine_id,
          preco_customizado: item.preco_customizado,
          imported_from_list_id: importedList.id
        }))

        const { error: vaccinesError } = await supabase
          .from('unit_vaccines')
          .insert(unitVaccines)

        if (vaccinesError) {
          console.error('Erro ao criar vacinas da unidade:', vaccinesError)
          toast({
            title: "Erro",
            description: "Erro ao criar vacinas individuais",
          })
          return
        }
      }

      toast({
        title: "Sucesso!",
        description: "Lista de vacinas importada com sucesso",
      })

      fetchUnitVaccineLists()
      fetchUnitVaccines()
    } catch (error) {
      console.error('Erro:', error)
      toast({
        title: "Erro",
        description: "Erro ao importar lista de vacinas",
      })
    }
  }

  const handleDeleteList = async (id: number) => {
    try {
      const { error } = await supabase
        .from('vaccine_lists')
        .update({ status: false })
        .eq('id', id)

      if (error) {
        console.error('Erro ao excluir lista:', error)
        toast({
          title: "Erro",
          description: "Erro ao excluir lista de vacinas",
        })
        return
      }

      toast({
        title: "Sucesso!",
        description: "Lista de vacinas excluída com sucesso",
      })

      fetchVaccineLists()
    } catch (error) {
      console.error('Erro:', error)
      toast({
        title: "Erro",
        description: "Erro ao excluir lista de vacinas",
      })
    }
  }

  const handleRemoveImportedList = async (id: number) => {
    try {
      // Primeiro, remover as vacinas individuais associadas a esta importação
      const { error: vaccinesError } = await supabase
        .from('unit_vaccines')
        .update({ is_active: false })
        .eq('imported_from_list_id', id)

      if (vaccinesError) {
        console.error('Erro ao remover vacinas da unidade:', vaccinesError)
        toast({
          title: "Erro",
          description: "Erro ao remover vacinas da unidade",
        })
        return
      }

      // Depois, desativar a lista importada
      const { error } = await supabase
        .from('unit_vaccine_lists')
        .update({ is_active: false })
        .eq('id', id)

      if (error) {
        console.error('Erro ao remover lista importada:', error)
        toast({
          title: "Erro",
          description: "Erro ao remover lista importada",
        })
        return
      }

      toast({
        title: "Sucesso!",
        description: "Lista e suas vacinas removidas da unidade com sucesso",
      })

      fetchUnitVaccineLists()
      fetchUnitVaccines()
    } catch (error) {
      console.error('Erro:', error)
      toast({
        title: "Erro",
        description: "Erro ao remover lista importada",
      })
    }
  }

  if (loading) {
    return <div>Carregando...</div>
  }

  return (
    <div className="space-y-6">
      {/* Seção para Administradores - Criar e Gerenciar Listas */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Listas de Vacinas</CardTitle>
            <CardDescription>
              Como administrador, você pode criar listas de vacinas que serão disponibilizadas para os gerentes das unidades.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-semibold">Listas Criadas</h3>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Criar Nova Lista
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Criador</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vaccineLists.map((list) => (
                  <TableRow key={list.id}>
                    <TableCell className="font-medium">{list.nome}</TableCell>
                    <TableCell>{list.descricao || '-'}</TableCell>
                    <TableCell>{list.creator_name}</TableCell>
                    <TableCell>
                      <Badge variant={list.is_template ? "default" : "secondary"}>
                        {list.is_template ? 'Template' : 'Privada'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(list.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setViewListId(list.id)
                            setViewDialogOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedList(list)
                            setEditDialogOpen(true)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setListToDelete(list.id)
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
          </CardContent>
        </Card>
      )}

      {/* Seção para Gerentes e Administradores - Importar Listas */}
      {(isManager || isAdmin) && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Listas Disponíveis para Importação</CardTitle>
              <CardDescription>
                Como gerente, você pode importar listas de vacinas criadas pelos administradores para suas unidades.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Criado por</TableHead>
                    <TableHead>Data de Criação</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vaccineLists.map((list) => (
                    <TableRow key={list.id}>
                      <TableCell className="font-medium">{list.nome}</TableCell>
                      <TableCell>{list.descricao || '-'}</TableCell>
                      <TableCell>{list.creator_name}</TableCell>
                      <TableCell>
                        {new Date(list.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setViewListId(list.id)
                              setViewDialogOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleImportList(list.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Listas Importadas</CardTitle>
              <CardDescription>
                Listas de vacinas que foram importadas para suas unidades.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome da Lista</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Importado por</TableHead>
                    <TableHead>Data de Importação</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unitVaccineLists.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.vaccine_list?.nome || 'Lista não encontrada'}
                      </TableCell>
                      <TableCell>{item.unit_name}</TableCell>
                      <TableCell>{item.imported_by_name}</TableCell>
                      <TableCell>
                        {new Date(item.imported_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setViewListId(item.vaccine_list_id)
                              setViewDialogOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveImportedList(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vacinas Individuais Importadas</CardTitle>
              <CardDescription>
                Vacinas específicas que foram importadas para suas unidades através das listas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome da Vacina</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Preço Padrão</TableHead>
                    <TableHead>Preço Customizado</TableHead>
                    <TableHead>Data de Importação</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unitVaccines.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.vaccine?.nome || 'Vacina não encontrada'}
                      </TableCell>
                      <TableCell>{item.unit_name}</TableCell>
                      <TableCell>
                        R$ {item.vaccine?.preco?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell>
                        {item.preco_customizado ? (
                          <span className="font-medium text-blue-600">
                            R$ {item.preco_customizado.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(item.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              // TODO: Implementar edição de preço customizado
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              // TODO: Implementar remoção individual
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

              {unitVaccines.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma vacina individual importada encontrada
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Mensagem para outros tipos de usuário */}
      {!isAdmin && !isManager && (
        <Card>
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>
              Apenas administradores e gerentes de unidade têm acesso a esta funcionalidade.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <DeleteAlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open)
          if (!open) setListToDelete(null)
        }}
        onConfirm={() => {
          if (listToDelete) {
            handleDeleteList(listToDelete)
            setDeleteDialogOpen(false)
            setListToDelete(null)
          }
        }}
        title="Excluir Lista de Vacinas"
        description="Tem certeza que deseja excluir esta lista de vacinas? Esta ação não pode ser desfeita."
      />

      <VaccineListDialog
        isOpen={createDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false)
          setSelectedList(undefined)
        }}
        onSuccess={() => {
          fetchVaccineLists()
          if (isManager || isAdmin) {
            fetchUnitVaccineLists()
            fetchUnitVaccines()
          }
        }}
      />

      <VaccineListDialog
        isOpen={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false)
          setSelectedList(undefined)
        }}
        onSuccess={() => {
          fetchVaccineLists()
          if (isManager || isAdmin) {
            fetchUnitVaccineLists()
            fetchUnitVaccines()
          }
        }}
        vaccineList={selectedList}
      />

      <VaccineListViewDialog
        isOpen={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false)
          setViewListId(undefined)
        }}
        vaccineListId={viewListId}
      />
    </div>
  )
}

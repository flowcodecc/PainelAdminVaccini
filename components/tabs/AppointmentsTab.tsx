'use client'

import React, { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { toast } from "@/components/ui/use-toast"
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CirclePlus, Edit, Trash2, ChevronLeft, ChevronRight, Printer, Eye, MessageSquare, Clock, User, Filter, X, Search } from "lucide-react"
import { Unit, Patient, UnitSchedule, Vaccine } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useUserUnitsFilter } from '@/hooks/useUserUnitsFilter'

interface Appointment {
  id: number
  patient_id: string
  patient_name: string
  scheduled_date: Date
  time_slot: string
  status: string
  unit_name: string
  unit_id: number
  vaccines: Vaccine[]
  valor_total: number
  forma_pagamento: string
  user: {
    logradouro: string
    numero: string
    bairro: string
    cidade: string
    estado: string
    cep: string
    email: string
    celular: string
  }
  patient_details: {
    nascimento: string
    sexo: string
    endereco: string
    bairro: string
    cidade: string
    estado: string
    cep: string
    email: string
    celular: string
    plano_saude?: string
  }
}

interface SolicitacaoAgendamento {
  id: number
  user_id: string
  vacina_id: number
  unidade_id: number | null
  observacoes: string | null
  status: string
  prioridade: string
  data_solicitacao: string
  data_contato: string | null
  atendente_id: string | null
  observacoes_atendente: string | null
  created_at: string
  updated_at: string
  // Dados relacionados
  user?: {
    email: string
    celular: string
    nome: string
  }
  vacina?: {
    nome: string
  }
  unidade?: {
    nome: string
  }
  atendente?: {
    email: string
    nome: string
  }
}

export function AppointmentsTab() {
  const { getUnitsFilter, shouldFilterByUnits, currentUser } = useUserUnitsFilter()
  const [units, setUnits] = useState<Unit[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedUnit, setSelectedUnit] = useState<number>(0)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [availableTimeSlots, setAvailableTimeSlots] = useState<UnitSchedule[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedPatient, setSelectedPatient] = useState<string>('')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<number>(0)
  const [paymentMethods, setPaymentMethods] = useState<{ id: number, nome: string }[]>([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<number>(0)
  const [vaccines, setVaccines] = useState<Vaccine[]>([])
  const [selectedVaccines, setSelectedVaccines] = useState<{ vaccineId: number, dose: number }[]>([])
  const [selectedVaccineId, setSelectedVaccineId] = useState<string>('')
  const [selectedDose, setSelectedDose] = useState<number>(0)
  const [totalValue, setTotalValue] = useState<number>(0)
  const [appointmentsByDay, setAppointmentsByDay] = useState<Record<string, Appointment[]>>({})
  const [activeTab, setActiveTab] = useState<string>("list")
  const [filterUnit, setFilterUnit] = useState<number>(0)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterDateRange, setFilterDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined })
  const [selectedAppointmentDetails, setSelectedAppointmentDetails] = useState<Appointment | null>(null)
  const [selectedAppointmentIds, setSelectedAppointmentIds] = useState<number[]>([])
  const [hasSchedules, setHasSchedules] = useState<boolean>(false)
  const [appointmentToDelete, setAppointmentToDelete] = useState<number | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  // Estados para solicitações de agendamento
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoAgendamento[]>([])
  const [isLoadingSolicitacoes, setIsLoadingSolicitacoes] = useState(false)
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<SolicitacaoAgendamento | null>(null)
  const [isSolicitacaoModalOpen, setIsSolicitacaoModalOpen] = useState(false)
  
  // Estados para filtros e paginação das solicitações
  const [filterStatusSolicitacao, setFilterStatusSolicitacao] = useState('')
  const [filterPrioridadeSolicitacao, setFilterPrioridadeSolicitacao] = useState('')
  const [filterUnidadeSolicitacao, setFilterUnidadeSolicitacao] = useState('')
  const [searchTermSolicitacao, setSearchTermSolicitacao] = useState('')
  const [currentPageSolicitacao, setCurrentPageSolicitacao] = useState(1)
  const [itemsPerPageSolicitacao] = useState(50)

  // 🔥 Busca unidades disponíveis
  const fetchUnits = async () => {
    let query = supabase
      .from('unidade')
      .select('*')
      .eq('status', true)

    // Aplica filtro de unidades se necessário
    const unitsFilter = getUnitsFilter()
    if (unitsFilter) {
      query = query.in('id', unitsFilter.in)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar unidades:', error)
      return
    }
    
    setUnits(data || [])
  }

  // 🔥 Verifica unidades que atendem ao CEP do paciente
  const fetchUnitsForPatient = async (patientId: string) => {
    try {
      // Verifica unidades que atendem ao CEP
      const { data, error } = await supabase
        .rpc('verifica_unidade_usuario', {
          user_id: patientId
        })

      if (error) {
        console.error('Erro ao verificar unidades para o paciente:', error)
        toast({
          title: "Erro",
          description: "Erro ao verificar unidades disponíveis para o paciente"
        })
        setUnits([])
        return
      }

      if (!data || data.length === 0) {
        toast({
          title: "Aviso",
          description: "Nenhuma unidade atende ao CEP deste paciente",
          duration: 4000
        })
        setUnits([])
        return
      }

      // Extrai os IDs únicos das unidades do resultado
      let unitIds: number[] = Array.from(new Set(data.map((item: { unidade_id: number }) => item.unidade_id)))

      // Filtra por unidades do usuário se necessário
      const unitsFilter = getUnitsFilter()
      if (unitsFilter) {
        unitIds = unitIds.filter((id: number) => unitsFilter.in.includes(id))
      }

      if (unitIds.length === 0) {
        toast({
          title: "Aviso",
          description: "Nenhuma das suas unidades vinculadas atende ao CEP deste paciente",
          duration: 4000
        })
        setUnits([])
        return
      }

      // Busca os detalhes das unidades retornadas
      const { data: unitsData, error: unitsError } = await supabase
        .from('unidade')
        .select('*')
        .eq('status', true)
        .in('id', unitIds)

      if (unitsError) {
        console.error('Erro ao buscar detalhes das unidades:', unitsError)
        toast({
          title: "Erro",
          description: "Erro ao buscar informações das unidades"
        })
        setUnits([])
        return
      }

      setUnits(unitsData || [])
    } catch (err) {
      console.error('Erro:', err)
      toast({
        title: "Erro",
        description: "Erro ao verificar unidades disponíveis"
      })
      setUnits([])
    }
  }

  // 🔥 Busca pacientes (usuários sem role)
  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('user')
        .select('*')
        .is('user_role_id', null)
        .eq('is_active', true)

      if (error) throw error

      const formattedPatients: Patient[] = data?.map(user => ({
        id: user.id,
        name: `${user.nome} ${user.sobrenome || ''}`.trim(),
        cpf: user.cpf || '',
        dateOfBirth: new Date(user.data_nascimento),
        address: user.endereco || '',
        email: user.email,
        phone: user.telefone || ''
      })) || []

      setPatients(formattedPatients)
    } catch (err) {
      console.error('Erro:', err)
      toast({
        title: "Erro",
        description: "Erro ao carregar pacientes"
      })
    }
  }

  // 🔥 Busca os horários disponíveis
  const fetchAvailableTimeSlots = async (unit_id: number, date: Date) => {
    try {
      const diasSemana: Record<number, string> = {
        0: 'Domingo',
        1: 'Segunda',
        2: 'Terca',
        3: 'Quarta',
        4: 'Quinta',
        5: 'Sexta',
        6: 'Sabado'
      }

      const dayOfWeek = diasSemana[date.getDay()]
      
      console.log('Buscando horários:', {
        unit_id,
        date: format(date, 'dd/MM/yyyy'),
        dayOfWeek
      })

      // Primeiro, verifica se a unidade tem horários configurados
      const { data: allSchedules, error: scheduleError } = await supabase
        .from('unit_schedules')
        .select('*')
        .eq('unit_id', unit_id)

      if (scheduleError) {
        console.error('Erro ao verificar horários da unidade:', scheduleError)
        toast({
          title: "Erro",
          description: "Erro ao buscar horários"
        })
        setAvailableTimeSlots([])
        return
      }

      // Se não houver nenhum horário configurado para a unidade
      if (!allSchedules || allSchedules.length === 0) {
        console.log('Unidade não possui horários configurados')
        toast({
          title: "Aviso",
          description: "Esta unidade não possui horários configurados",
          duration: 4000
        })
        setAvailableTimeSlots([])
        setSelectedTimeSlot(0)
        return
      }

      // Busca horários para o dia específico
      const { data: schedules, error } = await supabase
        .from('unit_schedules')
        .select('*')
        .eq('unit_id', unit_id)
        .eq('dia_da_semana', dayOfWeek)

      if (error) {
        console.error('Erro ao buscar horários:', error)
        toast({
          title: "Erro",
          description: "Erro ao buscar horários"
        })
        setAvailableTimeSlots([])
        return
      }

      if (!schedules || schedules.length === 0) {
        console.log('Nenhum horário encontrado para este dia')
        toast({
          title: "Aviso",
          description: "Nenhum horário de atendimento para esse dia da semana",
          duration: 3000
        })
        setAvailableTimeSlots([])
        setSelectedTimeSlot(0)
        return
      }

      // Verifica agendamentos existentes
      const formattedDate = format(date, 'yyyy-MM-dd')
      const { data: existingAppointments, error: appointmentsError } = await supabase
        .from('agendamento')
        .select('horario')
        .eq('dia', formattedDate)
        .eq('unidade_id', unit_id)
        .eq('status_id', 1)

      if (appointmentsError) {
        console.error('Erro ao verificar agendamentos:', appointmentsError)
      }

      // Filtra horários já agendados
      const availableSlots = schedules.filter(slot => {
        const isSlotTaken = existingAppointments?.some(
          appt => appt.horario === slot.horario_inicio
        )
        return !isSlotTaken
      })

      console.log('Horários disponíveis:', availableSlots)
      setAvailableTimeSlots(availableSlots)
    } catch (err) {
      console.error('Erro ao buscar horários:', err)
      toast({
        title: "Erro",
        description: "Erro ao buscar horários"
      })
      setAvailableTimeSlots([])
    }
  }

  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('ref_formas_pagamentos')
        .select('id, nome')
        .order('id')

      if (error) {
        console.error('Erro ao buscar formas de pagamento:', error)
        return
      }

      if (data && data.length > 0) {
        setPaymentMethods(data)
      } else {
        setPaymentMethods([
          { id: 1, nome: 'Pix' },
          { id: 2, nome: 'Cartão de Crédito' },
          { id: 3, nome: 'Cartão de Débito' }
        ])
      }
    } catch (error) {
      console.error('Erro:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar formas de pagamento"
      })
    }
  }

  const fetchVaccines = async () => {
    const { data, error } = await supabase
      .from('ref_vacinas')
      .select(`
        *,
        esquema:esquema_id (
          id,
          dose_1,
          dose_2,
          dose_3,
          dose_4,
          dose_5
        )
      `)
      .eq('status', true)

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar vacinas"
      })
      return
    }

    setVaccines(data || [])
  }

  // Busca agendamentos
  const fetchAppointments = async () => {
    try {
      let query = supabase
        .from('vw_agendamentos_com_usuarios')
        .select(`
          *,
          unidade:unidade_id (nome),
          status:status_id (nome),
          forma_pagamento:forma_pagamento_id (nome)
        `)
        .eq('status_id', 1)

      // Aplica filtro de unidades se necessário
      const unitsFilter = getUnitsFilter()
      if (unitsFilter) {
        query = query.in('unidade_id', unitsFilter.in)
      }

      const { data, error } = await query.order('horario', { ascending: true })

      if (error) throw error

      const formattedAppointments = await Promise.all(data
        .map(async appointment => {
          const { data: vaccinesData } = await supabase
            .from('ref_vacinas')
            .select('ref_vacinasID, nome, preco')
            .in('ref_vacinasID', appointment.vacinas_id || [])

          return {
            id: appointment.agendamento_id,
            patient_id: appointment.user_id,
            patient_name: `${appointment.nome} ${appointment.sobrenome || ''}`.trim(),
            scheduled_date: new Date(appointment.dia),
            time_slot: appointment.horario,
            status: appointment.status?.nome || 'Pendente',
            unit_name: appointment.unidade?.nome,
            unit_id: appointment.unidade_id,
            vaccines: (vaccinesData || []).map(v => ({
              ref_vacinasID: v.ref_vacinasID,
              nome: v.nome,
              preco: v.preco
            })),
            valor_total: appointment.valor_total,
            forma_pagamento: appointment.forma_pagamento?.nome || '-',
            // Novos campos do paciente
            patient_details: {
              email: appointment.email,
              celular: appointment.celular,
              endereco: `${appointment.logradouro}, ${appointment.numero}`,
              bairro: appointment.bairro,
              cidade: appointment.cidade,
              estado: appointment.estado,
              cep: appointment.cep,
              nascimento: appointment.nascimento,
              sexo: appointment.sexo,
              plano_saude: appointment.nome_plano_saude
            },
            user: {
              logradouro: appointment.logradouro,
              numero: appointment.numero,
              bairro: appointment.bairro,
              cidade: appointment.cidade,
              estado: appointment.estado,
              cep: appointment.cep,
              email: appointment.email,
              celular: appointment.celular
            }
          }
        }))

      setAppointments(formattedAppointments)
      
      const byDay = formattedAppointments.reduce((acc, appointment) => {
        const day = format(appointment.scheduled_date, 'yyyy-MM-dd')
        if (!acc[day]) acc[day] = []
        acc[day].push(appointment)
        return acc
      }, {} as Record<string, Appointment[]>)

      setAppointmentsByDay(byDay)
    } catch (error) {
      console.error('Erro:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar agendamentos"
      })
    }
  }

  // 🔥 Busca solicitações de agendamento
  const fetchSolicitacoes = async () => {
    try {
      setIsLoadingSolicitacoes(true)
      
      let query = supabase
        .from('solicitacoes_agendamento')
        .select(`
          *,
          vacina:ref_vacinas!vacina_id(nome),
          unidade:unidade!unidade_id(nome)
        `)
        .order('data_solicitacao', { ascending: false })

      // Aplica filtro de unidades se necessário
      const unitsFilter = getUnitsFilter()
      if (unitsFilter) {
        query = query.in('unidade_id', unitsFilter.in)
      }

      const { data: solicitacoesData, error } = await query

      if (error) throw error

      // Buscar dados dos usuários separadamente
      const solicitacoesComUsuarios = await Promise.all(
        (solicitacoesData || []).map(async (solicitacao) => {
          // Buscar dados do usuário na tabela user
          const { data: userData } = await supabase
            .from('user')
            .select('nome, email, celular')
            .eq('id', solicitacao.user_id)
            .single()

          // Buscar dados do atendente se existir
          let atendenteData = null
          if (solicitacao.atendente_id) {
            const { data: atendente } = await supabase
              .from('user')
              .select('nome, email')
              .eq('id', solicitacao.atendente_id)
              .single()
            atendenteData = atendente
          }

          return {
            ...solicitacao,
            user: userData,
            atendente: atendenteData
          }
        })
      )

      setSolicitacoes(solicitacoesComUsuarios)
    } catch (error) {
      console.error('Erro ao buscar solicitações:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar solicitações de agendamento"
      })
    } finally {
      setIsLoadingSolicitacoes(false)
    }
  }

  // 🔥 Funções para gerenciar solicitações
  const openSolicitacaoModal = (solicitacao?: SolicitacaoAgendamento) => {
    setSelectedSolicitacao(solicitacao || null)
    setIsSolicitacaoModalOpen(true)
  }

  const handleUpdateSolicitacao = async (solicitacaoId: number, updates: Partial<SolicitacaoAgendamento>) => {
    try {
      const { error } = await supabase
        .from('solicitacoes_agendamento')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', solicitacaoId)

      if (error) throw error

      await fetchSolicitacoes()
      
      toast({
        title: "Sucesso!",
        description: "Solicitação atualizada com sucesso!"
      })
    } catch (error) {
      console.error('Erro ao atualizar solicitação:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar solicitação"
      })
    }
  }

  const handleContactSolicitacao = async (solicitacaoId: number) => {
    try {
      const { error } = await supabase
        .from('solicitacoes_agendamento')
        .update({
          status: 'em_contato',
          data_contato: new Date().toISOString(),
          atendente_id: currentUser?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', solicitacaoId)

      if (error) throw error

      await fetchSolicitacoes()
      
      toast({
        title: "Sucesso!",
        description: "Status atualizado para 'Em Contato'"
      })
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar status da solicitação"
      })
    }
  }

  // Componente do botão de impressão
  const PrintButton = ({ appointment }: { appointment: Appointment }) => {
    return (
      <div className="relative inline-block">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <Printer className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-40" align="end">
            <div className="flex flex-col gap-1">
              <Button 
                variant="ghost" 
                onClick={() => handlePrintAppointment(appointment, false)}
                className="justify-start w-full"
              >
                Impressão Simples
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => handlePrintAppointment(appointment, true)}
                className="justify-start w-full"
              >
                Impressão Detalhada
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    )
  }

  // Função para imprimir os dados de um agendamento individual
  const handlePrintAppointment = async (appointment: Appointment, detailed: boolean = false) => {
    try {
      const printWindow = window.open('', '_blank', 'width=800,height=1000')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Comprovante de Agendamento</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  padding: 20px;
                  margin: 0;
                }
                .header {
                  background: linear-gradient(45deg, #2563eb, #3b82f6);
                  color: white;
                  padding: 20px;
                  text-align: center;
                  margin-bottom: 30px;
                }
                .content {
                  max-width: 800px;
                  margin: 0 auto;
                  padding: 20px;
                }
                .section {
                  background: white;
                  border: 1px solid #e5e7eb;
                  border-radius: 8px;
                  padding: 20px;
                  margin-bottom: 20px;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                .detail {
                  margin-bottom: 10px;
                  display: flex;
                  justify-content: space-between;
                }
                .signature-line {
                  margin-top: 50px;
                  border-top: 1px solid #000;
                  padding-top: 10px;
                  text-align: center;
                }
                @media print {
                  body { padding: 0; }
                  .header { background: #3b82f6 !important; -webkit-print-color-adjust: exact; }
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>VACCINI</h1>
                <p>Comprovante de Agendamento ${detailed ? '- Detalhado' : ''}</p>
              </div>
              <div class="content">
                ${detailed ? `
                  <div class="section">
                    <h3>Dados do Paciente</h3>
                    <div class="detail"><strong>Nome Completo:</strong> ${appointment.patient_name}</div>
                    <div class="detail"><strong>Endereço:</strong> ${appointment.user.logradouro}, ${appointment.user.numero}</div>
                    <div class="detail"><strong>Bairro:</strong> ${appointment.user.bairro}</div>
                    <div class="detail"><strong>Cidade/Estado:</strong> ${appointment.user.cidade}/${appointment.user.estado}</div>
                    <div class="detail"><strong>CEP:</strong> ${appointment.user.cep}</div>
                    <div class="detail"><strong>Email:</strong> ${appointment.user.email || '-'}</div>
                    <div class="detail"><strong>Celular:</strong> ${appointment.user.celular || '-'}</div>
                  </div>
                ` : ''}
                <div class="section">
                  <h3>Dados do Agendamento</h3>
                  <div class="detail"><strong>Data:</strong> ${format(appointment.scheduled_date, 'dd/MM/yyyy')}</div>
                  <div class="detail"><strong>Horário:</strong> ${appointment.time_slot}</div>
                  <div class="detail"><strong>Unidade:</strong> ${appointment.unit_name}</div>
                </div>
                <div class="section">
                  <h3>Vacinas</h3>
                  ${appointment.vaccines.map(v => `
                    <div class="detail">
                      <span>${v.nome}</span>
                      <span>R$ ${v.preco.toFixed(2)}</span>
                    </div>
                  `).join('')}
                  <div class="detail" style="margin-top: 15px; font-weight: bold;">
                    <span>Total:</span>
                    <span>R$ ${appointment.valor_total.toFixed(2)}</span>
                  </div>
                </div>
                <div class="signature-line">
                  <p>_____________________________________________</p>
                  <p>Assinatura do Responsável</p>
                  <p style="font-size: 12px; color: #666; margin-top: 20px;">
                    Apresente este comprovante na unidade no dia do seu agendamento
                  </p>
                </div>
              </div>
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.focus()
        printWindow.print()
        printWindow.close()
      }
    } catch (error) {
      console.error('Erro ao imprimir:', error)
      toast({
        title: "Erro",
        description: "Erro ao gerar impressão"
      })
    }
  }

  // Função para imprimir múltiplos agendamentos selecionados
  const handleBulkPrint = async (detailed: boolean = false) => {
    const appointmentsToPrint = appointments.filter(appt => selectedAppointmentIds.includes(appt.id))
    if (appointmentsToPrint.length === 0) {
      toast({ title: "Aviso", description: "Nenhum agendamento selecionado para impressão." })
      return
    }

    try {
      const printWindow = window.open('', '_blank', 'width=800,height=1000')
      if (printWindow) {
        let htmlContent = `
          <html>
            <head>
              <title>Impressão de Agendamentos</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  padding: 20px; 
                  margin: 0;
                }
                .appointment { 
                  margin-bottom: 30px; 
                  border-bottom: 1px solid #ccc; 
                  padding-bottom: 20px;
                  page-break-inside: avoid;
                }
                .appointment:last-child {
                  border-bottom: none;
                }
                h1, h2, h3 { 
                  margin: 0 0 15px 0; 
                }
                .section { 
                  margin-top: 15px;
                  page-break-inside: avoid;
                }
                .detail { 
                  margin-bottom: 5px;
                  line-height: 1.4;
                }
                @media print {
                  body { 
                    margin: 0; 
                    padding: 20px;
                  }
                  .appointment {
                    page-break-after: always;
                  }
                  .appointment:last-child {
                    page-break-after: avoid;
                  }
                }
              </style>
            </head>
            <body>
              <h1 style="text-align: center; margin-bottom: 30px;">Lista de Agendamentos</h1>
        `

        for (const appt of appointmentsToPrint) {
          htmlContent += `
            <div class="appointment">
              <h2>Agendamento - ${appt.patient_name}</h2>
              
              ${detailed ? `
                <div class="section">
                  <h3>Dados do Paciente</h3>
                  <div class="detail"><strong>Nome Completo:</strong> ${appt.patient_name}</div>
                  <div class="detail"><strong>Endereço:</strong> ${appt.user.logradouro}, ${appt.user.numero}</div>
                  <div class="detail"><strong>Bairro:</strong> ${appt.user.bairro}</div>
                  <div class="detail"><strong>Cidade/Estado:</strong> ${appt.user.cidade}/${appt.user.estado}</div>
                  <div class="detail"><strong>CEP:</strong> ${appt.user.cep}</div>
                  <div class="detail"><strong>Email:</strong> ${appt.user.email || '-'}</div>
                  <div class="detail"><strong>Celular:</strong> ${appt.user.celular || '-'}</div>
                </div>
              ` : ''}

              <div class="section">
                <h3>Dados do Agendamento</h3>
                <div class="detail"><strong>Data:</strong> ${format(new Date(appt.scheduled_date), 'dd/MM/yyyy', { locale: ptBR })}</div>
                <div class="detail"><strong>Horário:</strong> ${appt.time_slot}</div>
                <div class="detail"><strong>Unidade:</strong> ${appt.unit_name}</div>
                <div class="detail"><strong>Forma de Pagamento:</strong> ${appt.forma_pagamento}</div>
              </div>

              <div class="section">
                <h3>Vacinas</h3>
                ${appt.vaccines.map(v => `
                  <div class="detail">• ${v.nome} - R$ ${v.preco.toFixed(2)}</div>
                `).join('')}
                <div class="detail" style="margin-top: 10px; font-weight: bold;">
                  <strong>Valor Total:</strong> R$ ${appt.valor_total.toFixed(2)}
                </div>
              </div>

              <div class="section" style="margin-top: 50px; text-align: center;">
                <p style="border-top: 1px solid #000; width: 300px; margin: 20px auto; padding-top: 10px;">
                  Assinatura do Responsável
                </p>
              </div>
            </div>
          `
        }

        htmlContent += `</body></html>`
        printWindow.document.write(htmlContent)
        printWindow.document.close()
        setTimeout(() => {
          printWindow.focus()
          printWindow.print()
          printWindow.close()
        }, 500)
      }
    } catch (error) {
      console.error('Erro ao imprimir:', error)
      toast({
        title: "Erro",
        description: "Erro ao gerar impressão em lote"
      })
    }
  }

  // Função para alternar seleção de agendamentos via checkbox
  const toggleAppointmentSelection = (appointmentId: number) => {
    if (selectedAppointmentIds.includes(appointmentId)) {
      setSelectedAppointmentIds(selectedAppointmentIds.filter(id => id !== appointmentId))
    } else {
      setSelectedAppointmentIds([...selectedAppointmentIds, appointmentId])
    }
  }

  // Função para selecionar ou deselecionar todos os agendamentos listados
  const toggleSelectAll = () => {
    if (selectedAppointmentIds.length === filteredAppointments.length) {
      setSelectedAppointmentIds([])
    } else {
      setSelectedAppointmentIds(filteredAppointments.map(appt => appt.id))
    }
  }

  // Função para verificar se a unidade tem horários configurados
  const checkUnitSchedules = async (unit_id: number) => {
    try {
      const { data: schedules, error } = await supabase
        .from('unit_schedules')
        .select('*')
        .eq('unit_id', unit_id)

      if (error) {
        console.error('Erro ao verificar horários:', error)
        toast({
          title: "Erro",
          description: "Erro ao verificar horários da unidade"
        })
        setHasSchedules(false)
        return false
      }

      const hasConfiguredSchedules = schedules && schedules.length > 0
      setHasSchedules(hasConfiguredSchedules)

      if (!hasConfiguredSchedules) {
        toast({
          title: "Aviso",
          description: "Esta unidade não possui horários de atendimento configurados",
          duration: 4000
        })
      }

      return hasConfiguredSchedules
    } catch (err) {
      console.error('Erro:', err)
      toast({
        title: "Erro",
        description: "Erro ao verificar horários da unidade"
      })
      setHasSchedules(false)
      return false
    }
  }

  const handlePreviousMonth = () => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth)
      newMonth.setMonth(newMonth.getMonth() - 1)
      return newMonth
    })
  }

  const handleNextMonth = () => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth)
      newMonth.setMonth(newMonth.getMonth() + 1)
      return newMonth
    })
  }

  const getDaysInMonth = (date: Date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1)
    const days = []
    const startDay = start.getDay()

    // Adiciona dias do mês anterior para completar a primeira semana
    for (let i = 0; i < startDay; i++) {
      const prevDate = new Date(start)
      prevDate.setDate(i - startDay + 1)
      days.push({ date: prevDate, isCurrentMonth: false })
    }

    // Adiciona todos os dias do mês atual
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    for (let i = 1; i <= lastDay; i++) {
      const currentDate = new Date(date.getFullYear(), date.getMonth(), i)
      days.push({ date: currentDate, isCurrentMonth: true })
    }

    // Adiciona dias do próximo mês para completar a última semana
    const remainingDays = 42 - days.length // 6 semanas * 7 dias = 42
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(date.getFullYear(), date.getMonth() + 1, i)
      days.push({ date: nextDate, isCurrentMonth: false })
    }

    return days
  }

  useEffect(() => {
    fetchPatients()
    fetchPaymentMethods()
    fetchVaccines()
  }, [])

  // Reexecuta fetchAppointments quando currentUser mudar
  useEffect(() => {
    if (currentUser) {
      fetchAppointments()
      fetchSolicitacoes()
    }
  }, [currentUser])

  // Atualiza a lista de unidades quando um paciente é selecionado OU quando currentUser mudar
  useEffect(() => {
    if (currentUser) {
      if (selectedPatient) {
        fetchUnitsForPatient(selectedPatient)
      } else {
        fetchUnits()
      }
    }
  }, [selectedPatient, currentUser])

  useEffect(() => {
    const total = selectedVaccines.reduce((sum, { vaccineId }) => {
      const vaccine = vaccines.find(v => v.ref_vacinasID === vaccineId)
      return sum + (vaccine?.preco || 0)
    }, 0)
    setTotalValue(total)
  }, [selectedVaccines, vaccines])

  useEffect(() => {
    if (selectedUnit) {
      fetchAppointments()
    } else {
      setAppointments([])
      setAppointmentsByDay({})
    }
  }, [selectedUnit])

  // Reset página quando mudar de aba
  useEffect(() => {
    setCurrentPageSolicitacao(1)
  }, [activeTab])

  const handleScheduleAppointment = async () => {
    try {
      if (!selectedUnit || !selectedDate || !selectedTimeSlot || !selectedPatient || !selectedPaymentMethod) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios"
        })
        return
      }

      toast({
        title: "Processando",
        description: "Realizando agendamento..."
      })

      const timeSlot = availableTimeSlots.find(s => s.id === selectedTimeSlot)
      
      const { data, error } = await supabase
        .from('agendamento')
        .insert({
          user_id: selectedPatient,
          unidade_id: selectedUnit,
          forma_pagamento_id: selectedPaymentMethod,
          horario: timeSlot?.horario_inicio,
          dia: selectedDate.toISOString().split('T')[0],
          status_id: 1,
          valor_total: totalValue,
          vacinas_id: selectedVaccines.map(v => v.vaccineId)
        })
        .select()
        .single()

      if (error) throw error

      await fetchAppointments()

      toast({
        title: "Sucesso!",
        description: "Agendamento realizado com sucesso!"
      })

      // Limpa o formulário
      setSelectedDate(undefined)
      setSelectedTimeSlot(0)
      setSelectedPatient('')
      setSelectedPaymentMethod(0)
      setSelectedVaccines([])
      setAvailableTimeSlots([])
      setActiveTab('list')
    } catch (error) {
      console.error('Erro ao realizar agendamento:', error)
      toast({
        title: "Erro",
        description: "Erro ao realizar agendamento. Tente novamente."
      })
    }
  }

  const filteredAppointments = appointments.filter(appointment => {
    let matches = true

    if (filterUnit && appointment.unit_id !== filterUnit) {
      matches = false
    }

    if (filterStatus && appointment.status !== filterStatus) {
      matches = false
    }

    if (filterDateRange.from || filterDateRange.to) {
      const appointmentDate = new Date(appointment.scheduled_date)
      if (filterDateRange.from && appointmentDate < filterDateRange.from) {
        matches = false
      }
      if (filterDateRange.to && appointmentDate > filterDateRange.to) {
        matches = false
      }
    }

    return matches
  })

  // 🔥 Filtros e paginação para solicitações
  const filteredSolicitacoes = solicitacoes.filter(solicitacao => {
    const matchesSearch = searchTermSolicitacao === '' || 
      solicitacao.user?.nome?.toLowerCase().includes(searchTermSolicitacao.toLowerCase()) ||
      solicitacao.user?.email?.toLowerCase().includes(searchTermSolicitacao.toLowerCase()) ||
      solicitacao.vacina?.nome?.toLowerCase().includes(searchTermSolicitacao.toLowerCase()) ||
      solicitacao.unidade?.nome?.toLowerCase().includes(searchTermSolicitacao.toLowerCase())
    
    const matchesStatus = filterStatusSolicitacao === '' || 
      solicitacao.status === filterStatusSolicitacao
    
    const matchesPrioridade = filterPrioridadeSolicitacao === '' || 
      solicitacao.prioridade === filterPrioridadeSolicitacao
    
    const matchesUnidade = filterUnidadeSolicitacao === '' || 
      solicitacao.unidade_id?.toString() === filterUnidadeSolicitacao
    
    return matchesSearch && matchesStatus && matchesPrioridade && matchesUnidade
  })

  const totalPagesSolicitacoes = Math.ceil(filteredSolicitacoes.length / itemsPerPageSolicitacao)
  const startIndexSolicitacoes = (currentPageSolicitacao - 1) * itemsPerPageSolicitacao
  const endIndexSolicitacoes = startIndexSolicitacoes + itemsPerPageSolicitacao
  const paginatedSolicitacoes = filteredSolicitacoes.slice(startIndexSolicitacoes, endIndexSolicitacoes)

  // Função para resetar filtros das solicitações
  const resetFiltersSolicitacoes = () => {
    setFilterStatusSolicitacao('')
    setFilterPrioridadeSolicitacao('')
    setFilterUnidadeSolicitacao('')
    setSearchTermSolicitacao('')
    setCurrentPageSolicitacao(1)
  }

  // Função para mudar página das solicitações
  const handlePageChangeSolicitacoes = (page: number) => {
    setCurrentPageSolicitacao(page)
  }

  const handleDeleteAppointment = async (appointmentId: number) => {
    try {
      const { error } = await supabase
        .from('agendamento')
        .delete()
        .eq('id', appointmentId)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Agendamento excluído com sucesso"
      })

      // Atualiza a lista de agendamentos
      await fetchAppointments()
    } catch (error) {
      console.error('Erro ao excluir:', error)
      toast({
        title: "Erro",
        description: "Erro ao excluir agendamento"
      })
    }
  }

  const handleEditAppointment = (appointment: Appointment) => {
    // Preenche os estados com os dados do agendamento
    setSelectedPatient(appointment.patient_id)
    setSelectedUnit(appointment.unit_id)
    setSelectedDate(appointment.scheduled_date)
    setSelectedTimeSlot(parseInt(appointment.time_slot))
    
    // Busca o ID da forma de pagamento baseado no nome
    const paymentMethod = paymentMethods.find(p => p.nome === appointment.forma_pagamento)
    if (paymentMethod) {
      setSelectedPaymentMethod(paymentMethod.id)
    }
    
    // Define as vacinas selecionadas
    setSelectedVaccines(appointment.vaccines.map(v => ({
      vaccineId: v.ref_vacinasID,
      dose: 1 // Define dose padrão como 1
    })))
    
    // Abre a aba de novo agendamento
    setActiveTab("new")
  }

  return (
    <div className="w-full h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Agendamentos</h2>
        <div className="flex items-center">
          <Button onClick={() => setActiveTab("new")} className="bg-primary">
            <CirclePlus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
          {selectedAppointmentIds.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="ml-2">
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir Selecionados
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-40">
                <div className="flex flex-col gap-1">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleBulkPrint(false)}
                    className="justify-start"
                  >
                    Impressão Simples
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleBulkPrint(true)}
                    className="justify-start"
                  >
                    Impressão Detalhada
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-[600px]">
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="calendar">Calendário</TabsTrigger>
          <TabsTrigger value="solicitacoes">Solicitações</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <h3 className="text-sm font-medium mb-4">Filtros</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Unidade</Label>
                  <Select
                    value={filterUnit.toString()}
                    onValueChange={(value) => setFilterUnit(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as unidades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Todas as unidades</SelectItem>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id.toString()}>
                          {unit.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Status</Label>
                  <Select
                    value={filterStatus}
                    onValueChange={setFilterStatus}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Concluído">Concluído</SelectItem>
                      <SelectItem value="Cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Período</Label>
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                          {filterDateRange.from ? (
                            format(filterDateRange.from, 'dd/MM/yyyy')
                          ) : (
                            <span className="text-muted-foreground">Data inicial</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filterDateRange.from}
                          onSelect={(date) => setFilterDateRange(prev => ({ ...prev, from: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    <span>até</span>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                          {filterDateRange.to ? (
                            format(filterDateRange.to, 'dd/MM/yyyy')
                          ) : (
                            <span className="text-muted-foreground">Data final</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filterDateRange.to}
                          onSelect={(date) => setFilterDateRange(prev => ({ ...prev, to: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <input
                        type="checkbox"
                        checked={selectedAppointmentIds.length === filteredAppointments.length && filteredAppointments.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Vacina</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedAppointmentIds.includes(appointment.id)}
                          onChange={() => toggleAppointmentSelection(appointment.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{appointment.patient_name}</TableCell>
                      <TableCell>{format(appointment.scheduled_date, 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{appointment.time_slot}</TableCell>
                      <TableCell>{appointment.unit_name}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {appointment.vaccines.map((vaccine, index) => (
                            <div key={index} className="text-sm">
                              {vaccine.nome}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>R$ {appointment.valor_total.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium
                          ${appointment.status === 'Agendado' ? 'bg-blue-100 text-blue-700' : 
                            appointment.status === 'Concluído' ? 'bg-green-100 text-green-700' : 
                            'bg-red-100 text-red-700'}`}
                        >
                          {appointment.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditAppointment(appointment)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setAppointmentToDelete(appointment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <PrintButton appointment={appointment} />
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setSelectedAppointmentDetails(appointment)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-4">
              <div className="text-center text-sm text-gray-500">dom</div>
              <div className="text-center text-sm text-gray-500">seg</div>
              <div className="text-center text-sm text-gray-500">ter</div>
              <div className="text-center text-sm text-gray-500">qua</div>
              <div className="text-center text-sm text-gray-500">qui</div>
              <div className="text-center text-sm text-gray-500">sex</div>
              <div className="text-center text-sm text-gray-500">sab</div>

              {getDaysInMonth(currentMonth).map(({ date, isCurrentMonth }, index) => {
                const dateStr = format(date, 'yyyy-MM-dd')
                const appointments = appointmentsByDay[dateStr] || []
                const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr
                
                return (
                  <div 
                    key={index} 
                    className={`min-h-[100px] p-2 border rounded-lg ${
                      !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
                    } ${isToday ? 'border-primary' : ''}`}
                  >
                    <div className="text-sm font-medium mb-2">{date.getDate()}</div>
                    {appointments.map((appointment) => (
                      <div 
                        key={appointment.id}
                        onClick={() => setSelectedAppointmentDetails(appointment)}
                        className="text-xs p-1 mb-1 rounded bg-red-100 text-red-800 hover:bg-red-200 cursor-pointer transition-colors"
                      >
                        {appointment.time_slot} - {appointment.patient_name}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="solicitacoes">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Solicitações de Agendamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Filtros para Solicitações */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <Filter className="h-4 w-4" />
                    <span className="font-medium">Filtros</span>
                    {(filterStatusSolicitacao || filterPrioridadeSolicitacao || filterUnidadeSolicitacao || searchTermSolicitacao) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetFiltersSolicitacoes}
                        className="ml-auto"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Limpar
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="filter-status-solicitacao">Status</Label>
                      <select
                        id="filter-status-solicitacao"
                        value={filterStatusSolicitacao}
                        onChange={(e) => {
                          setFilterStatusSolicitacao(e.target.value)
                          setCurrentPageSolicitacao(1)
                        }}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="">Todos os status</option>
                        <option value="pendente">Pendente</option>
                        <option value="em_contato">Em Contato</option>
                        <option value="resolvido">Resolvido</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="filter-prioridade-solicitacao">Prioridade</Label>
                      <select
                        id="filter-prioridade-solicitacao"
                        value={filterPrioridadeSolicitacao}
                        onChange={(e) => {
                          setFilterPrioridadeSolicitacao(e.target.value)
                          setCurrentPageSolicitacao(1)
                        }}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="">Todas as prioridades</option>
                        <option value="baixa">Baixa</option>
                        <option value="normal">Normal</option>
                        <option value="alta">Alta</option>
                        <option value="urgente">Urgente</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="filter-unidade-solicitacao">Unidade</Label>
                      <select
                        id="filter-unidade-solicitacao"
                        value={filterUnidadeSolicitacao}
                        onChange={(e) => {
                          setFilterUnidadeSolicitacao(e.target.value)
                          setCurrentPageSolicitacao(1)
                        }}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="">Todas as unidades</option>
                        {units.map((unidade) => (
                          <option key={unidade.id} value={unidade.id}>
                            {unidade.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="search-solicitacao">Buscar</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="search-solicitacao"
                          placeholder="Buscar por nome, email, vacina..."
                          value={searchTermSolicitacao}
                          onChange={(e) => {
                            setSearchTermSolicitacao(e.target.value)
                            setCurrentPageSolicitacao(1)
                          }}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-sm text-gray-600">
                    Mostrando {paginatedSolicitacoes.length} de {filteredSolicitacoes.length} solicitações
                  </div>
                </div>

                {isLoadingSolicitacoes ? (
                  <div className="flex justify-center py-8">
                    <div className="text-gray-500">Carregando solicitações...</div>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Vacina</TableHead>
                          <TableHead>Unidade</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Prioridade</TableHead>
                          <TableHead>Data Solicitação</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedSolicitacoes.map((solicitacao) => (
                          <TableRow key={solicitacao.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{solicitacao.user?.nome || 'N/A'}</div>
                                <div className="text-sm text-gray-500">{solicitacao.user?.email}</div>
                                <div className="text-sm text-gray-500">{solicitacao.user?.celular}</div>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{solicitacao.vacina?.nome || 'N/A'}</TableCell>
                            <TableCell>{solicitacao.unidade?.nome || 'Não especificada'}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  solicitacao.status === 'pendente' ? 'secondary' :
                                  solicitacao.status === 'em_contato' ? 'default' :
                                  solicitacao.status === 'resolvido' ? 'outline' : 'destructive'
                                }
                              >
                                {solicitacao.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  solicitacao.prioridade === 'baixa' ? 'outline' :
                                  solicitacao.prioridade === 'normal' ? 'secondary' :
                                  solicitacao.prioridade === 'alta' ? 'default' : 'destructive'
                                }
                              >
                                {solicitacao.prioridade}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {format(new Date(solicitacao.data_solicitacao), 'dd/MM/yyyy HH:mm')}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openSolicitacaoModal(solicitacao)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {solicitacao.status === 'pendente' && (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleContactSolicitacao(solicitacao.id)}
                                  >
                                    <Clock className="h-4 w-4 mr-1" />
                                    Contatar
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Paginação para Solicitações */}
                    {totalPagesSolicitacoes > 1 && (
                      <div className="flex items-center justify-between mt-6">
                        <div className="text-sm text-gray-600">
                          Página {currentPageSolicitacao} de {totalPagesSolicitacoes}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChangeSolicitacoes(currentPageSolicitacao - 1)}
                            disabled={currentPageSolicitacao === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Anterior
                          </Button>
                          
                          <div className="flex gap-1">
                            {Array.from({ length: Math.min(5, totalPagesSolicitacoes) }, (_, i) => {
                              let pageNum;
                              if (totalPagesSolicitacoes <= 5) {
                                pageNum = i + 1;
                              } else if (currentPageSolicitacao <= 3) {
                                pageNum = i + 1;
                              } else if (currentPageSolicitacao >= totalPagesSolicitacoes - 2) {
                                pageNum = totalPagesSolicitacoes - 4 + i;
                              } else {
                                pageNum = currentPageSolicitacao - 2 + i;
                              }
                              
                              return (
                                <Button
                                  key={pageNum}
                                  variant={currentPageSolicitacao === pageNum ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handlePageChangeSolicitacoes(pageNum)}
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
                            onClick={() => handlePageChangeSolicitacoes(currentPageSolicitacao + 1)}
                            disabled={currentPageSolicitacao === totalPagesSolicitacoes}
                          >
                            Próxima
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog 
        open={activeTab === "new"} 
        onOpenChange={(open) => !open && setActiveTab("list")}
      >
        <DialogContent className="max-w-[90%] w-[1200px] h-[80vh] max-h-[800px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Novo Agendamento</DialogTitle>
          </DialogHeader>
          
          <div className="grid md:grid-cols-2 gap-6 px-4">
            {/* Lado esquerdo - Formulário */}
            <div className="space-y-4">
              <div className="bg-white rounded-lg border shadow-sm">
                <div className="p-4 border-b">
                  <h3 className="text-lg font-semibold">Informações Básicas</h3>
                </div>
                
                <div className="p-4 space-y-4">
                  <div>
                    <Label>Paciente</Label>
                    <Select
                      onValueChange={(value) => {
                        setSelectedPatient(value)
                        setSelectedUnit(0) // Reseta a unidade selecionada
                        setSelectedDate(undefined)
                        setAvailableTimeSlots([])
                      }}
                      value={selectedPatient}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um paciente" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Unidade</Label>
                    <Select 
                      onValueChange={async (value) => {
                        const unitId = parseInt(value)
                        setSelectedUnit(unitId)
                        setSelectedDate(undefined)
                        setAvailableTimeSlots([])
                        setSelectedTimeSlot(0)
                        
                        if (unitId > 0) {
                          const hasConfiguredSchedules = await checkUnitSchedules(unitId)
                          setHasSchedules(hasConfiguredSchedules)
                        } else {
                          setHasSchedules(false)
                        }
                      }}
                      value={selectedUnit.toString()}
                      disabled={!selectedPatient || units.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !selectedPatient 
                            ? "Selecione um paciente primeiro" 
                            : units.length === 0 
                              ? "Nenhuma unidade disponível para este CEP" 
                              : "Selecione uma unidade"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id.toString()}>
                            {unit.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedPatient && units.length === 0 && (
                      <p className="text-sm text-red-500 mt-1">
                        Nenhuma unidade atende ao CEP deste paciente
                      </p>
                    )}
                  </div>

                  {selectedUnit > 0 && !hasSchedules && (
                    <div className="mt-2 text-center py-6 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-yellow-800 font-medium">
                        Atenção
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Esta unidade não possui horários de atendimento configurados. Entre em contato com o administrador.
                      </p>
                    </div>
                  )}

                  {selectedUnit > 0 && hasSchedules && (
                    <div>
                      <Label>Data</Label>
                      <div className="calendar-container bg-white rounded-lg border shadow-sm p-4">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            if (date && selectedUnit) {
                              setSelectedDate(date)
                              fetchAvailableTimeSlots(selectedUnit, date)
                            }
                          }}
                          locale={ptBR}
                          className="w-full"
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                          fromDate={new Date()}
                          fixedWeeks
                          showOutsideDays={false}
                        />
                      </div>
                    </div>
                  )}

                  {selectedDate && availableTimeSlots.length > 0 && (
                    <div>
                      <Label>Horário</Label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {availableTimeSlots.map((slot) => (
                          <div
                            key={slot.id}
                            className={`p-3 border rounded cursor-pointer text-center transition-colors
                              ${selectedTimeSlot === slot.id 
                                ? 'bg-primary text-white' 
                                : 'hover:bg-gray-50'}`}
                            onClick={() => setSelectedTimeSlot(slot.id)}
                          >
                            {slot.horario_inicio}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedTimeSlot > 0 && (
                    <div>
                      <Label>Forma de Pagamento</Label>
                      <Select 
                        onValueChange={(value) => setSelectedPaymentMethod(parseInt(value))}
                        value={selectedPaymentMethod.toString()}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a forma de pagamento" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods.map((method) => (
                            <SelectItem key={method.id} value={method.id.toString()}>
                              {method.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedPaymentMethod > 0 && (
                    <div>
                      <Label>Vacinas</Label>
                      <div className="space-y-4">
                        {selectedVaccines.map(({ vaccineId, dose }) => {
                          const vaccine = vaccines.find(v => v.ref_vacinasID === vaccineId)
                          return (
                            <div key={vaccineId} className="flex items-center justify-between p-2 border rounded">
                              <span>{vaccine?.nome} - {dose}ª Dose</span>
                              <Button
                                variant="ghost" 
                                size="sm"
                                onClick={() => setSelectedVaccines(prev => prev.filter(v => v.vaccineId !== vaccineId))}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          )
                        })}

                        <div className="flex gap-2">
                          <Select
                            value={selectedVaccineId}
                            onValueChange={(value) => {
                              setSelectedVaccineId(value)
                              setSelectedDose(0)
                            }}
                          >
                            <SelectTrigger className="w-[300px]">
                              <SelectValue placeholder="Selecione uma vacina" />
                            </SelectTrigger>
                            <SelectContent>
                              {vaccines
                                .filter(v => !selectedVaccines.some(sv => sv.vaccineId === v.ref_vacinasID))
                                .map((vaccine) => (
                                  <SelectItem key={vaccine.ref_vacinasID} value={vaccine.ref_vacinasID.toString()}>
                                    {vaccine.nome}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>

                          {selectedVaccineId && (
                            <Select
                              value={selectedDose.toString()}
                              onValueChange={(value) => setSelectedDose(parseInt(value))}
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Dose" />
                              </SelectTrigger>
                              <SelectContent>
                                {[1, 2, 3, 4, 5].map(dose => {
                                  const vaccine = vaccines.find(v => v.ref_vacinasID === parseInt(selectedVaccineId))
                                  if (!vaccine?.esquema) return null
                                  
                                  const doseKey = `dose_${dose}` as keyof typeof vaccine.esquema
                                  if (vaccine.esquema[doseKey]) {
                                    return (
                                      <SelectItem key={dose} value={dose.toString()}>
                                        {dose}ª Dose
                                      </SelectItem>
                                    )
                                  }
                                  return null
                                }).filter(Boolean)}
                              </SelectContent>
                            </Select>
                          )}

                          <Button
                            variant="outline"
                            onClick={() => {
                              if (selectedVaccineId && selectedDose > 0) {
                                setSelectedVaccines(prev => [
                                  ...prev, 
                                  { 
                                    vaccineId: parseInt(selectedVaccineId), 
                                    dose: selectedDose 
                                  }
                                ])
                                setSelectedVaccineId('')
                                setSelectedDose(0)
                              }
                            }}
                            disabled={!selectedVaccineId || selectedDose === 0}
                          >
                            <CirclePlus className="h-4 w-4 mr-2" />
                            Adicionar Vacina
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Button 
                onClick={handleScheduleAppointment} 
                className="w-full"
                disabled={!selectedUnit || !selectedDate || !selectedTimeSlot || !selectedPatient || !selectedPaymentMethod}
              > 
                <CirclePlus className="w-4 h-4 mr-2" /> Confirmar Agendamento
              </Button>
            </div>

            {/* Lado direito - Resumo */}
            <div className="bg-gray-50 rounded-lg border h-fit sticky top-0">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold">Resumo do Agendamento</h3>
              </div>
              
              <div className="p-4 space-y-4">
                <div>
                  <span className="text-sm text-gray-500">Unidade</span>
                  <p className="font-medium">{units.find(u => u.id === selectedUnit)?.nome || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Data</span>
                  <p className="font-medium">
                    {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Horário</span>
                  <p className="font-medium">
                    {availableTimeSlots.find(s => s.id === selectedTimeSlot)?.horario_inicio || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Paciente</span>
                  <p className="font-medium">
                    {patients.find(p => p.id === selectedPatient)?.name || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Forma de Pagamento</span>
                  <p className="font-medium">
                    {paymentMethods.find(m => m.id === selectedPaymentMethod)?.nome || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Vacinas Selecionadas</span>
                  <div className="space-y-1">
                    {selectedVaccines.map(({ vaccineId, dose }) => {
                      const vaccine = vaccines.find(v => v.ref_vacinasID === vaccineId)
                      return (
                        <div key={vaccineId} className="flex justify-between">
                          <p className="font-medium">
                            {vaccine?.nome} - {dose}ª Dose
                          </p>
                          <p className="text-gray-600">
                            R$ {vaccine?.preco.toFixed(2)}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                  {selectedVaccines.length > 0 && (
                    <div className="mt-2 pt-2 border-t flex justify-between">
                      <span className="font-semibold">Total:</span>
                      <span className="font-semibold text-green-600">
                        R$ {totalValue.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização de Detalhes do Agendamento */}
      <Dialog 
        open={selectedAppointmentDetails !== null} 
        onOpenChange={(open) => { if (!open) setSelectedAppointmentDetails(null) }}
      >
        <DialogContent className="max-w-[90%] w-[400px]">
          <DialogHeader>
            <DialogTitle>Detalhes do Agendamento</DialogTitle>
          </DialogHeader>
          {selectedAppointmentDetails && (
            <div className="space-y-4">
              <div>
                <strong>Paciente:</strong> {selectedAppointmentDetails.patient_name}
              </div>
              <div>
                <strong>Data:</strong> {format(selectedAppointmentDetails.scheduled_date, 'dd/MM/yyyy')}
              </div>
              <div>
                <strong>Horário:</strong> {selectedAppointmentDetails.time_slot}
              </div>
              <div>
                <strong>Unidade:</strong> {selectedAppointmentDetails.unit_name}
              </div>
              <div>
                <strong>Vacinas:</strong> {selectedAppointmentDetails.vaccines.map(v => v.nome).join(', ')}
              </div>
              <div>
                <strong>Valor Total:</strong> R$ {selectedAppointmentDetails.valor_total.toFixed(2)}
              </div>
              <div>
                <strong>Status:</strong> {selectedAppointmentDetails.status}
              </div>
              <div>
                <strong>Endereço:</strong> {`${selectedAppointmentDetails.user.logradouro}, ${selectedAppointmentDetails.user.numero} - ${selectedAppointmentDetails.user.bairro}, ${selectedAppointmentDetails.user.cidade} - ${selectedAppointmentDetails.user.estado}, CEP: ${selectedAppointmentDetails.user.cep}`}
              </div>
              <div>
                <strong>Celular:</strong> {selectedAppointmentDetails.user.celular || '-'}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação de exclusão */}
      <AlertDialog open={appointmentToDelete !== null} onOpenChange={() => setAppointmentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Agendamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (appointmentToDelete) {
                  handleDeleteAppointment(appointmentToDelete)
                  setAppointmentToDelete(null)
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Solicitação de Agendamento */}
      <Dialog open={isSolicitacaoModalOpen} onOpenChange={setIsSolicitacaoModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {selectedSolicitacao ? 'Editar Solicitação' : 'Nova Solicitação'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedSolicitacao && (
            <div className="space-y-6">
              {/* Informações do Cliente */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3">Informações do Cliente</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Nome:</span> {selectedSolicitacao.user?.nome || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {selectedSolicitacao.user?.email || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Celular:</span> {selectedSolicitacao.user?.celular || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Vacina:</span> {selectedSolicitacao.vacina?.nome || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Unidade:</span> {selectedSolicitacao.unidade?.nome || 'Não especificada'}
                  </div>
                  <div>
                    <span className="font-medium">Data Solicitação:</span> {format(new Date(selectedSolicitacao.data_solicitacao), 'dd/MM/yyyy HH:mm')}
                  </div>
                </div>
                {selectedSolicitacao.observacoes && (
                  <div className="mt-3">
                    <span className="font-medium">Observações do Cliente:</span>
                    <p className="text-sm text-gray-600 mt-1">{selectedSolicitacao.observacoes}</p>
                  </div>
                )}
              </div>

              {/* Formulário de Edição */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status-solicitacao">Status</Label>
                    <select
                      id="status-solicitacao"
                      value={selectedSolicitacao.status}
                      onChange={(e) => setSelectedSolicitacao({
                        ...selectedSolicitacao,
                        status: e.target.value
                      })}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="pendente">Pendente</option>
                      <option value="em_contato">Em Contato</option>
                      <option value="resolvido">Resolvido</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="prioridade-solicitacao">Prioridade</Label>
                    <select
                      id="prioridade-solicitacao"
                      value={selectedSolicitacao.prioridade}
                      onChange={(e) => setSelectedSolicitacao({
                        ...selectedSolicitacao,
                        prioridade: e.target.value
                      })}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="baixa">Baixa</option>
                      <option value="normal">Normal</option>
                      <option value="alta">Alta</option>
                      <option value="urgente">Urgente</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="unidade-solicitacao">Unidade</Label>
                  <select
                    id="unidade-solicitacao"
                    value={selectedSolicitacao.unidade_id || ''}
                    onChange={(e) => setSelectedSolicitacao({
                      ...selectedSolicitacao,
                      unidade_id: e.target.value ? parseInt(e.target.value) : null
                    })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Selecione uma unidade</option>
                    {units.map((unidade) => (
                      <option key={unidade.id} value={unidade.id}>
                        {unidade.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="observacoes-atendente">Observações do Atendente</Label>
                  <Textarea
                    id="observacoes-atendente"
                    value={selectedSolicitacao.observacoes_atendente || ''}
                    onChange={(e) => setSelectedSolicitacao({
                      ...selectedSolicitacao,
                      observacoes_atendente: e.target.value
                    })}
                    placeholder="Digite suas observações sobre o atendimento..."
                    rows={4}
                  />
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsSolicitacaoModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    if (selectedSolicitacao) {
                      handleUpdateSolicitacao(selectedSolicitacao.id, {
                        status: selectedSolicitacao.status,
                        prioridade: selectedSolicitacao.prioridade,
                        unidade_id: selectedSolicitacao.unidade_id,
                        observacoes_atendente: selectedSolicitacao.observacoes_atendente,
                        atendente_id: currentUser?.id
                      })
                      setIsSolicitacaoModalOpen(false)
                    }
                  }}
                >
                  Salvar Alterações
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

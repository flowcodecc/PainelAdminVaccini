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
import { CirclePlus, Edit, Trash2, ChevronLeft, ChevronRight, Printer, Eye } from "lucide-react"
import { Unit, Patient, Appointment, UnitSchedule, Vaccine } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface UnidadeAtende {
  "unidade_id (FK)": number;
  unidade: {
    nome: string;
  };
}

export function AppointmentsTab() {
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

  // 🔥 Busca unidades disponíveis
  const fetchUnits = async () => {
    const { data, error } = await supabase
      .from('unidade')
      .select('*')
      .eq('status', true)

    if (error) {
      console.error('Erro ao buscar unidades:', error)
      return
    }
    setUnits(data || [])
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
      
      const { data: schedules, error } = await supabase
        .from('unit_schedules')
        .select('*')
        .eq('unit_id', unit_id)
        .eq('dia_da_semana', dayOfWeek)

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao buscar horários"
        })
        setAvailableTimeSlots([])
        return
      }

      if (!schedules || schedules.length === 0) {
        toast({
          title: "Aviso",
          description: "Nenhum horário de atendimento para esse dia da semana",
          duration: 3000
        })
        setAvailableTimeSlots([])
        setSelectedTimeSlot(0)
        return
      }

      setAvailableTimeSlots(schedules)
    } catch (err) {
      console.error(err)
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
      const { data, error } = await supabase
        .from('vw_agendamentos_com_endereco')
        .select(`
          *,
          unidade:unidade_id (nome),
          status:status_id (nome)
        `)

      if (error) throw error

      const formattedAppointments = await Promise.all(data.map(async appointment => {
        const { data: vaccinesData } = await supabase
          .from('ref_vacinas')
          .select(`
            ref_vacinasID,
            nome,
            codigo,
            preco,
            status,
            valor_plano,
            esquema_id,
            esquema
          `)
          .in('ref_vacinasID', appointment.vacinas_id || [])

        const vaccines = (vaccinesData || []).map(v => ({
          ref_vacinasID: v.ref_vacinasID,
          nome: v.nome,
          codigo: v.codigo || '',
          preco: v.preco || 0,
          status: v.status || true,
          valor_plano: v.valor_plano || v.preco || 0,
          esquema_id: v.esquema_id || 0,
          esquema: v.esquema
        }))

        return {
          id: appointment.id,
          patient_id: appointment.user_id,
          patient_name: `${appointment.nome} ${appointment.sobrenome || ''}`,
          scheduled_date: new Date(appointment.dia),
          time_slot: appointment.horario,
          status: appointment.status?.nome || 'Pendente',
          unit_name: appointment.unidade?.nome,
          unit_id: appointment.unidade_id,
          vaccines: vaccines as Vaccine[],
          valor_total: appointment.valor_total,
          user: {
            logradouro: appointment.logradouro || '',
            numero: appointment.numero || '',
            bairro: appointment.bairro || '',
            cidade: appointment.cidade || '',
            estado: appointment.estado || '',
            cep: appointment.cep || '',
            email: appointment.email || '',
            celular: appointment.celular || ''
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
      console.error('Erro ao buscar agendamentos:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar agendamentos"
      })
    }
  }

  // Função para validar CEP do paciente e filtrar as unidades que atendem aquele CEP
  const validatePatientCep = async (patientId: string, unitId: number) => {
    try {
      const { data: patient, error } = await supabase
        .from('user')
        .select('cep, nome')
        .eq('id', patientId)
        .single()

      if (error || !patient?.cep) {
        toast({
          title: "Erro",
          description: "Paciente não possui CEP cadastrado"
        })
        return false
      }

      const patientCep = patient.cep.replace(/\D/g, '')

      const { data: ranges, error: rangesError } = await supabase
        .from('unidade_ceps_atende')
        .select('cep_inicial, cep_final')
        .eq('"unidade_id (FK)"', unitId)

      if (rangesError) {
        toast({
          title: "Erro",
          description: "Erro ao verificar faixas de CEP da unidade"
        })
        return false
      }

      const isInRange = ranges.some(range => {
        const start = range.cep_inicial.replace(/\D/g, '')
        const end = range.cep_final.replace(/\D/g, '')
        return parseInt(patientCep) >= parseInt(start) && parseInt(patientCep) <= parseInt(end)
      })

      if (!isInRange) {
        toast({
          title: "Aviso",
          description: `O CEP ${patient.cep} não é atendido por esta unidade.`
        })
        return false
      }

      const { data: validUnitIds } = await supabase
        .from('unidade_ceps_atende')
        .select('"unidade_id (FK)"')
        .gte('cep_inicial', patient.cep)
        .lte('cep_final', patient.cep)

      console.log('CEP do paciente:', patient.cep)
      console.log('Unidades encontradas:', validUnitIds)

      if (!validUnitIds || validUnitIds.length === 0) {
        const { data: allRanges } = await supabase
          .from('unidade_ceps_atende')
          .select('*')
        console.log('Todas as faixas:', allRanges)
        
        toast({
          title: "Aviso",
          description: `Nenhuma unidade atende o CEP ${patient.cep} do paciente ${patient.nome}`,
          duration: 5000
        })
        setUnits([])
        return
      }

      const { data: validUnits } = await supabase
        .from('unidade')
        .select('*')
        .eq('status', true)
        .in('id', validUnitIds.map(u => u['unidade_id (FK)']))

      setUnits(validUnits || [])

      return true
    } catch (error) {
      console.error('Erro ao validar CEP:', error)
      toast({
        title: "Erro",
        description: "Erro ao validar CEP do paciente"
      })
      return false
    }
  }

  // Função para imprimir os dados de um agendamento individual
  const handlePrintAppointment = async (appointment: Appointment, detailed: boolean = false) => {
    try {
      // Buscar dados detalhados do paciente se necessário
      let patientDetails = null
      if (detailed) {
        const { data, error } = await supabase
          .from('user')
          .select('*')
          .eq('id', appointment.patient_id)
          .single()
        
        if (error) throw error
        patientDetails = data
      }

      const printWindow = window.open('', '_blank', 'width=600,height=800')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Impressão de Agendamento</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h2 { text-align: center; }
                .detail { margin-bottom: 10px; }
                .section { margin-top: 20px; border-top: 1px solid #ccc; padding-top: 10px; }
              </style>
            </head>
            <body>
              <h2>Detalhes do Agendamento</h2>
              ${detailed ? `
                <div class="section">
                  <h3>Dados do Paciente</h3>
                  <div class="detail"><strong>Nome Completo:</strong> ${patientDetails?.nome} ${patientDetails?.sobrenome || ''}</div>
                  <div class="detail"><strong>CPF:</strong> ${patientDetails?.cpf || '-'}</div>
                  <div class="detail"><strong>Data de Nascimento:</strong> ${patientDetails?.data_nascimento ? format(new Date(patientDetails.data_nascimento), 'dd/MM/yyyy') : '-'}</div>
                  <div class="detail"><strong>Endereço:</strong> ${patientDetails?.endereco || '-'}</div>
                  <div class="detail"><strong>Email:</strong> ${patientDetails?.email || '-'}</div>
                  <div class="detail"><strong>Telefone:</strong> ${patientDetails?.telefone || '-'}</div>
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
                    <strong>${v.nome}</strong> - R$ ${v.preco.toFixed(2)}
                  </div>
                `).join('')}
                <div class="detail" style="margin-top: 10px; font-weight: bold;">
                  <strong>Valor Total:</strong> R$ ${appointment.valor_total.toFixed(2)}
                </div>
              </div>
              <div class="section">
                <div class="detail"><strong>Status:</strong> ${appointment.status}</div>
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

  // Atualizar o botão de impressão para mostrar as opções
  const PrintButton = ({ appointment }: { appointment: Appointment }) => {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-40">
          <div className="flex flex-col gap-1">
            <Button 
              variant="ghost" 
              onClick={() => handleBulkPrint([appointment])}
            >
              Impressão Simples
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => handlePrintMultiple([appointment])}
            >
              Impressão Detalhada
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  // Função para imprimir múltiplos agendamentos selecionados
  const handleBulkPrint = (appointmentsToPrint: Appointment[]) => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      const content = appointmentsToPrint.map(appointment => `
        <div style="page-break-after: always;">
          <h2>Comprovante de Agendamento</h2>
          
          <div style="margin: 20px 0;">
            <p><strong>Data:</strong> ${format(appointment.scheduled_date, 'dd/MM/yyyy')}</p>
            <p><strong>Horário:</strong> ${appointment.time_slot}</p>
            <p><strong>Unidade:</strong> ${appointment.unit_name}</p>
            <p><strong>Vacinas:</strong> ${appointment.vaccines.map(v => v.nome).join(', ')}</p>
            <p><strong>Valor Total:</strong> R$ ${appointment.valor_total.toFixed(2)}</p>
            <p><strong>Status:</strong> ${appointment.status}</p>
          </div>
        </div>
      `).join('')

      printWindow.document.write(`
        <html>
          <head>
            <title>Comprovantes de Agendamento</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h2 { text-align: center; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            ${content}
            <script>window.print(); window.close();</script>
          </body>
        </html>
      `)
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

  useEffect(() => {
    fetchUnits()
    fetchPatients()
    fetchPaymentMethods()
    fetchVaccines()
    fetchAppointments()
  }, [])

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

  const handleScheduleAppointment = async () => {
    try {
      if (!selectedUnit || !selectedDate || !selectedTimeSlot || !selectedPatient || !selectedPaymentMethod || selectedVaccines.length === 0) {
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
          vacinas_id: selectedVaccines.map(v => v.vaccineId),
          forma_pagamento_id: selectedPaymentMethod,
          valor_total: totalValue,
          horario: timeSlot?.horario_inicio,
          dia: selectedDate.toISOString().split('T')[0],
          status_id: 1
        })
        .select()
        .single()

      if (error) throw error

      await fetchAppointments()

      toast({
        title: "Sucesso!",
        description: "Agendamento realizado com sucesso!"
      })

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

  // Função para imprimir múltiplos agendamentos
  const handlePrintMultiple = (appointmentsToPrint: Appointment[]) => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      const content = appointmentsToPrint.map(appointment => `
        <div style="page-break-after: always;">
          <div class="header">
            <div class="date">${format(new Date(), 'dd/MM/yyyy, HH:mm')}</div>
            <h2>Detalhes do Agendamento</h2>
          </div>

          <div class="divider"></div>
          
          <h3>Dados do Paciente</h3>
          <p><strong>Paciente:</strong> ${appointment.patient_name}</p>
          <p><strong>Data de Nascimento:</strong> -</p>
          <p><strong>Endereço:</strong> ${appointment.user.logradouro}, ${appointment.user.numero} - ${appointment.user.bairro}, ${appointment.user.cidade} - ${appointment.user.estado}, CEP: ${appointment.user.cep}</p>
          <p><strong>Email:</strong> ${appointment.user.email}</p>
          <p><strong>Telefone:</strong> ${appointment.user.celular}</p>

          <div class="divider"></div>

          <h3>Dados do Agendamento</h3>
          <p><strong>Data:</strong> ${format(appointment.scheduled_date, 'dd/MM/yyyy')}</p>
          <p><strong>Horário:</strong> ${appointment.time_slot}</p>
          <p><strong>Unidade:</strong> ${appointment.unit_name}</p>

          <div class="divider"></div>

          <h3>Vacinas</h3>
          <p>${appointment.vaccines.map(v => v.nome).join(', ')} - R$ ${appointment.valor_total.toFixed(2)}</p>
          <p><strong>Valor Total:</strong> R$ ${appointment.valor_total.toFixed(2)}</p>

          <div class="divider"></div>

          <p><strong>Status:</strong> ${appointment.status}</p>
        </div>
      `).join('')

      printWindow.document.write(`
        <html>
          <head>
            <title>Comprovantes de Agendamento</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .header { margin-bottom: 20px; }
              .header .date { text-align: right; font-size: 14px; }
              h2 { text-align: center; margin: 20px 0; }
              .divider { border-bottom: 1px solid #000; margin: 20px 0; }
              @media print { @page { margin: 2cm; } }
            </style>
          </head>
          <body>
            ${content}
            <script>window.print(); window.close();</script>
          </body>
        </html>
      `)
    }
  }

  return (
    <div className="w-full h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Agendamentos</h2>
        <div className="flex gap-2">
          {selectedAppointmentIds.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir Selecionados
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-40">
                <div className="flex flex-col gap-1">
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      const selectedAppointments = appointments.filter(app => 
                        selectedAppointmentIds.includes(app.id)
                      )
                      handleBulkPrint(selectedAppointments)
                    }}
                  >
                    Impressão Simples
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      const selectedAppointments = appointments.filter(app => 
                        selectedAppointmentIds.includes(app.id)
                      )
                      handlePrintMultiple(selectedAppointments)
                    }}
                  >
                    Impressão Detalhada
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
          <Button onClick={() => setActiveTab("new")}>
            <CirclePlus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="calendar">Calendário</TabsTrigger>
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
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <PrintButton 
                            appointment={appointment}
                          />
                          <Button variant="outline" size="sm" onClick={() => setSelectedAppointmentDetails(appointment)}>
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

        <TabsContent value="calendar" className="h-[calc(100vh-120px)]">
          <div className="bg-white p-6 rounded-lg border shadow-sm h-full grid">
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
              classNames={{
                months: "w-full grid",
                month: "w-full",
                table: "w-full border-collapse",
                head_row: "grid grid-cols-7",
                head_cell: "text-muted-foreground font-normal text-sm p-2 text-center",
                row: "grid grid-cols-7",
                cell: "h-[130px] border border-gray-100 overflow-hidden",
                day: "h-full",
                day_selected: "bg-primary text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
              }}
              components={{
                IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
                IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
                DayContent: (props) => {
                  const date = props.date
                  const day = format(date, 'yyyy-MM-dd')
                  const dayNumber = format(date, 'd')
                  const appointmentsForDay = appointmentsByDay[day] || []

                  return (
                    <div className="h-full flex flex-col">
                      <div className="text-sm p-1">{dayNumber}</div>
                      <div className="flex-1 overflow-y-auto p-1 space-y-1">
                        {appointmentsForDay.map((appointment, i) => (
                          <div 
                            key={i}
                            className="text-[11px] p-1 bg-red-50 text-red-800 truncate cursor-pointer hover:bg-red-100"
                            onClick={() => setSelectedAppointmentDetails(appointment)}
                          >
                            {appointment.time_slot} - {appointment.patient_name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                }
              }}
            />
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
                      onValueChange={async (value) => {
                        // Lógica para selecionar paciente e filtrar unidades pelo CEP
                        setSelectedPatient(value)
                        setSelectedUnit(0)
                        
                        const { data: patient, error } = await supabase
                          .from('user')
                          .select('cep, nome')
                          .eq('id', value)
                          .single()

                        if (error || !patient?.cep) {
                          toast({
                            title: "Aviso",
                            description: "Paciente não possui CEP cadastrado"
                          })
                          setUnits([])
                          return
                        }

                        const { data: validUnitIds } = await supabase
                          .from('unidade_ceps_atende')
                          .select('"unidade_id (FK)"')
                          .gte('cep_inicial', patient.cep)
                          .lte('cep_final', patient.cep)

                        console.log('CEP do paciente:', patient.cep)
                        console.log('Unidades encontradas:', validUnitIds)

                        if (!validUnitIds || validUnitIds.length === 0) {
                          const { data: allRanges } = await supabase
                            .from('unidade_ceps_atende')
                            .select('*')
                          console.log('Todas as faixas:', allRanges)
                          
                          toast({
                            title: "Aviso",
                            description: `Nenhuma unidade atende o CEP ${patient.cep} do paciente ${patient.nome}`,
                            duration: 5000
                          })
                          setUnits([])
                          return
                        }

                        const { data: validUnits } = await supabase
                          .from('unidade')
                          .select('*')
                          .eq('status', true)
                          .in('id', validUnitIds.map(u => u['unidade_id (FK)']))

                        setUnits(validUnits || [])
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

                  {selectedPatient && (
                    <div>
                      <Label htmlFor="unit">Unidade</Label>
                      {units.length === 0 ? (
                        <div className="p-4 text-center border rounded-md bg-gray-50">
                          <p className="text-gray-500">Nenhuma unidade atende o CEP deste paciente</p>
                        </div>
                      ) : (
                        <Select 
                          onValueChange={(value) => setSelectedUnit(parseInt(value))}
                          value={selectedUnit.toString()}
                        >
                          <SelectTrigger id="unit">
                            <SelectValue placeholder="Selecione uma unidade" />
                          </SelectTrigger>
                          <SelectContent>
                            {units.map((unit) => (
                              <SelectItem key={unit.id} value={unit.id.toString()}>
                                {unit.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {selectedUnit > 0 && selectedDate && (
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                  <h3 className="text-lg font-semibold mb-4">Horário e Pagamento</h3>
                  
                  <div className="space-y-4">
                    {availableTimeSlots.length > 0 ? (
                      <div>
                        <Label>Horário Disponível</Label>
                        <Select
                          onValueChange={(value) => setSelectedTimeSlot(parseInt(value))}
                          value={selectedTimeSlot.toString()}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um horário" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTimeSlots.map((slot) => (
                              <SelectItem key={slot.id} value={slot.id.toString()}>
                                {slot.horario_inicio} - {slot.horario_fim}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500">Nenhum horário de atendimento para esse dia da semana</p>
                      </div>
                    )}

                    {selectedTimeSlot > 0 && (
                      <>
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
                      </>
                    )}
                  </div>
                </div>
              )}

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
        <DialogContent className="max-w-[90%] w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalhes do Agendamento</DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-4">
            <div><strong>Paciente:</strong> {selectedAppointmentDetails?.patient_name}</div>
            <div><strong>Endereço:</strong> {`${selectedAppointmentDetails?.user?.logradouro || '-'}, ${selectedAppointmentDetails?.user?.numero || '-'} - ${selectedAppointmentDetails?.user?.bairro || '-'}, ${selectedAppointmentDetails?.user?.cidade || '-'} - ${selectedAppointmentDetails?.user?.estado || '-'}, CEP: ${selectedAppointmentDetails?.user?.cep || '-'}`}</div>
            <div>
              <strong>Data:</strong> {selectedAppointmentDetails ? format(selectedAppointmentDetails.scheduled_date, 'dd/MM/yyyy') : ''}
            </div>
            <div><strong>Horário:</strong> {selectedAppointmentDetails?.time_slot}</div>
            <div><strong>Unidade:</strong> {selectedAppointmentDetails?.unit_name}</div>
            <div>
              <strong>Vacinas:</strong> {selectedAppointmentDetails?.vaccines.map(v => v.nome).join(', ')}
            </div>
            <div>
              <strong>Valor Total:</strong> R$ {selectedAppointmentDetails?.valor_total.toFixed(2)}
            </div>
            <div><strong>Status:</strong> {selectedAppointmentDetails?.status}</div>
            
            <div className="flex justify-end gap-2 pt-4">
              {selectedAppointmentDetails && (
                <PrintButton 
                  appointment={selectedAppointmentDetails}
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

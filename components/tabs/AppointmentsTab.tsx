import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, Clock, Edit, Trash2, ChevronDown, ChevronUp, Printer, Check, X, PlusCircle, Filter, CalendarDays, List, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addDays, isSameDay, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DateRange } from 'react-day-picker'
import { toast } from "@/components/ui/use-toast"
import { TableActions } from '@/components/ui/table-actions'

interface Appointment {
  id: number
  patientId: number
  date: Date
  timeSlot: string
  status: 'scheduled' | 'completed' | 'cancelled'
  vaccines: string[]
  unit: string
  paymentMethod?: string; // Added paymentMethod field
}

interface Patient {
  id: number
  name: string
  cpf: string
  address: string
  email: string
}

const patients: Patient[] = [
  { id: 1, name: 'João Silva', cpf: '123.456.789-00', address: 'Rua A, 123', email: 'joao@email.com' },
  { id: 2, name: 'Maria Santos', cpf: '987.654.321-00', address: 'Rua B, 456', email: 'maria@email.com' },
  { id: 3, name: 'Pedro Oliveira', cpf: '456.789.123-00', address: 'Rua C, 789', email: 'pedro@email.com' },
]

const units = [
  { id: '1', name: 'Unidade Central' },
  { id: '2', name: 'Unidade Norte' },
  { id: '3', name: 'Unidade Sul' },
]

export function AppointmentsTab() {
  const [activeAppointmentTab, setActiveAppointmentTab] = useState("appointments")
  const [appointments, setAppointments] = useState<Appointment[]>([
    { id: 1, patientId: 1, date: new Date(), timeSlot: '08:00-10:00', status: 'scheduled', vaccines: ['COVID-19', 'Influenza'], unit: 'Unidade Central', paymentMethod: 'Cartão' }, // Added paymentMethod
    { id: 2, patientId: 2, date: addDays(new Date(), 1), timeSlot: '14:00-16:00', status: 'completed', vaccines: ['HPV'], unit: 'Unidade Norte', paymentMethod: 'Dinheiro' }, // Added paymentMethod
    { id: 3, patientId: 3, date: addDays(new Date(), 2), timeSlot: '10:00-12:00', status: 'cancelled', vaccines: ['Hepatite B'], unit: 'Unidade Sul', paymentMethod: 'Pix' }, // Added paymentMethod
  ])
  const [newAppointment, setNewAppointment] = useState<Omit<Appointment, 'id'>>({
    patientId: 0,
    date: new Date(),
    timeSlot: '',
    vaccines: [],
    status: 'scheduled',
    unit: '',
    paymentMethod: '' // Updated paymentMethod
  })
  const [expandedRows, setExpandedRows] = useState<number[]>([])
  const [selectedAppointments, setSelectedAppointments] = useState<number[]>([])
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7)
  })
  const [printWithDetails, setPrintWithDetails] = useState(false)
  const [editingAppointmentId, setEditingAppointmentId] = useState<number | null>(null)
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table')
  const [selectedUnit, setSelectedUnit] = useState<string | undefined>(undefined)
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined)
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())

  const handleNewAppointmentChange = (field: keyof Omit<Appointment, 'id'>, value: any) => {
    setNewAppointment(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveNewAppointment = () => {
    if (newAppointment.patientId && newAppointment.date && newAppointment.timeSlot && newAppointment.unit && newAppointment.paymentMethod) { // Updated validation
      const newAppointmentWithId: Appointment = {
        ...newAppointment,
        id: Date.now(),
      }
      setAppointments(prev => [...prev, newAppointmentWithId])
      setNewAppointment({
        patientId: 0,
        date: new Date(),
        timeSlot: '',
        vaccines: [],
        status: 'scheduled',
        unit: '',
        paymentMethod: '' // Updated paymentMethod
      })
      toast({
        title: "Agendamento criado",
        description: "O novo agendamento foi criado com sucesso.",
      })
      setActiveAppointmentTab("appointments")
    } else {
      toast({
        title: "Erro ao criar agendamento",
        description: "Por favor, preencha todos os campos obrigatórios.",
      })
    }
  }

  const handleDeleteAppointment = (id: number) => {
    setAppointments(prev => prev.filter(appointment => appointment.id !== id))
    toast({
      title: "Agendamento excluído",
      description: "O agendamento foi removido com sucesso.",
    })
  }

  const toggleRow = (id: number) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    )
  }

  const handleEditAppointment = (id: number) => {
    setEditingAppointmentId(id)
  }

  const handleSaveEditedAppointment = (id: number) => {
    setEditingAppointmentId(null)
    toast({
      title: "Agendamento atualizado",
      description: "As alterações foram salvas com sucesso.",
    })
  }

  const handleCancelEdit = () => {
    setEditingAppointmentId(null)
  }

  const handlePrint = () => {
    // Implement print functionality here
    console.log("Printing selected appointments:", selectedAppointments)
  }

  const filteredAppointments = appointments.filter(appointment => {
    const dateInRange = dateRange?.from && dateRange?.to
      ? appointment.date >= dateRange.from && appointment.date <= dateRange.to
      : true
    const unitMatch = selectedUnit && selectedUnit !== 'all' ? appointment.unit === selectedUnit : true
    const statusMatch = selectedStatus && selectedStatus !== 'all' ? appointment.status === selectedStatus : true
    return dateInRange && unitMatch && statusMatch
  })

  const renderMonthCalendar = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const startDate = startOfMonth(monthStart)
    const endDate = endOfMonth(monthEnd)

    const days = eachDayOfInterval({ start: startDate, end: endDate })

    return (
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <Button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold text-vaccini-primary">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </h2>
          <Button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} variant="outline" size="sm">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-col space-y-4">
          {days.map((day) => {
            const appointmentsForDay = filteredAppointments.filter((appointment) =>
              isSameDay(appointment.date, day)
            );
            const dayName = format(day, 'EEE', { locale: ptBR });
            return (
              <div
                key={day.toISOString()}
                className={`border rounded-md p-4 ${
                  isSameMonth(day, currentMonth)
                    ? 'bg-[#F8FAFC]'
                    : 'bg-[#F1F4F8] text-gray-400'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="font-semibold text-vaccini-primary">
                    {dayName}, {format(day, 'd')}
                  </div>
                  <div className="text-sm text-gray-500">
                    {format(day, 'MMMM yyyy', { locale: ptBR })}
                  </div>
                </div>
                {appointmentsForDay.length > 0 ? (
                  <div className="space-y-2">
                    {appointmentsForDay.map((appointment) => {
                      const patient = patients.find((p) => p.id === appointment.patientId);
                      return (
                        <div
                          key={appointment.id}
                          className={`p-2 rounded-md ${
                            appointment.status === 'scheduled'
                              ? 'bg-blue-100 text-blue-800'
                              : appointment.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          <div className="font-semibold">{patient?.name}</div>
                          <div className="text-sm">{appointment.timeSlot}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Nenhum agendamento</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    )
  }

  const renderMobileAppointmentList = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <Checkbox
            id="select-all-mobile"
            checked={selectedAppointments.length === filteredAppointments.length}
            onCheckedChange={(checked) => {
              if (checked) {
                setSelectedAppointments(filteredAppointments.map(a => a.id))
              } else {
                setSelectedAppointments([])
              }
            }}
          />
          <Label htmlFor="select-all-mobile">Selecionar Todos</Label>
        </div>
        {filteredAppointments.map((appointment) => {
          const patient = patients.find(p => p.id === appointment.patientId)
          return (
            <Card key={appointment.id} className="bg-[#F8FAFC]">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedAppointments.includes(appointment.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedAppointments(prev => [...prev, appointment.id])
                        } else {
                          setSelectedAppointments(prev => prev.filter(id => id !== appointment.id))
                        }
                      }}
                    />
                    <div>
                      <h3 className="font-semibold">{patient?.name}</h3>
                      <p className="text-sm text-gray-500">{format(appointment.date, 'dd/MM/yyyy')} - {appointment.timeSlot}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                    appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {appointment.status === 'scheduled' ? 'Agendado' :
                     appointment.status === 'completed' ? 'Concluído' : 'Cancelado'}
                  </span>
                </div>
                <p className="mt-2 text-sm">{appointment.unit}</p>
                <div className="mt-2 flex justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditAppointment(appointment.id)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteAppointment(appointment.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col">
      <h2 className="text-2xl font-semibold mb-4 text-vaccini-primary font-comfortaa">Agendamentos</h2>
      <Tabs value={activeAppointmentTab} onValueChange={setActiveAppointmentTab} className="w-full">
        <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground mb-4">
          <TabsTrigger
            value="appointments"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Agendamentos
          </TabsTrigger>
          <TabsTrigger
            value="schedule"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Agendar
          </TabsTrigger>
        </TabsList>
        <TabsContent value="schedule" className="flex-grow">
          <Card className="h-full bg-[#F8FAFC]">
            <CardHeader>
              <CardTitle className="font-comfortaa">Novo Agendamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="patient">Paciente</Label>
                    <Select 
                      onValueChange={(value) => handleNewAppointmentChange('patientId', parseInt(value))}
                      value={newAppointment.patientId ? newAppointment.patientId.toString() : undefined}
                    >
                      <SelectTrigger id="patient">
                        <SelectValue placeholder="Selecione um paciente" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id.toString()}>{patient.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="appointment-date">Data</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          id="appointment-date"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newAppointment.date ? format(newAppointment.date, "PPP") : <span>Selecione uma data</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={newAppointment.date}
                          onSelect={(date) => handleNewAppointmentChange('date', date || new Date())}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="time-slot">Horário</Label>
                    <Select 
                      onValueChange={(value) => handleNewAppointmentChange('timeSlot', value)}
                      value={newAppointment.timeSlot}
                    >
                      <SelectTrigger id="time-slot">
                        <SelectValue placeholder="Selecione um horário" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="08:00-10:00">08:00 - 10:00</SelectItem>
                        <SelectItem value="10:00-12:00">10:00 - 12:00</SelectItem>
                        <SelectItem value="14:00-16:00">14:00 - 16:00</SelectItem>
                        <SelectItem value="16:00-18:00">16:00 - 18:00</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="unit">Unidade</Label>
                    <Select 
                      onValueChange={(value) => handleNewAppointmentChange('unit', value)}
                      value={newAppointment.unit}
                    >
                      <SelectTrigger id="unit">
                        <SelectValue placeholder="Selecione uma unidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit.id} value={unit.name}>{unit.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div> {/* Added Payment Method Select */}
                    <Label htmlFor="payment-method">Forma de Pagamento</Label>
                    <Select 
                      onValueChange={(value) => handleNewAppointmentChange('paymentMethod', value)}
                      value={newAppointment.paymentMethod}
                    >
                      <SelectTrigger id="payment-method">
                        <SelectValue placeholder="Selecione a forma de pagamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cartao">Cartão</SelectItem>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="pix">Pix</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleSaveNewAppointment} className="w-full bg-vaccini-primary text-white hover:bg-vaccini-primary/90">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Agendar Consulta
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="appointments" className="flex-grow">
          <div className="space-y-4 h-full flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                  className="flex items-center gap-2"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros
                  {isFilterExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex items-center space-x-2 md:hidden">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                >
                  <CalendarDays className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {isFilterExpanded && (
              <div className="rounded-md border p-4 space-y-4 bg-[#F8FAFC]">
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="date-range">Intervalo de Datas</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date-range"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "PPP")} - {format(dateRange.to, "PPP")}
                            </>
                          ) : (
                            format(dateRange.from, "PPP")
                          )
                        ) : (
                          <span>Selecione um intervalo</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select onValueChange={setSelectedStatus} value={selectedStatus}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="scheduled">Agendado</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="unit">Unidade</Label>
                  <Select onValueChange={setSelectedUnit} value={selectedUnit}>
                    <SelectTrigger id="unit">
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.name}>{unit.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            <div className="flex-grow overflow-auto">
              {viewMode === 'table' ? (
                <div className="md:rounded-md md:border overflow-auto h-full">
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-vaccini-primary-light">
                          <TableHead className="w-[50px]">
                            <Checkbox
                              checked={selectedAppointments.length === filteredAppointments.length}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedAppointments(filteredAppointments.map(a => a.id))
                                } else {
                                  setSelectedAppointments([])
                                }
                              }}
                            />
                          </TableHead>
                          <TableHead>Paciente</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Horário</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Unidade</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAppointments.map((appointment) => {
                          const patient = patients.find(p => p.id === appointment.patientId);
                          const isExpanded = expandedRows.includes(appointment.id);
                          const isEditing = editingAppointmentId === appointment.id;

                          return (
                            <React.Fragment key={appointment.id}>
                              <TableRow>
                                <TableCell>
                                  <Checkbox
                                    checked={selectedAppointments.includes(appointment.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedAppointments(prev => [...prev, appointment.id])
                                      } else {
                                        setSelectedAppointments(prev => prev.filter(id => id !== appointment.id))
                                      }
                                    }}
                                  />
                                </TableCell>
                                <TableCell>{patient?.name}</TableCell>
                                <TableCell>{format(appointment.date, 'dd/MM/yyyy')}</TableCell>
                                <TableCell>{appointment.timeSlot}</TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                    appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {appointment.status === 'scheduled' ? 'Agendado' :
                                     appointment.status === 'completed' ? 'Concluído' : 'Cancelado'}
                                  </span>
                                </TableCell>
                                <TableCell>{appointment.unit}</TableCell>
                                <TableCell>
                                  <TableActions
                                    onToggle={() => toggleRow(appointment.id)}
                                    onEdit={() => handleEditAppointment(appointment.id)}
                                    onDelete={() => handleDeleteAppointment(appointment.id)}
                                    isExpanded={isExpanded}
                                    isEditing={isEditing}
                                    onSave={() => handleSaveEditedAppointment(appointment.id)}
                                    onCancel={handleCancelEdit}
                                  />
                                </TableCell>
                              </TableRow>
                              {isExpanded && (
                                <TableRow>
                                  <TableCell colSpan={7}>
                                    <div className="p-4 bg-[#F1F4F8] rounded-md">
                                      <p><strong>Vacinas:</strong> {appointment.vaccines.join(', ')}</p>
                                      <p><strong>Endereço:</strong> {patient?.address}</p>
                                      <p><strong>Email:</strong> {patient?.email}</p>
                                      <p><strong>CPF:</strong> {patient?.cpf}</p>
                                      <p><strong>Forma de Pagamento:</strong> {appointment.paymentMethod || 'Não especificado'}</p>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="md:hidden">
                    {renderMobileAppointmentList()}
                  </div>
                </div>
              ) : (
                <div className="rounded-md border p-4 h-full overflow-auto bg-[#F8FAFC]">
                  {renderMonthCalendar()}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button onClick={handlePrint} disabled={selectedAppointments.length === 0} className="bg-vaccini-primary text-white hover:bg-vaccini-primary/90 disabled:opacity-50 disabled:cursor-not-allowed">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir Selecionados
              </Button>
              <Checkbox
                id="print-details"
                checked={printWithDetails}
                onCheckedChange={(checked) => setPrintWithDetails(checked === true)}
              />
              <Label htmlFor="print-details">Imprimir com detalhes</Label>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}


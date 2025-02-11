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
import { Edit, Trash2 } from "lucide-react"
import { Unit, Patient, Appointment } from '@/types'

export function AppointmentsTab() {
  const [units, setUnits] = useState<Unit[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedUnit, setSelectedUnit] = useState<number>(0)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])

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

  // 🔥 Busca pacientes ativos
  const fetchPatients = async () => {
    const { data, error } = await supabase
      .from('user')
      .select('*')
      .is('user_role_id', null)
      .eq('is_active', true)

    if (error) {
      console.error('Erro ao buscar pacientes:', error)
      return
    }
    setPatients(data || [])
  }

  // 🔥 Busca os horários disponíveis
  const fetchAvailableTimeSlots = async (unit_id: number, date: Date) => {
    try {
      const diasSemana: Record<number, string> = {
        0: 'domingo',
        1: 'segunda',
        2: 'terca',
        3: 'quarta',
        4: 'quinta',
        5: 'sexta',
        6: 'sabado'
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
        return
      }

      if (!schedules?.length) {
        toast({
          title: "Aviso",
          description: "Nenhum horário disponível neste dia"
        })
        setAvailableTimeSlots([])
        return
      }

      setAvailableTimeSlots([schedules[0].horario_inicio])

    } catch (err) {
      console.error(err)
      toast({
        title: "Erro",
        description: "Erro ao buscar horários"
      })
    }
  }

  useEffect(() => {
    fetchUnits()
    fetchPatients()
  }, [])

  return (
    <div className="w-full h-full flex flex-col">
      <h2 className="text-2xl font-semibold mb-4">Agendamentos</h2>
      <Tabs defaultValue="schedule">
        <TabsList>
          <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
          <TabsTrigger value="schedule">Agendar</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule">
          <div className="space-y-4">
            <div>
              <Label htmlFor="unit">Unidade</Label>
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
            </div>

            {selectedUnit > 0 && (
              <div>
                <Label>Data</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date)
                      fetchAvailableTimeSlots(selectedUnit, date)
                    }
                  }}
                  locale={ptBR}
                  className="rounded-md border"
                />
              </div>
            )}

            {availableTimeSlots.length > 0 && (
              <div>
                <Label>Horário</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um horário" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTimeSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="appointments">
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>
                      {patients.find(p => p.id === appointment.patient_id)?.name || appointment.patient_id}
                    </TableCell>
                    <TableCell>{format(new Date(appointment.scheduled_date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{appointment.time_slot}</TableCell>
                    <TableCell>{appointment.status}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

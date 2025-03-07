'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { Unit, UnitSchedule } from '@/types'
import { PlusCircle, Trash2 } from 'lucide-react'

interface ScheduleDialogProps {
  unit: Unit | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const DAYS = [
  { name: 'Domingo', value: 'Domingo' },
  { name: 'Segunda', value: 'Segunda' },
  { name: 'Terça', value: 'Terça' },
  { name: 'Quarta', value: 'Quarta' },
  { name: 'Quinta', value: 'Quinta' },
  { name: 'Sexta', value: 'Sexta' },
  { name: 'Sábado', value: 'Sábado' }
] as const

export function ScheduleDialog({ unit, open, onOpenChange, onSuccess }: ScheduleDialogProps) {
  const [schedules, setSchedules] = useState<UnitSchedule[]>([])

  useEffect(() => {
    if (unit && open) {
      fetchSchedules()
    }
  }, [unit, open])

  const fetchSchedules = async () => {
    if (!unit) return

    const { data, error } = await supabase
      .from('unit_schedules')
      .select('*')
      .eq('unit_id', unit.id)
      .order('dia_da_semana', { ascending: true })
      .order('horario_inicio', { ascending: true })

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar horários"
      })
      return
    }

    setSchedules(data || [])
  }

  const handleAddSchedule = async (dia: string) => {
    if (!unit) return

    const { data: lastSchedule } = await supabase
      .from('unit_schedules')
      .select('*')
      .eq('unit_id', unit.id)
      .eq('dia_da_semana', dia)
      .order('horario_fim', { ascending: false })
      .limit(1)
      .single()

    const horarioInicio = lastSchedule ? lastSchedule.horario_fim : '08:00'
    const [hora] = horarioInicio.split(':')
    const horaFim = String(parseInt(hora) + 1).padStart(2, '0')
    const horarioFim = `${horaFim}:00`

    const { error } = await supabase
      .from('unit_schedules')
      .insert({
        unit_id: unit.id,
        dia_da_semana: dia,
        horario_inicio: horarioInicio,
        horario_fim: horarioFim
      })

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar horário"
      })
      return
    }

    fetchSchedules()
  }

  const handleUpdateSchedule = async (updatedSchedule: UnitSchedule) => {
    const { error } = await supabase
      .from('unit_schedules')
      .update({
        horario_inicio: updatedSchedule.horario_inicio,
        horario_fim: updatedSchedule.horario_fim
      })
      .eq('id', updatedSchedule.id)

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar horário"
      })
      return
    }

    fetchSchedules()
  }

  const handleDeleteSchedule = async (id: number) => {
    const { error } = await supabase
      .from('unit_schedules')
      .delete()
      .eq('id', id)

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir horário"
      })
      return
    }

    fetchSchedules()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Horários de Funcionamento - {unit?.nome}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {DAYS.map((day) => (
            <div key={day.value} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">{day.name}</h3>
                <Button onClick={() => handleAddSchedule(day.value)}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Adicionar Faixa
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-sm text-gray-500">Início</div>
                  <div className="text-sm text-gray-500">Fim</div>
                  <div></div>
                </div>

                {schedules
                  .filter(s => s.dia_da_semana === day.value)
                  .map((schedule) => (
                    <div key={schedule.id} className="grid grid-cols-3 gap-4 items-center">
                      <Input
                        type="time"
                        value={schedule.horario_inicio}
                        onChange={(e) => handleUpdateSchedule({
                          ...schedule,
                          horario_inicio: e.target.value
                        })}
                        className="w-32"
                      />
                      <Input
                        type="time"
                        value={schedule.horario_fim}
                        onChange={(e) => handleUpdateSchedule({
                          ...schedule,
                          horario_fim: e.target.value
                        })}
                        className="w-32"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSchedule(schedule.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
} 
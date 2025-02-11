'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { supabase } from '@/lib/supabase'
import { Unit, UnitSchedule } from '@/types'
import { PlusCircle, Trash2, Pencil, X } from 'lucide-react'

interface ScheduleDialogProps {
  unit: Unit | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const DAYS = [
  { name: 'Domingo', value: 'Domingo' },
  { name: 'Segunda', value: 'Segunda' },
  { name: 'Terça', value: 'Terca' },
  { name: 'Quarta', value: 'Quarta' },
  { name: 'Quinta', value: 'Quinta' },
  { name: 'Sexta', value: 'Sexta' },
  { name: 'Sábado', value: 'Sabado' }
] as const

export function ScheduleDialog({ unit, open, onOpenChange, onSuccess }: ScheduleDialogProps) {
  const [schedules, setSchedules] = useState<UnitSchedule[]>([])
  const [newSchedule, setNewSchedule] = useState<Omit<UnitSchedule, 'id'>>({
    unit_id: unit?.id || 0,
    dia_da_semana: '',
    horario_inicio: '',
    horario_fim: '',
    qtd_agendamentos: 1
  })

  useEffect(() => {
    if (unit) {
      fetchSchedules()
    }
  }, [unit])

  const fetchSchedules = async () => {
    if (!unit) return

    const { data, error } = await supabase
      .from('unit_schedules')
      .select('*')
      .eq('unit_id', unit.id)

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao buscar horários"
      })
      return
    }

    setSchedules(data || [])
  }

  const handleSave = async () => {
    if (!unit) return

    const { error } = await supabase
      .from('unit_schedules')
      .insert({
        ...newSchedule,
        unit_id: unit.id
      })

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar horário"
      })
      return
    }

    toast({
      title: "Sucesso",
      description: "Horário salvo com sucesso"
    })

    fetchSchedules()
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Horários - {unit?.nome}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Dia da Semana</Label>
              <Input
                value={newSchedule.dia_da_semana}
                onChange={(e) => setNewSchedule(prev => ({ ...prev, dia_da_semana: e.target.value }))}
              />
            </div>
            <div>
              <Label>Horário Início</Label>
              <Input
                type="time"
                value={newSchedule.horario_inicio}
                onChange={(e) => setNewSchedule(prev => ({ ...prev, horario_inicio: e.target.value }))}
              />
            </div>
            <div>
              <Label>Horário Fim</Label>
              <Input
                type="time"
                value={newSchedule.horario_fim}
                onChange={(e) => setNewSchedule(prev => ({ ...prev, horario_fim: e.target.value }))}
              />
            </div>
            <div>
              <Label>Qtd. Agendamentos</Label>
              <Input
                type="number"
                min="1"
                value={newSchedule.qtd_agendamentos}
                onChange={(e) => setNewSchedule(prev => ({ ...prev, qtd_agendamentos: parseInt(e.target.value) || 1 }))}
              />
            </div>
          </div>

          <Button onClick={handleSave}>Adicionar Horário</Button>

          <div className="mt-4">
            <h3 className="font-semibold mb-2">Horários Cadastrados</h3>
            {schedules.map((schedule) => (
              <div key={schedule.id} className="flex justify-between items-center p-2 border rounded mb-2">
                <span>{schedule.dia_da_semana}</span>
                <span>{schedule.horario_inicio} - {schedule.horario_fim}</span>
                <span>{schedule.qtd_agendamentos} agendamentos</span>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 
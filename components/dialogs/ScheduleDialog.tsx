import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { Unit, UnitSchedule } from '@/types'

interface ScheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  unit: Unit | null
}

const DAYS = [
  { name: 'Domingo', field: 'domingo' },
  { name: 'Segunda', field: 'segunda_feira' },
  { name: 'Terça', field: 'terca_feira' },
  { name: 'Quarta', field: 'quarta_feira' },
  { name: 'Quinta', field: 'quinta_feira' },
  { name: 'Sexta', field: 'sexta_feira' },
  { name: 'Sábado', field: 'sabado' }
] as const

export function ScheduleDialog({ open, onOpenChange, unit }: ScheduleDialogProps) {
  const [schedule, setSchedule] = useState<UnitSchedule>({
    id: 0,
    unit_id: unit?.id || 0,
    segunda_feira: null,
    terca_feira: null,
    quarta_feira: null,
    quinta_feira: null,
    sexta_feira: null,
    sabado: null,
    domingo: null
  })

  useEffect(() => {
    if (unit) {
      fetchSchedule()
    }
  }, [unit])

  const fetchSchedule = async () => {
    if (!unit) return

    try {
      // Busca os horários da unidade específica
      const { data, error } = await supabase
        .from('unit_schedules')
        .select('*')
        .eq('unit_id', unit.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = não encontrado
        throw error
      }

      if (data) {
        // Se encontrou horários, usa eles
        setSchedule(data)
      } else {
        // Se não encontrou, inicializa com valores padrão para esta unidade
        setSchedule({
          id: 0,
          unit_id: unit.id,
          segunda_feira: null,
          terca_feira: null,
          quarta_feira: null,
          quinta_feira: null,
          sexta_feira: null,
          sabado: null,
          domingo: null
        })
      }
    } catch (error) {
      console.error('Erro ao buscar horários:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar horários. Tente novamente.",
      })
    }
  }

  const handleScheduleChange = (field: keyof UnitSchedule, value: string | null) => {
    setSchedule(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      if (!unit) return

      // Primeiro verifica se já existe horário para esta unidade
      const { data: existingSchedule } = await supabase
        .from('unit_schedules')
        .select('*')
        .eq('unit_id', unit.id)
        .maybeSingle()

      if (existingSchedule) {
        // Se existe, faz update
        const { error: updateError } = await supabase
          .from('unit_schedules')
          .update({
            segunda_feira: schedule.segunda_feira || null,
            terca_feira: schedule.terca_feira || null,
            quarta_feira: schedule.quarta_feira || null,
            quinta_feira: schedule.quinta_feira || null,
            sexta_feira: schedule.sexta_feira || null,
            sabado: schedule.sabado || null,
            domingo: schedule.domingo || null
          })
          .eq('unit_id', unit.id)

        if (updateError) throw updateError
        console.log('Horários atualizados')
      } else {
        // Se não existe, faz insert usando o ID da unidade
        const { error: insertError } = await supabase
          .from('unit_schedules')
          .insert([{
            id: unit.id, // Usa o ID da unidade
            unit_id: unit.id,
            segunda_feira: schedule.segunda_feira || null,
            terca_feira: schedule.terca_feira || null,
            quarta_feira: schedule.quarta_feira || null,
            quinta_feira: schedule.quinta_feira || null,
            sexta_feira: schedule.sexta_feira || null,
            sabado: schedule.sabado || null,
            domingo: schedule.domingo || null
          }])

        if (insertError) throw insertError
        console.log('Novos horários inseridos')
      }

      toast({
        title: "Sucesso!",
        description: "Horários salvos com sucesso",
      })

      onOpenChange(false)
    } catch (error: any) {
      console.error('Erro detalhado:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar horários. Tente novamente.",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Horários de Funcionamento - {unit?.nome}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {DAYS.map(({ name, field }) => (
            <div key={field} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <Checkbox 
                    checked={!!schedule[field as keyof UnitSchedule]}
                    onCheckedChange={(checked) => 
                      handleScheduleChange(
                        field as keyof UnitSchedule, 
                        checked ? '08:00-18:00' : null
                      )
                    }
                  />
                  <Label className="text-lg font-medium">{name}</Label>
                </div>
              </div>

              {schedule[field as keyof UnitSchedule] && (
                <div className="flex items-center space-x-4">
                  <Input
                    type="time"
                    value={(schedule[field as keyof UnitSchedule] as string)?.split('-')[0] || ''}
                    onChange={(e) => {
                      const end = (schedule[field as keyof UnitSchedule] as string)?.split('-')[1]
                      handleScheduleChange(field as keyof UnitSchedule, `${e.target.value}-${end || '18:00'}`)
                    }}
                    className="w-32"
                  />
                  <span>até</span>
                  <Input
                    type="time"
                    value={(schedule[field as keyof UnitSchedule] as string)?.split('-')[1] || ''}
                    onChange={(e) => {
                      const start = (schedule[field as keyof UnitSchedule] as string)?.split('-')[0]
                      handleScheduleChange(field as keyof UnitSchedule, `${start || '08:00'}-${e.target.value}`)
                    }}
                    className="w-32"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-2 sticky bottom-0 bg-white py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar Horários
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 
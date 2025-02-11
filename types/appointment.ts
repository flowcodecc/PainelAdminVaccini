export interface AppointmentData {
  id: number
  patient_id: string
  unit_id: number
  scheduled_date: Date
  time_slot: string
  status: 'scheduled' | 'completed' | 'cancelled'
  payment_method: string
  unit_name: string
  patient_name: string
  patient_email: string
  patient_phone: string
  vaccines?: string[]
}

export interface TimeSlot {
  start: string
  end: string
  available: boolean
} 
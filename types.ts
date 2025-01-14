export interface User {
  id: string
  email: string
  role: string
  nome: string
  sobrenome?: string
  units: number[]
  user_role_id: number
  is_active: boolean
}

export interface NurseView {
  user_id: string
  user_name: string
  user_email: string
  user_is_active: string
  unidade_names: string[]
  units: number[]
  role_id: number
}

export interface HealthPlan {
  id: number
  name: string
  discount: number
}

export interface Unit {
  id: number
  name: string
  address: string
  cepRange: string
  excludedCeps: string[]
  availability: any[]
  notAvailableApp: boolean
  noPriceDisplay: boolean
  vaccinesPerTimeSlot: number
  esquemas: string[]
  healthPlans: number[]
}

export interface Patient {
  id: number
  name: string
  cpf: string
  dateOfBirth: Date
  address: string
  email: string
  phone: string
}

export interface Appointment {
  id: number
  patientId: number
  date: Date
  timeSlot: string
  status: 'scheduled' | 'completed' | 'cancelled'
  vaccines: string[]
} 
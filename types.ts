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

export interface UnitSchedule {
  id: number
  unit_id: number
  dia_da_semana: string
  horario_inicio: string
  horario_fim: string
  max_agendamentos: number
  qtd_agendamentos: number
  created_at?: string
} 

export interface HealthPlan {
  id: number
  name: string
  discount: number
}

export interface Unit {
  id: number
  nome: string
  nome_interno: string
  email: string
  telefone: string
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  status: boolean
  atende_aplicativo: boolean
  mostra_precos_unidades: boolean
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
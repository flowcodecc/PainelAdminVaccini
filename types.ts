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
  qtd_agendamento_por_faixa?: number
  qtd_vacinas_por_faixa?: number
  cep_ranges?: { cep_start: string; cep_end: string; id: string }[]
  blocked_ceps?: string[]
}

export interface Patient {
  id: string
  name: string
  cpf: string
  dateOfBirth: Date
  address: string
  email: string
  phone: string
}

export interface Appointment {
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
  patient_details: {
    email: string
    celular: string
    endereco: string
    bairro: string
    cidade: string
    estado: string
    cep: string
    nascimento: string
    sexo: string
    plano_saude: string | null
  }
}

export interface Vaccine {
  ref_vacinasID: number
  nome: string
  preco: number
  codigo?: string
  status?: boolean
  valor_plano?: number
  esquema_id?: number
  esquema?: VaccineScheme
}

export interface VaccineScheme {
  id: number
  dose_1: boolean
  dose_2: boolean
  dose_3: boolean
  dose_4: boolean
  dose_5: boolean
}

export interface VaccineList {
  id: number
  nome: string
  descricao?: string
  created_by: string
  created_at: string
  updated_at: string
  status: boolean
  is_template: boolean
  items?: VaccineListItem[]
  creator_name?: string
}

export interface VaccineListItem {
  id: number
  vaccine_list_id: number
  vaccine_id: number
  preco_customizado?: number
  created_at: string
  vaccine?: Vaccine
}

export interface UnitVaccineList {
  id: number
  unidade_id: number
  vaccine_list_id: number
  imported_by: string
  imported_at: string
  is_active: boolean
  vaccine_list?: VaccineList
  unit_name?: string
  imported_by_name?: string
}

export interface UnitVaccine {
  id: number
  unidade_id: number
  vaccine_list_id: number
  vaccine_id: number
  preco_customizado?: number
  imported_from_list_id: number
  created_at: string
  is_active: boolean
  vaccine?: Vaccine
  unit_name?: string
}

export * from './types/payment' 
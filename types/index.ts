// Interface para a view user_unidade_view
export interface NurseView {
  user_id: string
  user_name: string
  user_email: string
  user_is_active: string  // Campo que vem como 'Ativo'/'Inativo'
  unidade_names: string[]
  units: number[]  // Array de IDs das unidades
  role_id: number  // Para o user_role_id
}

// Interface original do User mantida para o NurseDialog
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

export interface Unit {
  id: number
  nome: string
  nome_interno?: string
  email?: string
  telefone?: string
  cep?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  status?: boolean
  atende_aplicativo?: boolean
  mostra_precos_unidades?: boolean
  limite_faixa_horario?: number
  limite_agendamento?: number
}

export interface HealthPlan {
  id: number
  name: string
  discount: number
}

export interface Vaccine {
  ref_vacinasID?: number
  nome: string
  codigo: string | null
  preco: number
  status: boolean
  valor_plano: number
  valor_protecao: number
  vacinas_plano: number[] | null
  esquema_id: number | null
}

// Add other type definitions as needed


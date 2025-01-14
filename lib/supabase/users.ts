import { supabase } from '@/lib/supabase'

interface UserData {
  id: string
  email: string
  role?: string
  created_at?: string
}

export async function createOrUpdateUser(userData: UserData) {
  try {
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: userData.id,
        email: userData.email,
        role: userData.role || 'user',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao criar/atualizar usuário:', error)
    throw error
  }
} 
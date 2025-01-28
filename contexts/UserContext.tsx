'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { User } from '@/types'
import { supabase } from '@/lib/supabase'

interface UserContextType {
  currentUser: User | null
  setCurrentUser: (user: User | null) => void
}

const UserContext = createContext<UserContextType>({
  currentUser: null,
  setCurrentUser: () => {}
})

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // 1. Primeiro, pegar o usuário do Auth
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          console.error('Erro ao buscar usuário do Auth:', authError)
          throw authError
        }

        if (!user) {
          console.log('Nenhum usuário autenticado')
          return
        }

        console.log('Usuário do Auth:', user)

        // 2. Depois, buscar os dados do usuário na tabela user
        const { data: userData, error: userError } = await supabase
          .from('user')
          .select('*')
          .eq('id', user.id)
          .single()

        if (userError) {
          console.error('Erro ao buscar dados do usuário:', userError)
          throw userError
        }

        console.log('Dados do usuário:', userData)

        if (userData) {
          setCurrentUser({
            id: userData.id,
            email: userData.email,
            nome: userData.nome,
            role: userData.user_role_id === 1 ? 'admin' : 
                  userData.user_role_id === 2 ? 'enfermeira' : 'gerente',
            units: userData.units || [],
            user_role_id: userData.user_role_id,
            is_active: userData.is_active
          })
        }
      } catch (error) {
        console.error('Erro detalhado ao buscar usuário:', error)
        // Não vamos fazer throw aqui para não quebrar a aplicação
      }
    }

    fetchUser()
  }, [])

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext) 
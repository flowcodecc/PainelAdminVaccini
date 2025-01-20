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
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const { data: userData, error } = await supabase
            .from('user')
            .select('*')
            .eq('id', user.id)
            .single()

          if (error) throw error

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
        }
      } catch (error) {
        console.error('Erro ao buscar usuário:', error)
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
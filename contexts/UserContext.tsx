'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { User as UserType } from '@/types'
import { supabase } from '@/lib/supabase'

const UserContext = createContext<UserType | null>(null)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase
            .from('user')
            .select('*')
            .eq('id', user.id)
            .single()

          if (data) {
            setCurrentUser(data as UserType)
          }
        }
      } catch (error) {
        console.error('Erro:', error)
      }
    }

    getUser()
  }, [])

  return (
    <UserContext.Provider value={currentUser}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext) 
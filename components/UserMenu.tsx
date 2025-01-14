import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "./ui/button"
import { LogOut } from 'lucide-react'
import { User as UserType } from '../types'
import { supabase } from '@/lib/supabase'

interface UserMenuProps {
  currentUser: UserType | null
}

export function UserMenu({ currentUser }: UserMenuProps) {
  const router = useRouter()
  if (!currentUser) return null

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador'
      case 'gerente':
        return 'Gerente'
      case 'enfermeira':
        return 'Enfermeira'
    }
  }

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-600">
        Usuário atual:
      </div>
      <div className="font-medium">
        {currentUser.email}
      </div>
      <div className="text-sm text-gray-600">
        Cargo: {getRoleName(currentUser.role)}
      </div>
      <Button
        onClick={handleLogout}
        variant="outline"
        className="w-full mt-2 text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sair
      </Button>
    </div>
  )
}


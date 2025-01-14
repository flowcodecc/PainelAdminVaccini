'use client'

import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export function NoAccessPage() {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-vaccini-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Acesso Negado
          </h1>
          <p className="text-gray-600 mb-6">
            Você não tem permissão para acessar o sistema.
            Entre em contato com o administrador.
          </p>
          <Button 
            onClick={handleLogout}
            className="bg-vaccini-primary hover:bg-vaccini-primary/90"
          >
            Sair do Sistema
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 
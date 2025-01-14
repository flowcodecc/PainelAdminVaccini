'use client'

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      router.push('/')
      router.refresh()
      
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
        duration: 3000,
      })
    } catch (error) {
      toast({
        title: "Erro ao sair",
        description: "Ocorreu um erro ao tentar desconectar.",
        duration: 3000,
      })
    }
  }

  return (
    <Button 
      onClick={handleLogout}
      variant="outline"
      className="gap-2"
    >
      <LogOut className="h-4 w-4" />
      Sair
    </Button>
  )
} 
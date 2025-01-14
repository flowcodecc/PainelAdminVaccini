'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast.error("Por favor, insira seu e-mail")
      return
    }

    try {
      setLoading(true)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      setSent(true)
      toast.success("Link de redefinição enviado! Verifique seu e-mail.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ocorreu um erro ao enviar o link"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-blue-100">
      <Card className="w-full max-w-[400px]">
        <CardContent className="pt-6">
          <div className="flex justify-center mb-6">
            <Image
              src="/images/logo-vaccini.png"
              alt="Vaccini - Clínica de Vacinação"
              width={180}
              height={60}
              priority
            />
          </div>

          <h2 className="text-2xl font-medium text-gray-900 mb-2 text-center">
            Esqueceu sua senha?
          </h2>
          
          <p className="text-gray-600 text-center mb-8">
            Digite seu e-mail e enviaremos um link para redefinir sua senha.
          </p>

          {sent ? (
            <div className="text-center">
              <p className="text-green-600 mb-4">
                Link de redefinição enviado!
              </p>
              <p className="text-gray-600 mb-6">
                Verifique seu e-mail e siga as instruções para redefinir sua senha.
              </p>
              <Link 
                href="/" 
                className="text-[#008FA2] hover:text-[#007A8A]"
              >
                Voltar para o login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Seu e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12"
                  disabled={loading}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 bg-[#008FA2] hover:bg-[#007A8A] text-white font-medium"
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar link de redefinição'}
              </Button>

              <div className="text-center">
                <Link 
                  href="/" 
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  Voltar para o login
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 
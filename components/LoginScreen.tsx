'use client'

import React, { useState, FormEvent } from 'react'
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Card, CardContent } from "./ui/card"
import { toast } from "sonner"
import { Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error("Por favor, preencha todos os campos")
      return
    }
    
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error("Email ou senha incorretos")
        } else {
          toast.error("Erro ao fazer login")
        }
        return
      }

      if (!data.user?.id) {
        toast.error("Usuário não encontrado")
        return
      }

      let { data: userData, error: userError } = await supabase
        .from('user')
        .select('user_role_id')
        .eq('id', data.user.id)
        .single()

      console.log('userData:', userData)
      console.log('userError:', userError)

      if (userError?.code === 'PGRST116') {
        console.log('Usuário não existe, criando...')
        const { data: newUser, error: createError } = await supabase
          .from('user')
          .insert([
            { 
              id: data.user.id,
              email: data.user.email,
              user_role_id: 2 // default para enfermeira
            }
          ])
          .select()
          .single()

        console.log('newUser:', newUser)
        console.log('createError:', createError)

        if (createError) {
          toast.error("Erro ao criar usuário")
          return
        }

        userData = newUser
      } else if (userError) {
        toast.error("Erro ao buscar dados do usuário")
        return
      }

      if (!userData) {
        toast.error("Dados do usuário não encontrados")
        return
      }

      const defaultRoutes: Record<number, string> = {
        1: '/dashboard?tab=units',
        2: '/dashboard?tab=units',
        3: '/dashboard?tab=units'
      }

      const route = defaultRoutes[userData.user_role_id as 1 | 2 | 3] || '/dashboard?tab=units'
      router.push(route)

    } catch (error) {
      console.error('Erro no login:', error)
      toast.error("Ocorreu um erro inesperado")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-vaccini-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex justify-center mb-6">
            <div className="relative w-40 h-14">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-vaccini-l0AYn2jSfZCCJqgkyHIcjt5Vx92zYr.webp"
                alt="Vaccini - Clínica de Vacinação"
                fill
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-vaccini-primary text-white"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link
              href="/forgot-password"
              className="text-vaccini-primary hover:text-vaccini-primary/90 text-sm"
            >
              Esqueceu a senha?
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { UserMenu } from './UserMenu'
import { UnitsTab } from './tabs/UnitsTab'
import { VaccinesTab } from './tabs/VaccinesTab'
import { HealthPlansTab } from './tabs/HealthPlansTab'
import { AppointmentsTab } from './tabs/AppointmentsTab'
import { NursesTab } from './tabs/NursesTab'
import { PatientTab } from './tabs/PatientTab'
import { User } from '../types'
import { Menu, Home, Syringe, HeartPulse, Calendar, Users, UserCircle, Briefcase } from 'lucide-react'
import { Skeleton } from "@/components/ui/skeleton"
import Image from 'next/image'
import { LoginScreen } from './LoginScreen'
import { supabase } from '../lib/supabase'
import { VacinasProtecaoTab } from './tabs/VacinasProtecaoTab'

export function VaccineManagementSystem() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [activeMainTab, setActiveMainTab] = useState("appointments")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const { data: userData, error } = await supabase
            .from('user')
            .select('user_role_id')
            .eq('id', user.id)
            .single()

          if (error) throw error

          if (!userData?.user_role_id) {
            router.push('/no-access')
            return
          }

          setCurrentUser({
            id: user.id,
            email: user.email!,
            role: userData.user_role_id === 1 ? 'admin' : 
                  userData.user_role_id === 2 ? 'enfermeira' : 
                  userData.user_role_id === 3 ? 'gerente' : ''
          } as User)
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error)
        setError('Erro ao carregar dados do usuário')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [router])

  const tabItems = React.useMemo(() => {
    // Itens base que todos os usuários têm acesso
    const baseItems = [
      { id: 1, value: "appointments", label: "Agendamentos", icon: Calendar },
      { id: 2, value: "patients", label: "Pacientes", icon: UserCircle },
    ]

    // Itens para gerente e admin
    const managerItems = [
      { id: 3, value: "vaccines", label: "Vacinas", icon: Syringe },
      { id: 4, value: "health-plans", label: "Planos de Saúde", icon: HeartPulse },
      { id: 5, value: "units", label: "Unidades", icon: Home },
    ]

    // Itens exclusivos do admin
    const adminItems = [
      { id: 6, value: "nurses", label: "Enfermeiras", icon: Users },
      { id: 7, value: "gerentes", label: "Gerentes", icon: Briefcase }
    ]

    if (currentUser?.role === 'admin') {
      return [...baseItems, ...managerItems, ...adminItems]
    }

    if (currentUser?.role === 'gerente') {
      return [...baseItems, ...managerItems]
    }

    return baseItems
  }, [currentUser?.role])

  const renderTabContent = () => {
    if (!currentUser) return null;

    return (
      <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-full h-full">
        <TabsContent value="appointments" className="mt-0 h-full">
          <AppointmentsTab />
        </TabsContent>
        <TabsContent value="patients" className="mt-0 h-full">
          <PatientTab />
        </TabsContent>

        {(currentUser.role === 'admin' || currentUser.role === 'gerente') && (
          <>
            <TabsContent value="vaccines" className="mt-0 h-full">
              <VacinasProtecaoTab currentUser={currentUser} />
            </TabsContent>
            <TabsContent value="health-plans" className="mt-0 h-full">
              <HealthPlansTab />
            </TabsContent>
            <TabsContent value="units" className="mt-0 h-full">
              <UnitsTab currentUser={currentUser} />
            </TabsContent>
          </>
        )}

        {currentUser.role === 'admin' && (
          <>
            <TabsContent value="nurses" className="mt-0 h-full">
              <NursesTab />
            </TabsContent>
          
          </>
        )}
      </Tabs>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-vaccini-background flex items-center justify-center">
        <Card className="w-full max-w-md p-6 bg-vaccini-surface">
          <div className="flex justify-center mb-4">
            <Skeleton className="h-8 w-32" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-vaccini-background flex items-center justify-center">
        <Card className="w-full max-w-md p-6 bg-vaccini-surface">
          <h2 className="text-xl font-bold text-red-600">Error</h2>
          <p>{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-vaccini-primary text-vaccini-surface hover:bg-vaccini-primary/90 transition-colors duration-200 ease-in-out"
          >
            Retry
          </Button>
        </Card>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginScreen />
  }

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-vaccini-background flex flex-col md:flex-row">
      {/* Sidebar for desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-vaccini-surface border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="relative w-32 h-12 mx-auto">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-vaccini-l0AYn2jSfZCCJqgkyHIcjt5Vx92zYr.webp"
              alt="Vaccini - Clínica de Vacinação"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
        </div>
        <div className="p-4">
          <UserMenu currentUser={currentUser} />
        </div>
        <nav className="flex-1 overflow-y-auto p-4">
          {tabItems.map((tab) => (
            <Button
              key={tab.value}
              variant={activeMainTab === tab.value ? "default" : "ghost"}
              onClick={() => setActiveMainTab(tab.value)}
              className={`w-full justify-start font-heading mb-2 text-left ${
                activeMainTab === tab.value ? 'bg-vaccini-primary-light text-vaccini-primary' : 'text-vaccini-secondary hover:bg-gray-100'
              }`}
            >
              {React.createElement(tab.icon, { className: "w-5 h-5 mr-2" })}
              {tab.label}
            </Button>
          ))}
        </nav>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-vaccini-surface border-b border-gray-200">
          <div className="relative w-24 h-10">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-vaccini-l0AYn2jSfZCCJqgkyHIcjt5Vx92zYr.webp"
              alt="Vaccini - Clínica de Vacinação"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </header>

        {/* Mobile menu */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent className="w-[80%] max-w-sm bg-vaccini-surface p-0">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-gray-200">
                <UserMenu currentUser={currentUser} />
              </div>
              <nav className="flex-1 overflow-y-auto p-4">
                {tabItems.map((tab) => (
                  <Button
                    key={tab.value}
                    variant={activeMainTab === tab.value ? "default" : "ghost"}
                    onClick={() => {
                      setActiveMainTab(tab.value);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full justify-start font-heading mb-2 text-left ${
                      activeMainTab === tab.value ? 'bg-vaccini-primary-light text-vaccini-primary' : 'text-vaccini-secondary hover:bg-gray-100'
                    }`}
                  >
                    {React.createElement(tab.icon, { className: "w-5 h-5 mr-2" })}
                    {tab.label}
                  </Button>
                ))}
              </nav>
            </div>
          </SheetContent>
        </Sheet>

        {/* Tab content */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-vaccini-background">
          <Card className="h-full bg-vaccini-surface">
            <CardContent className="p-4 md:p-6 h-full">
              {renderTabContent()}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
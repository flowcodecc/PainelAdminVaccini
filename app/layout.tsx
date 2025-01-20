import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { UserProvider } from '@/contexts/UserContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Vaccini - Clínica de Vacinação',
  description: 'Sistema de gerenciamento de vacinas',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <UserProvider>
          {children}
        </UserProvider>
        <Toaster />
      </body>
    </html>
  )
}


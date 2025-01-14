'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VaccinesTab } from "./VaccinesTab"
import { ProtecaoVacinasTab } from "./ProtecaoVacinasTab"
import { User } from "@/types"
import { PlanoVacinacaoTab } from "./PlanoVacinacaoTab"

interface VacinasProtecaoTabProps {
  currentUser: User
}

export function VacinasProtecaoTab({ currentUser }: VacinasProtecaoTabProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Gerenciamento de Vacinas</h1>
      
      <Tabs defaultValue="vacinas" className="w-full">
        <TabsList>
          <TabsTrigger value="vacinas">Gerenciar Vacinas</TabsTrigger>
          <TabsTrigger value="plano">Plano de Vacinação</TabsTrigger>
          <TabsTrigger value="protecoes">Proteções do Mês</TabsTrigger>
        </TabsList>
        
        <TabsContent value="vacinas">
          <VaccinesTab currentUser={currentUser} />
        </TabsContent>
        
        <TabsContent value="plano">
          <PlanoVacinacaoTab />
        </TabsContent>
        
        <TabsContent value="protecoes">
          <ProtecaoVacinasTab />
        </TabsContent>
      </Tabs>
    </div>
  )
} 
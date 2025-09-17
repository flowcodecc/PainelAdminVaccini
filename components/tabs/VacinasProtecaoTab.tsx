'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VaccinesTab } from "./VaccinesTab"
import { ProtecaoVacinasTab } from "./ProtecaoVacinasTab"
import { VaccineListsTab } from "./VaccineListsTab"
import { User } from "@/types"
import { PlanoVacinacaoTab } from "./PlanoVacinacaoTab"
import { VacinaPrecosConvenioTab } from "./VacinaPrecosConvenioTab"

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
          <TabsTrigger value="listas">Listas de Vacinas</TabsTrigger>
          <TabsTrigger value="precos-convenio">Preços no Convênio</TabsTrigger>
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
        
        <TabsContent value="listas">
          <VaccineListsTab currentUser={currentUser} />
        </TabsContent>
        
        <TabsContent value="precos-convenio">
          <VacinaPrecosConvenioTab />
        </TabsContent>
      </Tabs>
    </div>
  )
} 
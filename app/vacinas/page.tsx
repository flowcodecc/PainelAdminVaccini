'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VaccinesTab } from "@/components/tabs/VaccinesTab"
import { PlanoVacinacaoTab } from "@/components/tabs/PlanoVacinacaoTab"
import { VaccineListsTab } from "@/components/tabs/VaccineListsTab"
import { useState } from "react"

export default function VacinasPage() {
  const [activeTab, setActiveTab] = useState("gerenciar")

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="gerenciar">Gerenciar Vacinas</TabsTrigger>
        <TabsTrigger value="plano">Plano de Vacinação</TabsTrigger>
        <TabsTrigger value="listas">Listas de Vacinas</TabsTrigger>
      </TabsList>
      <TabsContent value="gerenciar">
        <VaccinesTab />
      </TabsContent>
      <TabsContent value="plano">
        <PlanoVacinacaoTab />
      </TabsContent>
      <TabsContent value="listas">
        <VaccineListsTab />
      </TabsContent>
    </Tabs>
  )
} 
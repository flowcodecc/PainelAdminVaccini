'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VaccinesTab } from "@/components/tabs/VaccinesTab"
import { PlanoVacinacaoTab } from "@/components/tabs/PlanoVacinacaoTab"
import { useState } from "react"

export default function VacinasPage() {
  const [activeTab, setActiveTab] = useState("gerenciar")

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="gerenciar">Gerenciar Vacinas</TabsTrigger>
        <TabsTrigger value="plano">Plano de Vacinação</TabsTrigger>
      </TabsList>
      <TabsContent value="gerenciar">
        <VaccinesTab />
      </TabsContent>
      <TabsContent value="plano">
        <PlanoVacinacaoTab />
      </TabsContent>
    </Tabs>
  )
} 
'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VaccinesTab } from "@/components/tabs/VaccinesTab"
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
        {/* Conteúdo do plano será implementado depois */}
      </TabsContent>
    </Tabs>
  )
} 
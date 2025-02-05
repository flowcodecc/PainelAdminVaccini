'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VaccinesTab } from "@/components/tabs/VaccinesTab"
import { VaccinationPlanTab } from "@/components/tabs/VaccinationPlanTab"
import { useState, useEffect } from "react"
import { useVaccineStore } from "@/store/vaccineStore"

export default function VacinasPage() {
  const [activeTab, setActiveTab] = useState("gerenciar")
  const { shouldRedirectToPlan, setShouldRedirectToPlan } = useVaccineStore()

  useEffect(() => {
    if (shouldRedirectToPlan) {
      setActiveTab("plano")
      setShouldRedirectToPlan(false)
    }
  }, [shouldRedirectToPlan])

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
        <VaccinationPlanTab />
      </TabsContent>
    </Tabs>
  )
} 
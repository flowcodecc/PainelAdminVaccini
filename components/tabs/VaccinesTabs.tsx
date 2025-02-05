import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useVaccineStore } from '@/store/vaccineStore'
import { Badge } from '@/components/ui/badge'
import { ToastAction } from '@/components/ui/use-toast'

export function VaccinesTabs() {
  const { vaccinesToUpdate } = useVaccineStore()

  const handleTabChange = (value: string) => {
    if (value === 'plano' && vaccinesToUpdate.length > 0) {
      toast({
        title: "Atualização Pendente",
        description: `${vaccinesToUpdate.length} vacina(s) com preços alterados precisam ser atualizadas no plano`,
        action: <ToastAction altText="Ver">Ver Alterações</ToastAction>
      })
    }
  }

  return (
    <Tabs onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="gerenciar">Gerenciar Vacinas</TabsTrigger>
        <TabsTrigger value="plano">
          Plano de Vacinação
          {vaccinesToUpdate.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {vaccinesToUpdate.length}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
} 
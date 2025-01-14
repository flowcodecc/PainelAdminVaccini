import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { MultiSelect } from "@/components/ui/multi-select"
import { PlusCircle, Edit, Trash2, Briefcase } from 'lucide-react'
import { User, Unit } from '../../types'
import { toast } from "@/components/ui/use-toast"

interface GerenteDialogProps {
  gerente: User | null
  units: Unit[]
  onSave: (gerente: Omit<User, 'id'>) => void
  onClose: () => void
}

const GerenteDialog: React.FC<GerenteDialogProps> = ({ gerente, units, onSave, onClose }) => {
  const [newGerente, setNewGerente] = useState<Omit<User, 'id'>>({
    name: gerente?.name || '',
    role: 'gerente',
    assignedUnits: gerente?.assignedUnits || []
  })

  const handleNewGerenteChange = (field: keyof Omit<User, 'id'>, value: any) => {
    setNewGerente(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    if (newGerente.name.trim() === '') {
      toast({
        title: "Erro",
        description: "O nome do gerente não pode estar vazio.",
        duration: 3000,
      })
      return
    }
    onSave(newGerente)
    onClose()
  }

  return (
    <DialogContent className="sm:max-w-[425px] bg-[#F8FAFC]">
      <DialogHeader>
        <DialogTitle className="text-2xl font-comfortaa text-vaccini-primary">
          {gerente ? 'Editar Gerente' : 'Adicionar Novo Gerente'}
        </DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right font-comfortaa">
            Nome
          </Label>
          <Input
            id="name"
            value={newGerente.name}
            onChange={(e) => handleNewGerenteChange('name', e.target.value)}
            className="col-span-3 bg-[#FFFFFF]"
          />
        </div>
        <div className="grid grid-cols-4 items-start gap-4">
          <Label className="text-right font-comfortaa">Unidades</Label>
          <div className="col-span-3">
            <MultiSelect
              options={units.map(unit => ({ value: unit.id.toString(), label: unit.name }))}
              selected={newGerente.assignedUnits?.map(id => id.toString()) || []}
              onChange={(selected) => handleNewGerenteChange('assignedUnits', selected.map(Number))}
              placeholder="Selecione as unidades"
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose} className="font-comfortaa">Cancelar</Button>
        <Button onClick={handleSave} className="bg-vaccini-primary text-[#F8FAFC] hover:bg-vaccini-primary/90 font-comfortaa">Salvar</Button>
      </div>
    </DialogContent>
  )
}

export function GerentesTab() {
  const [gerentes, setGerentes] = useState<User[]>([
    { id: 4, name: 'Carlos Gerente', role: 'gerente', assignedUnits: [1] },
    { id: 5, name: 'Ana Gerente', role: 'gerente', assignedUnits: [2] },
  ])
  const [units, setUnits] = useState<Unit[]>([
    { id: 1, name: 'Unidade A', address: 'Rua X, 123', cepRange: '12345-000 a 12345-999', excludedCeps: [], availability: [], esquemas: [], healthPlans: [], vaccinesPerTimeSlot: 1, notAvailableApp: false, noPriceDisplay: false },
    { id: 2, name: 'Unidade B', address: 'Av. Y, 456', cepRange: '54321-000 a 54321-999', excludedCeps: [], availability: [], esquemas: [], healthPlans: [], vaccinesPerTimeSlot: 1, notAvailableApp: false, noPriceDisplay: false },
  ])
  const [showGerenteDialog, setShowGerenteDialog] = useState(false)
  const [editingGerente, setEditingGerente] = useState<User | null>(null)

  const handleSaveGerente = (newGerente: Omit<User, 'id'>) => {
    if (editingGerente) {
      setGerentes(prev => prev.map(gerente => gerente.id === editingGerente.id ? { ...gerente, ...newGerente } : gerente))
      toast({
        title: "Gerente atualizado",
        description: `${newGerente.name} foi atualizado com sucesso.`,
        duration: 3000,
      })
    } else {
      setGerentes(prev => [...prev, { ...newGerente, id: Date.now() }])
      toast({
        title: "Gerente adicionado",
        description: `${newGerente.name} foi adicionado com sucesso.`,
        duration: 3000,
      })
    }
    setShowGerenteDialog(false)
    setEditingGerente(null)
  }

  const handleEditGerente = (gerente: User) => {
    setEditingGerente(gerente)
    setShowGerenteDialog(true)
  }

  const handleDeleteGerente = (id: number) => {
    setGerentes(prev => prev.filter(gerente => gerente.id !== id))
    toast({
      title: "Gerente removido",
      description: "O gerente foi removido com sucesso.",
      duration: 3000,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-vaccini-primary font-comfortaa">Gerenciar Gerentes</h2>
        <Dialog open={showGerenteDialog} onOpenChange={setShowGerenteDialog}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => setEditingGerente(null)} 
              className="bg-vaccini-primary text-[#F8FAFC] hover:bg-vaccini-primary/90 transition-colors duration-200 font-comfortaa"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              Adicionar Gerente
            </Button>
          </DialogTrigger>
          <GerenteDialog
            gerente={editingGerente}
            units={units}
            onSave={handleSaveGerente}
            onClose={() => setShowGerenteDialog(false)}
          />
        </Dialog>
      </div>
      <div className="bg-[#FFFFFF] rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F1F4F8]">
              <TableHead className="font-comfortaa text-vaccini-primary">Nome</TableHead>
              <TableHead className="font-comfortaa text-vaccini-primary">Unidades Atribuídas</TableHead>
              <TableHead className="font-comfortaa text-vaccini-primary">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gerentes.map((gerente, index) => (
              <TableRow key={gerente.id} className={index % 2 === 0 ? 'bg-[#F8FAFC]' : 'bg-[#FFFFFF]'}>
                <TableCell className="font-medium font-comfortaa">
                  <div className="flex items-center">
                    <Briefcase className="h-5 w-5 mr-2 text-vaccini-primary" />
                    {gerente.name}
                  </div>
                </TableCell>
                <TableCell className="font-comfortaa">
                  {gerente.assignedUnits && gerente.assignedUnits.length > 0
                    ? gerente.assignedUnits.map(unitId => {
                        const unit = units.find(u => u.id === unitId)
                        return unit ? unit.name : ''
                      }).filter(Boolean).join(', ')
                    : 'Nenhuma unidade atribuída'}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEditGerente(gerente)}
                      className="text-vaccini-primary hover:bg-vaccini-primary hover:text-[#F8FAFC] transition-colors duration-200"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDeleteGerente(gerente.id)}
                      className="text-red-500 hover:bg-red-500 hover:text-[#F8FAFC] transition-colors duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}


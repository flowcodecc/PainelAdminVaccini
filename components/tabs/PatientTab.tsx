import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, Edit, Trash2, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { Patient, Appointment } from '../../types'
import { TableActions } from '@/components/ui/table-actions'
import { toast } from "@/components/ui/use-toast"

// Mock data for initial patients and appointments
const initialPatients: Patient[] = [
  { id: 1, name: 'João Silva', cpf: '123.456.789-00', dateOfBirth: new Date(1980, 0, 1), address: 'Rua A, 123', email: 'joao@email.com', phone: '(11) 98765-4321' },
  { id: 2, name: 'Maria Santos', cpf: '987.654.321-00', dateOfBirth: new Date(1990, 5, 15), address: 'Rua B, 456', email: 'maria@email.com', phone: '(11) 91234-5678' },
]

const initialAppointments: Appointment[] = [
  { id: 1, patientId: 1, date: new Date(), timeSlot: '08:00-10:00', status: 'scheduled', vaccines: ['COVID-19', 'Influenza'] },
  { id: 2, patientId: 2, date: new Date(Date.now() + 86400000), timeSlot: '14:00-16:00', status: 'scheduled', vaccines: ['HPV'] },
]

export function PatientTab() {
  const [patients, setPatients] = useState<Patient[]>(initialPatients)
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments)
  const [isAddingPatient, setIsAddingPatient] = useState(false)
  const [newPatient, setNewPatient] = useState<Omit<Patient, 'id'>>({
    name: '',
    cpf: '',
    dateOfBirth: new Date(),
    address: '',
    email: '',
    phone: '',
  })
  const [editingPatientId, setEditingPatientId] = useState<number | null>(null)

  const handleAddPatient = () => {
    const patientWithId: Patient = {
      ...newPatient,
      id: Date.now(),
    }
    setPatients([...patients, patientWithId])
    setIsAddingPatient(false)
    setNewPatient({
      name: '',
      cpf: '',
      dateOfBirth: new Date(),
      address: '',
      email: '',
      phone: '',
    })
    toast({
      title: "Paciente adicionado",
      description: "O novo paciente foi adicionado com sucesso.",
    })
  }

  const handleEditPatient = (patient: Patient) => {
    setEditingPatientId(patient.id)
    setNewPatient(patient)
  }

  const handleUpdatePatient = () => {
    if (editingPatientId) {
      setPatients(patients.map(p => p.id === editingPatientId ? { ...newPatient, id: editingPatientId } : p))
      setEditingPatientId(null)
      setNewPatient({
        name: '',
        cpf: '',
        dateOfBirth: new Date(),
        address: '',
        email: '',
        phone: '',
      })
      toast({
        title: "Paciente atualizado",
        description: "As informações do paciente foram atualizadas com sucesso.",
      })
    }
  }

  const handleDeletePatient = (id: number) => {
    setPatients(patients.filter(p => p.id !== id))
    setAppointments(appointments.filter(a => a.patientId !== id))
    toast({
      title: "Paciente removido",
      description: "O paciente e seus agendamentos foram removidos com sucesso.",
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-vaccini-primary">Gerenciamento de Pacientes</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="list" className="py-2 text-sm font-medium text-gray-600 hover:text-vaccini-primary transition-colors data-[state=active]:text-vaccini-primary data-[state=active]:bg-vaccini-primary-light">Lista de Pacientes</TabsTrigger>
            <TabsTrigger value="add" className="py-2 text-sm font-medium text-gray-600 hover:text-vaccini-primary transition-colors data-[state=active]:text-vaccini-primary data-[state=active]:bg-vaccini-primary-light">Adicionar Paciente</TabsTrigger>
          </TabsList>
          <TabsContent value="list">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Data de Nascimento</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell>{patient.name}</TableCell>
                      <TableCell>{patient.cpf}</TableCell>
                      <TableCell>{format(patient.dateOfBirth, 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{patient.email}</TableCell>
                      <TableCell>{patient.phone}</TableCell>
                      <TableCell>
                        <TableActions
                          onEdit={() => handleEditPatient(patient)}
                          onDelete={() => handleDeletePatient(patient.id)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
</TabsContent>
          <TabsContent value="add">
            <Card>
              <CardHeader>
                <CardTitle>{editingPatientId ? 'Editar Paciente' : 'Adicionar Novo Paciente'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => {
                  e.preventDefault()
                  editingPatientId ? handleUpdatePatient() : handleAddPatient()
                }} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome</Label>
                      <Input
                        id="name"
                        value={newPatient.name}
                        onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        value={newPatient.cpf}
                        onChange={(e) => setNewPatient({ ...newPatient, cpf: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateOfBirth">Data de Nascimento</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={format(newPatient.dateOfBirth, 'yyyy-MM-dd')}
                        onChange={(e) => setNewPatient({ ...newPatient, dateOfBirth: new Date(e.target.value) })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newPatient.email}
                        onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={newPatient.phone}
                        onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Endereço</Label>
                      <Input
                        id="address"
                        value={newPatient.address}
                        onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-vaccini-primary text-white hover:bg-vaccini-primary/90">
                    {editingPatientId ? 'Atualizar Paciente' : 'Adicionar Paciente'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4 text-vaccini-primary">Agendamentos dos Pacientes</h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Paciente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vacinas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appointment) => {
                  const patient = patients.find(p => p.id === appointment.patientId)
                  return (
                    <TableRow key={appointment.id}>
                      <TableCell>{patient?.name}</TableCell>
                      <TableCell>{format(appointment.date, 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{appointment.timeSlot}</TableCell>
                      <TableCell>{appointment.status}</TableCell>
                      <TableCell>{appointment.vaccines.join(', ')}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


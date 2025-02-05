import { create } from 'zustand'

interface VaccineStore {
  vaccinesToUpdate: number[] // array de IDs das vacinas que precisam atualização
  addVaccineToUpdate: (id: number) => void
  removeVaccineToUpdate: (id: number) => void
  clearVaccinesToUpdate: () => void
  shouldRedirectToPlan: boolean
  setShouldRedirectToPlan: (value: boolean) => void
}

export const useVaccineStore = create<VaccineStore>((set) => ({
  vaccinesToUpdate: [],
  addVaccineToUpdate: (id) => 
    set((state) => ({ 
      vaccinesToUpdate: state.vaccinesToUpdate.includes(id) 
        ? state.vaccinesToUpdate 
        : [...state.vaccinesToUpdate, id],
      shouldRedirectToPlan: true
    })),
  removeVaccineToUpdate: (id) => 
    set((state) => ({ 
      vaccinesToUpdate: state.vaccinesToUpdate.filter(v => v !== id) 
    })),
  clearVaccinesToUpdate: () => set({ vaccinesToUpdate: [] }),
  shouldRedirectToPlan: false,
  setShouldRedirectToPlan: (value) => set({ shouldRedirectToPlan: value })
})) 
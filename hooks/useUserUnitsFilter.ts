'use client'

import { useUser } from '@/contexts/UserContext'

export function useUserUnitsFilter() {
  const { currentUser } = useUser()

  const getUserUnitsIds = (): number[] => {
    if (!currentUser) return []
    
    // Admin (role_id: 1) pode ver todas as unidades
    if (currentUser.user_role_id === 1) {
      return []
    }
    
    // Gerentes (role_id: 3) só podem ver suas unidades vinculadas
    if (currentUser.user_role_id === 3) {
      return currentUser.units || []
    }
    
    // Enfermeiras (role_id: 2) só podem ver suas unidades vinculadas
    if (currentUser.user_role_id === 2) {
      return currentUser.units || []
    }
    
    return []
  }

  const shouldFilterByUnits = (): boolean => {
    if (!currentUser) return false
    
    // Admin não precisa filtrar
    if (currentUser.user_role_id === 1) return false
    
    // Gerentes e enfermeiras precisam filtrar
    return currentUser.user_role_id === 2 || currentUser.user_role_id === 3
  }

  const filterByUserUnits = <T extends { unit_id?: number; unidade_id?: number }>(items: T[]): T[] => {
    if (!shouldFilterByUnits()) return items
    
    const allowedUnits = getUserUnitsIds()
    if (allowedUnits.length === 0) return []
    
    return items.filter(item => {
      const unitId = item.unit_id || item.unidade_id
      return unitId && allowedUnits.includes(unitId)
    })
  }

  const getUnitsFilter = () => {
    if (!shouldFilterByUnits()) return null
    
    const allowedUnits = getUserUnitsIds()
    if (allowedUnits.length === 0) return { in: [-1] } // Retorna filtro que não matcha nada
    
    return { in: allowedUnits }
  }

  return {
    getUserUnitsIds,
    shouldFilterByUnits,
    filterByUserUnits,
    getUnitsFilter,
    currentUser
  }
}
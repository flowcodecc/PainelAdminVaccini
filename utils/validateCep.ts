import { supabase } from '@/lib/supabase'

export const validateUnitCep = async (unitId: number, cep: string) => {
  try {
    // Busca as faixas de CEP da unidade
    const { data: ranges, error } = await supabase
      .from('unidade_ceps_atende')
      .select('*')
      .eq('unidade_id', unitId)

    if (error) {
      console.error('Erro ao buscar faixas de CEP:', error)
      return {
        isValid: false,
        message: 'Erro ao buscar faixas de CEP'
      }
    }

    if (!ranges || ranges.length === 0) {
      return {
        isValid: false,
        message: 'Esta unidade não possui faixas de CEP cadastradas'
      }
    }

    // Remove caracteres não numéricos do CEP
    const cleanCep = cep.replace(/\D/g, '')

    // Verifica se o CEP está em alguma das faixas
    const isInRange = ranges.some(range => {
      const start = range.cep_inicial.replace(/\D/g, '')
      const end = range.cep_final.replace(/\D/g, '')
      return parseInt(cleanCep) >= parseInt(start) && parseInt(cleanCep) <= parseInt(end)
    })

    if (!isInRange) {
      // Busca unidades que atendem este CEP
      const { data: validUnits } = await supabase
        .from('unidade_ceps_atende')
        .select(`
          unidade:unidade_id!inner(
            id,
            nome,
            logradouro,
            numero,
            bairro,
            cidade
          )
        `)
        .lte('cep_inicial', cleanCep)
        .gte('cep_final', cleanCep)

      return {
        isValid: false,
        message: 'CEP não atendido por esta unidade',
        validUnits: validUnits?.map(u => u.unidade) || []
      }
    }

    return {
      isValid: true,
      message: 'CEP válido para esta unidade'
    }
  } catch (error) {
    console.error('Erro ao validar CEP:', error)
    return {
      isValid: false,
      message: 'Erro ao validar CEP'
    }
  }
} 
const fs = require('fs');
const csv = require('csv-parser');

// Função para normalizar nomes (remover espaços extras, converter para maiúscula)
function normalizeName(name) {
  return name.trim().toUpperCase();
}

// Função para mapear nomes de unidades do CSV para nomes consistentes
function mapUnidadeName(csvName) {
  const mapping = {
    // Mapeamento baseado nas unidades reais do sistema
    'LARGO': 'Vaccini Largo do Machardo',           // ID 21
    'REDE': 'Vaccini Tijuca Central',               // ID 26 (Tijuca Central - Rede)
    'BOTAFOGO': 'Vaccini Botafogo',                 // ID 19
    'COPA': 'Vaccini Copacabana',                   // ID 20
    'TIJ 45': 'Vaccini Tijuca 45',                  // ID 24
    'BARRA AMERICAS': 'Vaccini Barra Américas',     // ID 18
    'N. IGUACU': 'Vaccini Nova Iguaçu',             // ID 22
    'NOVA IGUACU': 'Vaccini Nova Iguaçu',           // ID 22 (variação)
    'NOVA IGUACÚ': 'Vaccini Nova Iguaçu',           // ID 22 (com acento)
    'BARRA AMÉRICAS': 'Vaccini Barra Américas',     // ID 18 (com acento)
    'TIJ 45': 'Vaccini Tijuca 45',                  // ID 24
    'TIJUCA 45': 'Vaccini Tijuca 45',               // ID 24 (variação)
    'TIJUCA CENTRAL': 'Vaccini Tijuca Central',     // ID 26
    'LARGO DO MACHADO': 'Vaccini Largo do Machardo', // ID 21 (nome completo)
    'COPACABANA': 'Vaccini Copacabana',             // ID 20 (nome completo)
    'BOTAFOGO': 'Vaccini Botafogo',                 // ID 19 (nome completo)
    'BARRA DA TIJUCA': 'Vaccini Barra Américas',    // ID 18 (bairro)
    'AMÉRICAS': 'Vaccini Barra Américas',           // ID 18 (nome interno)
    'MACHADO': 'Vaccini Largo do Machardo',         // ID 21 (abreviação)
    'TIJUCA': 'Vaccini Tijuca Central'              // ID 26 (padrão para Tijuca)
  };
  
  const normalized = normalizeName(csvName);
  return mapping[normalized] || csvName.trim();
}

async function testMapping() {
  try {
    console.log('🧪 Testando mapeamento de unidades...\n');

    // Ler CSV de unidades
    const unidadesData = await readCSV('./convenios_unidades.csv');
    
    // Extrair unidades únicas
    const unidadesUnicas = [...new Set(unidadesData.map(row => row.Unidade))];
    
    console.log('📋 Unidades encontradas no CSV:');
    unidadesUnicas.forEach(unidade => {
      const mapeada = mapUnidadeName(unidade);
      const status = unidade === mapeada ? '✅' : '🔄';
      console.log(`   ${status} "${unidade}" → "${mapeada}"`);
    });

    // Verificar se todas as unidades do CSV têm mapeamento
    console.log('\n🔍 Verificando mapeamentos:');
    const unidadesSemMapeamento = unidadesUnicas.filter(unidade => {
      const mapeada = mapUnidadeName(unidade);
      return unidade === mapeada; // Se não mudou, não tem mapeamento específico
    });

    if (unidadesSemMapeamento.length > 0) {
      console.log('⚠️  Unidades sem mapeamento específico:');
      unidadesSemMapeamento.forEach(unidade => {
        console.log(`   • "${unidade}"`);
      });
    } else {
      console.log('✅ Todas as unidades têm mapeamento específico!');
    }

    // Mostrar estatísticas
    console.log('\n📊 Estatísticas:');
    console.log(`   • Total de unidades no CSV: ${unidadesUnicas.length}`);
    console.log(`   • Unidades com mapeamento: ${unidadesUnicas.length - unidadesSemMapeamento.length}`);
    console.log(`   • Unidades sem mapeamento: ${unidadesSemMapeamento.length}`);

    // Mostrar exemplos de mapeamento
    console.log('\n🎯 Exemplos de mapeamento:');
    const exemplos = [
      'Largo', 'Rede', 'Botafogo', 'Copa', 'Tij 45', 
      'Barra Americas', 'N. Iguacu'
    ];
    
    exemplos.forEach(exemplo => {
      const mapeada = mapUnidadeName(exemplo);
      console.log(`   • "${exemplo}" → "${mapeada}"`);
    });

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

// Função para ler CSV
function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// Executar teste
if (require.main === module) {
  testMapping();
}

module.exports = { testMapping };

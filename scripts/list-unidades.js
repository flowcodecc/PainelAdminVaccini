const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Se não encontrou nas variáveis de ambiente, tenta carregar do arquivo de configuração
if (!supabaseUrl || !supabaseKey) {
  try {
    const config = require('./config.js');
    supabaseUrl = config.supabaseUrl;
    supabaseKey = config.supabaseKey;
    console.log('📋 Usando configuração do arquivo config.js');
  } catch (error) {
    console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
    process.exit(1);
  }
}

const supabase = createClient(supabaseUrl, supabaseKey);

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

async function listUnidades() {
  try {
    console.log('🏥 Listando todas as unidades do sistema...\n');

    // Buscar todas as unidades
    const { data: unidades, error: unidadesError } = await supabase
      .from('unidade')
      .select('id, nome, status')
      .order('id');

    if (unidadesError) {
      throw new Error(`Erro ao acessar tabela unidade: ${unidadesError.message}`);
    }

    const unidadesAtivas = unidades.filter(u => u.status);
    const unidadesInativas = unidades.filter(u => !u.status);

    console.log(`📊 Total de unidades: ${unidades.length}`);
    console.log(`   • ${unidadesAtivas.length} unidades ativas`);
    console.log(`   • ${unidadesInativas.length} unidades inativas\n`);

    console.log('✅ UNIDADES ATIVAS:');
    console.log('='.repeat(80));
    unidadesAtivas.forEach(unidade => {
      console.log(`ID: ${unidade.id.toString().padStart(2)} | ${unidade.nome}`);
    });

    if (unidadesInativas.length > 0) {
      console.log('\n❌ UNIDADES INATIVAS:');
      console.log('='.repeat(80));
      unidadesInativas.forEach(unidade => {
        console.log(`ID: ${unidade.id.toString().padStart(2)} | ${unidade.nome}`);
      });
    }

    // Verificar mapeamento das unidades do CSV
    console.log('\n🔍 VERIFICANDO MAPEAMENTO DAS UNIDADES DO CSV:');
    console.log('='.repeat(80));
    
    const unidadesCSV = ['Largo', 'Rede', 'Botafogo', 'Copa', 'Tij 45', 'Barra Americas', 'N. Iguacu'];
    
    unidadesCSV.forEach(csvNome => {
      const mapeada = mapUnidadeName(csvNome);
      const encontrada = unidades.find(u => u.nome === mapeada);
      
      if (encontrada) {
        const status = encontrada.status ? '✅' : '❌';
        console.log(`${status} "${csvNome}" → "${mapeada}" (ID: ${encontrada.id})`);
      } else {
        console.log(`⚠️  "${csvNome}" → "${mapeada}" (NÃO ENCONTRADA)`);
      }
    });

    // Mostrar unidades que podem ser mapeadas
    console.log('\n🎯 UNIDADES QUE PODEM SER MAPEADAS:');
    console.log('='.repeat(80));
    
    const unidadesMapeaveis = unidadesAtivas.filter(u => {
      const nome = u.nome.toLowerCase();
      return nome.includes('vaccini') && (
        nome.includes('largo') || nome.includes('machado') ||
        nome.includes('tijuca') || nome.includes('central') ||
        nome.includes('botafogo') || nome.includes('copacabana') ||
        nome.includes('barra') || nome.includes('américas') ||
        nome.includes('nova') || nome.includes('iguaçu')
      );
    });

    unidadesMapeaveis.forEach(unidade => {
      console.log(`ID: ${unidade.id.toString().padStart(2)} | ${unidade.nome}`);
    });

    console.log('\n📋 RESUMO:');
    console.log(`   • Total de unidades: ${unidades.length}`);
    console.log(`   • Unidades ativas: ${unidadesAtivas.length}`);
    console.log(`   • Unidades mapeáveis: ${unidadesMapeaveis.length}`);
    console.log(`   • Unidades do CSV: ${unidadesCSV.length}`);

  } catch (error) {
    console.error('❌ Erro ao listar unidades:', error.message);
    process.exit(1);
  }
}

// Executar listagem
if (require.main === module) {
  listUnidades();
}

module.exports = { listUnidades };

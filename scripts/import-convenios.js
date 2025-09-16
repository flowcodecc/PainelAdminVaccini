const fs = require('fs');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key para operações administrativas

// Se não encontrou nas variáveis de ambiente, tenta carregar do arquivo de configuração
if (!supabaseUrl || !supabaseKey) {
  try {
    const config = require('./config.js');
    supabaseUrl = config.supabaseUrl;
    supabaseKey = config.supabaseKey;
    console.log('📋 Usando configuração do arquivo config.js');
  } catch (error) {
    console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
    console.error('Certifique-se de ter NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY configuradas');
    console.error('Ou configure o arquivo config.js com as credenciais');
    process.exit(1);
  }
}

const supabase = createClient(supabaseUrl, supabaseKey);

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

// Função para normalizar nomes (remover espaços extras, converter para maiúscula)
function normalizeName(name) {
  return name.trim().toUpperCase();
}

// Função para mapear nomes de convênios do CSV para nomes consistentes
function mapConvenioName(csvName) {
  const mapping = {
    'AMIL': 'AMIL',
    'BNDES': 'BNDES',
    'BRADESCO CONCIERGE': 'BRADESCO CONCIERGE',
    'BRADESCO AVON / NATURA': 'BRADESCO AVON / NATURA',
    'CAMARJ': 'CAMARJ',
    'CAMPERJ': 'CAMPERJ',
    'CAREPLUS': 'CAREPLUS',
    'FIPECQ': 'FIPECQ',
    'FUNCIONAL': 'FUNCIONAL',
    'HAPVIDA/NOTREDAME': 'HAPVIDA/NOTREDAME',
    'OMINT': 'OMINT',
    'FUNDAÇÃO REAL GRANDEZA': 'FUNDAÇÃO REAL GRANDEZA',
    'FUNDAÇÃO REAL GRANDEZA (SALVUS SALUTEM)': 'FUNDAÇÃO REAL GRANDEZA (SALVUS SALUTEM)',
    'HUMANIA': 'HUMANIA',
    'SULAMÉRICA EXECUTIVO': 'SULAMÉRICA EXECUTIVO',
    'SULAMÉRICA PRESTIGE': 'SULAMÉRICA PRESTIGE',
    'SULAMERICA ESPECIAL S/A': 'SULAMERICA ESPECIAL S/A',
    'UNAFISCO': 'UNAFISCO',
    'VIDALINK': 'VIDALINK'
  };
  
  return mapping[normalizeName(csvName)] || normalizeName(csvName);
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

// Função para mapear nomes de vacinas do CSV para IDs da tabela ref_vacinas
async function getVaccineId(vaccineName) {
  const { data, error } = await supabase
    .from('ref_vacinas')
    .select('ref_vacinasID')
    .ilike('nome', `%${vaccineName.trim()}%`)
    .limit(1)
    .single();

  if (error || !data) {
    console.warn(`⚠️  Vacina não encontrada: ${vaccineName}`);
    return null;
  }

  return data.ref_vacinasID;
}

// Função para obter ID da unidade
async function getUnidadeId(unidadeName) {
  // Primeiro tenta busca exata
  let { data, error } = await supabase
    .from('unidade')
    .select('id, nome')
    .eq('nome', unidadeName)
    .limit(1)
    .single();

  // Se não encontrou, tenta busca por similaridade
  if (error || !data) {
    const { data: similarData, error: similarError } = await supabase
      .from('unidade')
      .select('id, nome')
      .ilike('nome', `%${unidadeName}%`)
      .limit(1)
      .single();
    
    if (similarError || !similarData) {
      console.warn(`⚠️  Unidade não encontrada: ${unidadeName}`);
      return null;
    }
    
    data = similarData;
    console.log(`🔍 Unidade encontrada por similaridade: ${unidadeName} → ${data.nome}`);
  }

  return data.id;
}

// Função principal de importação
async function importConvenios() {
  try {
    console.log('🚀 Iniciando importação de convênios...\n');

    // 1. Importar convênios únicos
    console.log('📋 Passo 1: Importando convênios...');
    const precosData = await readCSV('./convenios_precos.csv');
    const unidadesData = await readCSV('./convenios_unidades.csv');

    // Extrair convênios únicos
    const conveniosUnicos = new Set();
    precosData.forEach(row => {
      const convenio = mapConvenioName(row.Convenio);
      if (convenio) conveniosUnicos.add(convenio);
    });
    unidadesData.forEach(row => {
      const convenio = mapConvenioName(row.Convênios);
      if (convenio) conveniosUnicos.add(convenio);
    });

    // Inserir convênios
    const conveniosToInsert = Array.from(conveniosUnicos).map(nome => ({
      nome,
      ativo: true
    }));

    const { data: conveniosInserted, error: conveniosError } = await supabase
      .from('convenios')
      .upsert(conveniosToInsert, { onConflict: 'nome' })
      .select();

    if (conveniosError) {
      throw new Error(`Erro ao inserir convênios: ${conveniosError.message}`);
    }

    console.log(`✅ ${conveniosInserted.length} convênios importados/atualizados`);

    // 2. Importar preços das vacinas
    console.log('\n💰 Passo 2: Importando preços das vacinas...');
    let precosInseridos = 0;
    let precosIgnorados = 0;

    for (const row of precosData) {
      const convenioNome = mapConvenioName(row.Convenio);
      const vacinaNome = row.VACINAS;
      const preco = parseFloat(row.Preco) || 0;

      // Buscar ID do convênio
      const convenio = conveniosInserted.find(c => c.nome === convenioNome);
      if (!convenio) {
        console.warn(`⚠️  Convênio não encontrado: ${convenioNome}`);
        continue;
      }

      // Buscar ID da vacina
      const vacinaId = await getVaccineId(vacinaNome);
      if (!vacinaId) {
        precosIgnorados++;
        continue;
      }

      // Inserir preço
      const { error: precoError } = await supabase
        .from('convenio_vacina_precos')
        .upsert({
          convenio_id: convenio.id,
          vacina_id: vacinaId,
          preco: preco,
          ativo: true
        }, { onConflict: 'convenio_id,vacina_id' });

      if (precoError) {
        console.error(`❌ Erro ao inserir preço para ${vacinaNome} - ${convenioNome}: ${precoError.message}`);
      } else {
        precosInseridos++;
      }
    }

    console.log(`✅ ${precosInseridos} preços importados/atualizados`);
    console.log(`⚠️  ${precosIgnorados} preços ignorados (vacina não encontrada)`);

    // 3. Importar convênios por unidade
    console.log('\n🏥 Passo 3: Importando convênios por unidade...');
    let unidadesInseridas = 0;
    let unidadesIgnoradas = 0;

    for (const row of unidadesData) {
      const convenioNome = mapConvenioName(row.Convênios);
      const unidadeNome = mapUnidadeName(row.Unidade);
      const aceita = row.Aceita === 'SIM';

      // Buscar ID do convênio
      const convenio = conveniosInserted.find(c => c.nome === convenioNome);
      if (!convenio) {
        console.warn(`⚠️  Convênio não encontrado: ${convenioNome}`);
        continue;
      }

      // Buscar ID da unidade
      const unidadeId = await getUnidadeId(unidadeNome);
      if (!unidadeId) {
        unidadesIgnoradas++;
        continue;
      }

      // Inserir relação unidade-convênio
      const { error: unidadeError } = await supabase
        .from('unidade_convenios')
        .upsert({
          unidade_id: unidadeId,
          convenio_id: convenio.id,
          aceita: aceita
        }, { onConflict: 'unidade_id,convenio_id' });

      if (unidadeError) {
        console.error(`❌ Erro ao inserir relação unidade-convênio: ${unidadeError.message}`);
      } else {
        unidadesInseridas++;
      }
    }

    console.log(`✅ ${unidadesInseridas} relações unidade-convênio importadas/atualizadas`);
    console.log(`⚠️  ${unidadesIgnoradas} relações ignoradas (unidade não encontrada)`);

    // 4. Resumo final
    console.log('\n📊 Resumo da Importação:');
    console.log(`   • Convênios: ${conveniosInserted.length}`);
    console.log(`   • Preços de vacinas: ${precosInseridos}`);
    console.log(`   • Relações unidade-convênio: ${unidadesInseridas}`);
    console.log('\n🎉 Importação concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante a importação:', error.message);
    process.exit(1);
  }
}

// Executar importação
if (require.main === module) {
  importConvenios();
}

module.exports = { importConvenios };

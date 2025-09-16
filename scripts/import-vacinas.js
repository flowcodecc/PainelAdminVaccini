const fs = require('fs');
const csv = require('csv-parser');
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

// Função para limpar e normalizar nome da vacina
function cleanVaccineName(name) {
  if (!name) return '';
  
  return name
    .trim()
    .replace(/\s+/g, ' ') // Remove espaços extras
    .replace(/"/g, '') // Remove aspas
    .replace(/\n/g, ' ') // Remove quebras de linha
    .replace(/\r/g, ' '); // Remove retornos de carro
}

// Função principal de importação
async function importVacinas() {
  try {
    console.log('🚀 Iniciando importação de vacinas...\n');

    // 1. Ler dados do CSV
    console.log('📋 Passo 1: Lendo arquivo CSV...');
    const precosData = await readCSV('./convenios_precos.csv');
    
    // 2. Extrair vacinas únicas
    console.log('🔍 Passo 2: Extraindo vacinas únicas...');
    const vacinasUnicas = new Set();
    
    precosData.forEach(row => {
      const vacinaNome = cleanVaccineName(row.VACINAS);
      if (vacinaNome && vacinaNome.length > 0) {
        vacinasUnicas.add(vacinaNome);
      }
    });

    const vacinasArray = Array.from(vacinasUnicas).sort();
    console.log(`✅ ${vacinasArray.length} vacinas únicas encontradas`);

    // 3. Verificar quais vacinas já existem
    console.log('\n🔍 Passo 3: Verificando vacinas existentes...');
    const { data: vacinasExistentes, error: vacinasError } = await supabase
      .from('ref_vacinas')
      .select('ref_vacinasID, nome');

    if (vacinasError) {
      throw new Error(`Erro ao buscar vacinas existentes: ${vacinasError.message}`);
    }

    const nomesExistentes = new Set(vacinasExistentes.map(v => v.nome));
    const vacinasParaInserir = vacinasArray.filter(nome => !nomesExistentes.has(nome));
    const vacinasJaExistentes = vacinasArray.filter(nome => nomesExistentes.has(nome));

    console.log(`✅ ${vacinasJaExistentes.length} vacinas já existem no sistema`);
    console.log(`📝 ${vacinasParaInserir.length} vacinas serão inseridas`);

    if (vacinasJaExistentes.length > 0) {
      console.log('\n📋 Vacinas já existentes:');
      vacinasJaExistentes.slice(0, 10).forEach(nome => {
        console.log(`   • ${nome}`);
      });
      if (vacinasJaExistentes.length > 10) {
        console.log(`   ... e mais ${vacinasJaExistentes.length - 10} vacinas`);
      }
    }

    // 4. Inserir novas vacinas
    if (vacinasParaInserir.length > 0) {
      console.log('\n💉 Passo 4: Inserindo novas vacinas...');
      
      const vacinasToInsert = vacinasParaInserir.map(nome => ({
        nome: nome,
        preco: 0, // Preço padrão como 0
        status: true, // Ativo por padrão
        vacinas_plano: null // Array vazio
      }));

      // Inserir em lotes para evitar problemas de tamanho
      const batchSize = 50;
      let inseridas = 0;

      for (let i = 0; i < vacinasToInsert.length; i += batchSize) {
        const batch = vacinasToInsert.slice(i, i + batchSize);
        
        const { data: insertedData, error: insertError } = await supabase
          .from('ref_vacinas')
          .insert(batch)
          .select('ref_vacinasID, nome');

        if (insertError) {
          console.error(`❌ Erro ao inserir lote ${Math.floor(i/batchSize) + 1}:`, insertError.message);
          continue;
        }

        inseridas += insertedData.length;
        console.log(`✅ Lote ${Math.floor(i/batchSize) + 1}: ${insertedData.length} vacinas inseridas`);
      }

      console.log(`\n🎉 Total de vacinas inseridas: ${inseridas}`);
    } else {
      console.log('\n✅ Todas as vacinas já existem no sistema!');
    }

    // 5. Resumo final
    console.log('\n📊 Resumo da Importação:');
    console.log(`   • Vacinas únicas no CSV: ${vacinasArray.length}`);
    console.log(`   • Vacinas já existentes: ${vacinasJaExistentes.length}`);
    console.log(`   • Vacinas inseridas: ${vacinasParaInserir.length}`);
    
    // 6. Verificar total de vacinas no sistema
    const { data: totalVacinas, error: totalError } = await supabase
      .from('ref_vacinas')
      .select('ref_vacinasID', { count: 'exact' });

    if (!totalError) {
      console.log(`   • Total de vacinas no sistema: ${totalVacinas.length}`);
    }

    console.log('\n🎉 Importação de vacinas concluída com sucesso!');
    console.log('\n💡 Agora você pode executar o script de importação de convênios novamente:');
    console.log('   node import-convenios.js');

  } catch (error) {
    console.error('❌ Erro durante a importação:', error.message);
    process.exit(1);
  }
}

// Executar importação
if (require.main === module) {
  importVacinas();
}

module.exports = { importVacinas };

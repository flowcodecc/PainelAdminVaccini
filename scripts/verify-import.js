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

async function verifyImport() {
  try {
    console.log('🔍 Verificando importação de convênios...\n');

    // 1. Verificar convênios
    console.log('📋 Verificando convênios...');
    const { data: convenios, error: conveniosError } = await supabase
      .from('convenios')
      .select('*')
      .order('nome');

    if (conveniosError) {
      throw new Error(`Erro ao buscar convênios: ${conveniosError.message}`);
    }

    console.log(`✅ ${convenios.length} convênios encontrados:`);
    convenios.forEach(c => {
      console.log(`   • ${c.nome} (ID: ${c.id}, Ativo: ${c.ativo})`);
    });

    // 2. Verificar preços das vacinas
    console.log('\n💰 Verificando preços das vacinas...');
    const { data: precos, error: precosError } = await supabase
      .from('convenio_vacina_precos')
      .select(`
        *,
        convenio:convenios(nome),
        vacina:ref_vacinas(nome)
      `)
      .order('convenio_id, vacina_id');

    if (precosError) {
      throw new Error(`Erro ao buscar preços: ${precosError.message}`);
    }

    console.log(`✅ ${precos.length} preços encontrados`);
    
    // Agrupar por convênio
    const precosPorConvenio = {};
    precos.forEach(preco => {
      const convenioNome = preco.convenio?.nome || 'Desconhecido';
      if (!precosPorConvenio[convenioNome]) {
        precosPorConvenio[convenioNome] = [];
      }
      precosPorConvenio[convenioNome].push(preco);
    });

    Object.keys(precosPorConvenio).forEach(convenioNome => {
      const count = precosPorConvenio[convenioNome].length;
      console.log(`   • ${convenioNome}: ${count} vacinas`);
    });

    // 3. Verificar convênios por unidade
    console.log('\n🏥 Verificando convênios por unidade...');
    const { data: unidadeConvenios, error: unidadeError } = await supabase
      .from('unidade_convenios')
      .select(`
        *,
        unidade:unidade(nome),
        convenio:convenios(nome)
      `)
      .order('unidade_id, convenio_id');

    if (unidadeError) {
      throw new Error(`Erro ao buscar convênios por unidade: ${unidadeError.message}`);
    }

    console.log(`✅ ${unidadeConvenios.length} relações unidade-convênio encontradas`);
    
    // Agrupar por unidade
    const conveniosPorUnidade = {};
    unidadeConvenios.forEach(uc => {
      const unidadeNome = uc.unidade?.nome || 'Desconhecida';
      if (!conveniosPorUnidade[unidadeNome]) {
        conveniosPorUnidade[unidadeNome] = { aceitos: 0, rejeitados: 0 };
      }
      if (uc.aceita) {
        conveniosPorUnidade[unidadeNome].aceitos++;
      } else {
        conveniosPorUnidade[unidadeNome].rejeitados++;
      }
    });

    Object.keys(conveniosPorUnidade).forEach(unidadeNome => {
      const { aceitos, rejeitados } = conveniosPorUnidade[unidadeNome];
      console.log(`   • ${unidadeNome}: ${aceitos} aceitos, ${rejeitados} rejeitados`);
    });

    // 4. Estatísticas gerais
    console.log('\n📊 Estatísticas Gerais:');
    console.log(`   • Total de convênios: ${convenios.length}`);
    console.log(`   • Total de preços de vacinas: ${precos.length}`);
    console.log(`   • Total de relações unidade-convênio: ${unidadeConvenios.length}`);
    
    const conveniosAtivos = convenios.filter(c => c.ativo).length;
    const precosAtivos = precos.filter(p => p.ativo).length;
    const relacoesAtivas = unidadeConvenios.filter(uc => uc.aceita).length;
    
    console.log(`   • Convênios ativos: ${conveniosAtivos}`);
    console.log(`   • Preços ativos: ${precosAtivos}`);
    console.log(`   • Relações ativas (aceitas): ${relacoesAtivas}`);

    // 5. Verificar alguns exemplos
    console.log('\n🔍 Exemplos de dados:');
    
    // Exemplo de preços por convênio
    const exemploConvenio = convenios[0];
    if (exemploConvenio) {
      const precosExemplo = precos.filter(p => p.convenio_id === exemploConvenio.id).slice(0, 3);
      console.log(`\n   Preços para ${exemploConvenio.nome}:`);
      precosExemplo.forEach(preco => {
        const vacinaNome = preco.vacina?.nome || 'Desconhecida';
        console.log(`     • ${vacinaNome}: R$ ${preco.preco.toFixed(2)}`);
      });
    }

    // Exemplo de convênios por unidade
    const exemploUnidade = unidadeConvenios.find(uc => uc.aceita);
    if (exemploUnidade) {
      const unidadeNome = exemploUnidade.unidade?.nome || 'Desconhecida';
      const convenioNome = exemploUnidade.convenio?.nome || 'Desconhecido';
      console.log(`\n   Exemplo: ${unidadeNome} aceita ${convenioNome}`);
    }

    console.log('\n✅ Verificação concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante a verificação:', error.message);
    process.exit(1);
  }
}

// Executar verificação
if (require.main === module) {
  verifyImport();
}

module.exports = { verifyImport };

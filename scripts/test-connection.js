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

async function testConnection() {
  try {
    console.log('🔌 Testando conexão com o Supabase...\n');
    console.log(`📡 URL: ${supabaseUrl}`);
    console.log(`🔑 Key: ${supabaseKey.substring(0, 20)}...`);

    // Teste 1: Verificar se consegue acessar a tabela de unidades
    console.log('\n🏥 Teste 1: Acessando tabela de unidades...');
    const { data: unidades, error: unidadesError } = await supabase
      .from('unidade')
      .select('id, nome, status')
      .order('id');

    if (unidadesError) {
      throw new Error(`Erro ao acessar tabela unidade: ${unidadesError.message}`);
    }

    const unidadesAtivas = unidades.filter(u => u.status);
    const unidadesInativas = unidades.filter(u => !u.status);

    console.log(`✅ ${unidades.length} unidades encontradas no total:`);
    console.log(`   • ${unidadesAtivas.length} unidades ativas`);
    console.log(`   • ${unidadesInativas.length} unidades inativas`);
    
    console.log('\n📋 Unidades ativas:');
    unidadesAtivas.forEach(unidade => {
      console.log(`   • ${unidade.nome} (ID: ${unidade.id})`);
    });

    if (unidadesInativas.length > 0) {
      console.log('\n📋 Unidades inativas:');
      unidadesInativas.forEach(unidade => {
        console.log(`   • ${unidade.nome} (ID: ${unidade.id})`);
      });
    }

    // Teste 2: Verificar se consegue acessar a tabela de vacinas
    console.log('\n💉 Teste 2: Acessando tabela de vacinas...');
    const { data: vacinas, error: vacinasError } = await supabase
      .from('ref_vacinas')
      .select('ref_vacinasID, nome, status')
      .order('ref_vacinasID');

    if (vacinasError) {
      throw new Error(`Erro ao acessar tabela ref_vacinas: ${vacinasError.message}`);
    }

    const vacinasAtivas = vacinas.filter(v => v.status);
    const vacinasInativas = vacinas.filter(v => !v.status);

    console.log(`✅ ${vacinas.length} vacinas encontradas no total:`);
    console.log(`   • ${vacinasAtivas.length} vacinas ativas`);
    console.log(`   • ${vacinasInativas.length} vacinas inativas`);
    
    console.log('\n📋 Primeiras 10 vacinas ativas:');
    vacinasAtivas.slice(0, 10).forEach(vacina => {
      console.log(`   • ${vacina.nome} (ID: ${vacina.ref_vacinasID})`);
    });

    if (vacinasAtivas.length > 10) {
      console.log(`   ... e mais ${vacinasAtivas.length - 10} vacinas ativas`);
    }

    // Teste 3: Verificar se as tabelas de convênios existem
    console.log('\n🏢 Teste 3: Verificando tabelas de convênios...');
    
    const { data: convenios, error: conveniosError } = await supabase
      .from('convenios')
      .select('*')
      .limit(1);

    if (conveniosError) {
      console.log('⚠️  Tabela convenios não existe ainda - será criada durante a importação');
    } else {
      console.log(`✅ Tabela convenios existe com ${convenios.length} registros`);
    }

    const { data: precos, error: precosError } = await supabase
      .from('convenio_vacina_precos')
      .select('*')
      .limit(1);

    if (precosError) {
      console.log('⚠️  Tabela convenio_vacina_precos não existe ainda - será criada durante a importação');
    } else {
      console.log(`✅ Tabela convenio_vacina_precos existe com ${precos.length} registros`);
    }

    const { data: unidadeConvenios, error: unidadeConveniosError } = await supabase
      .from('unidade_convenios')
      .select('*')
      .limit(1);

    if (unidadeConveniosError) {
      console.log('⚠️  Tabela unidade_convenios não existe ainda - será criada durante a importação');
    } else {
      console.log(`✅ Tabela unidade_convenios existe com ${unidadeConvenios.length} registros`);
    }

    // Teste 4: Verificar permissões de escrita
    console.log('\n✍️  Teste 4: Verificando permissões de escrita...');
    
    // Tenta inserir um registro de teste na tabela convenios (se existir)
    if (!conveniosError) {
      const { data: testInsert, error: testError } = await supabase
        .from('convenios')
        .insert({ nome: 'TESTE_CONEXAO', ativo: false })
        .select();

      if (testError) {
        console.log('⚠️  Não foi possível inserir registro de teste:', testError.message);
      } else {
        console.log('✅ Permissões de escrita funcionando');
        
        // Remove o registro de teste
        await supabase
          .from('convenios')
          .delete()
          .eq('id', testInsert[0].id);
        console.log('🧹 Registro de teste removido');
      }
    }

    console.log('\n🎉 Teste de conexão concluído com sucesso!');
    console.log('✅ Você pode prosseguir com a importação dos convênios');

  } catch (error) {
    console.error('❌ Erro durante o teste de conexão:', error.message);
    console.error('\n🔧 Possíveis soluções:');
    console.error('   1. Verifique se as credenciais estão corretas');
    console.error('   2. Verifique se o projeto Supabase está ativo');
    console.error('   3. Verifique se a service role key tem as permissões necessárias');
    process.exit(1);
  }
}

// Executar teste
if (require.main === module) {
  testConnection();
}

module.exports = { testConnection };

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

async function debugCep() {
  try {
    console.log('🔍 Debugando problema de CEP - Paulo Victor (21030-530)\n');

    // 1. Verificar se o usuário Paulo Victor existe
    console.log('👤 Passo 1: Buscando usuário Paulo Victor...');
    const { data: usuarios, error: usuariosError } = await supabase
      .from('user')
      .select('id, nome, email, cep')
      .ilike('nome', '%Paulo Victor%');

    if (usuariosError) {
      console.error('❌ Erro ao buscar usuários:', usuariosError.message);
      return;
    }

    if (!usuarios || usuarios.length === 0) {
      console.log('⚠️  Usuário Paulo Victor não encontrado');
      console.log('🔍 Buscando usuários com CEP 21030-530...');
      
      const { data: usuariosCep } = await supabase
        .from('user')
        .select('id, nome, email, cep')
        .eq('cep', '21030-530');

      if (usuariosCep && usuariosCep.length > 0) {
        console.log('✅ Usuários encontrados com CEP 21030-530:');
        usuariosCep.forEach(user => {
          console.log(`   • ${user.nome} (${user.email}) - CEP: ${user.cep}`);
        });
        usuarios.push(...usuariosCep);
      } else {
        console.log('❌ Nenhum usuário encontrado com CEP 21030-530');
        return;
      }
    } else {
      console.log('✅ Usuários Paulo Victor encontrados:');
      usuarios.forEach(user => {
        console.log(`   • ${user.nome} (${user.email}) - CEP: ${user.cep}`);
      });
    }

    // 2. Verificar tabela unidade_ceps_atende
    console.log('\n📋 Passo 2: Verificando tabela unidade_ceps_atende...');
    const { data: cepsAtende, error: cepsError } = await supabase
      .from('unidade_ceps_atende')
      .select('*')
      .order('unidade_id');

    if (cepsError) {
      console.error('❌ Erro ao buscar CEPs atendidos:', cepsError.message);
      return;
    }

    if (!cepsAtende || cepsAtende.length === 0) {
      console.log('⚠️  Tabela unidade_ceps_atende está vazia!');
      console.log('💡 Isso explica por que nenhuma unidade é encontrada.');
      
      // Verificar se existe a tabela com nome diferente
      console.log('\n🔍 Verificando tabelas relacionadas a CEP...');
      const { data: tabelas, error: tabelasError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .like('table_name', '%cep%');

      if (!tabelasError && tabelas) {
        console.log('📋 Tabelas relacionadas a CEP encontradas:');
        tabelas.forEach(tabela => {
          console.log(`   • ${tabela.table_name}`);
        });
      }
    } else {
      console.log(`✅ ${cepsAtende.length} registros encontrados na tabela unidade_ceps_atende:`);
      cepsAtende.forEach(cep => {
        console.log(`   • Unidade ${cep.unidade_id}: ${cep.cep_inicial} - ${cep.cep_final}`);
      });
    }

    // 3. Verificar tabela unidade_faixa_ceps (nome alternativo)
    console.log('\n📋 Passo 3: Verificando tabela unidade_faixa_ceps...');
    const { data: faixaCeps, error: faixaError } = await supabase
      .from('unidade_faixa_ceps')
      .select('*')
      .order('unidade_id');

    if (faixaError) {
      console.log('⚠️  Tabela unidade_faixa_ceps não existe ou erro:', faixaError.message);
    } else if (!faixaCeps || faixaCeps.length === 0) {
      console.log('⚠️  Tabela unidade_faixa_ceps está vazia!');
    } else {
      console.log(`✅ ${faixaCeps.length} registros encontrados na tabela unidade_faixa_ceps:`);
      faixaCeps.slice(0, 10).forEach(cep => {
        console.log(`   • Unidade ${cep.unidade_id}: ${JSON.stringify(cep)}`);
      });
    }

    // 4. Testar a função RPC diretamente
    console.log('\n🔧 Passo 4: Testando função RPC...');
    if (usuarios.length > 0) {
      const usuarioTeste = usuarios[0];
      console.log(`Testando com usuário: ${usuarioTeste.nome} (${usuarioTeste.id})`);
      
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('verifica_unidade_usuario', {
          user_id: usuarioTeste.id
        });

      if (rpcError) {
        console.error('❌ Erro na função RPC:', rpcError.message);
      } else {
        console.log(`✅ Resultado da função RPC: ${rpcResult?.length || 0} unidades`);
        if (rpcResult && rpcResult.length > 0) {
          rpcResult.forEach(result => {
            console.log(`   • Unidade ${result.unidade_id}: CEP ${result.cep_inicial}-${result.cep_final}`);
          });
        }
      }
    }

    // 5. Verificar unidades ativas no Rio de Janeiro
    console.log('\n🏥 Passo 5: Verificando unidades ativas no Rio de Janeiro...');
    const { data: unidadesRJ, error: unidadesError } = await supabase
      .from('unidade')
      .select('id, nome, cidade, cep, status')
      .eq('status', true)
      .ilike('cidade', '%Rio de Janeiro%');

    if (unidadesError) {
      console.error('❌ Erro ao buscar unidades:', unidadesError.message);
    } else {
      console.log(`✅ ${unidadesRJ?.length || 0} unidades ativas no Rio de Janeiro:`);
      unidadesRJ?.forEach(unidade => {
        console.log(`   • ${unidade.nome} - CEP: ${unidade.cep}`);
      });
    }

    // 6. Recomendações
    console.log('\n💡 RECOMENDAÇÕES:');
    if (!cepsAtende || cepsAtende.length === 0) {
      console.log('   1. ❌ Tabela unidade_ceps_atende está vazia');
      console.log('   2. 🔧 Você precisa configurar as faixas de CEP para cada unidade');
      console.log('   3. 📝 Exemplo: Para unidade do Rio, configurar faixa 20000-000 a 23799-999');
    }

    if (!faixaCeps || faixaCeps.length === 0) {
      console.log('   4. ❌ Tabela unidade_faixa_ceps também está vazia');
      console.log('   5. 🔧 Verifique qual tabela está sendo usada no sistema');
    }

    console.log('\n🚀 Para resolver o problema:');
    console.log('   1. Configure as faixas de CEP para as unidades');
    console.log('   2. Ou ajuste a função verifica_unidade_usuario');
    console.log('   3. Ou use uma lógica alternativa baseada na cidade');

  } catch (error) {
    console.error('❌ Erro durante o debug:', error.message);
  }
}

// Executar debug
if (require.main === module) {
  debugCep();
}

module.exports = { debugCep };

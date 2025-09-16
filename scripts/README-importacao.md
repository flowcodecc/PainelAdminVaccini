# 📋 Script de Importação de Convênios

## 🚀 Como usar o script de importação

### 1. **Configuração automática (Recomendado)**
```bash
# Linux/Mac
cd scripts
chmod +x setup.sh
./setup.sh

# Windows
cd scripts
setup.bat
```

### 1.1. **Configuração manual**
```bash
npm install csv-parser @supabase/supabase-js
```

### 2. **Configurar credenciais do Supabase**
As credenciais já estão configuradas no arquivo `config.js`. Se preferir usar variáveis de ambiente, configure:

```bash
export NEXT_PUBLIC_SUPABASE_URL=https://yhvzhmzlmfkyabsmmtvg.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Como obter as chaves (se necessário):**
- `NEXT_PUBLIC_SUPABASE_URL`: Vá no painel do Supabase → Settings → API
- `SUPABASE_SERVICE_ROLE_KEY`: Mesmo local, use a "service_role" key (não a "anon" key)

### 3. **Preparar os arquivos CSV**
Coloque os arquivos CSV na pasta `scripts/`:
- `convenios_precos.csv`
- `convenios_unidades.csv`

### 4. **Testar conexão com Supabase**
```bash
cd scripts
node test-connection.js
```

### 5. **Testar mapeamento (opcional)**
```bash
cd scripts
node test-mapping.js
```

### 6. **Executar o script**
```bash
cd scripts
node import-convenios.js
```

## 📊 O que o script faz

### ✅ **Passo 1: Importa Convênios**
- Extrai convênios únicos dos dois CSVs
- Cria/atualiza registros na tabela `convenios`
- Normaliza nomes (remove espaços, converte para maiúscula)

### ✅ **Passo 2: Importa Preços das Vacinas**
- Lê o arquivo `convenios_precos.csv`
- Busca IDs das vacinas na tabela `ref_vacinas`
- Insere preços na tabela `convenio_vacina_precos`
- Ignora vacinas não encontradas (com aviso)

### ✅ **Passo 3: Importa Convênios por Unidade**
- Lê o arquivo `convenios_unidades.csv`
- Busca IDs das unidades na tabela `unidade`
- Insere relações na tabela `unidade_convenios`
- Ignora unidades não encontradas (com aviso)

## 🔧 Mapeamentos Automáticos

### **Convênios:**
- Normaliza nomes (remove espaços extras)
- Converte para maiúscula
- Mapeia variações de nomes

### **Unidades:**
- Mapeia nomes do CSV para nomes reais das tabelas:
  - `LARGO` → `Vaccini Largo do Machardo` (ID 21)
  - `REDE` → `Vaccini Tijuca Central` (ID 26)
  - `BOTAFOGO` → `Vaccini Botafogo` (ID 19)
  - `COPA` → `Vaccini Copacabana` (ID 20)
  - `TIJ 45` → `Vaccini Tijuca 45` (ID 24)
  - `BARRA AMERICAS` → `Vaccini Barra Américas` (ID 18)
  - `N. IGUACU` → `Vaccini Nova Iguaçu` (ID 22)
  - `COPACABANA` → `Vaccini Copacabana` (ID 20)
  - `LARGO DO MACHADO` → `Vaccini Largo do Machardo` (ID 21)
  - `TIJUCA CENTRAL` → `Vaccini Tijuca Central` (ID 26)
  - E outras variações...

### **Vacinas:**
- Busca por similaridade de nome na tabela `ref_vacinas`
- Usa `ILIKE` para busca case-insensitive

## ⚠️ **Avisos Importantes**

1. **Backup**: Faça backup do banco antes de executar
2. **Service Role Key**: Use a chave de service role, não a anon key
3. **Vacinas não encontradas**: Serão ignoradas com aviso
4. **Unidades não encontradas**: Serão ignoradas com aviso
5. **Upsert**: O script usa upsert, então pode ser executado múltiplas vezes

## 📈 **Exemplo de Saída**
```
🚀 Iniciando importação de convênios...

📋 Passo 1: Importando convênios...
✅ 19 convênios importados/atualizados

💰 Passo 2: Importando preços das vacinas...
✅ 1250 preços importados/atualizados
⚠️  290 preços ignorados (vacina não encontrada)

🏥 Passo 3: Importando convênios por unidade...
✅ 95 relações unidade-convênio importadas/atualizadas
⚠️  19 relações ignoradas (unidade não encontrada)

📊 Resumo da Importação:
   • Convênios: 19
   • Preços de vacinas: 1250
   • Relações unidade-convênio: 95

🎉 Importação concluída com sucesso!
```

## 🐛 **Solução de Problemas**

### **Erro: "Variáveis de ambiente não encontradas"**
- Verifique se o arquivo `.env` está na pasta `scripts/`
- Confirme se as variáveis estão corretas

### **Erro: "Vacina não encontrada"**
- Verifique se os nomes das vacinas no CSV correspondem aos da tabela `ref_vacinas`
- O script usa busca por similaridade, mas nomes muito diferentes podem não ser encontrados

### **Erro: "Unidade não encontrada"**
- Verifique se os nomes das unidades no CSV correspondem aos da tabela `unidade`
- Confirme se as unidades estão ativas (`status = true`)

## 🔌 **Script de Teste de Conexão**

Antes de executar qualquer importação, teste se a conexão com o Supabase está funcionando:

```bash
cd scripts
node test-connection.js
```

Este script irá:
- ✅ Testar conexão com o Supabase
- ✅ Verificar acesso às tabelas existentes (unidade, ref_vacinas)
- ✅ Verificar se as tabelas de convênios existem
- ✅ Testar permissões de escrita
- ✅ Mostrar informações das tabelas encontradas

**Exemplo de saída:**
```
🔌 Testando conexão com o Supabase...

📡 URL: https://yhvzhmzlmfkyabsmmtvg.supabase.co
🔑 Key: eyJhbGciOiJIUzI1NiIsInR5cCI6...

🏥 Teste 1: Acessando tabela de unidades...
✅ 5 unidades encontradas:
   • Vaccini Barra Américas (ID: 18, Status: true)
   • Vaccini Botafogo (ID: 19, Status: true)
   • Vaccini Copacabana (ID: 20, Status: true)
   ...

💉 Teste 2: Acessando tabela de vacinas...
✅ 5 vacinas encontradas:
   • BCG (ID: 1, Status: true)
   • Dengue (Qdenga) (ID: 2, Status: true)
   ...

🏢 Teste 3: Verificando tabelas de convênios...
⚠️  Tabela convenios não existe ainda - será criada durante a importação
⚠️  Tabela convenio_vacina_precos não existe ainda - será criada durante a importação
⚠️  Tabela unidade_convenios não existe ainda - será criada durante a importação

🎉 Teste de conexão concluído com sucesso!
✅ Você pode prosseguir com a importação dos convênios
```

## 🧪 **Script de Teste de Mapeamento**

Antes de executar a importação, você pode testar se o mapeamento das unidades está funcionando:

```bash
cd scripts
node test-mapping.js
```

Este script irá:
- ✅ Mostrar todas as unidades encontradas no CSV
- ✅ Mostrar como cada unidade será mapeada
- ✅ Identificar unidades sem mapeamento específico
- ✅ Mostrar estatísticas do mapeamento
- ✅ Dar exemplos de mapeamento

**Exemplo de saída:**
```
🧪 Testando mapeamento de unidades...

📋 Unidades encontradas no CSV:
   🔄 "Largo" → "Vaccini Largo do Machardo"
   🔄 "Rede" → "Vaccini Tijuca Central"
   🔄 "Botafogo" → "Vaccini Botafogo"
   🔄 "Copa" → "Vaccini Copacabana"
   🔄 "Tij 45" → "Vaccini Tijuca 45"
   🔄 "Barra Americas" → "Vaccini Barra Américas"
   🔄 "N. Iguacu" → "Vaccini Nova Iguaçu"

✅ Todas as unidades têm mapeamento específico!

📊 Estatísticas:
   • Total de unidades no CSV: 7
   • Unidades com mapeamento: 7
   • Unidades sem mapeamento: 0
```

## 🔄 **Re-executar Importação**
O script usa `upsert`, então pode ser executado múltiplas vezes sem problemas. Ele irá:
- Atualizar convênios existentes
- Atualizar preços existentes
- Atualizar relações unidade-convênio existentes

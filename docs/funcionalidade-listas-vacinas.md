# Funcionalidade: Listas de Vacinas

## Visão Geral

A nova funcionalidade de Listas de Vacinas permite aos administradores criar listas personalizadas de vacinas que podem ser importadas pelos gerentes para suas unidades. Esta funcionalidade melhora a gestão de vacinas e padroniza os preços entre diferentes unidades.

## Funcionalidades por Perfil de Usuário

### Administradores (user_role_id = 1)
- **Criar Listas de Vacinas**: Podem criar listas personalizadas com vacinas específicas
- **Definir Preços Customizados**: Opção de definir preços diferentes do padrão para cada vacina
- **Gerenciar Templates**: Criar listas que ficam disponíveis para todos os gerentes
- **Editar e Excluir**: Gerenciar todas as listas criadas
- **Visualizar Detalhes**: Ver informações completas das listas

### Gerentes (user_role_id = 3)
- **Visualizar Templates**: Ver todas as listas marcadas como template pelos administradores
- **Importar Listas**: Importar listas de vacinas para suas unidades
- **Gerenciar Importações**: Remover listas importadas de suas unidades
- **Visualizar Detalhes**: Ver informações completas das listas disponíveis

### Enfermeiras (user_role_id = 2)
- **Acesso Restrito**: Não têm acesso a esta funcionalidade

## Estrutura do Banco de Dados

### Tabelas Criadas

1. **vaccine_lists**
   - `id`: Identificador único da lista
   - `nome`: Nome da lista de vacinas
   - `descricao`: Descrição opcional da lista
   - `created_by`: ID do usuário que criou a lista
   - `created_at` / `updated_at`: Timestamps de criação e atualização
   - `status`: Status ativo/inativo da lista
   - `is_template`: Se a lista está disponível como template para gerentes

2. **vaccine_list_items**
   - `id`: Identificador único do item
   - `vaccine_list_id`: Referência à lista de vacinas
   - `vaccine_id`: Referência à vacina (ref_vacinas)
   - `preco_customizado`: Preço personalizado (opcional)
   - `created_at`: Timestamp de criação

3. **unit_vaccine_lists**
   - `id`: Identificador único da importação
   - `unidade_id`: ID da unidade que importou
   - `vaccine_list_id`: ID da lista importada
   - `imported_by`: ID do usuário que fez a importação
   - `imported_at`: Timestamp da importação
   - `is_active`: Se a importação está ativa

### Views Criadas

1. **vw_vaccine_lists_complete**
   - Visão que consolida informações das listas com total de vacinas e valor total

## Segurança (RLS - Row Level Security)

### Políticas Implementadas

#### vaccine_lists
- Administradores podem ver, criar, editar e excluir todas as listas
- Gerentes podem ver apenas templates ou listas importadas para suas unidades

#### vaccine_list_items
- Usuários podem ver itens de listas que têm acesso
- Apenas administradores podem modificar itens

#### unit_vaccine_lists
- Usuários veem importações de suas unidades (gerentes) ou todas (admin)
- Gerentes podem importar apenas para suas unidades

## Interface do Usuário

### Nova Aba "Listas de Vacinas"
Adicionada à página `/vacinas` com três abas:
1. Gerenciar Vacinas (existente)
2. Plano de Vacinação (existente)
3. **Listas de Vacinas (nova)**

### Componentes Criados

1. **VaccineListsTab**: Componente principal da aba
2. **VaccineListDialog**: Dialog para criar/editar listas
3. **VaccineListViewDialog**: Dialog para visualizar detalhes das listas

### Funcionalidades da Interface

#### Para Administradores:
- Botão "Criar Nova Lista"
- Tabela com listas criadas
- Ações: Visualizar, Editar, Excluir
- Badge indicando se é Template ou Privada

#### Para Gerentes:
- Seção "Listas Disponíveis para Importação"
- Seção "Listas Importadas"
- Ações: Visualizar, Importar, Remover importação

## Fluxo de Uso

### Criação de Lista (Admin)
1. Admin acessa aba "Listas de Vacinas"
2. Clica em "Criar Nova Lista"
3. Preenche informações básicas (nome, descrição)
4. Marca como template se deseja disponibilizar para gerentes
5. Seleciona vacinas e define preços customizados (opcional)
6. Salva a lista

### Importação de Lista (Gerente)
1. Gerente acessa aba "Listas de Vacinas"
2. Visualiza listas disponíveis na seção "Listas Disponíveis"
3. Clica no ícone de download para importar
4. Lista aparece na seção "Listas Importadas"

## Tipos TypeScript Adicionados

```typescript
interface VaccineList {
  id: number
  nome: string
  descricao?: string
  created_by: string
  created_at: string
  updated_at: string
  status: boolean
  is_template: boolean
  items?: VaccineListItem[]
  creator_name?: string
}

interface VaccineListItem {
  id: number
  vaccine_list_id: number
  vaccine_id: number
  preco_customizado?: number
  created_at: string
  vaccine?: Vaccine
}

interface UnitVaccineList {
  id: number
  unidade_id: number
  vaccine_list_id: number
  imported_by: string
  imported_at: string
  is_active: boolean
  vaccine_list?: VaccineList
  unit_name?: string
  imported_by_name?: string
}
```

## Benefícios

1. **Padronização**: Permite padronizar listas de vacinas entre unidades
2. **Eficiência**: Agiliza o processo de configuração de preços para gerentes
3. **Flexibilidade**: Administradores podem criar diferentes listas para diferentes contextos
4. **Controle**: Mantém controle centralizado de quais listas estão disponíveis
5. **Auditoria**: Rastreia quem criou e importou cada lista

## Melhorias Futuras

1. **Seleção de Unidade**: Permitir que gerentes escolham para qual unidade importar
2. **Histórico de Versões**: Controlar versões das listas
3. **Importação em Lote**: Importar múltiplas listas de uma vez
4. **Notificações**: Avisar gerentes sobre novas listas disponíveis
5. **Relatórios**: Relatórios de uso das listas por unidade

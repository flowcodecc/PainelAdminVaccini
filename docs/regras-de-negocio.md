# Regras de Negócio do Sistema Vaccini

## 1. Gestão de Usuários

### Tipos de Usuários:
1. Administrador
2. Gerente
3. Enfermeira

### Campos do Usuário:
- id: number (identificador único)
- name: string (nome completo)
- email: string (e-mail único)
- password: string (senha criptografada)
- role: 'admin' | 'gerente' | 'nurse' (tipo de usuário)
- assignedUnits: number[] (IDs das unidades atribuídas)
- active: boolean (status da conta)

### Regras Específicas:
- O sistema deve permitir a alternância entre papéis de usuário (por exemplo, de enfermeira para administrador) para fins de demonstração.
- A interface do usuário deve se adaptar dinamicamente com base no papel do usuário logado.
- Apenas administradores podem acessar as funcionalidades de gerenciamento de gerentes e enfermeiras.

### Acesso por Tipo de Usuário:

#### Administrador:
- Acesso completo a todas as funcionalidades do sistema
- Pode criar, editar e excluir contas de todos os tipos de usuários
- Pode gerenciar todas as unidades, vacinas, planos de saúde e campanhas
- Tem acesso a todos os relatórios e estatísticas do sistema
- Pode configurar parâmetros globais do sistema

#### Gerente:
- Acesso limitado às unidades atribuídas
- Pode criar e editar contas de enfermeiras para suas unidades
- Pode gerenciar estoque de vacinas em suas unidades
- Tem acesso a relatórios relacionados às suas unidades
- Pode criar e gerenciar campanhas de vacinação para suas unidades
- Não pode criar ou editar vacinas, planos de saúde ou unidades não atribuídas

#### Enfermeira:
- Acesso limitado às unidades atribuídas
- Pode gerenciar agendamentos de pacientes
- Pode registrar aplicação de vacinas
- Pode adicionar e editar informações de pacientes
- Pode visualizar esquemas de vacinação e proteções do mês
- Tem acesso a relatórios básicos relacionados aos seus atendimentos
- Não pode editar configurações de unidades ou criar novas unidades


## 2. Gestão de Unidades

### Campos da Unidade:
- id: number (identificador único)
- name: string (nome da unidade)
- address: string (endereço completo)
- cepRange: string (faixa de CEP atendida)
- excludedCeps: string[] (CEPs excluídos da faixa de atendimento)
- availability: { day: string, timeSlots: { start: string, end: string }[] }[] (disponibilidade de horários)
- notAvailableApp: boolean (indica se a unidade não atende pelo aplicativo)
- noPriceDisplay: boolean (indica se a unidade não mostra preços)
- vaccinesPerTimeSlot: number (quantidade de vacinas por faixa de horário)
- esquemas: string[] (esquemas de vacinação disponíveis)
- healthPlans: number[] (IDs dos planos de saúde aceitos)

### Regras Específicas:
- Administradores podem adicionar, editar e excluir unidades.
- Gerentes podem visualizar e editar apenas as unidades atribuídas a eles.
- Enfermeiras podem visualizar informações básicas das unidades atribuídas a elas.
- A interface deve permitir a adição, edição e exclusão de unidades.
- Ao adicionar ou editar uma unidade, todos os campos devem ser preenchidos.
- A disponibilidade de horários deve ser configurável por dia da semana.
- O sistema deve validar a faixa de CEP e os CEPs excluídos.
- A interface deve permitir a seleção de múltiplos esquemas de vacinação e planos de saúde para cada unidade.

## 3. Gestão de Vacinas

### Campos da Vacina:
- id: number (identificador único)
- name: string (nome da vacina)
- basePrice: number (preço base)
- planDiscount: number (desconto para planos de saúde em porcentagem)
- planPrice: number (preço calculado para planos de saúde)
- protectionDiscount: number (desconto para proteções do mês em porcentagem)
- protectionPrice: number (preço calculado para proteções do mês)
- esquema: string[] (esquemas de vacinação aplicáveis)

### Regras Específicas:
- Apenas administradores podem adicionar, editar e excluir vacinas.
- Gerentes e enfermeiras podem visualizar informações sobre vacinas.
- A interface deve permitir a adição, edição e exclusão de vacinas.
- Os preços (planPrice e protectionPrice) devem ser calculados automaticamente com base nos descontos.
- A interface deve permitir a criação de "Proteções do Mês", que são conjuntos de vacinas com preços especiais.
- O sistema deve validar que os preços e descontos sejam valores positivos.
- A interface deve permitir a associação de vacinas a múltiplos esquemas de vacinação.

## 4. Gestão de Planos de Saúde

### Campos do Plano de Saúde:
- id: number (identificador único)
- name: string (nome do plano)
- discount: number (porcentagem de desconto)

### Regras Específicas:
- Apenas administradores podem adicionar, editar e excluir planos de saúde.
- Gerentes e enfermeiras podem visualizar informações sobre planos de saúde.
- A interface deve permitir a adição, edição e exclusão de planos de saúde.
- O desconto deve ser um valor entre 0 e 100.
- O sistema deve validar que o nome do plano seja único.

## 5. Gestão de Agendamentos

### Campos do Agendamento:
- id: number (identificador único)
- patientId: number (ID do paciente)
- unitId: number (ID da unidade)
- date: Date (data do agendamento)
- timeSlot: string (faixa de horário)
- status: 'scheduled' | 'completed' | 'cancelled' (status do agendamento)
- vaccines: string[] (vacinas a serem aplicadas)
- paymentMethod: string (método de pagamento)

### Regras Específicas:
- Administradores podem gerenciar agendamentos em todas as unidades.
- Gerentes podem gerenciar agendamentos nas unidades atribuídas a eles.
- Enfermeiras podem criar e editar agendamentos nas unidades atribuídas a elas.
- A interface deve permitir a criação, edição e cancelamento de agendamentos.
- O sistema deve verificar a disponibilidade de horários na unidade selecionada.
- A interface deve permitir a seleção de múltiplas vacinas para um agendamento.
- O sistema deve impedir agendamentos duplicados no mesmo horário.
- A interface deve permitir a filtragem de agendamentos por data, unidade e status.
- O sistema deve permitir a impressão de agendamentos selecionados.
- A interface deve oferecer visualizações em formato de tabela e calendário.

## 6. Gestão de Pacientes

### Campos do Paciente:
- id: number (identificador único)
- name: string (nome completo)
- cpf: string (CPF único)
- dateOfBirth: Date (data de nascimento)
- address: string (endereço completo)
- email: string (e-mail)
- phone: string (telefone)

### Regras Específicas:
- A interface deve permitir a adição, edição e visualização de informações de pacientes.
- O sistema deve validar o CPF como único e válido.
- A interface deve exibir o histórico de agendamentos e vacinações do paciente.
- O sistema deve permitir a busca de pacientes por nome, CPF ou e-mail.

## 7. Gestão de Enfermeiras

### Campos da Enfermeira (extends User):
- assignedUnits: number[] (IDs das unidades atribuídas)

### Regras Específicas:
- A interface deve permitir a adição, edição e remoção de enfermeiras.
- O sistema deve permitir a atribuição de enfermeiras a múltiplas unidades.
- Apenas administradores devem ter acesso a esta funcionalidade.

## 8. Gestão de Gerentes

### Campos do Gerente (extends User):
- assignedUnits: number[] (IDs das unidades atribuídas)

### Regras Específicas:
- A interface deve permitir a adição, edição e remoção de gerentes.
- O sistema deve permitir a atribuição de gerentes a múltiplas unidades.
- Apenas administradores devem ter acesso a esta funcionalidade.

## 9. Relatórios e Análises

### Tipos de Relatórios:
- Agendamentos por período
- Vacinas aplicadas por unidade
- Faturamento por unidade e período

### Regras Específicas:
- O sistema deve gerar relatórios em tempo real.
- A interface deve permitir a seleção de parâmetros para os relatórios (período, unidade, etc.).
- O acesso aos relatórios deve ser baseado no papel do usuário (administrador: todos os relatórios; gerente: relatórios de suas unidades; enfermeira: relatórios básicos de seus atendimentos).

## 10. Segurança e Autenticação

### Regras Específicas:
- O sistema deve implementar autenticação segura para todos os usuários.
- As senhas devem ser armazenadas de forma criptografada.
- O sistema deve implementar controle de acesso baseado em papéis.


## 11.Manipulação dos Dados de Agendamento

A página de agendamento deve permitir a filtragem e exibição dos pacientes, horários, unidades e formas de pagamento de forma organizada e dinâmica. O objetivo é garantir que os usuários possam visualizar e gerenciar as informações de agendamento de maneira eficiente, com base em critérios específicos.

1. Manipulação dos Dados de Agendamento:

Exibir uma lista de pacientes agendados, incluindo nome, horário, unidade de atendimento e forma de pagamento.

Carregar os dados dinamicamente a partir do banco de dados ou API, garantindo uma organização clara e acessível.

2. Filtros para Visualização:

Unidade: Filtragem por unidade de atendimento, permitindo ao usuário selecionar uma unidade específica para visualizar apenas os agendamentos correspondentes.

Horário: Opção de filtragem por intervalo de tempo (manhã, tarde ou horário personalizado).

Forma de Pagamento: Filtro baseado na forma de pagamento utilizada pelo paciente (cartão, dinheiro, plano de saúde, etc.).

3. Funcionalidades Esperadas:

Carregamento Dinâmico: Atualização dos dados conforme os filtros são aplicados, sem necessidade de recarregar a página.

Ordenação: Opção de ordenar os agendamentos por horário, nome do paciente ou unidade.

Exibição Detalhada: Possibilidade de visualizar detalhes completos do agendamento, incluindo informações do paciente, procedimento agendado, unidade, horário e forma de pagamento.
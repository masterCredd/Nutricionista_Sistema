# NutriSystem — Documentação Completa do Projeto

> Sistema de Gestão para Nutricionistas com IA
> Versão: 1.0.0 | Supabase + Edge Functions + Claude AI

**Produção:** https://frontend-rouge-xi-55.vercel.app

---

## 1. VISÃO GERAL

O NutriSystem é um sistema web completo para clínicas de nutrição, permitindo que nutricionistas gerenciem pacientes, consultas, evolução de peso e gerem planos alimentares personalizados com inteligência artificial (Claude Anthropic).

### 1.1 Pilares do Sistema

| Pilar | Tecnologia |
|---|---|
| Frontend | HTML5, CSS3, JavaScript puro |
| Backend | Supabase Edge Functions (Deno/TypeScript) |
| Banco de Dados | PostgreSQL 17 no Supabase |
| Autenticação | Supabase Auth + API Tokens SHA-256 |
| IA | Claude Sonnet 4 (Anthropic) via Edge Function |
| Gráficos | Chart.js 4 |
| Deploy Frontend | Vercel (estático) |
| Deploy Backend | Supabase CLI |

---

## 2. FUNCIONALIDADES COMPLETAS

### 2.1 Módulo de Autenticação

**Arquivos:** `index.html`, `cadastro.html`, `js/auth.js`, `js/supabase.js`

| Funcionalidade | Detalhes |
|---|---|
| Login | Email + senha via Supabase Auth |
| Cadastro | Nome + email + senha + confirmação |
| Sessão persistente | Auto-refresh token, localStorage |
| Redirecionamento automático | Usuário logado → Dashboard |
| Proteção de rotas | Páginas sem sessão → Login |
| Mensagens de erro | Mapeadas para português |
| Pós-cadastro | Insere registro na tabela `nutricionistas` |

### 2.2 Módulo Dashboard

**Arquivos:** `dashboard.html`, `js/dashboard.js`

| Funcionalidade | Fonte de Dados |
|---|---|
| Sidebar fixo | Dashboard, Pacientes, Sair |
| Card: Total de pacientes ativos | `SELECT count(*) FROM pacientes` via RLS |
| Card: Consultas da semana | `SELECT count(*) FROM consultas` (segunda-domingo) via RLS |
| Card: Pacientes sem retorno | RPC `get_pacientes_sem_retorno()` |
| Lista clicável | Cada paciente → `paciente.html?id=X` |

### 2.3 Módulo Pacientes — Listagem

**Arquivos:** `pacientes.html`, `js/pacientes.js`

| Funcionalidade | Detalhes |
|---|---|
| Listagem completa | Nome, objetivo principal, última consulta |
| Busca por nome | Filtro em tempo real (case insensitive) |
| Card clicável | Redireciona para perfil do paciente |
| Avatar | Inicial do nome em círculo verde |
| Botão "Novo Paciente" | → `cadastro-paciente.html` |
| Estado vazio | Mensagem + CTA para cadastrar |

### 2.4 Módulo Pacientes — Cadastro

**Arquivos:** `cadastro-paciente.html`, `js/cadastro-paciente.js`

**Aba 1 — Pessoal:**

| Campo | Tipo | Obrigatório |
|---|---|---|
| Nome completo | Texto | SIM |
| Data de nascimento | Date | Calcula idade |
| Sexo | Select: Feminino/Masculino/Outro | |
| Telefone | Tel | |
| WhatsApp | Tel | |
| Email | Email | |

**Aba 2 — Clínico:**

| Campo | Tipo | Detalhes |
|---|---|---|
| Peso atual | Number (kg) | |
| Altura | Number (cm) | |
| IMC | Readonly | Calculado automaticamente |
| Objetivo | Checkboxes + texto livre | 6 opções + campo livre |
| Nível atividade física | Select | 5 níveis |
| Patologias | Checkboxes + livre | 7 opções + "Nenhum" |
| Restrições alimentares | Checkboxes + livre | 5 opções + "Nenhum" |
| Alergias | Checkboxes + livre | 6 opções + "Nenhum" |
| Medicamentos | Textarea | |
| Suplementos | Textarea | |

**Aba 3 — Hábitos:**

| Campo | Tipo | Detalhes |
|---|---|---|
| Refeições por dia | Number | |
| Horário acorda | Text | Conversão automática (6→06:00) |
| Horário dorme | Text | Conversão automática (23→23:00) |
| Água por dia | Number (litros) | |
| Atividade física | Radio | Sim/Não com campo descrição |
| Observações | Textarea | |

### 2.5 Módulo Paciente — Perfil

**Arquivos:** `paciente.html`, `js/paciente.js`

#### Seção 1 — Dados Editáveis

- Abas: Pessoal, Clínico, Hábitos
- Campos preenchidos do banco
- Edição inline com "Salvar alterações"
- Toast de sucesso animado

#### Seção 2 — Consultas

- **Gráfico de evolução de peso**: Chart.js (linha, pontos, preenchimento verde)
- **Estado vazio**: "Nenhuma consulta registrada ainda"
- **Lista cronológica**: Data, peso, cintura, quadril, % gordura, observações, retorno
- **Modal "Nova Consulta"**:
  - Data (hoje default, editável)
  - Peso, cintura, quadril, % gordura
  - Observações
  - Próximo retorno
  - Fecha e atualiza automaticamente

#### Seção 3 — Planos Alimentares

- **Botão "Gerar Plano Alimentar"**: Chama Edge Function → Claude AI
- **Loading**: Spinner com "Gerando plano alimentar com IA..."
- **Resultado editável**: 5 cards de refeição (☀️🍎🥗🍊🌙), 5 opções cada
- **Edição inline**: Cada opção é um input editável
- **"Salvar Plano"**: Persiste no Supabase
- **Histórico**: Planos anteriores clicáveis para visualização

### 2.6 API de Agendamentos (Edge Functions)

**Endpoint 1 — POST /agendamentos** (Marcar)

| Validação | Código | Resposta |
|---|---|---|
| Token inválido/ausente | 401 | TOKEN_INVALIDO |
| Token desabilitado | 401 | TOKEN_DESABILITADO |
| Agenda não encontrada | 403 | AGENDA_NAO_ENCONTRADA |
| Procedimento não encontrado | 404 | PROCEDIMENTO_NAO_ENCONTRADO |
| Horário ocupado | 409 | HORARIO_OCUPADO + 3 sugestões |
| Campo obrigatório ausente | 422 | CAMPO_OBRIGATORIO_AUSENTE |
| Data/hora inválida | 422 | FORMATO_INVALIDO |
| Data passada | 422 | DATA_PASSADA |
| Agenda fechada | 423 | AGENDA_FECHADA |

**Endpoint 2 — PUT /agendamentos/:id** (Reagendar)

- Verifica se pertence à agenda
- Impede reagendamento de cancelado
- Ignora próprio agendamento no cálculo de conflitos
- Status volta para "agendado"

**Endpoint 3 — DELETE /agendamentos/:id** (Cancelar)

- Soft delete: status → "cancelado"
- Impede cancelamento duplicado (422)

**Endpoint 4 — GET /agendamentos/horarios** (Disponibilidade)

- Com `hora`: verifica específico + 3 sugestões
- Sem `hora`: lista todos slots disponíveis
- Fuso: America/Sao_Paulo

---

## 3. BANCO DE DADOS

### 3.1 Tabelas

| Tabela | Finalidade | RLS |
|---|---|---|
| `nutricionistas` | Perfil das nutricionistas | SIM |
| `pacientes` | Dados completos dos pacientes | SIM |
| `consultas` | Registro de consultas com medidas | SIM |
| `planos_alimentares` | Planos gerados (JSONB) | SIM |
| `agendas` | Profissionais/salas (agendamento) | NÃO (Edge) |
| `agenda_hours` | Horários de funcionamento | NÃO (Edge) |
| `procedimentos` | Serviços com duração | NÃO (Edge) |
| `agendamentos` | Agendamentos marcados | NÃO (Edge) |
| `api_tokens` | Tokens de API (hash SHA-256) | NÃO (Edge) |

### 3.2 Segurança (RLS)

Todas as tabelas de nutricionista usam `auth.uid()`:

- `nutricionistas`: `id = auth.uid()`
- `pacientes`: `nutricionista_id = auth.uid()`
- `consultas`: `paciente_id IN (SELECT id FROM pacientes WHERE nutricionista_id = auth.uid())`
- `planos_alimentares`: mescla regra das consultas

### 3.3 Triggers

1. **on_agenda_created**: Ao criar agenda, insere 7 dias em `agenda_hours`
2. **on_api_token_update**: Impede reativação de token desabilitado

### 3.4 Funções RPC

- `get_pacientes_sem_retorno()`: Retorna pacientes sem consulta há 30+ dias e sem retorno agendado

---

## 4. ESTRUTURA DE ARQUIVOS

```
Nutricionista_Sistema/
├── .env                          # Variáveis locais (gitignored)
├── .env.example                  # Template de variáveis
├── .gitignore                    # .env, node_modules, .temp
├── opencode.json                 # Config MCP Supabase
│
├── docs/                         # Documentação e prompts
│   ├── api.md                    # Especificação da API de agendamentos
│   ├── autenticacao.md           # Prompt de autenticação
│   ├── banco.md                  # Schema do banco (agendamento)
│   ├── banco-antigo.md           # Prompt do banco de nutricionistas
│   ├── Cadastro_pacientes.md     # Prompt de cadastro de pacientes
│   ├── dashboard.md              # Prompt do dashboard
│   ├── deploy.md                 # Guia de deploy atualizado
│   ├── DOCUMENTACAO_COMPLETA.md  # ← Este arquivo
│   ├── perfil_paciente.md        # Prompt do perfil do paciente
│   ├── plano_alimentar.md        # Prompt de planos com IA
│   └── sintese.txt               # Síntese original do projeto
│
├── frontend/                     # Aplicação web
│   ├── index.html                # Login
│   ├── cadastro.html             # Cadastro nutricionista
│   ├── dashboard.html            # Dashboard principal
│   ├── pacientes.html            # Listagem de pacientes
│   ├── cadastro-paciente.html    # Cadastro de paciente (3 abas)
│   ├── paciente.html             # Perfil do paciente
│   ├── css/
│   │   └── style.css             # Estilos completos (~1100 linhas)
│   └── js/
│       ├── supabase.js           # Cliente Supabase
│       ├── auth.js               # Login/cadastro/logout
│       ├── dashboard.js          # Dashboard metrics
│       ├── pacientes.js          # Listagem pacientes
│       ├── cadastro-paciente.js  # Formulário paciente
│       └── paciente.js           # Perfil, consultas, planos
│
├── scripts/
│   └── deploy.ps1                # Script de deploy PowerShell
│
└── supabase/
    ├── config.toml               # Configuração do projeto
    ├── functions/
    │   ├── _shared/
    │   │   ├── auth.ts           # Validação token SHA-256
    │   │   ├── errors.ts         # Respostas padronizadas
    │   │   └── slots.ts          # Cálculo de disponibilidade
    │   ├── agendamentos/
    │   │   └── index.ts          # POST /agendamentos
    │   ├── agendamentos-id/
    │   │   └── index.ts          # PUT|DELETE /agendamentos/:id
    │   ├── agendamentos-horarios/
    │   │   └── index.ts          # GET /agendamentos/horarios
    │   └── gerar-plano/
    │       └── index.ts          # Geração IA (Anthropic)
    └── migrations/
        ├── 001_create_enums.sql
        ├── 002_create_tables.sql
        ├── 003_create_indexes.sql
        ├── 004_create_triggers.sql
        ├── 005_seed_data.sql
        ├── 006_create_nutricionista_tables.sql
        └── 007_create_function_sem_retorno.sql
```

---

## 5. REVISÃO DE ERROS E PONTOS DE ATENÇÃO

### 5.1 Erros Encontrados e Corrigidos

| # | Problema | Status | Impacto |
|---|---|---|---|
| 1 | Função `sair()` duplicada em `auth.js` e `dashboard.js` | Cosmético | Nenhum (mesmo código) |
| 2 | ANTHROPIC_API_KEY configurada com chave Supabase em vez de chave Anthropic | ⚠️ Crítico | Função `gerar-plano` falha |
| 3 | `exibirErro()` referência `#error-message` que não existe em páginas sem formulário | ⚠️ Potencial | Só falha se chamada nessas páginas |
| 4 | `scripts/deploy.ps1` desatualizado — não inclui function `gerar-plano` | ⚠️ Médio | Deploy incompleto |
| 5 | Arquivos `.temp/` regenerados a cada `supabase link` | Cosmético | Gitignore já bloqueia |

### 5.2 Pontos de Melhoria (Não Críticos)

| # | Sugestão | Motivo |
|---|---|---|
| 1 | Extrair funções globais (`sair`, `exibirErro`) para módulo separado | Organização |
| 2 | Adicionar confirmação antes de sair no dashboard | UX |
| 3 | Adicionar loading state nos cards do dashboard | Feedback visual |
| 4 | Timezone explícito nos gráficos (America/Sao_Paulo) | Precisão |
| 5 | Validar email duplicado no cadastro antes do submit | UX |
| 6 | Paginação na listagem de pacientes (se muitos) | Performance |

---

## 6. PLANO DE TESTES (Open Test)

### 6.1 Testes de Autenticação

| # | Cenário | Passos | Resultado Esperado |
|---|---|---|---|
| T01 | Cadastro bem-sucedido | Preencher nome, email, senha ≥6, confirmar → "Criar conta" | Redirecionar para Dashboard |
| T02 | Login bem-sucedido | Email + senha corretos → "Entrar" | Redirecionar para Dashboard |
| T03 | Senha inválida | Email correto + senha errada → "Entrar" | Mensagem "Email ou senha inválidos" |
| T04 | Senha curta | Senha < 6 caracteres no cadastro | Mensagem "mínimo 6 caracteres" |
| T05 | Senhas não conferem | Password ≠ Confirm password | Mensagem "As senhas não conferem" |
| T06 | Sessão persistente | Fechar e reabrir navegador | Permanecer logado |
| T07 | Logout | Clicar "Sair" | Redirecionar para Login |
| T08 | Acesso restrito | Tentar acessar dashboard sem login | Redirecionar para Login |

### 6.2 Testes de Dashboard

| # | Cenário | Passos | Resultado Esperado |
|---|---|---|---|
| T09 | Card Pacientes | Após cadastrar pacientes | Número atualizado |
| T10 | Card Consultas | Após registrar consultas na semana | Número atualizado |
| T11 | Card Sem Retorno | Paciente sem consulta há 30+ dias | Nome aparece na lista |
| T12 | Card Sem Retorno vazio | Todos com retorno agendado | "Nenhum paciente sem retorno" |
| T13 | Clique paciente | Clicar em nome na lista | Redirecionar para perfil |

### 6.3 Testes de Pacientes

| # | Cenário | Passos | Resultado Esperado |
|---|---|---|---|
| T14 | Cadastro completo | Preencher todas as 3 abas → "Salvar" | Redirecionar para perfil |
| T15 | Campo obrigatório | "Salvar" sem nome | Alerta "Nome obrigatório" |
| T16 | IMC automático | Preencher peso + altura | IMC calculado |
| T17 | Conversão horário | Digitar "630" no campo acorda | Exibir "06:30" |
| T18 | Busca paciente | Digitar nome parcial na listagem | Filtrar resultados |
| T19 | Lista vazia | Nenhum paciente cadastrado | "Nenhum paciente cadastrado" |
| T20 | Edição perfil | Alterar campos → "Salvar alterações" | Toast "Dados salvos" |

### 6.4 Testes de Consultas

| # | Cenário | Passos | Resultado Esperado |
|---|---|---|---|
| T21 | Nova consulta | Abrir modal → preencher → "Salvar" | Card aparece na lista |
| T22 | Gráfico vazio | Paciente sem consultas | "Nenhuma consulta registrada" |
| T23 | Gráfico com dados | 2+ consultas com peso | Linha do gráfico visível |
| T24 | Campo obrigatório | Salvar consulta sem data | Erro "Data obrigatória" |

### 6.5 Testes de Plano Alimentar

| # | Cenário | Passos | Resultado Esperado |
|---|---|---|---|
| T25 | Gerar plano | Clicar "Gerar Plano Alimentar" | Loading + resultado com 25 opções |
| T26 | Editar opção | Alterar texto de uma opção | Campo editável reflete mudança |
| T27 | Salvar plano | "Salvar Plano" | Plano aparece no histórico |
| T28 | Visualizar histórico | Clicar em plano salvo | Modal com conteúdo completo |

### 6.6 Testes de API (Agendamentos)

| # | Cenário | Método | Rota |
|---|---|---|---|
| T29 | Criar agendamento | POST | /agendamentos |
| T30 | Reagendar | PUT | /agendamentos/:id |
| T31 | Cancelar | DELETE | /agendamentos/:id |
| T32 | Verificar disponibilidade | GET | /agendamentos/horarios |
| T33 | Token inválido | Qualquer | 401 TOKEN_INVALIDO |
| T34 | Agenda fechada | POST | 423 AGENDA_FECHADA |
| T35 | Horário ocupado | POST | 409 HORARIO_OCUPADO |

---

## 7. PROCESSO DE DIAGNÓSTICO

### 7.1 Diagnóstico Rápido (2 min)

```bash
# 1. Verificar conexão com Supabase
supabase link --project-ref ocyabbrncokgtahaqqkv

# 2. Verificar tabelas
supabase db query --linked "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"

# 3. Verificar functions deployadas
supabase functions list --project-ref ocyabbrncokgtahaqqkv

# 4. Verificar secrets
supabase secrets list --project-ref ocyabbrncokgtahaqqkv

# 5. Verificar git status
git status
```

### 7.2 Diagnóstico Detalhado (10 min)

#### Passo 1 — Validar Banco
```sql
-- Verificar RLS ativo
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' AND rowsecurity=true;

-- Verificar policies
SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname='public';

-- Testar RPC
SELECT * FROM get_pacientes_sem_retorno();
```

#### Passo 2 — Validar Edge Functions
```bash
# Testar function gerar-plano
curl -X POST https://ocyabbrncokgtahaqqkv.supabase.co/functions/v1/gerar-plano \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nome":"Teste","peso_inicial":65,"altura":165}'
```

#### Passo 3 — Testar Frontend
```bash
# Servir localmente
npx serve frontend
# Abrir http://localhost:3000 no navegador
```

#### Passo 4 — Verificar Autenticação
```javascript
// No console do navegador
const { data: { session } } = await supabase.auth.getSession();
console.log('Logado:', !!session);
console.log('User:', session?.user?.email);
```

### 7.3 Matriz de Diagnóstico

| Componente | Indicador de Saúde | O que verificar |
|---|---|---|
| Supabase project | `supabase link` funciona | project-ref `ocyabbrncokgtahaqqkv` |
| Banco de dados | 9 tabelas listadas | `SELECT count(*)` |
| RLS | 15 policies ativas | `pg_policies` |
| Edge Functions | 4 functions ACTIVE | `functions list` |
| Auth | Login redireciona | Console browser → session |
| IA (Anthropic) | `gerar-plano` retorna 200 | API key válida |
| Frontend | Páginas carregam sem erro 404 | Servidor rodando |
| Git | `.env` gitignorado | `git status` mostra apenas .env.example |

### 7.4 Problemas Conhecidos e Soluções

| Sintoma | Causa Provável | Solução |
|---|---|---|
| Erro 401 nas Edge Functions | Token hash não encontrado em `api_tokens` | Inserir token com `gen_random_uuid()` + hash SHA-256 |
| Função `gerar-plano` retorna 500 | ANTHROPIC_API_KEY inválida | `supabase secrets set ANTHROPIC_API_KEY=sk-ant-...` |
| Login redireciona mas dashboard não carrega | Sessão expirada ou RLS bloqueando | Verificar se `auth.uid()` existe em `nutricionistas` |
| "Nenhum paciente sem retorno" mesmo sem consultas | Função RPC não criada | Executar migration 007 |
| Gráfico em branco | Chart.js não carregou (CDN bloqueado) | Verificar internet ou usar CDN alternativo |
| Modal de consulta não abre | Erro JS no console | Verificar IDs dos elementos no HTML |

---

## 8. COMANDOS ÚTEIS

```bash
# Deploy todas as functions
supabase functions deploy agendamentos
supabase functions deploy agendamentos-id
supabase functions deploy agendamentos-horarios
supabase functions deploy gerar-plano

# Gerenciar secrets
supabase secrets set ANTHROPIC_API_KEY=sua-chave
supabase secrets list
supabase secrets unset ANTHROPIC_API_KEY

# Banco
supabase db query --linked "SELECT * FROM nutricionistas"
supabase db dump --linked -f backup.sql

# Servir frontend local
npx serve frontend

# Git
git add -A
git commit -m "descricao"
git push
```

---

## 9. TECNOLOGIAS E VERSÕES

| Tecnologia | Versão | Função |
|---|---|---|
| Supabase | v14.5+ | Backend, Auth, DB, Functions |
| PostgreSQL | 17 | Banco de dados |
| Deno | (runtime Supabase) | Edge Functions |
| TypeScript | 5+ | Edge Functions |
| Anthropic Claude | Sonnet 4 (20250514) | Geração de planos |
| Chart.js | 4 | Gráficos |
| HTML/CSS/JS | - | Frontend |
| Vercel | - | Hospedagem frontend |

---

## 10. CONTATO E SUPORTE

- **Repositório**: https://github.com/masterCredd/Nutricionista_Sistema
- **Frontend em produção**: https://frontend-rouge-xi-55.vercel.app
- **Supabase Dashboard**: https://supabase.com/dashboard/project/ocyabbrncokgtahaqqkv
- **Projeto**: Nutricionista_Sistema (ref: `ocyabbrncokgtahaqqkv`)
- **Região**: sa-east-1 (São Paulo)

---

*Documentação gerada em 08/07/2026*

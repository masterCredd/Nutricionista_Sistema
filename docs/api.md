# Prompt — API de Agendamento
## Sistema de Agendamento — Versão Demonstração

Você vai criar a API de agendamento. Ela permite que sistemas externos (N8N, agentes de IA) interajam com o sistema via HTTP. Você tem acesso ao Supabase via MCP. A API deve ser criada como **Supabase Edge Functions** em **TypeScript/Deno**.

---

## CONTEXTO DO BANCO DE DADOS

O banco já está criado no Supabase. Tabelas relevantes:

- `agendamentos` — campos: `id`, `agenda_id`, `procedimento_id`, `nome_lead`, `whatsapp_lead`, `data_hora_inicio`, `data_hora_fim`, `status`, `observacoes`, `created_at`
- `agendas` — campos: `id`, `nome`, `cor`, `ativo`
- `agenda_hours` — campos: `agenda_id`, `dia` (enum: domingo, segunda, terca, quarta, quinta, sexta, sabado), `aberto`, `hora_inicio`, `hora_fim`
- `procedimentos` — campos: `id`, `nome`, `duracao_minutos`, `ativo`
- `api_tokens` — campos: `id`, `label`, `token_hash`, `ativo`

**Timezone do banco:** `America/Sao_Paulo`. Sempre usar horário de São Paulo em todos os cálculos.

---

## ESTRUTURA DE PASTAS

```
supabase/
  functions/
    agendamentos/
      index.ts              ← POST (marcar)
    agendamentos-id/
      index.ts              ← PUT (reagendar) e DELETE (cancelar)
    agendamentos-horarios/
      index.ts              ← GET (consultar disponibilidade)
    _shared/
      auth.ts               ← validação de token
      errors.ts             ← respostas de erro padronizadas
      slots.ts              ← lógica de cálculo de slots
```

---

## AUTENTICAÇÃO — `_shared/auth.ts`

Usada em todos os endpoints.

**Lógica:**
1. Extrair token do header `Authorization: Bearer <token>`
2. Gerar hash SHA-256 do token recebido
3. Buscar em `api_tokens` onde `token_hash` = hash gerado
4. Se não encontrar → retornar 401 com `TOKEN_INVALIDO`
5. Verificar se `ativo = true`
6. Se `ativo = false` → retornar 401 com `TOKEN_DESABILITADO`
7. Verificar se `agenda_id` foi informado na requisição
8. Buscar em `agendas` onde `id` = `agenda_id` e `ativo` = true
9. Se não encontrar → retornar 403 com `AGENDA_NAO_ENCONTRADA`
10. Retornar dados da agenda

**Respostas:**

```json
// 401 — Token inválido
{ "sucesso": false, "erro": "TOKEN_INVALIDO", "mensagem": "Token de autenticação inválido ou ausente." }

// 401 — Token desabilitado
{ "sucesso": false, "erro": "TOKEN_DESABILITADO", "mensagem": "Este token foi desabilitado e não pode mais ser utilizado." }

// 403 — Agenda não encontrada
{ "sucesso": false, "erro": "AGENDA_NAO_ENCONTRADA", "mensagem": "A agenda informada não foi encontrada ou está inativa." }
```

---

## LÓGICA DE SLOTS — `_shared/slots.ts`

Função `calcularSlotsDisponiveis(agenda_id, procedimento_id, data)`:

1. Buscar dia da semana da `data` informada
2. Buscar em `agenda_hours` onde `agenda_id` = agenda_id e `dia` = dia da semana
3. Se `aberto = false` → retornar erro 423
4. Buscar em `procedimentos` onde `id` = procedimento_id → obter `duracao_minutos`
5. Gerar todos os slots do dia de `hora_inicio` até `hora_fim` com intervalo de `duracao_minutos`
   - Último slot só é válido se `slot + duracao_minutos <= hora_fim`
6. Buscar agendamentos do dia na agenda onde `status` NOT IN (`cancelado`)
7. Para cada slot verificar conflito: `slot_inicio < agendamento_fim` AND `slot_fim > agendamento_inicio`
8. Se `data` = hoje (São Paulo) → remover slots com horário já passado
9. Retornar apenas slots sem conflito e no futuro

---

## ENDPOINT 1 — Marcar Agendamento

**Arquivo:** `agendamentos/index.ts`
**Método:** `POST`
**Rota:** `/agendamentos`

**Parâmetros (body JSON):**

| Campo | Tipo | Obrigatório |
|---|---|---|
| `agenda_id` | UUID | SIM |
| `procedimento_id` | UUID | SIM |
| `nome_lead` | String | NÃO |
| `whatsapp_lead` | String | NÃO |
| `data` | String YYYY-MM-DD | SIM |
| `hora` | String HH:MM | SIM |
| `observacoes` | String | NÃO |

**Lógica passo a passo:**

1. Validar autenticação via `auth.ts`
2. Validar que `procedimento_id` foi informado → se não, retornar 422
3. Validar formato de `data` e `hora` → se inválido, retornar 422
4. Verificar se `data` é passada → se sim, retornar 422 com `DATA_PASSADA`
5. Verificar se `procedimento_id` existe e `ativo = true` → se não, retornar 404
6. Chamar `calcularSlotsDisponiveis`
7. Verificar se o slot da `hora` está disponível → se não, retornar 409 com 3 sugestões
8. Calcular `data_hora_fim` = `data_hora_inicio` + `duracao_minutos`
9. Inserir na tabela `agendamentos`
10. Fazer JOIN com `procedimentos` para obter `nome` do procedimento
11. Retornar 201 com dados completos incluindo `nome_lead`, `whatsapp_lead`, `procedimento_nome`, `data_hora_inicio`, `data_hora_fim`

**Resposta de sucesso — 201:**

```json
{
  "sucesso": true,
  "mensagem": "Agendamento criado com sucesso.",
  "agendamento": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "agenda_id": "3d94b8e2-1c7a-4f9d-b123-456789abcdef",
    "procedimento_id": "9f8e7d6c-abcd-1234-5678-0123456789ab",
    "procedimento_nome": "Limpeza de Pele",
    "nome_lead": "Maria Silva",
    "whatsapp_lead": "5548999999999",
    "data_hora_inicio": "2025-03-15T14:30:00-03:00",
    "data_hora_fim": "2025-03-15T15:30:00-03:00",
    "status": "agendado"
  }
}
```

**Erros:**

| Código | Erro | Motivo |
|---|---|---|
| `401` | `TOKEN_INVALIDO` | Token ausente ou inválido |
| `401` | `TOKEN_DESABILITADO` | Token desabilitado permanentemente |
| `403` | `AGENDA_NAO_ENCONTRADA` | agenda_id inválido ou inativo |
| `404` | `PROCEDIMENTO_NAO_ENCONTRADO` | procedimento_id não existe ou inativo |
| `409` | `HORARIO_OCUPADO` | Slot indisponível — retornar 3 sugestões |
| `422` | `CAMPO_OBRIGATORIO_AUSENTE` | Campo obrigatório não informado |
| `422` | `FORMATO_INVALIDO` | Formato de data ou hora inválido |
| `422` | `DATA_PASSADA` | Data anterior a hoje |
| `423` | `AGENDA_FECHADA` | Agenda fechada no dia solicitado |
| `500` | `ERRO_INTERNO` | Erro inesperado |

**cURL:**

```bash
curl -X POST https://seu-projeto.supabase.co/functions/v1/agendamentos \
  -H "Authorization: Bearer seu_token_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "agenda_id": "UUID_AGENDA",
    "procedimento_id": "UUID_PROCEDIMENTO",
    "nome_lead": "Maria Silva",
    "whatsapp_lead": "5548999999999",
    "data": "2025-03-15",
    "hora": "14:30"
  }'
```

---

## ENDPOINT 2 — Reagendar Agendamento

**Arquivo:** `agendamentos-id/index.ts` (método PUT)
**Método:** `PUT`
**Rota:** `/agendamentos/:id`

**Parâmetros:**

| Campo | Onde | Obrigatório |
|---|---|---|
| `:id` | URL | SIM |
| `agenda_id` | Body | SIM |
| `data` | Body | SIM |
| `hora` | Body | SIM |

**Lógica passo a passo:**

1. Validar autenticação via `auth.ts`
2. Extrair `:id` da URL
3. Buscar agendamento onde `id` = `:id` → se não encontrar, retornar 404
4. Verificar se `agendamento.agenda_id` = `agenda_id` do body → se diferente, retornar 403
5. Verificar se status != `cancelado` → se cancelado, retornar 422
6. Validar formato de `data` e `hora` → se inválido, retornar 422
7. Verificar se nova `data` é passada → se sim, retornar 422
8. Chamar `calcularSlotsDisponiveis` ignorando o próprio agendamento no cálculo de conflitos
9. Verificar se novo slot está disponível → se não, retornar 409 com 3 sugestões
10. Calcular nova `data_hora_fim`
11. Atualizar agendamento — status volta para `agendado`
12. Fazer JOIN com `procedimentos` para obter `nome`
13. Retornar 200 com dados completos incluindo `nome_lead`, `whatsapp_lead`, `procedimento_nome`, `data_hora_inicio`, `data_hora_fim`

**Resposta de sucesso — 200:**

```json
{
  "sucesso": true,
  "mensagem": "Agendamento reagendado com sucesso.",
  "agendamento": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "agenda_id": "3d94b8e2-1c7a-4f9d-b123-456789abcdef",
    "procedimento_id": "9f8e7d6c-abcd-1234-5678-0123456789ab",
    "procedimento_nome": "Limpeza de Pele",
    "nome_lead": "Maria Silva",
    "whatsapp_lead": "5548999999999",
    "data_hora_inicio": "2025-03-20T10:00:00-03:00",
    "data_hora_fim": "2025-03-20T11:00:00-03:00",
    "status": "agendado"
  }
}
```

**Erros:**

| Código | Erro | Motivo |
|---|---|---|
| `401` | `TOKEN_INVALIDO` | Token ausente ou inválido |
| `401` | `TOKEN_DESABILITADO` | Token desabilitado permanentemente |
| `403` | `AGENDA_NAO_ENCONTRADA` | agenda_id inválido ou inativo |
| `403` | `ACESSO_NEGADO` | Agendamento não pertence à agenda informada |
| `404` | `AGENDAMENTO_NAO_ENCONTRADO` | ID não existe |
| `409` | `HORARIO_OCUPADO` | Novo slot indisponível — retornar 3 sugestões |
| `422` | `CAMPO_OBRIGATORIO_AUSENTE` | Campo obrigatório não informado |
| `422` | `FORMATO_INVALIDO` | Formato de data ou hora inválido |
| `422` | `DATA_PASSADA` | Nova data anterior a hoje |
| `422` | `AGENDAMENTO_CANCELADO` | Não é possível reagendar agendamento cancelado |
| `423` | `AGENDA_FECHADA` | Agenda fechada no novo dia solicitado |
| `500` | `ERRO_INTERNO` | Erro inesperado |

**cURL:**

```bash
curl -X PUT https://seu-projeto.supabase.co/functions/v1/agendamentos/UUID_AGENDAMENTO \
  -H "Authorization: Bearer seu_token_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "agenda_id": "UUID_AGENDA",
    "data": "2025-03-20",
    "hora": "10:00"
  }'
```

---

## ENDPOINT 3 — Cancelar Agendamento

**Arquivo:** `agendamentos-id/index.ts` (método DELETE)
**Método:** `DELETE`
**Rota:** `/agendamentos/:id`

> Nunca deletar o registro — alterar status para `cancelado`.

**Parâmetros:**

| Campo | Onde | Obrigatório |
|---|---|---|
| `:id` | URL | SIM |
| `agenda_id` | Body | SIM |

**Lógica passo a passo:**

1. Validar autenticação via `auth.ts`
2. Buscar agendamento onde `id` = `:id` → se não encontrar, retornar 404
3. Verificar se `agendamento.agenda_id` = `agenda_id` do body → se diferente, retornar 403
4. Verificar se já está cancelado → se sim, retornar 422
5. Atualizar `status = 'cancelado'`
6. Retornar 200

**Resposta de sucesso — 200:**

```json
{
  "sucesso": true,
  "mensagem": "Agendamento cancelado com sucesso.",
  "agendamento": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "status": "cancelado"
  }
}
```

**Erros:**

| Código | Erro | Motivo |
|---|---|---|
| `401` | `TOKEN_INVALIDO` | Token ausente ou inválido |
| `401` | `TOKEN_DESABILITADO` | Token desabilitado permanentemente |
| `403` | `AGENDA_NAO_ENCONTRADA` | agenda_id inválido ou inativo |
| `403` | `ACESSO_NEGADO` | Agendamento não pertence à agenda informada |
| `404` | `AGENDAMENTO_NAO_ENCONTRADO` | ID não existe |
| `422` | `CAMPO_OBRIGATORIO_AUSENTE` | agenda_id ausente |
| `422` | `AGENDAMENTO_JA_CANCELADO` | Já está cancelado |
| `500` | `ERRO_INTERNO` | Erro inesperado |

**cURL:**

```bash
curl -X DELETE https://seu-projeto.supabase.co/functions/v1/agendamentos/UUID_AGENDAMENTO \
  -H "Authorization: Bearer seu_token_aqui" \
  -H "Content-Type: application/json" \
  -d '{ "agenda_id": "UUID_AGENDA" }'
```

---

## ENDPOINT 4 — Consultar Horários Disponíveis

**Arquivo:** `agendamentos-horarios/index.ts`
**Método:** `GET`
**Rota:** `/agendamentos/horarios`

**Parâmetros (query string):**

| Campo | Obrigatório | Descrição |
|---|---|---|
| `agenda_id` | SIM | ID da agenda |
| `procedimento_id` | SIM | ID do procedimento — define duração dos slots |
| `data` | SIM | Data no formato `YYYY-MM-DD` |
| `hora` | NÃO | Hora no formato `HH:MM` — se informada, verifica horário específico |

**Comportamento 1 — Com `data` + `hora`:**

1. Validar autenticação
2. Validar `procedimento_id`, `data` e `hora`
3. Verificar se `data` é passada → retornar 422
4. Chamar `calcularSlotsDisponiveis`
5. Se `hora` está disponível → retornar `disponivel: true`
6. Se não está → retornar `disponivel: false` + 3 slots mais próximos após a hora solicitada

**Resposta — disponível:**
```json
{ "sucesso": true, "disponivel": true, "horario": "2025-03-15T14:30:00-03:00" }
```

**Resposta — ocupado:**
```json
{
  "sucesso": true,
  "disponivel": false,
  "mensagem": "O horário solicitado não está disponível.",
  "sugestoes": [
    "2025-03-15T15:00:00-03:00",
    "2025-03-15T15:30:00-03:00",
    "2025-03-15T16:00:00-03:00"
  ]
}
```

**Comportamento 2 — Só com `data`:**

1. Validar autenticação
2. Validar `procedimento_id` e `data`
3. Verificar se `data` é passada → retornar 422
4. Chamar `calcularSlotsDisponiveis`
5. Retornar todos os slots livres do dia

**Resposta:**
```json
{
  "sucesso": true,
  "data": "2025-03-15",
  "procedimento_id": "9f8e7d6c-abcd-1234-5678-0123456789ab",
  "duracao_minutos": 60,
  "slots_disponiveis": ["08:00", "09:00", "10:00", "14:00", "15:00"]
}
```

**Erros (ambos os casos):**

| Código | Erro | Motivo |
|---|---|---|
| `401` | `TOKEN_INVALIDO` | Token ausente ou inválido |
| `401` | `TOKEN_DESABILITADO` | Token desabilitado permanentemente |
| `403` | `AGENDA_NAO_ENCONTRADA` | agenda_id inválido ou inativo |
| `404` | `PROCEDIMENTO_NAO_ENCONTRADO` | procedimento_id não existe ou inativo |
| `422` | `CAMPO_OBRIGATORIO_AUSENTE` | Campo obrigatório ausente |
| `422` | `FORMATO_INVALIDO` | Formato de data ou hora inválido |
| `422` | `DATA_PASSADA` | Data anterior a hoje |
| `423` | `AGENDA_FECHADA` | Agenda fechada no dia solicitado |
| `500` | `ERRO_INTERNO` | Erro inesperado |

**cURLs:**

```bash
# Com data + hora
curl -X GET "https://seu-projeto.supabase.co/functions/v1/agendamentos/horarios?agenda_id=UUID_AGENDA&procedimento_id=UUID_PROCEDIMENTO&data=2025-03-15&hora=14:30" \
  -H "Authorization: Bearer seu_token_aqui"

# Só com data
curl -X GET "https://seu-projeto.supabase.co/functions/v1/agendamentos/horarios?agenda_id=UUID_AGENDA&procedimento_id=UUID_PROCEDIMENTO&data=2025-03-15" \
  -H "Authorization: Bearer seu_token_aqui"
```

---

## REGRAS GERAIS OBRIGATÓRIAS

1. **Timezone:** todos os cálculos em `America/Sao_Paulo`
2. **Datas passadas:** rejeitar com `DATA_PASSADA`
3. **Slots futuros:** ao consultar hoje, retornar apenas slots a partir do horário atual
4. **Agendamentos cancelados:** slots de agendamentos cancelados são considerados livres
5. **Token:** validar sempre via hash — nunca texto puro. Verificar `ativo = true`
6. **Soft delete:** nunca deletar agendamentos — sempre `status = 'cancelado'`
7. **CORS:** habilitar em todas as Edge Functions
8. **Resposta erro:** sempre `{ "sucesso": false, "erro": "CODIGO", "mensagem": "..." }`
9. **Resposta sucesso:** sempre `{ "sucesso": true, ... }`
10. **Campos de retorno:** `POST` e `PUT` sempre retornar `nome_lead`, `whatsapp_lead`, `procedimento_nome`, `data_hora_inicio`, `data_hora_fim`

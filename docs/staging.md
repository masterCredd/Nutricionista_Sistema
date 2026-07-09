# Ambiente de Staging

Staging espelha a produção para validar migrations e Edge Functions antes do go-live.

## 1. Criar projeto Supabase de staging

- No painel do Supabase, crie um novo projeto (ex.: `nutricionista-staging`).
- Anote o `project-ref` (usado como `SUPABASE_PROJECT_ID` do ambiente `staging`).

## 2. Configurar variáveis

Crie um `.env.staging` local (ignorado pelo git, ver `.gitignore`) baseado em
`.env.staging.example`, com as credenciais do projeto de staging.

## 3. GitHub Environments

Em **Settings → Environments** crie dois ambientes:

- `staging` → secrets: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_ID`, `SUPABASE_DB_PASSWORD`, `SUPABASE_ANON_KEY`, `ALLOWED_ORIGIN`, `RATE_LIMIT_MAX` (valores de staging).
- `production` → secrets correspondentes ao projeto de produção.

Opcional: em `production`, adicione **Required reviewers** para aprovação manual antes do deploy.

## 4. Branch Protection (boa prática)

Em **Settings → Branches**, para `master`/`main`:
- [x] Require a pull request before merging
- [x] Require status checks to pass (`frontend`, `supabase`)
- [x] Require conversation resolution before merge
- [x] Do not allow force pushes

## 5. Fluxo de trabalho

```
feature/* → PR → master
                │
                ├─ CI (lint JS, typecheck Deno, db diff)
                │
                └─ Deploy workflow:
                     deploy-staging  (ambiente staging)
                          │ (sucesso)
                          └─ deploy-prod (ambiente production, com aprovação)
```

## 6. Validação em staging

Após o deploy-staging, rode os testes manuais:
- `node simular-consultas-node.js` (popula dados de teste).
- Teste de login/cadastro no frontend apontando para a URL de staging.
- Teste da function `gerar-plano` autenticada.

Só então aprove o `deploy-prod`.

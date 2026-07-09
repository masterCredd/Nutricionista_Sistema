# AGENTS.md — Guia para agentes de IA e colaboradores

Este arquivo orienta qualquer agente (ou humano) trabalhando neste repositório.

## Stack
- **Frontend:** HTML5 + CSS3 + JavaScript puro (sem framework/bundler). Scripts em `frontend/js/`.
- **Backend:** Supabase Edge Functions (Deno/TypeScript) em `supabase/functions/`.
- **Banco:** PostgreSQL no Supabase; migrations versionadas em `supabase/migrations/` (`NN_nome.sql`).
- **Deploy:** Frontend na Vercel (estático); backend via Supabase CLI.

## Comandos locais
- `npm install` — instala devDeps (ESLint, Prettier).
- `npm run lint` — ESLint no `frontend/js`.
- `npm run format:check` — Prettier check. `npm run format` — aplicar.
- `npm run smoke` — smoke test (requer `.env` com `SUPABASE_URL`, `SUPABASE_ANON_KEY`, opcional `SUPABASE_SERVICE_ROLE_KEY`).
- `deno lint supabase/functions` / `deno check supabase/functions/<fn>/index.ts` — Edge Functions.

## Regras de processo
- **Commits:** seguir [Conventional Commits](https://www.conventionalcommits.org/) em inglês (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `ci:`, `chore:`). Ver `CONTRIBUTING.md`.
- **Branches:** nunca commitar direto em `master`/`main`. Abrir PR; CI (`frontend`, `supabase`) deve passar.
- **Migrations:** SEMPRE criar nova migration numerada (`013_*.sql`); NUNCA editar migrations já aplicadas em staging/prod.
- **Segredos:** nunca commitar `.env`, chaves ou tokens. Usar GitHub Environments (`staging`, `production`).
- **Estilo:** rodar `npm run format` antes de abrir PR.
- **Não comentar código** a menos que solicitado.

## Estrutura importante
- `docs/` — documentação de API, auth, deploy, staging, runbook de chaves.
- `scripts/` — `deploy.ps1`, `backup.ps1/sh`, `test-smoke.mjs`.
- `docs/staging.md` — fluxo de deploy e branch protection.

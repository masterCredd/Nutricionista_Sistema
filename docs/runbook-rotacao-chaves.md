# Runbook — Rotação de Segredos e Credenciais

Este documento descreve o procedimento de emergência e manutenção para credenciais do Supabase.

## 1. Credenciais gerenciadas

| Segredo | Onde vive | Impacto se vazar |
|---|---|---|
| `SUPABASE_ACCESS_TOKEN` (`sbp_...`) | GitHub Secrets / `.env` local | Controle total da conta Supabase (CLI/admin) |
| `SUPABASE_SERVICE_ROLE_KEY` | GitHub Secrets / `.env` local | Bypass total de RLS no banco |
| `SUPABASE_ANON_KEY` (`eyJ...`) | GitHub Secrets (pública por design) | Acesso anon (limitado pelo RLS) |
| `SUPABASE_URL` | Público | — |

> ⚠️ A `SERVICE_ROLE_KEY` e o `ACCESS_TOKEN` NUNCA devem ser colados em chat, issues ou logs.

## 2. Rotação de emergência (credencial comprometida)

Procedimento em ordem — fazer o mais rápido possível:

1. **Revogar imediatamente** no painel do Supabase:
   - `ACCESS_TOKEN`: Account → Access Tokens → revogar o token exposto.
   - `SERVICE_ROLE_KEY`: Project Settings → API → regenerar a `service_role` key.
2. **Atualizar os secrets** na plataforma:
   - GitHub: Settings → Secrets → Actions → atualizar `SUPABASE_ACCESS_TOKEN` e `SUPABASE_SERVICE_ROLE_KEY`.
   - Vercel (frontend): Environment Variables → atualizar `SUPABASE_ANON_KEY` (se aplicável).
3. **Re-deploy** para que as novas chaves entrem em vigor nas Edge Functions:
   - `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<nova>` (ou via workflow `Deploy`).
   - Reexecutar o workflow de Deploy.
4. **Auditar logs** por uso da chave antiga nas últimas 24–72h (Project → Logs → Auth/Database).
5. **Invalidar sessões** se necessário (Auth → revogar tokens, ou forçar re-login em massa).

## 3. Rotação de rotina

- **Acesso de máquina/CI:** rotacionar `ACCESS_TOKEN` a cada 90 dias.
- **Service role:** rotacionar a cada 180 dias ou a cada troca de equipe.
- **Anon key:** só rotacionar se suspeita de abuso (quebra todos os clientes logados).

## 4. Prevenção

- Nunca committar `.env` (já coberto pelo `.gitignore`).
- Usar sempre secrets da plataforma, nunca valores hardcoded.
- CI (`.github/workflows/ci.yml`) bloqueia push com segredos detectados? Adicionar step de scanning se necessário.
- Após qualquer rotação, remover a chave antiga de todos os locais (`.env` local, notas, histórico de chat).

## 5. Checklist pós-rotação

- [ ] Nova chave definida nos GitHub Secrets
- [ ] Nova chave definida nos Vercel Env Vars
- [ ] Deploy/re-secret aplicado
- [ ] Teste de conectividade executado (REST + Auth admin)
- [ ] Logs revisados para uso anômalo
- [ ] Chave antiga removida de todos os locais

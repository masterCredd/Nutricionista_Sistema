# Contribuindo

Obrigado por contribuir com o NutriSystem!

## Fluxo de trabalho
1. Crie uma branch a partir de `master`: `git checkout -b feat/minha-feature`.
2. Faça suas alterações e rode localmente:
   - `npm install`
   - `npm run lint` e `npm run format:check`
   - `npm run smoke` (requer `.env` configurado)
3. Abra um **Pull Request** para `master`.
4. Aguarde a aprovação dos checks de CI (`frontend` e `supabase`).
5. O deploy segue `staging → production` automaticamente após o merge.

## Conventional Commits
Use prefixos em inglês:

| Tipo | Quando |
|---|---|
| `feat:` | nova funcionalidade |
| `fix:` | correção de bug |
| `docs:` | documentação |
| `refactor:` | refatoração sem mudança de comportamento |
| `test:` | testes |
| `ci:` | pipeline/CI |
| `chore:` | tarefas diversas (build, deps) |

Ex.: `feat: adiciona filtro de pacientes por status`.

## Banco de dados
- Adicione **sempre** uma nova migration numerada em `supabase/migrations/` (`013_*.sql`).
- Nunca altere migrations já aplicadas em `staging`/`production`.
- Teste o `db diff` localmente com a CLI do Supabase antes do PR.

## Segurança
- Nunca comite `.env`, chaves ou tokens.
- Use os secrets dos GitHub Environments (`staging`, `production`).
- Siga `docs/runbook-rotacao-chaves.md` para rotação de credenciais.

## Branch protection
O branch `master`/`main` exige PR + checks verdes + resolução de conversas.
Veja `docs/staging.md` para detalhes.

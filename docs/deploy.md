# Guia de Deploy

## Pré-requisitos
- Node.js 18+
- Git + GitHub Desktop
- Conta no Vercel

---

## 1. Deploy das Edge Functions (Supabase)

```bash
supabase link --project-ref ocyabbrncokgtahaqqkv
supabase functions deploy agendamentos
supabase functions deploy agendamentos-id
supabase functions deploy agendamentos-horarios
supabase functions deploy gerar-plano
```

## 2. Variáveis de ambiente no Supabase

```bash
supabase secrets set ANTHROPIC_API_KEY=sua-chave-aqui
```

## 3. Deploy do Frontend (Vercel)

### Pelo GitHub Desktop:
1. Abrir GitHub Desktop → File → Add Local Repository
2. Selecionar a pasta `Nutricionista_Sistema`
3. Fazer commit com mensagem tipo "feat: sistema completo"
4. Clicar em "Publish repository" → criar repositório no GitHub

### No Vercel:
1. Acessar https://vercel.com/new
2. Importar o repositório do GitHub
3. Configurar:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Other
   - **Build Command:** (deixar vazio — é estático)
   - **Output Directory:** `.`
4. Variáveis de ambiente (NÃO necessárias — Supabase é chamado direto do frontend com anon key)
5. Clicar em "Deploy"

### Configurar domínio (opcional):
- Vercel gera URL automática `projeto.vercel.app`
- É possível adicionar domínio personalizado em Settings → Domains

## 4. Notas importantes
- O arquivo `.env` com `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_ACCESS_TOKEN` **nunca** deve ser commitado (.gitignore já bloqueia)
- A chave `ANTHROPIC_API_KEY` está armazenada nos secrets do Supabase, **não** no frontend
- O frontend usa a `SUPABASE_ANON_KEY` (pública) — isso é seguro com RLS
- O RLS garante que cada nutricionista vê apenas seus próprios dados

# Deploy — Lumina Connect

Guia passo a passo para colocar o MVP em produção.

## Visão geral

| Componente | Onde | URL exemplo |
|------------|------|-------------|
| Frontend (Next.js) | [Vercel](https://vercel.com) | `https://app.seudominio.com` |
| API (FastAPI) | [Render](https://render.com) | `https://lumina-api.onrender.com` |
| Banco (PostgreSQL) | Render (managed) | interno |
| Auth | [Firebase](https://console.firebase.google.com) | — |

---

## 1. Firebase Auth

1. Crie um projeto no Firebase Console
2. **Authentication → Sign-in method** → ative **Email/Password**
3. **Project settings → General → Your apps** → adicione app Web
4. Copie as credenciais para o frontend
5. **Project settings → Service accounts → Generate new private key**
6. Use o JSON para preencher as variáveis do backend

---

## 2. Backend + Postgres (Render)

### Opção A — Blueprint (recomendado)

1. Faça push do repo para GitHub
2. No Render: **New → Blueprint** → conecte o repo
3. O arquivo `render.yaml` cria API + Postgres automaticamente
4. Configure as variáveis marcadas como `sync: false`:

| Variável | Exemplo |
|----------|---------|
| `CORS_ORIGINS` | `https://app.seudominio.com` |
| `LANDING_BASE_URL` | `https://app.seudominio.com/p` |
| `FIREBASE_PROJECT_ID` | seu projeto |
| `FIREBASE_CLIENT_EMAIL` | firebase-adminsdk@... |
| `FIREBASE_PRIVATE_KEY` | chave privada (com `\n`) |
| `SMTP_HOST` | `smtp.gmail.com` (opcional) |
| `SMTP_USER` / `SMTP_PASSWORD` | credenciais SMTP |
| `SMTP_FROM` | `noreply@seudominio.com` |
| `LEAD_NOTIFY_EMAILS` | `vendas@empresa.com` (opcional, senão usa e-mails dos usuários) |

5. Após deploy, confira: `https://sua-api.onrender.com/health`

### Opção B — Docker manual

```bash
cd backend
docker build -t lumina-api .
docker run -p 8000:8000 --env-file .env lumina-api
```

O container roda `alembic upgrade head` antes de subir a API.

---

## 3. Frontend (Vercel)

1. Importe o repo no Vercel
2. **Root Directory:** `frontend`
3. Framework: Next.js (detectado automaticamente)
4. Variáveis de ambiente:

| Variável | Valor |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | URL da API Render |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase |

5. Deploy → acesse a URL gerada

---

## 4. Ajustes pós-deploy

### CORS

No backend, `CORS_ORIGINS` deve incluir **exatamente** a URL do frontend (sem barra final):

```
CORS_ORIGINS=https://app.seudominio.com
```

### URLs dos QR codes

Atualize `LANDING_BASE_URL` no backend para a URL pública das landings:

```
LANDING_BASE_URL=https://app.seudominio.com/p
```

Produtos **novos** já nascem com a URL correta. Para produtos existentes criados em dev:

```bash
cd backend && source .venv/bin/activate
LANDING_BASE_URL=https://app.seudominio.com/p python scripts/patch_local_qr_urls.py
```

### Notificações de lead (opcional)

Com SMTP configurado, cada novo lead dispara e-mail para:
- `LEAD_NOTIFY_EMAILS` (se definido), ou
- todos os usuários da empresa no banco

Sem SMTP, o sistema funciona normalmente — só não envia e-mail.

---

## 5. Checklist final

- [ ] `GET /health` retorna `ok`
- [ ] `GET /health/db` retorna `phase2_ready: true`
- [ ] Login/registro Firebase funciona
- [ ] Criar campanha + produto gera QR com URL de produção
- [ ] Landing `/p/{code}` abre e registra scan
- [ ] Formulário de lead salva e (se SMTP ok) envia e-mail
- [ ] Analytics mostra dados reais

---

## Domínio customizado (opcional)

**Frontend:** Vercel → Settings → Domains → adicione `app.seudominio.com`

**Landings:** mesma app Next.js — `/p/{code}` já funciona no mesmo domínio.

**API:** Render → Settings → Custom Domain → `api.seudominio.com`

Atualize `NEXT_PUBLIC_API_URL` e `CORS_ORIGINS` após configurar domínios.

---

## Problemas comuns

### API retorna CORS error

`CORS_ORIGINS` no backend não inclui a URL exata do frontend.

### Login funciona mas API retorna 401

Firebase service account incorreta no backend, ou usuário não fez sync (`POST /auth/sync` no primeiro login).

### QR aponta para localhost

`LANDING_BASE_URL` ainda está em dev. Corrija e regenere URLs (script acima).

### E-mails de lead não chegam

Confira SMTP no Render, porta 587, e `SMTP_FROM` válido. Veja logs da API.

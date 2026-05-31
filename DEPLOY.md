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
7. **Authentication → Settings → Authorized domains** → adicione o domínio do Vercel (veja seção abaixo)

### Projeto Lumina Connect (referência)

| Item | Valor |
|------|--------|
| Firebase `project_id` | `lumina-connect-ed8ca` |
| `authDomain` (público) | `lumina-connect-ed8ca.firebaseapp.com` |
| API Render (exemplo) | `https://lumina-api-g99a.onrender.com` |
| Frontend Vercel | URL `https://seu-app.vercel.app` (copie em Vercel → Domains) |

---

## 1b. Firebase em produção (Vercel + Render) — passo a passo

Use este fluxo quando o app já está no ar no Vercel e a API no Render.

### Render: reativar a API (se necessário)

No plano **free**, o serviço **suspende** após inatividade. No [Render Dashboard](https://dashboard.render.com), abra o serviço `lumina-api` (ou o nome do seu Web Service) e clique em **Resume** / aguarde o deploy. Confirme:

```bash
curl -s https://lumina-api-g99a.onrender.com/health
# {"status":"ok",...}

curl -s https://lumina-api-g99a.onrender.com/auth/status
# firebase_configured deve ser true após configurar Firebase no Render
```

Se `firebase_configured` for `false`, a API ainda está em **auth local** — login Firebase no browser não sincroniza com o banco.

### Passo 1 — Firebase Console

1. [Firebase Console](https://console.firebase.google.com) → projeto **lumina-connect-ed8ca**
2. **Authentication → Sign-in method** → ative **Email/Password**
3. **Authentication → Settings → Authorized domains** → adicione:
   - `localhost` (dev)
   - `lumina-connect-ed8ca.firebaseapp.com` (já vem por padrão)
   - **Domínio exato do Vercel**, ex.: `lumina-connect.vercel.app` (sem `https://`, sem `/`)
   - Domínio customizado, se usar (ex.: `app.seudominio.com`)
4. **Project settings → General → Your apps → Web** → copie os campos para o Vercel (nomes abaixo; **não** commite chaves no Git)
5. **Project settings → Service accounts → Generate new private key** → JSON para o Render (campos `project_id`, `client_email`, `private_key`)

### Passo 2 — Variáveis no Render (API)

Render → seu Web Service → **Environment**:

| Variável | Onde obter | Exemplo / formato |
|----------|------------|-------------------|
| `FIREBASE_PROJECT_ID` | JSON `project_id` | `lumina-connect-ed8ca` |
| `FIREBASE_CLIENT_EMAIL` | JSON `client_email` | `firebase-adminsdk-...@lumina-connect-ed8ca.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | JSON `private_key` | Cole a chave **inteira**; no Render use `\n` literais entre as linhas **ou** o campo multiline da UI |
| `CORS_ORIGINS` | URL do frontend Vercel | `https://seu-app.vercel.app` — **sem barra no final**; vários domínios: separados por vírgula |
| `LANDING_BASE_URL` | Mesmo host do frontend | `https://seu-app.vercel.app/p` |
| `DATABASE_URL` | Blueprint / Postgres Render | preenchido pelo `render.yaml` |

Opcionais: `SMTP_*`, `LEAD_NOTIFY_EMAILS`, `API_PUBLIC_URL`.

Salve → **Manual Deploy** / aguarde redeploy. Valide:

```bash
curl -s https://lumina-api-g99a.onrender.com/auth/status
# {"firebase_configured":true,"local_auth_enabled":false,...}
```

### Passo 3 — Variáveis na Vercel (frontend)

Vercel → projeto → **Settings → Environment Variables** → marque **Production** (e **Preview** se quiser o mesmo comportamento em PRs).

| Variável | Origem (Firebase Web app) |
|----------|-----------------------------|
| `NEXT_PUBLIC_API_URL` | URL pública da API Render |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `apiKey` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain` → `lumina-connect-ed8ca.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `projectId` → `lumina-connect-ed8ca` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `appId` |

**Importante:** variáveis `NEXT_PUBLIC_*` entram no bundle no **build**. Depois de alterar env na Vercel, faça **Redeploy** (Deployments → ⋮ → Redeploy).

**Root Directory** do projeto na Vercel: `frontend` (ver `frontend/vercel.json`).

### Passo 4 — Teste ponta a ponta

1. Abra a URL do Vercel → `/login` — não deve aparecer o aviso de “auth local”
2. Crie conta ou entre com e-mail/senha (Firebase)
3. DevTools → Network: chamadas para `https://lumina-api-g99a.onrender.com/auth/sync` ou `/auth/me` com status **200** (não CORS, não 503)
4. Dashboard carrega perfil/empresa

### Checklist rápido (copiar)

**Firebase Console**

- [ ] Email/Password ativado
- [ ] Domínio Vercel em **Authorized domains**
- [ ] App Web criado; anotou `apiKey`, `authDomain`, `projectId`, `appId`
- [ ] Service account JSON gerado (`project_id`, `client_email`, `private_key`)

**Vercel (5 variáveis `NEXT_PUBLIC_*`)**

- [ ] `NEXT_PUBLIC_API_URL` = `https://lumina-api-g99a.onrender.com` (sem `/` no final)
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`
- [ ] Redeploy após salvar env

**Render (Firebase + CORS + landings)**

- [ ] Serviço API **ativo** (não suspenso)
- [ ] `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- [ ] `CORS_ORIGINS` = URL exata do Vercel
- [ ] `LANDING_BASE_URL` = `https://<vercel>/p`
- [ ] `GET /auth/status` → `firebase_configured: true`

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
| `NEXT_PUBLIC_API_URL` | `https://lumina-api-g99a.onrender.com` (sua URL Render, sem `/` final) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web → `apiKey` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `lumina-connect-ed8ca.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `lumina-connect-ed8ca` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase Web → `appId` |

5. **Redeploy** após definir env (obrigatório para `NEXT_PUBLIC_*`)
6. Acesse a URL gerada → login Firebase

Lista completa e troubleshooting: [§ 1b. Firebase em produção](#1b-firebase-em-produção-vercel--render--passo-a-passo).

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

### Tela de login mostra “Firebase não configurado” no Vercel

Faltam uma ou mais variáveis `NEXT_PUBLIC_FIREBASE_*` na Vercel, ou não houve **redeploy** após configurá-las.

### `auth/unauthorized-domain` no browser

O domínio do Vercel não está em **Firebase → Authentication → Authorized domains**.

### API retorna CORS error

`CORS_ORIGINS` no Render não é **exatamente** a origem do browser (scheme + host, sem path, sem `/` final). Ex.: `https://app.vercel.app`, não `https://app.vercel.app/`.

### Login Firebase ok mas API retorna 503 em `/auth/sync`

`GET /auth/status` com `firebase_configured: false` — configure as 3 variáveis `FIREBASE_*` no Render e redeploy.

### Login funciona mas API retorna 401

Firebase service account incorreta no backend (`FIREBASE_PRIVATE_KEY` mal formatada é comum), ou usuário não sincronizou (`POST /auth/sync` no primeiro cadastro).

### Chamadas da API vão para `localhost:8000` em produção

`NEXT_PUBLIC_API_URL` ausente no build da Vercel → refaça deploy com a variável definida em **Production**.

### QR aponta para localhost

`LANDING_BASE_URL` ainda está em dev. Corrija e regenere URLs (script acima).

### E-mails de lead não chegam

Confira SMTP no Render, porta 587, e `SMTP_FROM` válido. Veja logs da API.

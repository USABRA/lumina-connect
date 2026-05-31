# Alinhamento Render ↔ Vercel — Lumina Connect

Guia **copy-paste** para alinhar a API no Render com o frontend em produção na Vercel. Sem secrets neste arquivo.

## URLs de referência

| Componente | URL |
|------------|-----|
| Frontend (Vercel Production) | https://lumina-connect-eight.vercel.app |
| API (Render) | https://lumina-api-g99a.onrender.com |
| Firebase `project_id` | `lumina-connect-ed8ca` |
| Dashboard Render | https://dashboard.render.com → Web Service **lumina-api** |
| Firebase Console | https://console.firebase.google.com/project/lumina-connect-ed8ca |

Documentação Vercel (já aplicada): [VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md).

---

## 1. Estado atual da API (verificação)

```bash
curl -sS https://lumina-api-g99a.onrender.com/health
curl -sS https://lumina-api-g99a.onrender.com/auth/status
```

**Última verificação (antes de configurar o Render):**

- `/health` → `{"status":"ok","service":"lumina-connect-api"}`
- `/auth/status` → `firebase_configured: false`, `local_auth_enabled: true`

Após configurar Firebase no Render e redeploy, espere:

```json
{"firebase_configured":true,"local_auth_enabled":false,...}
```

---

## 2. Render Dashboard — Environment (copiar)

Render → **lumina-api** → **Environment** → adicione ou edite:

### URLs públicas (cole exatamente)

```text
CORS_ORIGINS=https://lumina-connect-eight.vercel.app
```

```text
LANDING_BASE_URL=https://lumina-connect-eight.vercel.app/p
```

Opcional (documentação / links absolutos na API):

```text
API_PUBLIC_URL=https://lumina-api-g99a.onrender.com
```

### Firebase Admin (service account)

| Variável | Valor no Render |
|----------|-----------------|
| `FIREBASE_PROJECT_ID` | `lumina-connect-ed8ca` |
| `FIREBASE_CLIENT_EMAIL` | Copie de `backend/.env` local (campo `FIREBASE_CLIENT_EMAIL`) |
| `FIREBASE_PRIVATE_KEY` | Copie de `backend/.env` local (campo `FIREBASE_PRIVATE_KEY`) — **não** commite este valor |

**Origem local (recomendado):**

1. Abra `backend/.env` no seu Mac (gerado por `scripts/setup-firebase-env.sh` ou setup manual).
2. Copie os três campos `FIREBASE_*` para o Render **sem alterar** o formato da chave privada.

**Alternativa:** JSON em `backend/.firebase-service-account.json` ou arquivo baixado do Firebase (Downloads). Use os campos `project_id`, `client_email`, `private_key`.

**Formato da chave no Render:**

- Cole a chave **inteira** no campo multiline da UI, **ou**
- Uma linha com `\n` literais entre as linhas (como em `backend/.env.example`).

`DATABASE_URL` vem do Postgres do blueprint (`render.yaml`) — não sobrescreva salvo migração manual.

Salve → aguarde **Redeploy** automático (ou **Manual Deploy**).

---

## 3. Firebase Console — domínio autorizado

1. [Firebase Console](https://console.firebase.google.com/project/lumina-connect-ed8ca/authentication/settings)
2. **Authentication → Settings → Authorized domains**
3. **Add domain** (sem `https://`, sem path):

```text
lumina-connect-eight.vercel.app
```

Mantenha `localhost` para desenvolvimento local.

---

## 4. Render CLI (opcional)

O CLI `render` **não** estava instalado/autenticado neste ambiente. Se você instalar:

```bash
brew install render
render login
```

Defina variáveis (substitua `srv-xxxxx` pelo ID do serviço no dashboard):

```bash
render env set CORS_ORIGINS="https://lumina-connect-eight.vercel.app" --service lumina-api
render env set LANDING_BASE_URL="https://lumina-connect-eight.vercel.app/p" --service lumina-api
render env set FIREBASE_PROJECT_ID="lumina-connect-ed8ca" --service lumina-api
# FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY: cole interativamente ou via dashboard
```

Secrets (`FIREBASE_PRIVATE_KEY`) são mais seguros pelo **Dashboard** ou `render env set` em terminal local (não documentar o valor no Git).

---

## 5. Checklist pós-alinhamento

- [ ] Render: `CORS_ORIGINS` e `LANDING_BASE_URL` (valores acima)
- [ ] Render: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (de `backend/.env`)
- [ ] Firebase: domínio `lumina-connect-eight.vercel.app` em Authorized domains
- [ ] Redeploy da API concluído
- [ ] `curl -sS https://lumina-api-g99a.onrender.com/auth/status` → `firebase_configured: true`
- [ ] Vercel: login em https://lumina-connect-eight.vercel.app/login sem aviso de auth local
- [ ] Network: `POST .../auth/sync` retorna **200**

---

## 6. Se `firebase_configured` continuar `false`

A API em produção **não** lê o `.env` do seu Mac — só variáveis do Render. Causas comuns:

1. As três variáveis `FIREBASE_*` não foram salvas ou o deploy não rodou após salvar.
2. `FIREBASE_PRIVATE_KEY` mal formatada (quebras de linha perdidas).
3. Serviço free **suspenso** — no dashboard, **Resume** e aguarde `/health` ok.

**Ação:** atualize o Environment no Render manualmente (seção 2) e redeploy. Este repositório não pode aplicar secrets remotamente sem CLI autenticada.

---

## 7. Infraestrutura como código

Valores públicos de CORS/landing estão documentados em `render.yaml` (comentário + exemplos). Secrets permanecem `sync: false` no blueprint.

Ver também: [DEPLOY.md](./DEPLOY.md) § 1b.

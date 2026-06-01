# Vercel — Lumina Connect (produção)

Documentação operacional (sem valores de secrets). As variáveis foram aplicadas via **Vercel CLI** (`npx` / `node_modules/.bin/vercel`) na conta `sales-4023`.

## Projeto

| Campo | Valor |
|-------|--------|
| Team / scope | `sales-4023s-projects` |
| Project name | `lumina-connect` |
| Dashboard | https://vercel.com/sales-4023s-projects/lumina-connect |
| **Production URL (alias)** | **https://lumina-connect-eight.vercel.app** |
| Root directory | `frontend/` (deploy a partir de `frontend/`) |

## Variáveis de ambiente (Production)

Todas configuradas no target **Production**:

- `NEXT_PUBLIC_API_URL` → `https://lumina-api-g99a.onrender.com`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` → `lumina-connect-ed8ca.firebaseapp.com`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` → `lumina-connect-ed8ca`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Valores completos: Firebase Console → Project settings → Your apps (Web), ou `frontend/.env.local` local (gitignored).

### Preview

O CLI em modo não interativo pede branch para Preview. **Production está completo.** Para Preview, no dashboard: **Settings → Environment Variables** → duplique as mesmas cinco variáveis em **Preview** (all branches), ou rode localmente:

```bash
cd frontend
npx vercel link --project lumina-connect
# Interativo: vercel env add <NAME> preview
```

## Render (CORS)

Defina no Render (`CORS_ORIGINS` e `LANDING_BASE_URL`):

```text
CORS_ORIGINS=https://lumina-connect-eight.vercel.app
LANDING_BASE_URL=https://lumina-connect-eight.vercel.app/p
```

## Firebase Authorized domains

Adicione em Authentication → Settings → Authorized domains:

```text
lumina-connect-eight.vercel.app
```

## Redeploy produção

```bash
cd frontend
npx vercel link -y --project lumina-connect
npx vercel --prod --yes
```

Último deploy CLI: **READY** (alias `lumina-connect-eight.vercel.app`).

## CLI local

Global `vercel` não estava no PATH; use `npx vercel@latest` ou instale dev: `npm i -D vercel` em `frontend/`.

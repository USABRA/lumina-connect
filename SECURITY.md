# Segurança — Lumina Connect

Checklist pragmático para deploy (Render + Vercel + Firebase + PostgreSQL).

## O que o código já faz (v1)

- **Headers HTTP** (API): `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`; **HSTS** só com `ENVIRONMENT=production`.
- **Rate limit** (memória, por IP): `POST /leads`, `POST /track/{code}`, `POST /meetings/join/{token}/join`, `POST /auth/login`, `POST /auth/register`.
- **Validação Pydantic**: tamanhos máximos, `EmailStr`, URLs externas só `http`/`https` em campos de marca/landing.
- **Uploads**: autenticado, tipos MIME permitidos, assinatura de arquivo, máx. 2 MB, path sem traversal.
- **Platform admin**: apenas e-mails em `PLATFORM_ADMIN_EMAILS`.
- **Erros em rotas públicas** (produção): mensagens genéricas; sem stack trace quando `DEBUG=false`.
- **Frontend**: CSP e headers em `next.config.ts`; tokens JWT em `localStorage` com limpeza no logout.

## Variáveis obrigatórias em produção

| Variável | Onde | Notas |
|----------|------|--------|
| `JWT_SECRET_KEY` | Render | ≥ 32 caracteres aleatórios; rotacionar se vazou |
| `FIREBASE_*` (3) | Render | Service account; nunca no Git |
| `DATABASE_URL` | Render | Só no servidor |
| `ENVIRONMENT` | Render | `production` |
| `DEBUG` | Render | `false` |
| `CORS_ORIGINS` | Render | URL exata do Vercel, sem `/` final |
| `PLATFORM_ADMIN_EMAILS` | Render | Lista mínima de owners |
| `NEXT_PUBLIC_API_URL` | Vercel | URL pública da API apenas |
| `NEXT_PUBLIC_FIREBASE_*` | Vercel | Chaves **públicas** do Firebase (esperado) |

**Nunca** commitar `.env`, `.env.local` ou JSON da service account.

## Rotação de segredos

1. **Firebase**: Console → Service accounts → nova chave → atualizar Render → revogar chave antiga.
2. **JWT_SECRET_KEY**: gerar novo → atualizar Render → todos os usuários em auth local precisam logar de novo.
3. **SMTP / DB**: seguir provedor (Render Postgres, etc.).

## Checklist pré-deploy

- [ ] `ENVIRONMENT=production` e `DEBUG=false` no Render
- [ ] `JWT_SECRET_KEY` forte (não usar valor de dev)
- [ ] `PLATFORM_ADMIN_EMAILS` só com e-mails de confiança
- [ ] `CORS_ORIGINS` = domínio(s) reais do frontend
- [ ] Firebase Authorized domains inclui o domínio Vercel
- [ ] Repositório sem `.env` / chaves privadas
- [ ] HTTPS em API e app (Vercel/Render default)
- [ ] Revisar logs do Render por erros 5xx repetidos (abuso)

## Riscos conhecidos (v1)

| Risco | Mitigação atual | Próximo passo |
|-------|-----------------|---------------|
| JWT em `localStorage` (XSS) | Logout limpa token; CSP no frontend | Cookies `httpOnly` + SameSite |
| Rate limit em memória | OK para 1 instância Render | Redis / edge rate limit multi-instância |
| Uploads servidos como estáticos | Requer auth para upload; URLs públicas | Signed URLs ou proxy autenticado |
| Sem WAF / bot detection | Rate limit básico | Cloudflare ou similar |
| Dependências | Atualizar periodicamente | `pip audit` / `npm audit` no CI |

## Testes de segurança

```bash
cd backend && pytest tests/test_security.py tests/test_platform.py -q
cd frontend && npm run build
```

## Referências

- [DEPLOY.md](./DEPLOY.md) — fluxo Render/Vercel/Firebase
- [backend/.env.example](./backend/.env.example) — variáveis da API

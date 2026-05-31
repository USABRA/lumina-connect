# Protótipo local — Lumina Connect

Guia para rodar o MVP completo na sua máquina, **sem Firebase** e **sem deploy**.

## Pré-requisitos

| Ferramenta | Versão |
|------------|--------|
| Node.js | 20+ |
| Python | 3.9+ |
| PostgreSQL | 16 (Homebrew ou Docker) |

### PostgreSQL no macOS (Homebrew)

```bash
brew install postgresql@16
brew services start postgresql@16
```

## Setup em um comando

Na raiz do projeto:

```bash
bash scripts/setup-prototype.sh
```

Isso faz:

1. Verifica Node, Python e Postgres
2. Cria `backend/.env` e `frontend/.env.local` (se não existirem)
3. Instala dependências Python e Node
4. Roda migrations + seed **Lumina Precision** (sem dados fake)
5. Ajusta URLs dos QR codes para `http://localhost:3000/p/{code}`

## Subir o protótipo

**Terminal 1 — API**

```bash
make backend-dev
```

**Terminal 2 — App**

```bash
make frontend-dev
```

## URLs importantes

| O quê | URL |
|-------|-----|
| Dashboard | http://localhost:3000 |
| Campanhas | http://localhost:3000/campaigns |
| Produtos & QR | http://localhost:3000/products |
| Leads | http://localhost:3000/leads |
| Analytics | http://localhost:3000/analytics |
| API Swagger | http://localhost:8000/docs |
| Saúde do banco | http://localhost:8000/health/db |

## Modo dev (sem login)

Sem credenciais Firebase, o app abre o dashboard direto com um banner azul:

> *Dev mode — Firebase not configured*

A API usa o usuário **Lumina Precision** (`admin@luminaprecision.com`) automaticamente.

## Dados iniciais (seed)

| Item | Valor |
|------|-------|
| Empresa | Lumina Precision |
| Campanha | Lumina Precision |
| Produtos | 0 |
| Scans | 0 |
| Leads | 0 |

Tudo começa zerado — você cria campanhas, produtos e captura leads reais pelo protótipo.

## Fluxo para testar o protótipo

1. Abra o **Dashboard** — métricas em zero
2. Vá em **Products & QR** — crie um produto na campanha Lumina Precision
3. Copie o QR / link da landing e abra em nova aba
4. Preencha o formulário de contato (ative em *Edit landing* se necessário)
5. Veja o lead em **Leads** (agrupado por campanha)
6. Confira o scan em **Analytics**

## Comandos úteis

```bash
make db-setup          # migrations + seed + verify
make db-verify         # confirma tabelas e contagens
make db-reset          # zera e recria seed Lumina Precision
bash scripts/check-prototype.sh   # verifica se tudo está ok
```

## Problemas comuns

### `ERR_CONNECTION_REFUSED` na porta 3000 ou 8000

Os servidores não estão rodando. Execute `make backend-dev` e `make frontend-dev`.

### Postgres não conecta

```bash
brew services start postgresql@16
pg_isready -h localhost
```

### QR aponta para URL errada

```bash
cd backend && source .venv/bin/activate && python scripts/patch_local_qr_urls.py
```

Confirme em `backend/.env`:

```
LANDING_BASE_URL=http://localhost:3000/p
```

### Quero login real depois

Configure Firebase conforme o [README.md](./README.md#authentication-phase-3-) e reinicie backend + frontend.

## Próximo passo (depois do protótipo)

Siga o guia **[DEPLOY.md](./DEPLOY.md)** — ordem recomendada:

1. Firebase Auth (login real)
2. Deploy API + Postgres no Render
3. Deploy frontend na Vercel
4. Ajustar `LANDING_BASE_URL` e CORS
5. (Opcional) SMTP para alertas de lead

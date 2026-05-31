# Lumina Connect MVP

Monorepo for the Lumina Connect platform — QR-powered product engagement, tracking, landing pages, and lead capture.

## Tech Stack

| Layer    | Technology                          | Deployment   |
|----------|-------------------------------------|--------------|
| Frontend | Next.js, React, TypeScript, MUI     | Vercel       |
| Backend  | FastAPI, SQLAlchemy, PostgreSQL     | Railway/Render |
| Auth     | Firebase Auth (Phase 3+)            | Firebase     |

## Project Structure

```
sistema/
├── frontend/          # Next.js app (MUI shell, placeholder routes)
├── backend/           # FastAPI API + SQLAlchemy models
├── docker-compose.yml # Local PostgreSQL
├── .env.example       # Root env reference
└── README.md
```

## Prerequisites

- Node.js 20+
- Python 3.11+ (3.9+ works)
- PostgreSQL — **Docker** (`docker compose up -d`) or **Homebrew** (`brew install postgresql@16 && brew services start postgresql@16`)

## Quick Start

> **Protótipo local (sem Firebase):** veja [PROTOTIPO.md](./PROTOTIPO.md) ou rode `make prototype-setup`.

### 1. Start PostgreSQL

**Option A — Docker**

```bash
docker compose up -d
```

**Option B — Homebrew (macOS)**

```bash
brew install postgresql@16
brew services start postgresql@16
createdb lumina_connect
```

Then create the app user (matches `backend/.env.example`):

```bash
psql -d lumina_connect -c "CREATE USER lumina WITH PASSWORD 'lumina'; GRANT ALL PRIVILEGES ON DATABASE lumina_connect TO lumina; GRANT ALL ON SCHEMA public TO lumina;"
```

### 2. Backend — one-command setup

```bash
make db-setup    # migrations + seed + verify
make backend-dev # start API on :8000
```

Or manually:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
bash scripts/setup_db.sh
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API health check: [http://localhost:8000/health](http://localhost:8000/health)

Phase 2 status: [http://localhost:8000/health/db](http://localhost:8000/health/db) — returns `phase2_ready: true` when all tables exist and seed data is loaded.

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

App: [http://localhost:3000](http://localhost:3000)

## Database (Phase 2) ✅

Six PostgreSQL tables managed via **Alembic migrations**, with **Pydantic schemas**, **seed data**, and **automated verification**.

| Table        | Key fields |
|--------------|------------|
| `companies`  | company_name, subscription_plan (free/starter/pro) |
| `users`      | name, email, company_id, role (admin/company_user) |
| `campaigns`  | company_id, name, start_date, end_date |
| `products`   | campaign_id, unique_code, product_type, qr_url, status |
| `interactions` | product_id, timestamp, city, country, device_type, ip_address |
| `leads`      | product_id, name, email, phone, company |

### Commands

| Command | Description |
|---------|-------------|
| `make db-setup` | Run migrations, seed, and verify |
| `make db-migrate` | Apply Alembic migrations |
| `make db-seed` | Load demo data |
| `make db-verify` | Confirm Phase 2 is ready |
| `make db-reset` | Drop/recreate schema and re-seed |
| `make test` | Run schema unit tests |

### Seed demo data

Creates **Lumina Precision** company and campaign with zero demo metrics (no fake scans or leads).

### Verify Phase 2

```bash
make db-verify
# or
curl http://localhost:8000/health/db
```

## Authentication (Phase 3) ✅

Firebase Auth on the frontend, token verification on the backend, protected dashboard routes.

| Feature | Route / endpoint |
|---------|------------------|
| Login | `/login` |
| Register | `/register` |
| Password reset | `/reset-password` |
| Sync user to DB | `POST /auth/sync` |
| Current user | `GET /auth/me` |
| Auth status | `GET /auth/status` |

**Roles:** `admin` and `company_user` (new registrations get `company_user` + a new company).

### Configure Firebase

1. Create a project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Email/Password** under Authentication → Sign-in method
3. Add a **Web app** and copy credentials to `frontend/.env.local`
4. Generate a **service account key** (Project settings → Service accounts) and set `backend/.env`:

```bash
# frontend/.env.local
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_APP_ID=...

# backend/.env
FIREBASE_PROJECT_ID=your-project
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

5. Run migration 002 if upgrading: `make db-migrate`
6. Restart backend and frontend

Without Firebase credentials, the dashboard stays open in **dev mode** with a banner; auth pages show a setup warning.

## Campaigns & QR (Phase 4) ✅

| Feature | Where |
|---------|--------|
| List / create / edit / delete campaigns | `/campaigns` |
| Generate products with unique codes | `/products` |
| QR code display | Products table → QR icon |
| Public landing page | `/p/{code}` — URL shown on each product after creation |
| Dashboard stats (live) | `/` |

### API endpoints

- `GET/POST /campaigns`, `GET/PUT/DELETE /campaigns/{id}`
- `GET/POST /products`, `GET/PUT/DELETE /products/{id}`
- `GET /products/by-code/{code}` — public landing data
- `GET /products/stats/dashboard` — dashboard metrics

Set `LANDING_BASE_URL=http://localhost:3000/p` in `backend/.env` for local QR links.

## Tracking (Phase 5) ✅

Every visit to a product landing page (`/p/{code}`) fires `POST /track/{code}` and records:

| Field | Source |
|-------|--------|
| Date / time | Server timestamp (UTC) |
| Device | Parsed from `User-Agent` (mobile / tablet / desktop) |
| Location | City + country via IP lookup (local IPs → `Local, DEV`) |
| Product / campaign | Linked via product code |

### Analytics

- **`/analytics`** — overview, top products, geographic distribution, recent scans
- **`GET /analytics/overview`** — aggregated stats
- **`GET /analytics/interactions`** — recent scan events

### Test a scan

Open a product landing URL from **Products & QR** — then check **Analytics** or `GET /analytics/interactions`.

## Landing Pages & Leads (Phase 6) ✅

Each product landing page (`/p/{code}`) supports:

| Feature | Configure in Products → Edit landing |
|---------|--------------------------------------|
| Logo | `logo_url` |
| Headline & description | Custom copy |
| Video | YouTube embed URL |
| PDF download | `pdf_url` |
| Schedule meeting | Calendly / meeting link |
| Contact form | Name, email, phone, company → `leads` table |

### API

- `PUT /products/{id}/landing` — customize landing page (auth)
- `POST /leads` — public lead submission by product code
- `GET /leads` — list leads for your company (auth)

## Analytics Dashboard (Phase 7) ✅

Full analytics at **`/analytics`**:

| Feature | Description |
|---------|-------------|
| Conversion rate | Leads ÷ scans (%) |
| Daily scans | Line chart (14 days) |
| Geographic heat map | City/country bar chart |
| Top campaigns | Scans vs leads comparison |
| Leads by campaign | Bar chart |
| By country / device | Distribution charts |
| Export CSV | `GET /analytics/export` — all scans + leads |

## MVP Roadmap

| Phase | Scope | Status |
|-------|-------|--------|
| **1 — Foundation** | Monorepo, Next.js shell, FastAPI, PostgreSQL, env config | ✅ Done |
| **2 — Database** | Models, Alembic migrations, seed data | ✅ Done |
| **3 — Auth** | Firebase login/register/reset, protected routes | ✅ Done |
| **4 — Campaigns & QR** | CRUD campaigns, product generator, QR URLs | ✅ Done |
| **5 — Tracking** | Interaction logging, geo/device capture | ✅ Done |
| **6 — Landing & Leads** | Public landing pages, lead forms | ✅ Done |
| **7 — Analytics** | Dashboard metrics, charts, exports | ✅ Done |

## Environment Variables

See `.env.example` at the repo root and in `frontend/` and `backend/` for all variables. Never commit real secrets.

## Next Steps

1. **Deploy:** see [DEPLOY.md](./DEPLOY.md) — Vercel + Render + Firebase
2. **Production checklist:** health checks, CORS, `LANDING_BASE_URL`, SMTP for lead alerts
3. Onboard first paying customer 🎯

### Recently added (post-MVP)

| Feature | Where |
|---------|--------|
| QR print sheet | Products → **QR sheet** (print/save PDF) |
| QR PNG download | Products → QR icon → **Download PNG** |
| Product status | Products → Active / Inactive / Archived |
| Lead email alerts | Backend SMTP (optional) |
| Custom landing builder | Products → template **Custom** |

# Adyapan Hospital Queue & Appointment System — Deployment Guide

This guide provides step-by-step production deployment instructions for the **Adyapan Hospital Queue & Appointment SaaS platform**, optimized for high availability, containerization, and cost-effective / free-tier cloud hosting.

---

## Production Architecture

```mermaid
graph TD
    Client["Clients & TV Displays (Browsers / Mobile / Tablets)"]
    
    subgraph Frontend Tier
        Nginx["Nginx Reverse Proxy & Static Host (Port 80/443)"]
        ReactApp["Vite React 18 SPA (Compiled Assets)"]
    end
    
    subgraph Application Tier
        Backend["Express.js API Cluster (Node.js 20 Alpine, Port 5000)"]
        AuthMiddleware["JWT RBAC Guard (7 Master Roles)"]
        PrismaORM["Prisma ORM Engine"]
    end
    
    subgraph Data & Cache Tier
        Postgres[("PostgreSQL 16 (Relational DB)")]
        Redis[("Redis 7 (In-Memory Cache & Queue Broker)")]
    end
    
    Client -->|HTTPS :443| Nginx
    Nginx -->|Static Assets| ReactApp
    Nginx -->|Proxy /api/*| Backend
    Backend --> AuthMiddleware
    AuthMiddleware --> PrismaORM
    PrismaORM --> Postgres
    Backend --> Redis
```

---

## Option 1: 1-Command Docker Compose (Single VPS / Local Server)

Ideal for on-premise hospital servers, DigitalOcean Droplets ($4-$6/mo), Hetzner VPS (€3.50/mo), or AWS Lightsail.

### Prerequisites
- Docker Engine 24.0+ & Docker Compose v2 installed.
- Git installed.

### Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/adyapan-hms.git
   cd adyapan-hms
   ```

2. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   ```
   Generate cryptographically secure secrets:
   ```bash
   node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
   node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
   ```
   Update `.env` with the generated secrets and your preferred database password.

3. **Launch the Complete Stack:**
   ```bash
   docker compose up -d --build
   ```

4. **Verify Container Health:**
   ```bash
   docker compose ps
   ```
   You should see 4 healthy containers running:
   - `hms-postgres` (PostgreSQL 16)
   - `hms-redis` (Redis 7)
   - `hms-backend` (Node.js Express API)
   - `hms-frontend` (Nginx + React SPA)

5. **Access the Application:**
   - **Frontend Web Portal:** `http://<your-server-ip>` or `http://localhost`
   - **Public TV Queue Display:** `http://<your-server-ip>/queue/tv`
   - **Backend API Health Check:** `http://<your-server-ip>/api/health`

---

## Option 2: 100% Free-Tier Serverless / Split Architecture

You can run this full platform completely free using standard modern developer tiers:
- **Database:** Supabase (Free 500MB PostgreSQL) or Neon.tech (Free Serverless Postgres).
- **Backend API:** Render.com (Free Web Service) or Fly.io (Free hobby VMs).
- **Frontend Client:** Vercel or Netlify (Free unlimited static hosting & SSL).

### Step 1: Provision Free PostgreSQL Database (Supabase / Neon)
1. Create a free account at [Supabase](https://supabase.com) or [Neon](https://neon.tech).
2. Create a new database project named `adyapan-hms`.
3. Copy your connection URI (with connection pooling enabled, port 6543 or 5432).
   Example:
   ```text
   postgresql://postgres.[project-id]:[password]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

### Step 2: Deploy Backend API on Render.com
1. Create an account at [Render](https://render.com).
2. Click **New +** $\rightarrow$ **Web Service** $\rightarrow$ Connect your Git repository.
3. Configure the service:
   - **Name:** `adyapan-hms-api`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npx prisma generate && npx prisma db push && node prisma/seed.js`
   - **Start Command:** `npm start`
4. Add Environment Variables in Render Dashboard:
   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `5000` |
   | `DATABASE_URL` | *Your Supabase / Neon connection string* |
   | `JWT_SECRET` | *32-character random string* |
   | `JWT_REFRESH_SECRET` | *32-character random string* |
   | `FRONTEND_URL` | `https://your-frontend-domain.vercel.app` |
   | `SEED_ON_BOOT` | `false` *(after first deployment)* |
5. Click **Deploy Web Service**. Your API will be live at `https://adyapan-hms-api.onrender.com`.

### Step 3: Deploy Frontend on Vercel
1. Create an account at [Vercel](https://vercel.com).
2. Import your Git repository.
3. Configure project settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add Environment Variable:
   - `VITE_API_URL`: `https://adyapan-hms-api.onrender.com/api`
5. Click **Deploy**. Vercel will build and distribute your React app across its global CDN with free automatic SSL.

---

## Option 3: Full-Stack on Railway.app

1. Sign up at [Railway.app](https://railway.app).
2. Click **New Project** $\rightarrow$ **Deploy from GitHub repo**.
3. Add a **PostgreSQL** plugin from the Railway dashboard.
4. Add a **Node.js** service pointing to the `/backend` folder:
   - Set environment variable `DATABASE_URL` referencing the Railway Postgres service (`${{Postgres.DATABASE_URL}}`).
   - Run build command `npm install && npx prisma generate && npx prisma db push`.
   - Start command: `node prisma/seed.js && npm start`.
5. Add a static or Docker service pointing to `/frontend`:
   - Set `VITE_API_URL` to your backend's public domain.
6. Railway automatically connects the private network and provisions SSL certificates.

---

## Seed Accounts & Default Credentials

Upon first boot (or executing `npm run prisma:seed`), the following multi-role accounts are automatically created:

| Role | Email | Default Password | Key Capabilities |
|------|-------|------------------|------------------|
| **Super Admin** | `superadmin@adyapan.com` | `Password123!` | System settings, user creation, all roles |
| **Hospital Admin** | `admin@adyapan.com` | `Password123!` | Executive dashboard, analytics, hospital configuration |
| **Receptionist** | `reception@adyapan.com` | `Password123!` | Patient registration (UHID), token issuing, appointments |
| **Doctor** | `doctor.sharma@adyapan.com` | `Password123!` | Calling desk, clinical workstation, vitals, Rx generator |
| **Nurse Assistant** | `nurse@adyapan.com` | `Password123!` | Triage queue, vital signs entry, alerts monitoring |
| **Pharmacist** | `pharmacist@adyapan.com` | `Password123!` | FEFO inventory, batch dispensing, stock alerts |
| **Accountant** | `accounts@adyapan.com` | `Password123!` | Cashier counter, encounter billing, partial/full payments |

> [!CAUTION]
> In production environments, immediately log in as `superadmin@adyapan.com` and update default passwords for all administrative and clinical staff.

---

## Production Security & Maintenance Checklist

- [x] **CORS Origin Restriction:** Configure `FRONTEND_URL` to only accept traffic from designated frontend domains.
- [x] **JWT Secret Strength:** Ensure `JWT_SECRET` and `JWT_REFRESH_SECRET` are high-entropy keys ($\ge 32$ bytes).
- [x] **Helmet Security Headers:** Content-Security-Policy, HSTS, and X-Content-Type headers enabled on Express backend.
- [x] **Nginx Anti-Clickjacking:** `X-Frame-Options: SAMEORIGIN` and `nosniff` configured in `nginx.conf`.
- [x] **Rate Limiting:** Protect `/api/auth/login` and `/api/auth/refresh` against brute-force attacks via reverse proxy or cloud firewall.
- [x] **Database Backups:** Schedule daily PostgreSQL automated dumps via `pg_dump`:
  ```bash
  docker compose exec postgres pg_dump -U postgres adyapan_hms > backup_$(date +%Y%m%d).sql
  ```
- [x] **Health Check Monitoring:** Monitor `GET /api/health` and frontend `/healthz` using uptime monitoring services (e.g., UptimeRobot, BetterUptime).

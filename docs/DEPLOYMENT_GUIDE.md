# Adyapan Hospital Queue & Appointment System — Deployment Guide

Comprehensive instructions for deploying the **Adyapan Hospital Queue & Appointment System** in production environments.

---

## 1. Production Architecture Overview

```mermaid
graph TD
    Client["Browser Clients & Waiting Area TV Screens"]
    
    subgraph Frontend Tier
        Nginx["Nginx Reverse Proxy & SSL Terminator (Port 443)"]
        SPA["Compiled React 18 SPA (Vite Production Build)"]
    end
    
    subgraph Application Tier
        BackendCluster["Express.js + Socket.IO Engine (Port 5000)"]
        RateLimiter["express-rate-limit Defense"]
        PDFKit["PDFKit Binary Streaming"]
    end
    
    subgraph Persistence Tier
        Postgres[("PostgreSQL 18 Managed DB Cluster (Port 5432)")]
        Locks["pg_advisory_xact_lock Concurrency Guards"]
    end
    
    Client -->|HTTPS :443| Nginx
    Client -->|WSS Socket.IO| Nginx
    Nginx -->|Static Assets| SPA
    Nginx -->|HTTP Proxy /api/*| BackendCluster
    Nginx -->|WebSocket Proxy /socket.io/*| BackendCluster
    BackendCluster --> RateLimiter
    BackendCluster --> PDFKit
    BackendCluster --> Locks
    Locks --> Postgres
```

---

## 2. Production Environment Variables

### Backend Production Environment (`backend/.env`)
```env
# Application Runtime
NODE_ENV=production
PORT=5000

# PostgreSQL Managed Database Connection String (with Connection Pooling)
DATABASE_URL="postgresql://db_user:secure_password@postgres.prod.internal:5432/adyapan_hms?schema=public&connection_limit=20&pool_timeout=10"

# Cryptographic Authentication Secrets (Use 64-char random hex)
JWT_SECRET="7f8b9e6a5d4c3b2a10f9e8d7c6b5a4938271605f4e3d2c1b0a9f8e7d6c5b4a32"
JWT_REFRESH_SECRET="a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0"
JWT_EXPIRES_IN="1d"

# Production Whitelisted CORS Origins (Comma-separated)
FRONTEND_URL="https://hms.adyapan.com,https://display.hms.adyapan.com"

# Notification Provider Credentials (Optional / Live API)
TWILIO_ACCOUNT_SID="ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
TWILIO_AUTH_TOKEN="your_auth_token_here"
TWILIO_PHONE_NUMBER="+1234567890"

SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT=587
SMTP_USER="apikey"
SMTP_PASS="SG.your_api_key_here"
SMTP_FROM="Adyapan Hospital <noreply@hms.adyapan.com>"
```

### Frontend Production Environment (`frontend/.env.production`)
```env
VITE_API_BASE_URL="https://hms.adyapan.com/api"
VITE_SOCKET_URL="https://hms.adyapan.com"
```

---

## 3. Production CORS & Security Configuration

In production, CORS is restricted to validated HTTPS hospital domain names. In `backend/src/app.js`:
```javascript
const allowedOrigins = config.frontendUrl && config.frontendUrl.includes(',')
  ? config.frontendUrl.split(',').map((o) => o.trim())
  : (config.frontendUrl || 'https://hms.adyapan.com');

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
```

### Security Headers (`helmet`)
Production deployments automatically send:
- `Content-Security-Policy`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Strict-Transport-Security` (HSTS)

---

## 4. Socket.IO Production Configuration

The WebSocket real-time engine requires explicit transport and proxy handling:
```javascript
export function initSocketIO(httpServer, allowedOrigins) {
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 30000,
    pingInterval: 10000,
  });
  return io;
}
```

### Nginx WebSocket Proxy Configuration
Ensure your Nginx reverse proxy forwards `Upgrade` headers for WebSocket connections:
```nginx
location /socket.io/ {
    proxy_pass http://127.0.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 86400s;
    proxy_send_timeout 86400s;
}
```

---

## 5. PostgreSQL Migration Deployment Steps

In automated CI/CD deployment pipelines:

1. **Step 1: Install Production Dependencies**:
   ```bash
   npm ci --omit=dev
   ```

2. **Step 2: Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

3. **Step 3: Execute Database Migrations (Zero-Downtime)**:
   ```bash
   npx prisma migrate deploy
   ```
   *Note: Never run `prisma db push` in production. Always use `prisma migrate deploy` to execute verified `.sql` migrations.*

4. **Step 4: Execute Seed (Initial Deployment Only)**:
   ```bash
   node prisma/seed.js
   ```

---

## 6. Docker Deployment (Recommended)

The platform includes a production-tested `docker-compose.yml` supporting 1-command startup:
```bash
# 1. Clone repo
git clone https://github.com/your-org/adyapan-hms.git
cd adyapan-hms

# 2. Configure production .env
cp .env.example .env

# 3. Build & Launch in detached mode
docker compose up -d --build
```
This orchestrates:
- `postgres`: PostgreSQL with persistent volume.
- `redis`: Redis cache for background tasks.
- `backend`: Node.js 20 Alpine with automatic `prisma migrate deploy`.
- `frontend`: Nginx Alpine serving the compiled Vite React build and reverse proxying `/api` and `/socket.io`.

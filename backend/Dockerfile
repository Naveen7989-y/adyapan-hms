# ============================================================
# Adyapan HMS - Backend Dockerfile (Production)
# Multi-stage build with Alpine Linux for lightweight runtime
# ============================================================

# Step 1: Base image
FROM node:20-alpine AS base

WORKDIR /app

# Install OpenSSL (required for Prisma engines on Alpine) and dumb-init
RUN apk add --no-cache openssl libc6-compat dumb-init

# Step 2: Dependencies
FROM base AS dependencies

COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies including Prisma CLI
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Step 3: Production Runtime
FROM base AS runner

ENV NODE_ENV=production
ENV PORT=5000

# Create non-root system user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 hmsapp

WORKDIR /app

# Copy installed dependencies and generated Prisma client
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/prisma ./prisma
COPY package*.json ./
COPY src ./src
COPY docker-entrypoint.sh ./

# Make entrypoint script executable and change ownership to non-root
RUN chmod +x docker-entrypoint.sh && \
    chown -R hmsapp:nodejs /app

USER hmsapp

EXPOSE 5000

ENTRYPOINT ["/usr/bin/dumb-init", "--", "./docker-entrypoint.sh"]
CMD ["node", "src/server.js"]

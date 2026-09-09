# ============================================================
# Adyapan HMS - Frontend Dockerfile (Production)
# Multi-stage build: Vite React build -> Nginx Alpine server
# ============================================================

# Step 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source files
COPY . .

# Support configurable API URL at build time (defaults to relative /api)
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

# Build optimized production bundle
RUN npm run build

# Step 2: Production runtime stage
FROM nginx:1.27-alpine AS runner

# Remove default Nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration with SPA routing and API reverse proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

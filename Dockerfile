# Use Node.js 20 Alpine as base image
FROM node:20-alpine AS base

# Install system dependencies including bash for Bun installation and git for Vocs
RUN apk add --no-cache libc6-compat curl unzip bash git

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

# Set working directory
WORKDIR /app

# Copy package manager files
COPY package.json bun.lock ./

# Install dependencies
FROM base AS deps
RUN bun install --frozen-lockfile

# Build stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NODE_ENV=production

# Build only the Vocs documentation (skip batua:build)
RUN bun run vocs build

# Production stage - use nginx to serve static files
FROM nginx:alpine AS runner

# Copy built Vocs site from docs/dist
COPY --from=builder /app/docs/dist /usr/share/nginx/html

# Copy custom nginx config for SPA routing
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Development stage
FROM base AS dev
WORKDIR /app

# Copy package files and install all dependencies
COPY package.json bun.lock ./
RUN bun install

# Copy source code
COPY . .

# Expose port for Vocs dev server
EXPOSE 5173

# Set environment for development
ENV NODE_ENV=development

# Default to development mode
CMD ["bun", "run", "dev"] 
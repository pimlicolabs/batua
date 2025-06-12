# Docker Setup for Batua Documentation

This repository includes Docker configuration for running the Batua documentation site built with Vocs.

## Overview

The Docker setup provides two main services:
- **Development**: Hot-reloading Vocs development server
- **Production**: Optimized nginx-served static documentation

## Prerequisites

- Docker and Docker Compose installed
- Bun package manager (used in containers)

## Quick Start

### Development Mode

Run the documentation in development mode with hot reloading:

```bash
docker-compose up dev
```

The development server will be available at http://localhost:5173

### Production Mode

Build and serve the optimized documentation:

```bash
docker-compose up docs
```

The production site will be available at http://localhost:80

## Available Services

### `dev` Service
- **Purpose**: Development with hot reloading
- **Port**: 5173
- **Features**: 
  - Live reload on file changes
  - Volume mounting for real-time development
  - Full Bun development environment

### `docs` Service  
- **Purpose**: Production-ready static site
- **Port**: 80
- **Features**:
  - Nginx-served static files
  - Optimized for performance
  - Proper caching headers
  - SPA routing support

## Building Images

Build all images:
```bash
docker-compose build
```

Build specific service:
```bash
docker-compose build dev
docker-compose build docs
```

## Environment Variables

### Development
- `NODE_ENV=development`
- `HOST=0.0.0.0`

### Production  
- `NODE_ENV=production`

## File Structure

```
├── Dockerfile          # Multi-stage build configuration
├── docker-compose.yml  # Service definitions
├── .dockerignore       # Files excluded from build context
└── docs/               # Vocs documentation source
    ├── pages/          # Documentation pages
    └── dist/           # Built output (created during build)
```

## Dockerfile Stages

### `base`
- Node.js 20 Alpine base image
- System dependencies (bash, git, curl, etc.)
- Bun installation

### `deps`
- Dependency installation with frozen lockfile
- Cached layer for faster rebuilds

### `builder`
- Copies source code
- Runs Vocs build process
- Generates static documentation

### `runner` (Production)
- Nginx Alpine base
- Serves static files from build stage
- Optimized nginx configuration

### `dev` (Development)
- Full development environment
- Live reloading capabilities
- Volume mounting support

## Performance Benefits

### Bun Package Manager
- **Faster installs**: Up to 25x faster than npm
- **Better caching**: Improved dependency resolution
- **Native performance**: Written in Zig for speed

### Nginx Production Serving
- **Static file optimization**: Efficient serving of built assets
- **Caching headers**: Proper browser caching
- **Compression**: Built-in gzip support
- **SPA routing**: Fallback to index.html for client-side routing

## Troubleshooting

### Build Issues

**Problem**: Build fails with dependency errors
```bash
# Clear Docker cache and rebuild
docker system prune -f
docker-compose build --no-cache
```

**Problem**: Port conflicts
```bash
# Check what's using the ports
lsof -i :5173  # Development
lsof -i :80    # Production

# Use different ports in docker-compose.yml if needed
```

### Development Issues

**Problem**: Changes not reflecting in development mode
```bash
# Ensure volume mounting is working
docker-compose down
docker-compose up dev
```

**Problem**: Permission issues with volumes
```bash
# On Linux/macOS, ensure proper permissions
chmod -R 755 docs/
```

### Production Issues

**Problem**: 404 errors on page refresh
- The nginx configuration includes SPA routing support
- All routes fallback to index.html for client-side routing

**Problem**: Static assets not loading
- Check nginx logs: `docker-compose logs docs`
- Verify build output: `docker-compose exec docs ls -la /usr/share/nginx/html`

## Advanced Usage

### Custom nginx Configuration

To customize nginx settings, modify the Dockerfile's nginx configuration:

```dockerfile
RUN echo 'server { 
    # Your custom nginx config
}' > /etc/nginx/conf.d/default.conf
```

### Multi-stage Development

For testing production builds locally:

```bash
# Build production image
docker-compose build docs

# Run production container
docker-compose up docs

# Test at http://localhost:80
```

### CI/CD Integration

Example GitHub Actions workflow:

```yaml
- name: Build Docker image
  run: docker-compose build docs

- name: Test production build
  run: |
    docker-compose up -d docs
    # Add your tests here
    docker-compose down
```

## Security Considerations

- Production image runs nginx as non-root user
- No unnecessary packages in production image
- Static files only - no server-side execution
- Proper file permissions and ownership

## Monitoring

### Health Checks

Add health checks to docker-compose.yml:

```yaml
docs:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:80"]
    interval: 30s
    timeout: 10s
    retries: 3
```

### Logs

View service logs:
```bash
docker-compose logs dev    # Development logs
docker-compose logs docs   # Production logs
docker-compose logs -f     # Follow all logs
``` 
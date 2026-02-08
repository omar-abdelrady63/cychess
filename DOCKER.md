# Docker Setup for CyChess

This document explains how to run the CyChess application using Docker.

## Prerequisites

- Docker Desktop installed on your system
- Docker Compose (included with Docker Desktop)

## Project Structure

```
cychess/
├── server/
│   ├── Dockerfile          # Backend container configuration
│   └── .env                # Backend environment variables
├── client/
│   ├── Dockerfile          # Frontend container configuration
│   └── nginx.conf          # Nginx configuration with Security Headers & React Router support
├── docker-compose.yml      # Orchestrates both services
└── .dockerignore          # Files to exclude from Docker builds
```

## Configuration

### Environment Variables

Before running the application, ensure your `server/.env` file contains:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost
PORT=5000
NODE_ENV=production
```

## Running the Application

### Option 1: Using Docker Compose (Recommended)

Build and start both services:

```bash
docker-compose up --build
```

Run in detached mode (background):

```bash
docker-compose up -d --build
```

Stop the services:

```bash
docker-compose down
```

### Option 2: Building Individual Containers

**Backend:**
```bash
cd server
docker build -t cychess-server .
docker run -p 5000:5000 --env-file .env cychess-server
```

**Frontend:**
```bash
cd client
docker build -t cychess-client .
docker run -p 80:80 cychess-client
```

## Accessing the Application

- **Frontend:** http://localhost
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/api/health

## Key Features & Security

### COOP/COEP Headers (Critical for Stockfish)

The `nginx.conf` is configured to serve the following headers:
- `Cross-Origin-Embedder-Policy: require-corp`
- `Cross-Origin-Opener-Policy: same-origin`

These are **required** for the Stockfish chess engine to function, as it uses `SharedArrayBuffer` for multi-threaded performance. Without these headers, the chess engine will fail to load in the browser.

### Docker Optimization

- **Multi-stage Builds**: Both Dockerfiles use multi-stage builds to reduce image size.
- **Dependency Caching**: `npm ci` is used for reliable builds, and layer ordering is optimized to cache `node_modules`.
- **Nginx Compression**: Gzip compression is enabled for text and WASM files to improve load times.
- **Health Checks**: Built-in health checks ensure traffic is only sent to healthy containers.

### Server Dockerfile
- `node:18-alpine` base image
- Production dependencies only (`npm ci --only=production`)
- Runs as non-root user (best practice)

### Client Dockerfile
- Builds Vite app in a node container
- Serves static assets via Nginx
- Custom Nginx config handles React Router (SPA) and proxying

## Troubleshooting

### Stockfish / WASM Errors
If the chess engine fails to load, check the browser console. If you see errors about `SharedArrayBuffer` not being defined, verify that the COOP/COEP headers are being served correctly by checking the Network tab in DevTools.

### Port Conflicts

If port 80 or 5000 is already in use, modify `docker-compose.yml`:

```yaml
ports:
  - "8080:80"  
  - "5001:5000" 
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f server
docker-compose logs -f client
```

### Cleaning Up

Remove containers, networks, and volumes (if any):
```bash
docker-compose down -v
```

Remove all images to reclaim space:
```bash
docker-compose down --rmi all
```

## Development vs Production

This Docker setup is optimized for **production**. 

For development, we recommend running the apps locally (`npm run dev`) to benefit from hot-reloading, or using a separate `docker-compose.dev.yml` that mounts source code volumes.

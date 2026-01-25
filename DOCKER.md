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
│   └── nginx.conf          # Nginx configuration for React Router
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

## WebSocket Support

The Docker setup fully supports WebSockets for real-time chess gameplay:

- Socket.IO connections are proxied through Nginx
- The backend and frontend communicate via a Docker bridge network
- WebSocket upgrade headers are properly configured in `nginx.conf`

## Key Features

### Server Dockerfile
- Uses `node:18-alpine` for minimal image size
- Multi-stage build for optimized dependency caching
- Exposes port 5000
- Production environment configuration

### Client Dockerfile
- **Stage 1:** Builds Vite React app
- **Stage 2:** Serves with `nginx:stable-alpine`
- Includes custom Nginx configuration for:
  - React Router support (404 → index.html)
  - WebSocket proxying
  - API proxying to backend
  - Static asset caching

### Docker Compose
- Orchestrates both services
- Bridge network for inter-container communication
- Health checks for both services
- Automatic restart policies
- Proper dependency management (client depends on server)

## Troubleshooting

### Port Conflicts

If port 80 or 5000 is already in use, modify `docker-compose.yml`:

```yaml
ports:
  - "8080:80"  # Change frontend to port 8080
  - "5001:5000"  # Change backend to port 5001
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f server
docker-compose logs -f client
```

### Rebuilding After Code Changes

```bash
docker-compose up --build
```

### Cleaning Up

Remove containers and networks:
```bash
docker-compose down
```

Remove containers, networks, and volumes:
```bash
docker-compose down -v
```

Remove all images:
```bash
docker-compose down --rmi all
```

## Production Deployment

For production deployment:

1. Update `CLIENT_URL` in server environment to your production domain
2. Configure proper SSL/TLS certificates
3. Use a production MongoDB instance
4. Set strong `JWT_SECRET`
5. Consider using Docker secrets for sensitive data
6. Set up proper logging and monitoring

## Development vs Production

This Docker setup is optimized for production. For development:

- Use `docker-compose.override.yml` for dev-specific settings
- Mount volumes for hot-reloading
- Use development environment variables

Example `docker-compose.override.yml`:

```yaml
version: '3.8'

services:
  server:
    volumes:
      - ./server:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    command: npm run dev

  client:
    volumes:
      - ./client:/app
      - /app/node_modules
    command: npm run dev
```

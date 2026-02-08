# Multi-stage build for optimized caching
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy application code
COPY . .

# Set environment to production
ENV NODE_ENV=production

# Expose the port the app runs on
EXPOSE 5000

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:5000/api/health || exit 1

# Add labels for identification
LABEL maintainer="CyChess Team"
LABEL description="CyChess Node.js Backend with Express, Socket.IO, and MongoDB"
LABEL version="1.0"

# Start the application
CMD ["node", "server.js"]

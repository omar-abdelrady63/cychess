# Multi-stage build for optimized caching
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Set environment to production
ENV NODE_ENV=production

# Expose the port the app runs on
EXPOSE 5000

# Start the application
CMD ["node", "server.js"]

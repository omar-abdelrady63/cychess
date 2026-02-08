FROM node:18-alpine AS base

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

ENV NODE_ENV=production

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:5000/api/health || exit 1

LABEL maintainer="CyChess Team"
LABEL description="CyChess Node.js Backend with Express, Socket.IO, and MongoDB"
LABEL version="1.0"

CMD ["node", "server.js"]

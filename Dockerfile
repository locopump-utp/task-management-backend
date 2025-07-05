# Use Node.js 22.16.0 as base image
FROM node:22.16.0-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && ln -sf python3 /usr/bin/python

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Install development dependencies for development mode
RUN npm install --save-dev typescript ts-node ts-node-dev @types/node

# Copy application code
COPY . .

# Create uploads directory for file uploads
RUN mkdir -p uploads

# Expose port
EXPOSE 4002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4002/health || exit 1

# Default command for development
CMD ["npm", "run", "dev"]

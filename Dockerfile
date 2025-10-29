# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (needed for vite import in server code)
RUN npm ci

# Copy built application from builder (includes both backend and frontend)
COPY --from=builder /app/dist ./dist

# Expose port 80
EXPOSE 80

# Start the application
CMD ["node", "dist/index.js"]

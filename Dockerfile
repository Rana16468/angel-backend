# Stage 1: Build Stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for build)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
RUN npm run build

# Stage 2: Production Stage
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built artifacts from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Create necessary directories for local temporary storage (Multer)
RUN mkdir -p src/public/temp

# Set environment variable (can be overridden during docker run)
ENV NODE_ENV=production
ENV PORT=5000

# Expose the application port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]

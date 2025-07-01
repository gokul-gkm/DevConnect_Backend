FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --only=production

COPY --from=builder /app/dist ./dist

RUN ln -s /app/dist /app/@

EXPOSE 8000

CMD ["node", "-r", "module-alias/register", "dist/app.js"]














# the base image
# FROM node:24-slim as builder

# # Set the working directory in the container
# WORKDIR /usr/src/app

# # Copy package.json and package-lock.json
# COPY package*.json ./

# # Install project dependencies
# RUN npm install

# # Copy the project files into the container
# COPY . .

# # Build TypeScript code
# RUN npm run 

# # Production stage
# FROM node:20-slim

# WORKDIR /usr/src/app

# # Copy package files
# COPY package*.json ./

# # Install only production dependencies
# RUN npm ci --only=production

# # Copy built files from builder stage
# COPY --from=builder /usr/src/app/dist ./dist

# # Create a non-root user
# RUN addgroup -S appgroup && adduser -S appuser -G appgroup
# RUN chown -R appuser:appgroup /usr/src/app
# USER appuser

# # Set environment variables
# ENV NODE_ENV=production
# ENV PORT=8000

# # Expose port
# EXPOSE 8000

# # Start the application
# CMD ["npm", "start"]


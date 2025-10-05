# Simple single-stage build for Crumb PWA
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for server)
RUN npm install --include=dev

# Copy all source code
COPY . .

# Always build fresh frontend (remove old dist first to ensure clean build)
RUN rm -rf dist && npx vite build

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 5554

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); const port = process.env.PORT || 5554; const options = { host: 'localhost', port: port, path: '/health', timeout: 2000 }; const req = http.request(options, (res) => { if (res.statusCode === 200) process.exit(0); else process.exit(1); }); req.on('error', () => process.exit(1)); req.end();"

# Start the application
CMD ["node", "server/index.js"]
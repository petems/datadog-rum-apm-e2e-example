FROM node:22.18.0-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S datablog-ui -u 1001

# Change ownership of the app directory
RUN chown -R datablog-ui:nodejs /app

USER datablog-ui

EXPOSE 3000

CMD ["npm", "start"]
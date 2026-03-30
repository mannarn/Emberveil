FROM node:20-alpine

WORKDIR /app

# Copy package files first (layer caching)
COPY package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy source
COPY server.js ./

# Fly.io will inject PORT via env — default 8080
EXPOSE 8080

CMD ["node", "server.js"]

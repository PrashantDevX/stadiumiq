# ---------------------------------------------------------------------------
# StadiumIQ — container image for Google Cloud Run.
# Cloud Run injects the PORT env var and provides Application Default
# Credentials, so Firestore works with no key file in production.
# ---------------------------------------------------------------------------
FROM node:20-slim

ENV NODE_ENV=production
WORKDIR /app

# Install production dependencies first for better layer caching.
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source.
COPY src ./src
COPY public ./public

# Cloud Run sets PORT (default 8080); the server reads it via config.
EXPOSE 8080

CMD ["node", "src/server.js"]

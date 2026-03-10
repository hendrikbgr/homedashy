# Install dependencies only when needed
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate migrations before build
RUN npx drizzle-kit generate

RUN npm run build

# Production image, copy all the files and run next
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV DB_PATH=/app/data/sqlite.db

# In Docker, we often need to run as root initially to fix permissions 
# on host-mounted volumes, then drop to the nextjs user.
# For simplicity and to ensure the DB can be written, we'll ensure 
# the data directory is handled correctly.

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create data directory
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

COPY --from=builder /app/public ./public
RUN mkdir .next && chown nextjs:nodejs .next

# Standalone build artifacts
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Copy migrations for auto-init
COPY --from=builder --chown=nextjs:nodejs /app/src/db/migrations ./migrations

# If the host-mounted volume is owned by root, nextjs won't be able to write.
# Sometimes it's safer to not switch user if the user can't control host permissions.
# However, let's keep it for security and hope the logging helps.
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# server.js is created by next build from the standalone output
CMD ["node", "server.js"]

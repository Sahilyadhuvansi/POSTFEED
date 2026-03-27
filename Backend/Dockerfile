# ─── PRODUCTION DOCKERFILE ─────────────────────────────────────────────────────
# Multi-stage build for minimal image size and maximum security.
# ──────────────────────────────────────────────────────────────────────────────

FROM node:24-alpine AS base

# Stage 1: Dependencies installer
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Stage 2: Final Production Runner
FROM base AS runner
WORKDIR /app

# Non-Root Security (Best Practice)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
USER nodejs

# Copy pre-installed dependencies from stage 1
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment Configuration
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "src/server.js"]

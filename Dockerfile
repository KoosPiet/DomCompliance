# syntax=docker/dockerfile:1
# =============================================================================
# LabourMate — multi-stage production image (Next.js standalone output)
# =============================================================================

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# --- Dependencies (cached) ---------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json* ./
# Skip lifecycle scripts here (the Prisma schema isn't copied yet); the client
# is generated explicitly in the builder stage.
RUN npm ci --ignore-scripts

# --- Build -------------------------------------------------------------------
FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
# Secrets are not needed to build; skip env validation.
ENV SKIP_ENV_VALIDATION=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# --- Runtime -----------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]

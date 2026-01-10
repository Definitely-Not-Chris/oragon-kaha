FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
# Set working directory
WORKDIR /app
# Copy root package.json and lockfile
COPY package.json turbo.json pnpm-lock.yaml ./

# Copy packages
COPY packages ./packages

# Copy app source
COPY apps/server ./apps/server

# Install dependencies (frozen-lockfile for consistency)
RUN pnpm install --frozen-lockfile

# Generate Prisma Client (must happen before build)
WORKDIR /app/packages/database
# If you have a specific script to generate, run it. 
# Usually `pnpm db:generate`. Assuming standard prisma generate here.
RUN npx prisma generate

# Build the server
WORKDIR /app/apps/server
RUN pnpm build

# --- Production Image ---
FROM base AS runner
WORKDIR /app

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy necessary files from builder
# We need node_modules. Ideally we prune, but for simplicity we copy.
# A better approach is using 'turbo prune' but that requires turbo CLI knowledge.
# We'll copy the built artifacts and the necessary production deps.

# Copy everything for now to robustly handle monorepo symlinks
COPY --from=builder /app .

WORKDIR /app/apps/server

USER nestjs

EXPOSE 3000

CMD ["node", "dist/main"]

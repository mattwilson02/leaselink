FROM node:20-slim AS build

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root workspace files for npm ci
COPY package.json package-lock.json turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install all deps using workspace resolution
RUN npm ci --workspace=apps/api --workspace=packages/shared --include-workspace-root

# Copy and build shared package first (API depends on @leaselink/shared)
COPY packages/shared ./packages/shared
RUN cd packages/shared && npm run build

# Generate Prisma client
COPY apps/api/prisma ./apps/api/prisma
RUN cd apps/api && npx prisma generate

# Copy API source and build
COPY apps/api ./apps/api
RUN cd apps/api && npm run build

# Production stage
FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

RUN npm ci --workspace=apps/api --workspace=packages/shared --include-workspace-root --omit=dev

COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3333

CMD ["node", "apps/api/dist/src/infra/main.js"]

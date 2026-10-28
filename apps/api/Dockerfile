# Build context is the repo root:  docker build -f apps/api/Dockerfile .
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/content/package.json packages/content/
RUN npm ci --omit=dev --workspace @silo/api --workspace @silo/content --include-workspace-root

FROM node:22-alpine AS content
WORKDIR /app/packages/content
COPY packages/content ./
# Parse the lesson .txt files into data/weeks.json
RUN node scripts/build.mjs

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json ./
COPY --from=deps /app/node_modules node_modules
COPY --from=content /app/packages/content packages/content
COPY apps/api apps/api
USER node
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=5 CMD wget -qO- http://127.0.0.1:4000/api/health || exit 1
# The seed is idempotent (upserts lessons only), so it is safe on every start.
CMD ["sh", "-c", "npm run seed -w @silo/api && npm run start -w @silo/api"]

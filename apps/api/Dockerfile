# Construye desde la raíz del monorepo: docker build -f apps/api/Dockerfile .
FROM node:22-slim AS build
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile --filter @armario/api... \
 && pnpm --filter @armario/shared build \
 && pnpm --filter @armario/api build \
 && pnpm deploy --filter @armario/api --prod --legacy /out

FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /out .
EXPOSE 4000
CMD ["node", "dist/server.js"]

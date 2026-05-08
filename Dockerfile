FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY scripts/install-rollup-native.sh ./scripts/install-rollup-native.sh
RUN npm ci && sh ./scripts/install-rollup-native.sh

COPY . .
RUN npm run build && npm prune --omit=dev

FROM oven/bun:1.3.11-slim AS runtime

WORKDIR /app

ENV PORT=3000
ENV DATABASE_URL=/app/persist/library-of-netheril.sqlite
ENV CORS_ORIGIN=*

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/data ./data
COPY --from=build /app/drizzle ./drizzle

RUN mkdir -p /app/persist

VOLUME ["/app/persist"]
EXPOSE 3000

CMD ["bun", "dist/server/src/server/index.js"]

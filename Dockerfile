# DeclineKit, self-hosted. See SELF_HOSTING.md.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_OUTPUT=standalone NEXT_TELEMETRY_DISABLED=1
RUN npx next build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
# The migration runner and its driver, for `docker compose run --rm app node scripts/migrate.mjs`.
COPY --from=build /app/db ./db
COPY --from=build /app/scripts/migrate.mjs ./scripts/migrate.mjs
COPY --from=deps /app/node_modules/postgres ./node_modules/postgres
USER app
EXPOSE 3000
CMD ["sh", "-c", "node scripts/migrate.mjs && node server.js"]

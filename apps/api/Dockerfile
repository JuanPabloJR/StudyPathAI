FROM node:20-alpine AS base
WORKDIR /app

# ─── Instalar dependencias ─────────────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ─── Build ─────────────────────────────────────────────────────────────────────
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ─── Producción ────────────────────────────────────────────────────────────────
FROM base AS production
ENV NODE_ENV=production

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY package.json ./

EXPOSE 3001

# Ejecutar migraciones y arrancar el servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
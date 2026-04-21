ARG CADDY_IMAGE=caddy:2.10-alpine
ARG NODE_IMAGE=node:20-alpine

FROM ${NODE_IMAGE} AS builder

WORKDIR /app/apps/web

COPY apps/web/package.json apps/web/package-lock.json ./
RUN npm ci

COPY apps/web ./
RUN npm run build

FROM ${CADDY_IMAGE}

WORKDIR /srv

COPY apps/web/Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /app/apps/web/dist /srv

EXPOSE 3000

FROM caddy:2.10-alpine

WORKDIR /srv

COPY apps/web/Caddyfile /etc/caddy/Caddyfile
COPY apps/web/dist /srv

EXPOSE 3000

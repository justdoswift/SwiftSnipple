FROM node:20-alpine AS build

WORKDIR /app
COPY apps/web/package.json apps/web/package-lock.json ./
RUN echo "[web build] installing npm dependencies" && \
    npm ci

COPY apps/web ./
RUN echo "[web build] creating production bundle" && \
    npm run build

EXPOSE 3000

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]

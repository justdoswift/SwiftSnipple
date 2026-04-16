FROM golang:1.24.4-alpine AS builder

ARG GOPROXY=https://proxy.golang.org,direct
ARG GOSUMDB=sum.golang.org

ENV GOPROXY=${GOPROXY}
ENV GOSUMDB=${GOSUMDB}

WORKDIR /app

COPY apps/api/go.mod ./apps/api/go.mod
WORKDIR /app/apps/api
RUN echo "[api build] downloading Go module dependencies" && \
    go mod download

COPY apps/api ./ 
RUN echo "[api build] compiling API server binary" && \
    go build -o /out/server ./cmd/server && \
    echo "[api build] compiling migration binary" && \
    go build -o /out/migrate ./cmd/migrate

FROM alpine:3.21

WORKDIR /app
RUN echo "[api build] installing runtime certificates" && \
    apk add --no-cache ca-certificates

COPY --from=builder /out/server /app/server
COPY --from=builder /out/migrate /app/migrate

EXPOSE 8080

CMD ["/app/server"]

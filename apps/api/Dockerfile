FROM golang:1.24.4-alpine AS builder

WORKDIR /app

COPY apps/api/go.mod ./apps/api/go.mod
WORKDIR /app/apps/api
RUN go mod download

COPY apps/api ./ 
RUN go build -o /out/server ./cmd/server && \
    go build -o /out/migrate ./cmd/migrate

FROM alpine:3.21

WORKDIR /app
RUN apk add --no-cache ca-certificates

COPY --from=builder /out/server /app/server
COPY --from=builder /out/migrate /app/migrate

EXPOSE 8080

CMD ["/app/server"]

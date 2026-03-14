# Build stage
FROM golang:1.23-alpine AS builder
RUN apk add --no-cache git ca-certificates
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-s -w" \
    -o /api cmd/api/main.go

# Runtime stage (~20MB)
FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata
RUN adduser -D -g '' appuser
COPY --from=builder /api /usr/local/bin/api
COPY migrations /migrations
USER appuser
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["api"]

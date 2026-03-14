.PHONY: dev build test lint migrate-up migrate-down docker-build docker-run

# Development
dev:
	go run cmd/api/main.go

# Build
build:
	CGO_ENABLED=0 go build -ldflags="-s -w" -o bin/api cmd/api/main.go

# Test
test:
	go test -v -race -coverprofile=coverage.out ./...

test-short:
	go test -short ./...

# Lint
lint:
	golangci-lint run ./...

# Migrations
migrate-up:
	migrate -path migrations -database "$(DATABASE_URL)" up

migrate-down:
	migrate -path migrations -database "$(DATABASE_URL)" down 1

migrate-create:
	migrate create -ext sql -dir migrations -seq $(name)

# Docker
docker-build:
	docker build -t art-haven-api .

docker-run:
	docker-compose up -d

# Deps
deps:
	go mod download
	go mod tidy

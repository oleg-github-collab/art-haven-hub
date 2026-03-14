# Розгортання та Операції — Продакшн-гайд

## Зміст

1. [Чек-лист перед випуском](#чек-лист)
2. [Інфраструктура](#інфраструктура)
3. [Nginx конфігурація](#nginx)
4. [SSL/TLS](#ssl)
5. [PostgreSQL продакшн](#postgresql)
6. [Резервне копіювання](#бекапи)
7. [Моніторинг стек](#моніторинг)
8. [Alerting](#alerting)
9. [Логування](#логування)
10. [Безпека](#безпека)
11. [CDN та статика](#cdn)
12. [CI/CD Pipeline](#cicd)

---

## Чек-лист

### Перед першим деплоєм

- [ ] SSL сертифікати налаштовані (Let's Encrypt / Cloudflare)
- [ ] CORS origins обмежені конкретними доменами
- [ ] JWT_SECRET згенеровано криптографічно (`openssl rand -hex 64`)
- [ ] DATABASE_URL використовує SSL (`?sslmode=require`)
- [ ] Rate limiting ввімкнено
- [ ] Health check endpoints працюють
- [ ] Міграції бази даних виконані
- [ ] Бекапи налаштовані та протестовані
- [ ] Моніторинг та алерти налаштовані
- [ ] Error tracking (Sentry) підключено
- [ ] Логи агрегуються централізовано
- [ ] Security headers налаштовані
- [ ] OWASP Top 10 перевірено

### Frontend

- [ ] `VITE_API_URL` вказує на продакшн API
- [ ] Build оптимізований (`npm run build`)
- [ ] Статика подається через CDN
- [ ] Service Worker для offline (опціонально)
- [ ] Meta tags та OG tags для SEO
- [ ] robots.txt та sitemap.xml

---

## Інфраструктура

### Мінімальна продакшн-конфігурація

```
┌─────────────────────────────────────────────────┐
│                  Cloudflare CDN                 │
│              (DNS + DDoS + Cache)               │
└────────────────────┬────────────────────────────┘
                     │
         ┌───────────┼───────────┐
         │                       │
   ┌─────▼─────┐          ┌─────▼──────┐
   │  Frontend  │          │   API LB   │
   │  (Static)  │          │  (Nginx)   │
   │  Vercel /  │          └─────┬──────┘
   │  Netlify   │                │
   └────────────┘       ┌───────┼───────┐
                        │               │
                  ┌─────▼─────┐  ┌─────▼─────┐
                  │  API #1   │  │  API #2   │
                  └─────┬─────┘  └─────┬─────┘
                        │               │
                  ┌─────▼───────────────▼─────┐
                  │      PostgreSQL 16         │
                  │   Primary + Replica        │
                  └────────────────────────────┘
```

### Рекомендовані хостинг-провайдери

| Сервіс | Використання | Ціна |
|---|---|---|
| **Hetzner** | VPS для API | від €4/міс |
| **DigitalOcean** | Managed DB, App Platform | від $12/міс |
| **Fly.io** | Elixir/Go deploy | від $0 (free tier) |
| **Railway** | Full-stack deploy | від $5/міс |
| **Vercel** | Frontend hosting | від $0 |
| **Cloudflare** | CDN + DNS + DDoS | від $0 |
| **AWS** | Enterprise | Pay-as-you-go |

---

## Nginx

```nginx
# /etc/nginx/sites-available/mystetstvo-api

upstream api_backend {
    least_conn;
    server 127.0.0.1:8080 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:8081 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

server {
    listen 80;
    server_name api.mystetstvo.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.mystetstvo.com;

    # SSL
    ssl_certificate /etc/letsencrypt/live/api.mystetstvo.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.mystetstvo.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;
    add_header Content-Security-Policy "default-src 'self'" always;

    # Limits
    client_max_body_size 50M;
    client_body_timeout 30s;
    client_header_timeout 10s;

    # Gzip
    gzip on;
    gzip_types application/json text/plain;
    gzip_min_length 256;

    # API proxy
    location /api/ {
        proxy_pass http://api_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Request-ID $request_id;

        proxy_connect_timeout 5s;
        proxy_read_timeout 30s;
        proxy_send_timeout 10s;

        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }

    # WebSocket (для Elixir Phoenix Channels)
    location /socket {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }

    # Health check (не логувати)
    location /health {
        proxy_pass http://api_backend;
        access_log off;
    }
}
```

---

## PostgreSQL продакшн

### Оптимізація postgresql.conf

```ini
# Connection
max_connections = 200
superuser_reserved_connections = 3

# Memory
shared_buffers = 4GB              # 25% RAM
effective_cache_size = 12GB       # 75% RAM
work_mem = 64MB
maintenance_work_mem = 1GB

# WAL
wal_level = replica
max_wal_senders = 5
wal_keep_size = 1GB

# Checkpoints
checkpoint_completion_target = 0.9
max_wal_size = 4GB
min_wal_size = 1GB

# Planner
random_page_cost = 1.1            # SSD
effective_io_concurrency = 200    # SSD

# Logging
log_min_duration_statement = 500  # логувати запити > 500ms
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
log_temp_files = 0
```

---

## Бекапи

```bash
#!/bin/bash
# scripts/backup.sh

set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgres"
S3_BUCKET="s3://mystetstvo-backups/postgres"
RETENTION_DAYS=30

# Створити дамп
pg_dump "$DATABASE_URL" \
  --format=custom \
  --compress=9 \
  --file="${BACKUP_DIR}/mystetstvo_${TIMESTAMP}.dump"

# Завантажити в S3
aws s3 cp "${BACKUP_DIR}/mystetstvo_${TIMESTAMP}.dump" \
  "${S3_BUCKET}/mystetstvo_${TIMESTAMP}.dump" \
  --storage-class STANDARD_IA

# Видалити старі локальні бекапи
find "$BACKUP_DIR" -name "*.dump" -mtime +${RETENTION_DAYS} -delete

# Видалити старі S3 бекапи
aws s3 ls "${S3_BUCKET}/" | while read -r line; do
  file_date=$(echo "$line" | awk '{print $1}')
  if [[ $(date -d "$file_date" +%s) -lt $(date -d "-${RETENTION_DAYS} days" +%s) ]]; then
    file_name=$(echo "$line" | awk '{print $4}')
    aws s3 rm "${S3_BUCKET}/${file_name}"
  fi
done

echo "✅ Backup completed: mystetstvo_${TIMESTAMP}.dump"
```

### Crontab

```cron
# Щоденний бекап о 3:00
0 3 * * * /opt/mystetstvo/scripts/backup.sh >> /var/log/backup.log 2>&1

# WAL архівування кожну годину
0 * * * * /opt/mystetstvo/scripts/wal-archive.sh >> /var/log/wal-archive.log 2>&1
```

---

## Моніторинг

### Prometheus + Grafana стек

```yaml
# docker-compose.monitoring.yml
version: "3.9"
services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    volumes:
      - grafana_data:/var/lib/grafana
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
    ports:
      - "3000:3000"
    restart: unless-stopped

  node-exporter:
    image: prom/node-exporter:latest
    restart: unless-stopped

  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:latest
    environment:
      DATA_SOURCE_NAME: ${DATABASE_URL}
    restart: unless-stopped

volumes:
  prometheus_data:
  grafana_data:
```

### Ключові метрики для дашборду

| Метрика | Поріг Warning | Поріг Critical |
|---|---|---|
| HTTP error rate (5xx) | > 1% | > 5% |
| Response latency P95 | > 500ms | > 2s |
| CPU usage | > 70% | > 90% |
| Memory usage | > 75% | > 90% |
| DB connections | > 80% pool | > 95% pool |
| Disk usage | > 75% | > 90% |
| Request rate drop | > 50% drop | > 80% drop |

---

## Безпека

### Security checklist

- [ ] Всі секрети в env vars, не в коді
- [ ] HTTPS only з HSTS
- [ ] SQL injection protection (параметризовані запити)
- [ ] XSS protection (Content-Security-Policy)
- [ ] CSRF protection
- [ ] Rate limiting на auth endpoints (5/хв)
- [ ] Input validation на всіх endpoints
- [ ] File upload validation (тип, розмір)
- [ ] Паролі хешовані (bcrypt, cost ≥ 12)
- [ ] JWT з коротким TTL (15 хв access, 30 днів refresh)
- [ ] Ролі в окремій таблиці (не на user record!)
- [ ] Dependency audit (`npm audit`, `go mod verify`)
- [ ] Docker image scan (Trivy)

---

## CDN та статика

### Cloudflare Configuration

```
Page Rules:
  *.mystetstvo.com/assets/* → Cache Level: Cache Everything, Edge TTL: 1 month
  api.mystetstvo.com/* → Cache Level: Bypass

Firewall Rules:
  Block requests from known bad ASNs
  Challenge requests > 100/min per IP

Security:
  SSL: Full (Strict)
  Min TLS: 1.2
  Always Use HTTPS: On
  HSTS: On (max-age=31536000, includeSubDomains)
```

---

## CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: "--prod"

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build & Push Docker
        run: |
          docker build -t ghcr.io/${{ github.repository }}/api:${{ github.sha }} .
          docker push ghcr.io/${{ github.repository }}/api:${{ github.sha }}
      - name: Deploy to K8s
        run: |
          kubectl set image deployment/mystetstvo-api \
            api=ghcr.io/${{ github.repository }}/api:${{ github.sha }} \
            --record
          kubectl rollout status deployment/mystetstvo-api --timeout=300s
```

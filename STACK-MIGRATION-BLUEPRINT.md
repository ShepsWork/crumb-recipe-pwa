# STACK-MIGRATION-BLUEPRINT.md

Hybrid plan + implementation guide to split your growing monorepo into independent app repos, centralize infrastructure, and automate build → ship → run with Docker images published to GHCR and pulled by an infra repository. Written to be “agent-ready” for VS Code Agents: clear tasks, folder scaffolds, copy-pasteable manifests, and reasoning notes so the agent doesn’t go rogue.

---

## 0) Scope and Principles

Scope: Split apps currently in `modern-server-stack` into individual repositories; create a single “infra” repository to orchestrate runtime concerns (reverse proxy, TLS, networks, DB, monitoring, backups), with per-app CI/CD pipelines that build containers and publish them to GitHub Container Registry (GHCR), then deploy by pulling images in the infra repo.

Guiding principles:
- Single responsibility per repo (apps independent; infra shared).
- Immutable deployments (always deploy images, never build in production).
- Declarative automation (CI/CD builds, versioned IaC, reproducible `.env.example`).
- Security by default (principle of least privilege, secrets in GitHub Environments, non-root images).
- Observability first (structured logs, health checks, uptime probes, basic dashboards).
- Agent safety rails (explicit tasks, naming rules, idempotent scripts).

---

## 1) Target Repo Topology

Create these top-level repos under your GitHub account (names can be adjusted to taste):

- `modern-server-infra` (central orchestration)
- `app-5k-tracker-pwa`
- `app-clan-map`
- `app-crumb-recipe-pwa`
- `app-coc-discord-bot`
- `app-w5xy-qsl-card-creator`
- (Optional) `lib-shared-utils` (shared code/components published as a package)

Each app repo ships its **own container** to GHCR. The infra repo references those images in `docker-compose.yml` (or Swarm/K8s later).

Name and tag conventions:
- Image tag pattern: `ghcr.io/<owner>/<repo>:{sha|tag|semver}`
- Default deploy tag: `:main` or `:latest` for head, and `:vX.Y.Z` for releases
- Service names match repo slugs, e.g., `app-5k-tracker-pwa` → service `fivek`

---

## 2) Migration Strategy and Tasks

### 2.1 High-Level Phases

Phase A — Prepare and Plan
- Enumerate apps, ports, domains/subdomains.
- Decide secrets layout (GitHub Environments and repo secrets).
- Define GHCR naming and retention policy.

Phase B — Extract Repos (non-destructive)
- For each app, git-filter history into its own repo to preserve blame/logs.
- Establish Dockerfile per app; add `.env.example`.
- Add CI workflow to build/push image to GHCR.

Phase C — Build Infra Repo
- Create `modern-server-infra` with Compose, Traefik, networks, volumes, DB, monitoring.
- Wire services by image reference, not build context.
- Add `deploy.sh` and `rollback.sh` runbooks.

Phase D — Cutover
- Freeze monorepo main branch.
- Verify app images build and run locally.
- Bring up infra repo using GHCR images.
- Smoke test routes, health, logs.
- Unfreeze and iterate.

### 2.2 Detailed Tasks per App (repeatable playbook)

Task A: Extract App History into New Repo
- Use `git filter-repo` (preferred) or `git subtree split` to preserve history for the app directory.
- Result: new standalone repo with app code, minimal top-level.

Task B: Add Containerization
- Create `Dockerfile` with minimal base, non-root user, healthcheck, and proper `CMD`.
- Provide `docker-compose.dev.yml` for local dev with hot reload (optional).

Task C: Configuration Hygiene
- Add `.env.example` with documented vars.
- Move secrets to GitHub → Settings → Secrets and variables.
- Add `README.md` with run/dev/build instructions.

Task D: CI/CD Pipeline
- Add GitHub Actions workflow: on push to `main` (and releases), build/push GHCR image.
- Optional: SemVer release workflow using tags.

Task E: Observability Hooks
- Liveness/Readiness endpoints.
- Structured JSON logs (or minimal log format).

---

## 3) Infra Repo Structure (`modern-server-infra`)

Directory tree (Compose-first approach):

```
modern-server-infra/
├─ compose/
│  ├─ docker-compose.yml
│  ├─ docker-compose.override.example.yml
│  ├─ traefik/
│  │  ├─ traefik.yml
│  │  └─ dynamic/
│  │     └─ middleware.yml
│  ├─ networks/
│  │  └─ README.md
│  ├─ volumes/
│  │  └─ README.md
│  └─ env/
│     └─ .env.example
├─ db/
│  ├─ postgres/   (data volume mountpoint)
│  └─ backups/    (backup scripts/cron output)
├─ monitoring/
│  ├─ prometheus.yml
│  └─ grafana/
│     └─ provisioning/
│        ├─ dashboards/
│        └─ datasources/
├─ scripts/
│  ├─ deploy.sh
│  ├─ rollback.sh
│  ├─ backup_db.sh
│  └─ restore_db.sh
├─ security/
│  ├─ fail2ban/ (optional)
│  └─ audit.md
└─ README.md
```

Key choices:
- **Traefik** as reverse proxy with Let’s Encrypt and per-service labels.
- **Dedicated external network**: `edge` (proxy) and `backend` (service mesh).
- **Images referenced from GHCR**, never built here.
- **One `.env` loaded by compose** to centralize host-level configs.

---

## 4) Reference Manifests

### 4.1 Traefik Static Config (`compose/traefik/traefik.yml`)
```yaml
entryPoints:
  web:
    address: ":80"
  websecure:
    address: ":443"

providers:
  docker:
    exposedByDefault: false

certificatesResolvers:
  letsencrypt:
    acme:
      email: ${LETSENCRYPT_EMAIL}
      storage: /letsencrypt/acme.json
      httpChallenge:
        entryPoint: web
```

### 4.2 Traefik Dynamic Middleware (`compose/traefik/dynamic/middleware.yml`)
```yaml
http:
  middlewares:
    compress:
      compress: {}
    security-headers:
      headers:
        frameDeny: true
        contentTypeNosniff: true
        referrerPolicy: no-referrer
        stsSeconds: 31536000
        stsIncludeSubdomains: true
        stsPreload: true
```

### 4.3 Infra Compose (`compose/docker-compose.yml`)
```yaml
version: "3.9"

networks:
  edge:
    external: false
  backend:
    external: false

volumes:
  traefik_letsencrypt:
  pgdata:
  grafana_data:

services:
  traefik:
    image: traefik:v3.0
    container_name: traefik
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik_letsencrypt:/letsencrypt
      - ./traefik/traefik.yml:/traefik.yml:ro
      - ./traefik/dynamic:/dynamic:ro
    environment:
      - LETSENCRYPT_EMAIL=${LETSENCRYPT_EMAIL}
    labels:
      - "traefik.enable=true"
    networks:
      - edge
      - backend
    restart: unless-stopped

  postgres:
    image: postgres:16
    container_name: postgres
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - backend
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  grafana:
    image: grafana/grafana:11.2.0
    container_name: grafana
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
    environment:
      - GF_SECURITY_ADMIN_USER=${GRAFANA_USER}
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASS}
    networks:
      - edge
      - backend
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.grafana.rule=Host(`${GRAFANA_HOST}`)"
      - "traefik.http.routers.grafana.entrypoints=websecure"
      - "traefik.http.routers.grafana.tls.certresolver=letsencrypt"
      - "traefik.http.middlewares.shared-compress.chain.middlewares=compress@file,security-headers@file"
      - "traefik.http.routers.grafana.middlewares=shared-compress"
    restart: unless-stopped

  fivek:
    image: ghcr.io/${OWNER}/app-5k-tracker-pwa:${APP_5K_TAG}
    container_name: fivek
    environment:
      - NODE_ENV=production
      - BASE_URL=${FIVEK_BASE_URL}
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - backend
      - edge
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.fivek.rule=Host(`${FIVEK_HOST}`)"
      - "traefik.http.routers.fivek.entrypoints=websecure"
      - "traefik.http.routers.fivek.tls.certresolver=letsencrypt"
      - "traefik.http.routers.fivek.middlewares=shared-compress"
    restart: unless-stopped

  clanmap:
    image: ghcr.io/${OWNER}/app-clan-map:${CLANMAP_TAG}
    container_name: clanmap
    environment:
      - NODE_ENV=production
    networks:
      - backend
      - edge
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.clanmap.rule=Host(`${CLANMAP_HOST}`)"
      - "traefik.http.routers.clanmap.entrypoints=websecure"
      - "traefik.http.routers.clanmap.tls.certresolver=letsencrypt"
      - "traefik.http.routers.clanmap.middlewares=shared-compress"
    restart: unless-stopped
```

### 4.4 Infra `.env.example` (`compose/env/.env.example`)
```
OWNER=yancmo1

# TLS/Proxy
LETSENCRYPT_EMAIL=you@example.com

# Hosts (DNS must point to this server)
FIVEK_HOST=fivek.example.com
CLANMAP_HOST=clanmap.example.com
GRAFANA_HOST=grafana.example.com

# App image tags (override for pinning)
APP_5K_TAG=latest
CLANMAP_TAG=latest

# Postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change-me
POSTGRES_DB=appdb
DATABASE_URL=postgresql://postgres:change-me@postgres:5432/appdb

# Grafana
GRAFANA_USER=admin
GRAFANA_PASS=change-me
```

---

## 5) App Repo Templates

### 5.1 Standard App Repo Layout
```
app-xyz/
├─ src/...
├─ public/...
├─ Dockerfile
├─ .dockerignore
├─ .env.example
├─ README.md
└─ .github/
   └─ workflows/
      └─ build-push.yml
```

### 5.2 Sample Dockerfile (Node → Static Serve)
```dockerfile
# Builder
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev=false
COPY . .
RUN npm run build

# Runtime (static)
FROM nginx:1.27-alpine
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/dist /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
USER app
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1:8080/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
```

Minimal `nginx.conf` for port 8080:
```
server {
  listen 8080;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;
  location / {
    try_files $uri /index.html;
  }
  access_log /var/log/nginx/access.log;
  error_log /var/log/nginx/error.log warn;
}
```

### 5.3 GitHub Actions to Build/Push GHCR (`.github/workflows/build-push.yml`)
```yaml
name: build-and-push
on:
  push:
    branches: [ "main" ]
  release:
    types: [published]

jobs:
  docker:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
      id-token: write
    steps:
      - uses: actions/checkout@v4

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata (tags, labels)
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/${{ github.repository }}
          tags: |
            type=ref,event=branch
            type=sha
            type=semver,pattern={{version}}

      - name: Build and Push
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
```

---

## 6) Preserving History When Splitting

Use `git filter-repo` (install via pip) from the old monorepo:

1) Clone fresh:
```
git clone --no-local --no-hardlinks git@github.com:yancmo1/modern-server-stack.git temp-split
cd temp-split
```

2) Filter a single app (example: `apps/5k-tracker-pwa`):
```
git filter-repo --path apps/5k-tracker-pwa --to-subdirectory-filter .
```

3) Create new repo and push:
```
git remote remove origin
git remote add origin git@github.com:yancmo1/app-5k-tracker-pwa.git
git push -u origin main
```

Repeat per app. Clean up top-level files to match the app template. Confirm `git log` shows original contributors.

Alternative: `git subtree split --prefix=apps/5k-tracker-pwa -b split-5k` then push the branch to a new repo.

---

## 7) Secrets and Environments

- Put runtime secrets into **infra** `.env` (or better, host env + docker secrets).
- Put build-time secrets into **GitHub Actions** (repo → Settings → Secrets and variables).
- For production deployments, use **GitHub Environments** with required reviewers to prevent accidental pushes to prod.
- Ensure images run non-root; avoid mounting docker socket except for Traefik read-only.

Secrets checklist:
- Postgres: `POSTGRES_PASSWORD`
- App keys: JWT secret, API keys
- External APIs: Discord bot tokens, Google credentials
- TLS email (ACME): `LETSENCRYPT_EMAIL`

---

## 8) Deployment Runbooks (Infra Repo)

### 8.1 `scripts/deploy.sh` (idempotent pull + up)
```
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

export $(grep -v '^#' compose/env/.env | xargs -d '\n')

docker compose -f compose/docker-compose.yml pull
docker compose -f compose/docker-compose.yml up -d
docker compose -f compose/docker-compose.yml ps
```

### 8.2 `scripts/rollback.sh` (pin prior tags)
- Maintain a simple `deploy.lock` with image:tag pins.
- To rollback: edit tags to prior known-good, run `deploy.sh`.

### 8.3 DB Backups
`scripts/backup_db.sh`:
```
#!/usr/bin/env bash
set -euo pipefail
STAMP=$(date +%F-%H%M%S)
docker exec -i postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" | gzip > "db/backups/${STAMP}.sql.gz"
```

`scripts/restore_db.sh`:
```
#!/usr/bin/env bash
set -euo pipefail
FILE="$1"
gunzip -c "$FILE" | docker exec -i postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```

Schedule via cron/systemd timers on the host.

---

## 9) Health, Observability, and Alerts

Minimum signals:
- Liveness/Readiness endpoints (`/healthz`).
- Traefik dashboard (secured network or basic auth middleware).
- Grafana with a few panels:
  - Container CPU/Memory (cAdvisor/Node exporter optional)
  - HTTP 4xx/5xx by service (via Traefik metrics)
  - Postgres connections and slow queries
- Uptime monitoring:
  - Add a simple external uptime service or your own curl checker to hit each route.
- Logging:
  - JSON logs where possible; at minimum consistent timestamp+level.

---

## 10) Agent Guardrails and Conventions

To keep VS Code Agents on track:
- Repos MUST include `.env.example` with inline docs.
- Repos MUST define `npm run build` and `npm run start` (or equivalent) so workflows stay uniform.
- CI pipelines MUST never deploy directly to servers; they only publish images. Deployment is pulled from infra.
- Compose service names MUST match repo slugs for clarity.
- Traefik labels MUST be declared in the infra repo only.
- Never store real `.env` in Git; use host or GitHub Environments.
- Changes to database schema MUST be accompanied by a migration script and applied on deploy (e.g., Prisma, Alembic, Flyway).

---

## 11) Cutover Checklist

Pre-Cut:
- DNS set for `*.example.com` to server IP.
- GHCR images exist for each app (`:latest` tag).
- Infra repo boots locally with sample `.env`.

Cut:
- Stop old monorepo stack.
- `docker system prune -f` (optional) to clean.
- Start `modern-server-infra` → `deploy.sh`.
- Validate: Traefik routes resolve, TLS ok, app UIs load.
- Validate: DB connectivity and data.
- Validate logs have no errors (first 10 minutes).

Post-Cut:
- Tag release in each app repo (`vX.Y.Z`).
- Pin tags in infra `.env` to release versions (optional).
- Create issues for remaining TODOs.

---

## 12) Roadmap (Next 2–6 Weeks)

Week 1:
- Extract `app-5k-tracker-pwa` and `app-coc-discord-bot`.
- Stand up `modern-server-infra` with Traefik, Postgres, Grafana.
- Publish first GHCR images, deploy via infra compose.

Week 2:
- Extract `app-clan-map`, `app-crumb-recipe-pwa`.
- Add DB backup automation.
- Add liveness endpoints across apps.

Week 3:
- Create `lib-shared-utils` (if duplication observed).
- Add release tagging workflow (semver) to all apps.
- Harden images (non-root, minimal base, SBOMs via `docker sbom`).

Week 4:
- Document on-call runbook: restart, rollback, restore DB.
- Add alerting (Grafana alerting or external service).
- Evaluate Swarm or K8s trajectory (optional).

Weeks 5–6:
- Normalize all repos to same structure and pipeline.
- Consider staging environment on same host with different hostnames or ports.
- Prepare quality gates: unit tests minimum, lint, type-check in CI.

---

## 13) Risk Register and Mitigations

- Image drift: Pin image tag versions in infra `.env`. Schedule monthly base image refresh.
- Secret leakage: Only use GH Secrets; scan with `gitleaks` pre-commit.
- Single host SPOF: Backups + restore runbook; evaluate second host later.
- DNS/ACME failures: Verify port 80/443 open, Traefik challenge passes; fallback to DNS challenge if needed.
- Database bottleneck: Monitor connections; add pgbouncer if necessary.

---

## 14) Quick Commands (Operator Cheatsheet)

Build & push (per app, locally):
```
docker build -t ghcr.io/<owner>/<repo>:dev .
echo $GITHUB_TOKEN | docker login ghcr.io -u <owner> --password-stdin
docker push ghcr.io/<owner>/<repo>:dev
```

Infra up:
```
cd modern-server-infra/compose
cp env/.env.example env/.env  # edit values
docker compose pull
docker compose up -d
docker compose ps
```

Inspect logs:
```
docker compose logs -f traefik
docker compose logs -f fivek
docker compose logs -f postgres
```

Rollback (pin previous tags in `.env`), then:
```
./scripts/deploy.sh
```

---

## 15) Acceptance Criteria

- Each app builds and publishes an image to GHCR on push to `main`.
- Infra repo pulls images (no local app builds) and runs healthy services behind Traefik with TLS.
- Basic monitoring accessible at `${GRAFANA_HOST}` with initial dashboards.
- DB backups are runnable on demand and documented.
- Clear runbooks exist for deploy, rollback, backup/restore.

---

## 16) Appendix: Minimal Policies (Copy into each repo’s README)

- Code must compile and lint clean in CI.
- `.env.example` must reflect all required vars with comments.
- Docker images must run as non-root where possible.
- Expose only the internal port; Traefik terminates TLS at the edge.
- Provide `/healthz` endpoint or equivalent for liveness.
- Don’t commit `.env`, secrets, or local data; `.gitignore` must block them.
- Tag releases with semver; infra prefers pinned release tags in production.

---

End of blueprint. Proceed by creating `modern-server-infra` first, then extract and onboard `app-5k-tracker-pwa` to validate the flow before scaling to remaining apps.
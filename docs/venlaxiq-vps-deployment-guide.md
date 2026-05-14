# VenlaxIQ VPS Deployment Guide (Hostinger / Self-Hosted)

> Deploy the entire VenlaxIQ stack — API, web app, admin panel, all infrastructure services — on a single VPS using Docker Compose and Caddy.
>
> **Version:** Phase 3 Complete · **Date:** May 2026 · **Audience:** Beginner Friendly

---

## Table of Contents

1. [Choose Your VPS Plan](#1-choose-your-vps-plan)
2. [Create Accounts](#2-create-accounts)
3. [Initial Server Setup](#3-initial-server-setup)
4. [Install Docker](#4-install-docker)
5. [Configure DNS](#5-configure-dns)
6. [Clone the Repository](#6-clone-the-repository)
7. [Configure Environment Variables](#7-configure-environment-variables)
8. [Create the Apps Compose File](#8-create-the-apps-compose-file)
9. [Build and Start All Services](#9-build-and-start-all-services)
10. [Run Database Migrations](#10-run-database-migrations)
11. [Create Your First Admin Account](#11-create-your-first-admin-account)
12. [Set Up Stripe Webhooks](#12-set-up-stripe-webhooks)
13. [Build the Mobile App](#13-build-the-mobile-app-expo-eas)
14. [Seed Content](#14-seed-content)
15. [Monitoring Dashboard](#15-monitoring-dashboard)
16. [Maintenance & Updates](#16-maintenance--updates)
17. [Final Checklist](#final-checklist)
18. [Cost Summary](#cost-summary)

---

## 1. Choose Your VPS Plan

Go to **hostinger.com → VPS Hosting**. All plans below run Ubuntu 22.04 LTS.

| Plan | vCPU | RAM | Storage | Price | Recommended For |
|------|------|-----|---------|-------|-----------------|
| **KVM 2** | 2 | 8 GB | 100 GB NVMe | ~$12/mo | Development / staging |
| **KVM 4** | 4 | 16 GB | 200 GB NVMe | ~$23/mo | **Production (recommended)** |
| **KVM 8** | 8 | 32 GB | 400 GB NVMe | ~$44/mo | High traffic / all observability services |

> **Minimum for production:** KVM 4 (16 GB RAM). The full stack runs TimescaleDB, Valkey, Meilisearch, MinIO, ClickHouse, PostHog, Grafana, Sentry, Metabase, Prometheus, Unleash, Caddy, plus the API, web, and admin apps.

When ordering:
- **OS:** Ubuntu 22.04 LTS
- **Region:** Closest to your users
- **Enable backups:** Yes (adds ~20% to cost — worth it)

Save your **VPS IP address** from the Hostinger control panel. You'll need it throughout this guide.

---

## 2. Create Accounts

You still need these external services (only for features, not for hosting):

| Service | What It's For | URL |
|---------|--------------|-----|
| **Stripe** | Subscription payments | [stripe.com](https://stripe.com) |
| **Expo** | Mobile app builds | [expo.dev](https://expo.dev) |
| **Anthropic** | AI features (Claude) | [console.anthropic.com](https://console.anthropic.com) |
| **HuggingFace** | Sentiment analysis | [huggingface.co](https://huggingface.co) |
| **NewsAPI** | News feed for AI insights | [newsapi.org](https://newsapi.org) |

> **Push notifications only:**
> - Apple Developer Program — $99/year (iOS push)
> - Firebase — free (Android push)

---

## 3. Initial Server Setup

Open the Hostinger control panel → **VPS** → click your server → **Terminal** (or use any SSH client).

**Step 1 — Log in as root**

```bash
ssh root@YOUR_VPS_IP
```

**Step 2 — Create a non-root user**

```bash
adduser deploy
usermod -aG sudo deploy
```

When prompted, set a strong password and press Enter through the other prompts.

**Step 3 — Copy your SSH key to the new user** *(run this on your local machine, not the server)*

```bash
ssh-copy-id deploy@YOUR_VPS_IP
```

**Step 4 — Harden SSH** *(back on the server)*

```bash
nano /etc/ssh/sshd_config
```

Find and change these lines:
```
PermitRootLogin no
PasswordAuthentication no
```

Save with `Ctrl+O`, `Enter`, `Ctrl+X`. Then restart SSH:

```bash
systemctl restart sshd
```

**Step 5 — Set up firewall**

```bash
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable
```

From now on, SSH as the `deploy` user:

```bash
ssh deploy@YOUR_VPS_IP
```

**Step 6 — Update the system**

```bash
sudo apt update && sudo apt upgrade -y
```

---

## 4. Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com | sudo sh

# Add deploy user to docker group (no sudo needed for docker commands)
sudo usermod -aG docker deploy

# Log out and back in for the group change to take effect
exit
ssh deploy@YOUR_VPS_IP

# Verify
docker --version
docker compose version
```

---

## 5. Configure DNS

In your domain registrar (wherever `venlaxiq.com` is managed), add these **A records** pointing to your VPS IP:

| Hostname | Type | Value |
|----------|------|-------|
| `api` | A | `YOUR_VPS_IP` |
| `app` | A | `YOUR_VPS_IP` |
| `admin` | A | `YOUR_VPS_IP` |

> DNS changes take 5–30 minutes to propagate. You can test with `nslookup api.venlaxiq.com` — once it returns your VPS IP, you're ready to proceed.

Caddy (included in the stack) automatically obtains and renews SSL certificates for all three domains. No manual certificate setup needed.

---

## 6. Clone the Repository

```bash
# Install git if not present
sudo apt install -y git

# Clone to /opt/venlaxiq
sudo git clone https://github.com/YOUR_ORG/venlaxiq.git /opt/venlaxiq
sudo chown -R deploy:deploy /opt/venlaxiq

cd /opt/venlaxiq
```

> Replace `YOUR_ORG/venlaxiq` with your actual GitHub repository path.

---

## 7. Configure Environment Variables

```bash
cd /opt/venlaxiq/infrastructure
cp .env.example .env
nano .env
```

Fill in every value. Use the table below:

**Generate secrets with:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Run that command once per secret field — each must be unique.

```env
# ── Database ──────────────────────────────────────────────────────────────────
POSTGRES_USER=venlaxiq
POSTGRES_PASSWORD=<generate a strong password>
POSTGRES_DB=venlaxiq

# ── Valkey (Redis) ────────────────────────────────────────────────────────────
VALKEY_PASSWORD=<generate a strong password>

# ── Meilisearch ───────────────────────────────────────────────────────────────
MEILI_MASTER_KEY=<32+ character random string>

# ── MinIO (file storage) ──────────────────────────────────────────────────────
MINIO_ROOT_USER=venlaxiq_admin
MINIO_ROOT_PASSWORD=<generate a strong password>

# ── ClickHouse ────────────────────────────────────────────────────────────────
CLICKHOUSE_USER=venlaxiq
CLICKHOUSE_PASSWORD=<generate a strong password>

# ── PostHog ───────────────────────────────────────────────────────────────────
POSTHOG_DATABASE_URL=postgresql://venlaxiq:<POSTGRES_PASSWORD>@postgres:5432/posthog
POSTHOG_SECRET_KEY=<generate secret>

# ── Grafana ───────────────────────────────────────────────────────────────────
GRAFANA_PASSWORD=<generate a strong password>

# ── Sentry ────────────────────────────────────────────────────────────────────
SENTRY_SECRET_KEY=<generate secret>

# ── Unleash ───────────────────────────────────────────────────────────────────
UNLEASH_ADMIN_TOKEN=<generate secret>

# ── API App ───────────────────────────────────────────────────────────────────
DATABASE_URL=postgresql://venlaxiq:<POSTGRES_PASSWORD>@postgres:5432/venlaxiq
REDIS_URL=redis://:<VALKEY_PASSWORD>@valkey:6379
JWT_SECRET=<generate secret>
ADMIN_JWT_SECRET=<generate a different secret>
PORT=3001
NODE_ENV=production

# ── External APIs ─────────────────────────────────────────────────────────────
ANTHROPIC_API_KEY=sk-ant-...
HF_API_KEY=hf_...
NEWSAPI_KEY=...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=             # Fill in after Part 12

# ── MinIO (used by API) ───────────────────────────────────────────────────────
MINIO_ENDPOINT=minio
MINIO_ACCESS_KEY=venlaxiq_admin
MINIO_SECRET_KEY=<same as MINIO_ROOT_PASSWORD>
MINIO_BUCKET=venlaxiq-receipts

# ── Push Notifications (optional) ────────────────────────────────────────────
APNS_KEY_PATH=/run/secrets/apns.p8
APNS_KEY_ID=XXXXXXXXXX
APNS_TEAM_ID=XXXXXXXXXX
APNS_BUNDLE_ID=com.venlaxiq
FCM_PROJECT_ID=venlaxiq-prod
FCM_CLIENT_EMAIL=firebase-adminsdk@venlaxiq-prod.iam.gserviceaccount.com
FCM_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\n...
```

Save with `Ctrl+O`, `Enter`, `Ctrl+X`.

---

## 8. Create the Apps Compose File

The base `docker-compose.yml` runs all infrastructure services. Create this overlay file to add the API, web, and admin app containers:

```bash
nano /opt/venlaxiq/infrastructure/docker-compose.apps.yml
```

Paste the following exactly:

```yaml
services:
  api:
    build:
      context: ..
      dockerfile: apps/api/Dockerfile
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      REDIS_URL: redis://:${VALKEY_PASSWORD}@valkey:6379
      JWT_SECRET: ${JWT_SECRET}
      ADMIN_JWT_SECRET: ${ADMIN_JWT_SECRET}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      HF_API_KEY: ${HF_API_KEY}
      NEWSAPI_KEY: ${NEWSAPI_KEY}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
      STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET}
      MINIO_ENDPOINT: minio
      MINIO_ACCESS_KEY: ${MINIO_ROOT_USER}
      MINIO_SECRET_KEY: ${MINIO_ROOT_PASSWORD}
      MINIO_BUCKET: venlaxiq-receipts
      PORT: 3001
      NODE_ENV: production
    depends_on:
      postgres:
        condition: service_healthy
      valkey:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  web:
    build:
      context: ..
      dockerfile: apps/web/Dockerfile
    restart: unless-stopped
    environment:
      API_URL: http://api:3001
      NEXT_PUBLIC_API_URL: https://api.venlaxiq.com
      NEXT_PUBLIC_WS_URL: wss://api.venlaxiq.com
    depends_on:
      - api

  admin:
    build:
      context: ..
      dockerfile: apps/admin/Dockerfile
    restart: unless-stopped
    environment:
      API_URL: http://api:3001
      ADMIN_JWT_SECRET: ${ADMIN_JWT_SECRET}
    depends_on:
      - api
```

Save and close.

---

## 9. Build and Start All Services

This step builds your Docker images from source (takes ~10–15 minutes the first time) and starts everything.

```bash
cd /opt/venlaxiq/infrastructure

# Build app images (API, web, admin)
docker compose -f docker-compose.yml -f docker-compose.apps.yml build

# Start all services in the background
docker compose -f docker-compose.yml -f docker-compose.apps.yml up -d
```

**Check that everything is running:**

```bash
docker compose -f docker-compose.yml -f docker-compose.apps.yml ps
```

All services should show `Up` or `healthy`. If any show `Exit`, check logs:

```bash
docker compose -f docker-compose.yml -f docker-compose.apps.yml logs <service-name>
# Example:
docker compose -f docker-compose.yml -f docker-compose.apps.yml logs api
```

> **Caddy** (the reverse proxy) will automatically request SSL certificates for `api.venlaxiq.com`, `app.venlaxiq.com`, and `admin.venlaxiq.com` the first time it starts. This requires your DNS records (from Part 5) to be pointing at the VPS already.

---

## 10. Run Database Migrations

Run this once to create all database tables:

```bash
cd /opt/venlaxiq/infrastructure

docker compose -f docker-compose.yml -f docker-compose.apps.yml exec api \
  node -e "require('./dist/db/migrate').runMigrations()"
```

If that doesn't work (migration script path may vary), run from the repo root on the VPS:

```bash
cd /opt/venlaxiq
DATABASE_URL="postgresql://venlaxiq:<POSTGRES_PASSWORD>@localhost:5432/venlaxiq" pnpm db:migrate
```

> You need Node.js and pnpm installed for this alternative. Install with:
> ```bash
> curl -fsSL https://fnm.vercel.app/install | bash
> source ~/.bashrc
> fnm install 20
> npm install -g pnpm@9
> pnpm install --frozen-lockfile
> ```

---

## 11. Create Your First Admin Account

```bash
cd /opt/venlaxiq/infrastructure

docker compose -f docker-compose.yml -f docker-compose.apps.yml exec api \
  node -e "
const { seedAdmin } = require('./dist/modules/admin-auth/admin-auth.service');
seedAdmin('your@email.com', 'your-strong-password').then(secret => {
  console.log('TOTP Secret:', secret);
});
"
```

1. Copy the TOTP secret printed in the terminal
2. Open **Google Authenticator** or **Authy** → Add account → Enter setup key → paste the secret
3. Go to `https://admin.venlaxiq.com/login` → email + password → 6-digit code

> **Store your TOTP secret in a password manager.** If lost, delete the admin record from the database and run `seedAdmin` again.

---

## 12. Set Up Stripe Webhooks

1. Go to **stripe.com** → Developers → Webhooks → **Add endpoint**
2. Set URL to: `https://api.venlaxiq.com/subscriptions/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
4. Click **Add endpoint** → copy the **Signing secret** (starts with `whsec_`)
5. Update your `.env` file on the VPS:

```bash
nano /opt/venlaxiq/infrastructure/.env
# Set STRIPE_WEBHOOK_SECRET=whsec_...
```

Then restart the API to pick up the new value:

```bash
cd /opt/venlaxiq/infrastructure
docker compose -f docker-compose.yml -f docker-compose.apps.yml restart api
```

---

## 13. Build the Mobile App (Expo EAS)

This runs on **your local machine**, not the VPS:

**Step 1 — Install EAS CLI**

```bash
npm install -g eas-cli
```

**Step 2 — Log in to Expo**

```bash
eas login
```

**Step 3 — Create `apps/mobile/eas.json`**

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.venlaxiq.com"
      }
    }
  }
}
```

**Step 4 — Build**

```bash
cd apps/mobile
eas build --platform ios --profile production      # requires Apple Developer account
eas build --platform android --profile production
```

Builds take ~15 minutes. EAS handles code signing automatically.

---

## 14. Seed Content

```bash
cd /opt/venlaxiq/infrastructure

docker compose -f docker-compose.yml -f docker-compose.apps.yml exec api \
  node -e "require('./dist/seeds/rewards').seedRewards()"

docker compose -f docker-compose.yml -f docker-compose.apps.yml exec api \
  node -e "require('./dist/seeds/missions').seedMissions()"
```

If seed scripts need to be run via pnpm (from the repo root on the VPS):

```bash
cd /opt/venlaxiq
DATABASE_URL="postgresql://venlaxiq:<POSTGRES_PASSWORD>@localhost:5432/venlaxiq" pnpm --filter api seed:rewards
DATABASE_URL="postgresql://venlaxiq:<POSTGRES_PASSWORD>@localhost:5432/venlaxiq" pnpm --filter api seed:missions
```

---

## 15. Monitoring Dashboard

All observability services are running and accessible. To expose them securely, add entries to the Caddyfile:

```bash
nano /opt/venlaxiq/infrastructure/Caddyfile
```

Append (replacing `venlaxiq.com` with your domain):

```
grafana.venlaxiq.com {
  reverse_proxy grafana:3000
}

metabase.venlaxiq.com {
  reverse_proxy metabase:3000
}

posthog.venlaxiq.com {
  reverse_proxy postHog:8000
}
```

Add the corresponding DNS A records (same VPS IP), then reload Caddy:

```bash
cd /opt/venlaxiq/infrastructure
docker compose -f docker-compose.yml -f docker-compose.apps.yml exec caddy caddy reload --config /etc/caddy/Caddyfile
```

| Tool | Default Access | Purpose |
|------|---------------|---------|
| Grafana | `grafana.venlaxiq.com` | Metrics & dashboards |
| Prometheus | internal (port 9090) | Metrics collection |
| PostHog | `posthog.venlaxiq.com` | Product analytics |
| Sentry | internal (port 9010) | Error tracking |
| Metabase | `metabase.venlaxiq.com` | Business intelligence |
| Unleash | internal (port 4242) | Feature flags |
| MinIO | internal (port 9001) | File storage console |

> **Security:** Only expose monitoring dashboards behind authentication or a VPN. Never expose Prometheus or MinIO directly to the internet.

---

## 16. Maintenance & Updates

### Deploy a new version

```bash
cd /opt/venlaxiq

# Pull latest code
git pull origin main

# Rebuild and restart (zero-downtime per service)
cd infrastructure
docker compose -f docker-compose.yml -f docker-compose.apps.yml build api web admin
docker compose -f docker-compose.yml -f docker-compose.apps.yml up -d --no-deps api web admin

# Run any new migrations
DATABASE_URL="postgresql://venlaxiq:<password>@localhost:5432/venlaxiq" pnpm db:migrate
```

### View logs

```bash
cd /opt/venlaxiq/infrastructure

# All services
docker compose -f docker-compose.yml -f docker-compose.apps.yml logs -f

# Specific service
docker compose -f docker-compose.yml -f docker-compose.apps.yml logs -f api
```

### Backup the database

```bash
docker exec infrastructure-postgres-1 pg_dump -U venlaxiq venlaxiq > backup_$(date +%Y%m%d).sql
```

> Hostinger VPS backups (enabled at purchase) snapshot the entire disk weekly. For daily DB backups, set up a cron job:
>
> ```bash
> crontab -e
> # Add:
> 0 2 * * * docker exec infrastructure-postgres-1 pg_dump -U venlaxiq venlaxiq > /opt/backups/venlaxiq_$(date +\%Y\%m\%d).sql
> ```

### Restart a service

```bash
cd /opt/venlaxiq/infrastructure
docker compose -f docker-compose.yml -f docker-compose.apps.yml restart api
```

### Check disk usage

```bash
df -h
docker system df
```

---

## Final Checklist

- [ ] Hostinger VPS provisioned (KVM 4 recommended), SSH access working
- [ ] UFW firewall configured (ports 22, 80, 443 open)
- [ ] Docker installed, `deploy` user in docker group
- [ ] DNS A records for `api`, `app`, `admin` pointing to VPS IP
- [ ] Repository cloned to `/opt/venlaxiq`
- [ ] `.env` file created and all values filled in
- [ ] `docker-compose.apps.yml` created in `infrastructure/`
- [ ] All services built and running (`docker compose ps` shows healthy)
- [ ] Caddy obtained SSL certificates (visit `https://app.venlaxiq.com` — should load)
- [ ] Database migrations run
- [ ] Admin account created and TOTP secret saved in authenticator app
- [ ] Stripe webhook pointing to `https://api.venlaxiq.com/subscriptions/webhook`
- [ ] `STRIPE_WEBHOOK_SECRET` updated in `.env` and API restarted
- [ ] Mobile app built via EAS
- [ ] Rewards catalog and missions seeded
- [ ] Grafana accessible and showing metrics

---

## Cost Summary

| Item | Cost |
|------|------|
| Hostinger KVM 4 VPS (recommended) | ~$23/month |
| Hostinger VPS backups | ~$4/month |
| Domain name (if not already owned) | ~$10–15/year |
| Stripe | Free — charges only on transactions |
| Expo EAS Build | Free (30 builds/month) |
| Anthropic API | Pay-per-use (~$0.003–0.015 per 1K tokens) |
| HuggingFace | Free inference tier |
| NewsAPI | Free tier (100 req/day) |
| Apple Developer Program (iOS push) | $99/year |
| Firebase (Android push) | Free |

**Estimated total: ~$27/month** (vs $0/month to start on the cloud guide — but the cloud guide has per-usage costs that add up; VPS is fixed and fully self-contained once paid)

### VPS vs Cloud (Railway + Vercel + Upstash)

| | VPS (This Guide) | Cloud (Railway + Vercel) |
|---|---|---|
| Monthly cost | ~$27 fixed | $0 start, scales with usage |
| All services included | Yes (observability stack included) | No (each service billed separately) |
| Control | Full — SSH, root access | Limited |
| SSL | Automatic (Caddy) | Automatic |
| Scalability | Manual (upgrade plan) | Automatic |
| Setup complexity | Moderate | Simple |
| Best for | Cost predictability, full stack ownership | Fastest path to launch |

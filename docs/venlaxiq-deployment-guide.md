# VenlaxIQ Production Deployment Guide

> Step-by-step instructions to take VenlaxIQ from your local machine to live — including API, web app, admin panel, and mobile app.
>
> **Version:** Phase 3 Complete · **Date:** May 2026 · **Audience:** Beginner Friendly

---

## Table of Contents

1. [Create Accounts](#1-create-accounts)
2. [Set Up the Database](#2-set-up-the-database-railway)
3. [Set Up Redis](#3-set-up-redis-upstash)
4. [Deploy the API](#4-deploy-the-api-railway)
5. [Deploy the Web App](#5-deploy-the-web-app-vercel)
6. [Deploy the Admin App](#6-deploy-the-admin-app-vercel)
7. [Set Up Stripe Webhooks](#7-set-up-stripe-webhooks)
8. [Create Your First Admin Account](#8-create-your-first-admin-account)
9. [Build the Mobile App](#9-build-the-mobile-app-expo-eas)
10. [Seed Content](#10-seed-content)
11. [Final Checklist](#final-checklist)
12. [Cost Summary](#cost-summary)

---

## 1. Create Accounts

Sign up for each service below. All are free to start — no credit card needed except Stripe (which only charges when users pay you).

| Service | What It's For | URL |
|---------|--------------|-----|
| **Railway** | Hosts your API + database | [railway.app](https://railway.app) |
| **Vercel** | Hosts your web and admin apps | [vercel.com](https://vercel.com) |
| **Upstash** | Managed Redis for background jobs | [upstash.com](https://upstash.com) |
| **Stripe** | Subscription payments | [stripe.com](https://stripe.com) |
| **Expo** | Mobile app builds | [expo.dev](https://expo.dev) |
| **Anthropic** | AI features (Claude) | [console.anthropic.com](https://console.anthropic.com) |
| **HuggingFace** | Sentiment analysis for market insights | [huggingface.co](https://huggingface.co) |
| **NewsAPI** | News feed for AI insight pipeline | [newsapi.org](https://newsapi.org) |

> **Paid — Only needed for mobile push notifications**
> - Apple Developer Program — $99/year — [developer.apple.com](https://developer.apple.com) (iOS push notifications)
> - Firebase — free — [console.firebase.google.com](https://console.firebase.google.com) (Android push notifications)
>
> You can skip both if you're testing without push notifications first.

---

## 2. Set Up the Database (Railway)

1. Go to **railway.app** → click **New Project** → **Deploy a template** → search **PostgreSQL** → click Deploy
2. Once it's running, click on the Postgres service → **Variables** tab → copy the `DATABASE_URL` value (looks like `postgresql://postgres:...@...railway.app:5432/railway`)
3. Open your terminal in the VenlaxIQ folder and run:

```bash
# Replace with your actual Railway DATABASE_URL
DATABASE_URL="postgresql://postgres:xxx@xxx.railway.app:5432/railway" pnpm db:migrate
```

> **What this does:** Creates all your database tables in the cloud. You only need to run this once (and again each time you add new tables in the future).

---

## 3. Set Up Redis (Upstash)

1. Go to **upstash.com** → create account → click **Create Database**
2. Name it `venlaxiq`, choose the region closest to your users, click **Create**
3. On the database page, copy the **Redis URL** — it looks like `rediss://...upstash.io:6379`

> **What this does:** Redis powers your background job queues (AI insights, push notifications, market settlement). Upstash is serverless so it costs nothing when idle.

---

## 4. Deploy the API (Railway)

1. In Railway → **New Project** → **Deploy from GitHub repo** → connect GitHub → select the VenLax repo
2. Set these build settings:
   - **Root Directory:** `apps/api`
   - **Build Command:** `pnpm install && pnpm build`
   - **Start Command:** `node dist/index.js`
3. Go to the **Variables** tab and add every variable below:

```
DATABASE_URL          = postgresql://postgres:xxx@xxx.railway.app:5432/railway
REDIS_URL             = rediss://xxx.upstash.io:6379
JWT_SECRET            = (generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
ADMIN_JWT_SECRET      = (run same command again — must be a different value)
ANTHROPIC_API_KEY     = (from console.anthropic.com → API Keys)
HF_API_KEY            = (from huggingface.co → Settings → Access Tokens)
NEWSAPI_KEY           = (from newsapi.org → account page)
STRIPE_SECRET_KEY     = (from stripe.com → Developers → API Keys → Secret key)
STRIPE_WEBHOOK_SECRET = (leave blank for now — fill in Part 7)
PORT                  = 3001
NODE_ENV              = production
```

4. Click **Deploy** and wait for the green checkmark
5. Click on the service → **Settings** → copy the public URL (e.g. `https://venlaxiq-api.up.railway.app`)

> **Save this URL — you'll need it in the next steps.**

---

## 5. Deploy the Web App (Vercel)

1. Go to **vercel.com** → **New Project** → Import your GitHub repo
2. Set:
   - **Framework:** Next.js (auto-detected)
   - **Root Directory:** `apps/web`
3. Under **Environment Variables**, add:

```
API_URL              = https://venlaxiq-api.up.railway.app
NEXT_PUBLIC_API_URL  = https://venlaxiq-api.up.railway.app
NEXT_PUBLIC_WS_URL   = wss://venlaxiq-api.up.railway.app
```

4. Click **Deploy** — Vercel gives you a URL like `venlaxiq-web.vercel.app`

---

## 6. Deploy the Admin App (Vercel)

1. In Vercel → **New Project** → same GitHub repo
2. Set:
   - **Root Directory:** `apps/admin`
3. Under **Environment Variables**, add:

```
API_URL              = https://venlaxiq-api.up.railway.app
ADMIN_JWT_SECRET     = (same value you used in Part 4)
```

4. Click **Deploy** — save your admin URL (e.g. `venlaxiq-admin.vercel.app`)

---

## 7. Set Up Stripe Webhooks

> **Important:** Without this step, users who pay via Stripe will stay on the free tier forever. This wires Stripe back to your API.

1. Go to **stripe.com** → Developers → Webhooks → **Add endpoint**
2. Set the URL to: `https://your-railway-api-url/subscriptions/webhook`
3. Under **Events to listen to**, select:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
4. Click **Add endpoint** → copy the **Signing secret** (starts with `whsec_`)
5. Go back to Railway → your API service → Variables → update `STRIPE_WEBHOOK_SECRET` with this value. Railway will auto-redeploy.

---

## 8. Create Your First Admin Account

This is a one-time setup. Run this in your terminal (replace the DATABASE_URL, email, and password):

```bash
DATABASE_URL="postgresql://postgres:xxx@xxx.railway.app:5432/railway" \
node -e "
const { seedAdmin } = require('./apps/api/dist/modules/admin-auth/admin-auth.service');
seedAdmin('your@email.com', 'your-strong-password').then(secret => {
  console.log('TOTP Secret:', secret);
});
"
```

1. Copy the TOTP secret printed in the terminal
2. Open **Google Authenticator** or **Authy** on your phone → Add account → Enter setup key → paste the secret
3. Go to `venlaxiq-admin.vercel.app/login` → enter email + password → enter the 6-digit code from the authenticator app

> **Keep your TOTP secret safe.** Store it in a password manager. If you lose it, delete the admin record from the database and run `seedAdmin` again.

---

## 9. Build the Mobile App (Expo EAS)

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
        "EXPO_PUBLIC_API_URL": "https://your-railway-api-url"
      }
    }
  }
}
```

**Step 4 — Build for iOS** *(requires Apple Developer account)*

```bash
cd apps/mobile
eas build --platform ios --profile production
```

**Step 5 — Build for Android**

```bash
eas build --platform android --profile production
```

Builds take ~15 minutes. You'll get a download link when done. EAS handles code signing automatically.

---

## 10. Seed Content

Run these once to populate the reward catalog and daily missions:

```bash
DATABASE_URL="postgresql://postgres:xxx@xxx.railway.app:5432/railway" pnpm --filter api seed:rewards
DATABASE_URL="postgresql://postgres:xxx@xxx.railway.app:5432/railway" pnpm --filter api seed:missions
```

---

## Final Checklist

- [ ] Railway Postgres created + `pnpm db:migrate` run
- [ ] Upstash Redis created
- [ ] API deployed to Railway with all environment variables set
- [ ] Web app deployed to Vercel
- [ ] Admin app deployed to Vercel
- [ ] Stripe webhook created and `STRIPE_WEBHOOK_SECRET` updated in Railway
- [ ] Admin account created and TOTP secret saved in authenticator app
- [ ] Mobile app built via EAS
- [ ] Rewards catalog and missions seeded

---

## Cost Summary

| Service | Cost |
|---------|------|
| Railway (API + Postgres) | Free tier available |
| Vercel (Web + Admin) | Free tier available |
| Upstash Redis | Free tier available |
| Stripe | Free — charges only on transactions |
| Expo EAS Build | Free tier (30 builds/month) |
| Apple Developer Program (iOS push) | $99/year |
| Firebase (Android push) | Free |

**Total to get started: $0/month** (Apple Developer account only needed to publish to the App Store)

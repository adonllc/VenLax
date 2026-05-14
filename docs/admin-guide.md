# VenlaxIQ Admin Guide

This guide covers everything available in the **Admin Dashboard** at `https://admin.yourdomain.com` (port 3002). Admin accounts are created via the seed script — there is no self-registration for admins.

---

## Table of Contents

1. [Admin Roles](#1-admin-roles)
2. [Logging In (with 2FA)](#2-logging-in-with-2fa)
3. [Dashboard — Platform Overview](#3-dashboard--platform-overview)
4. [Analytics](#4-analytics)
5. [User Management](#5-user-management)
6. [Market Management](#6-market-management)
7. [FP Adjustments](#7-fp-adjustments)
8. [Review Moderation](#8-review-moderation)
9. [Admin Settings](#9-admin-settings)
10. [Background Jobs & Workers](#10-background-jobs--workers)
11. [Database Concepts for Admins](#11-database-concepts-for-admins)
12. [Runbook — Common Admin Tasks](#12-runbook--common-admin-tasks)

---

## 1. Admin Roles

There are two admin roles:

| Role | Capabilities |
|---|---|
| **Admin** | Full access to all dashboard features |
| **Superadmin** | Admin + ability to reset 2FA secrets, run seed scripts |

---

## 2. Logging In (with 2FA)

Admin accounts are protected by **two-factor authentication (TOTP)** in addition to a password.

### First Login — Setting Up 2FA

Your TOTP secret is generated when the admin account is seeded. Ask your Superadmin to run:

```bash
pnpm --filter api seed:admin
```

This prints a **TOTP secret** and a **QR code** to the terminal. Scan the QR code with any TOTP app (Google Authenticator, Authy, 1Password).

### Login Flow

1. Go to the Admin Dashboard URL
2. Enter your **email** and **password** → click Sign In
3. On the next screen, enter the **6-digit code** from your TOTP app
4. You're in

### If You're Locked Out (Lost 2FA Device)

A Superadmin must re-run the seed script to regenerate a new TOTP secret. This is done from the server via SSH:

```bash
pnpm --filter api seed:admin
```

---

## 3. Dashboard — Platform Overview

The **Dashboard** is the first page after login. It gives a live snapshot of platform health.

### KPI Cards

| Card | What It Shows |
|---|---|
| Monthly Active Users (MAU) | Unique users who logged in during the current calendar month |
| Daily Active Users (DAU) | Unique users who logged in today |
| Pro Subscribers | Total users currently on the Pro tier |
| Elite Subscribers | Total users currently on the Elite tier |

### Top Active Markets

A list of the most actively traded open markets by FP volume — useful for knowing which markets are driving engagement.

### Subscription Breakdown

A summary of how many users are on each tier (Free / Pro / Elite) with counts.

---

## 4. Analytics

Go to **Analytics** in the sidebar for deeper metrics.

### What's Available

| Metric | Details |
|---|---|
| 30-Day MAU | Monthly active user trend |
| Daily AU | Daily active user trend |
| Pro User Count | Count of Pro subscribers |
| Elite User Count | Count of Elite subscribers |
| Tier Distribution | Percentage breakdown across Free/Pro/Elite with bar chart |
| FP Volume (7-day) | Total FP moved in the last 7 days, broken down by pool type |

### FP Pool Types

| Pool | Description |
|---|---|
| `daily_forecast` | FP staked into market forecasts |
| `earned` | FP credited after market settlement |
| `bonus` | Admin adjustments and promotional credits |
| `achievement` | FP awarded for badges and missions |
| `review` | FP from review-related activity |

---

## 5. User Management

Go to **Users** in the sidebar.

### User List

The user list shows all registered users with:

- Email address
- Subscription tier badge (Free / Pro / Elite)
- Account status (Active / Suspended)
- Join date
- Link to the user's detail page

### Searching & Filtering

- **Search** by email address (partial match)
- **Filter by tier:** Free, Pro, Elite
- **Filter by status:** Active, Suspended
- Results are paginated

### User Detail Page

Click **Manage** on any user to open their detail page. You'll see:

| Field | Description |
|---|---|
| Email | User's registered email |
| Username | Display name |
| Tier | Current subscription level |
| Status | Active or Suspended |
| FP Balance | Current FP balance (sum of ledger) |
| XP Level | Rookie → Analyst → Expert → Master → Legend |
| Account Created | Registration date |

### Suspending a User

Suspended users cannot log in or take any action on the platform.

1. Open the user's detail page
2. Click **Suspend User**
3. A confirmation modal appears — enter your **admin password** to confirm
4. The user's status changes to **Suspended** immediately
5. The action is permanently recorded in the **Audit Log**

### Reinstating a User

1. Open the suspended user's detail page
2. Click **Reinstate User**
3. Confirm with your **admin password**
4. Status returns to **Active**

### Audit Log

Every admin action on a user (suspend, reinstate, FP adjustment) is recorded in the audit log with:

- Timestamp
- Admin who took the action
- Action type
- Details (reason, amount, etc.)

The audit log is **immutable** — entries can never be edited or deleted.

---

## 6. Market Management

Go to **Markets** in the sidebar.

### Market List

Shows all markets with:

- Title
- Category (Sports / Politics / Open)
- Status badge (Draft / Open / Closed / Resolved / Settled)
- Close date
- Link to manage

### Filtering Markets

- **Status filter:** All, Open, Closed, Resolved, Settled
- **Category filter:** Sports, Politics, Open
- Results are paginated

### Creating a Market

Click **New Market** to open the creation form.

**Required fields:**

| Field | Description |
|---|---|
| Title | Short, clear question (e.g. "Will Team X win the championship?") |
| Description | Full context for the market |
| Category | Sports / Politics / Open |
| Closes At | Date/time when forecasting ends |
| Resolves At | Date/time when the outcome will be declared |
| Resolution Criteria | Exact conditions for YES to win |
| Resolution Source | Where the outcome will be verified (e.g. official website, news source) |

Click **Create Market**. New markets are created in **Draft** status. Change to **Open** to accept forecasts.

### Managing a Market

Click **Manage** on any market to open its detail page.

**What you can do:**

#### Change Market Status

Move a market through its lifecycle:

```
Draft → Open → Closed → Resolved → Settled
```

- Set to **Open** when ready to accept forecasts
- Set to **Closed** when the forecasting period is over
- **Resolved** and **Settled** are set automatically during resolution

#### Resolving a Market

When the real-world event has a result:

1. Open the market detail page
2. The market must be in **Closed** status
3. Select the outcome: **YES** or **NO** from the resolution dropdown
4. Click **Resolve**
5. Confirm with your **admin password**

What happens automatically after resolution:
- Market status changes to **Resolved**
- The settlement worker picks up the market within seconds
- All positions are settled: winning positions receive FP, losing positions receive 0
- Market status changes to **Settled**
- FP is credited to winners' ledgers

> **Important:** Resolution is irreversible. Double-check the outcome before confirming.

---

## 7. FP Adjustments

Go to **FP Adjustments** in the sidebar. This lets you manually credit or debit FP for any user — for promotions, corrections, or support resolutions.

### Making an Adjustment

Fill in the form:

| Field | Description |
|---|---|
| User ID | The user's UUID (find it on their detail page) |
| Amount | Positive integer = credit FP. Negative integer = debit FP |
| Pool Type | `bonus` (promotional) or `achievement` (badge/milestone) |
| Reason | Minimum 10 characters. This appears in the immutable audit log |

Click **Submit Adjustment**, then confirm with your **admin password** in the modal.

### Notes

- All FP adjustments are **permanently logged** with the admin who made them, timestamp, amount, pool type, and reason
- A debit (negative amount) will reduce the user's balance — ensure their balance is sufficient before debiting
- Adjustments cannot be reversed — create a correcting entry with an opposite amount if you make an error

### Examples

| Scenario | Amount | Pool Type | Reason |
|---|---|---|---|
| Welcome bonus for new user | +500 | bonus | "New user welcome bonus — May 2026 campaign" |
| Compensate for settlement error | +1000 | bonus | "Compensation for market M-123 settlement delay" |
| Remove fraudulent FP | -2000 | bonus | "Fraudulent activity detected — account review case #456" |

---

## 8. Review Moderation

Go to **Reviews** in the sidebar. This is the moderation queue for user-submitted product reviews.

### The Queue

Reviews appear here when they are:
- **Pending** — newly submitted, not yet reviewed
- **Flagged** — community-flagged as potentially violating guidelines

A counter at the top shows total reviews awaiting action.

### Review Panel

Each review in the queue shows:

| Field | Description |
|---|---|
| Title | Review headline |
| Rating | 1–5 stars |
| Content | Full review body |
| Author | Username and user ID |
| Receipt URL | Link to purchase receipt (if provided) |
| AI Trust Score | 0–100 score from the AI review scorer (internal use) |

### Actions

| Action | What It Does |
|---|---|
| **Approve** | Review status → `published`. Becomes visible to all users. |
| **Reject** | Review status → `rejected`. Not published. User is not notified by default. |

### Guidelines for Moderation

**Approve if:**
- Review is genuine and on-topic for the product
- Language is appropriate and not abusive
- No obvious fake or spam indicators
- AI Trust Score is above 40 (use as a signal, not a rule)

**Reject if:**
- Review appears fake, coordinated, or incentivised inappropriately
- Contains hate speech, personal attacks, or illegal content
- Completely off-topic for the product
- Receipt is fraudulent or mismatched

---

## 9. Admin Settings

Go to **Settings** in the sidebar.

### What's Shown

| Setting | Description |
|---|---|
| Admin Email | Your admin account email |
| Role | Admin or Superadmin |
| 2FA Reset Instructions | Command to regenerate TOTP secret (Superadmin only) |

### Resetting 2FA

To reset a 2FA secret (e.g. someone lost their TOTP device), SSH into the server and run:

```bash
pnpm --filter api seed:admin
```

This prints a new TOTP secret and QR code to the terminal. The admin must re-scan it in their authenticator app.

---

## 10. Background Jobs & Workers

VenlaxIQ runs several automated background jobs using **BullMQ** (backed by Redis/Valkey). These run automatically — no admin action is needed — but it's useful to know what they do.

| Worker | Schedule | What It Does |
|---|---|---|
| **AI Insight Worker** | Every 6 hours | Fetches news via NewsAPI, runs sentiment analysis via HuggingFace, synthesises AI signals via Claude Sonnet, stores results for Pro/Elite users |
| **Settlement Worker** | Triggered on market resolution | Calculates FP payouts for all positions, debits losers, credits winners, marks market as Settled |
| **Notification Worker** | Triggered by events | Sends iOS (APNs) and Android (FCM) push notifications to registered devices |

### If a Worker Seems Stuck

SSH into the server and check the Docker logs:

```bash
docker logs <api_container_name> --tail 100
```

Or restart the API container (workers restart automatically with it):

```bash
docker restart <api_container_name>
```

---

## 11. Database Concepts for Admins

### FP Ledger is Append-Only

FP balances are never stored as a single number. Instead, every credit and debit is a separate row in the `fp_ledger` table. A user's balance is always calculated by summing all their non-expired rows:

```
balance = SUM(amount) WHERE (expiresAt IS NULL OR expiresAt > NOW())
```

This means:
- You can never accidentally overwrite a balance
- Every transaction has a permanent record
- FP expiry is handled automatically by the expiry date on each row

### Market Settlement Is Automatic

Once you resolve a market with an outcome (YES or NO), the settlement worker handles everything:
1. Finds all positions for that market
2. Calculates FP earned for winning positions
3. Inserts credit rows into the FP ledger for winners
4. Marks all positions as `isSettled = true`
5. Updates market status to `settled`

You do not need to do anything after clicking Resolve.

### Audit Log Is Immutable

The `audit_log` table has no UPDATE or DELETE operations. Every admin action — user suspensions, FP adjustments, market resolutions — creates a new row that cannot be changed. This is by design for accountability.

---

## 12. Runbook — Common Admin Tasks

### Launch a New Prediction Market

1. **Markets → New Market**
2. Fill in title, description, category, close date, resolve date, resolution criteria, resolution source
3. Click **Create Market** (creates in Draft)
4. Return to the market list, click **Manage**
5. Change status to **Open**
6. Market is now live and accepting forecasts

---

### Resolve a Market After the Event

1. Confirm the real-world result from the **Resolution Source** you specified
2. **Markets → find the market → Manage**
3. Change status to **Closed** if not already
4. Select **YES** or **NO** from the resolution dropdown
5. Click **Resolve** → confirm with admin password
6. Settlement runs automatically within seconds

---

### Issue a Promotional FP Grant

1. Get the target user's UUID from their detail page (**Users → find user → Manage**, copy the ID from the URL or page)
2. **FP Adjustments → fill form:**
   - User ID: paste UUID
   - Amount: positive number (e.g. `500`)
   - Pool Type: `bonus`
   - Reason: descriptive text (e.g. "Spring 2026 promo — all users")
3. Submit → confirm password
4. FP appears in user's balance immediately

---

### Suspend a User for Abuse

1. **Users → search by email → Manage**
2. Review their account details and confirm this is the correct user
3. Click **Suspend User**
4. Enter your admin password to confirm
5. The user is locked out immediately
6. The action is logged in the audit log

---

### Approve Pending Reviews

1. **Reviews** in sidebar
2. Read each review in the queue
3. Check the content, rating, and AI Trust Score
4. Click **Approve** to publish or **Reject** to decline
5. Work through the queue until the counter reaches 0

---

### Add a New Admin Account

This is done via the seed script on the server (no UI for admin creation):

```bash
pnpm --filter api seed:admin
```

The script creates the admin with credentials defined in your environment variables and prints the 2FA QR code.

---

### Check Platform Health

1. **Dashboard** — check MAU/DAU are within normal range
2. **Analytics** — check FP volume is flowing (if 0, workers may be down)
3. SSH into server → `docker ps` to verify all containers are running
4. Check API logs: `docker logs <api_container> --tail 50`

---

## Quick Reference

### Market Status Transitions

```
Draft  →  Open  →  Closed  →  Resolved  →  Settled
         (forecasts   (no new       (outcome      (FP paid
          accepted)   forecasts)    declared)      out)
```

### FP Pool Types

| Pool | Triggered By |
|---|---|
| `daily_forecast` | User stakes FP on a market |
| `earned` | Settlement worker credits winners |
| `bonus` | Admin manual adjustment / daily login |
| `achievement` | Mission completion / badge award |
| `review` | Review-related rewards |

### Subscription Tiers Summary

| | Free | Pro | Elite |
|---|---|---|---|
| Daily FP | 500 | 2,000 | 6,000 |
| Open Positions | 5 | 15 | 50 |
| Accuracy Multiplier | 1.0× | 1.25× | 1.75× |
| Monthly Bonus FP | 0 | 5,000 | 20,000 |
| AI Signals / Day | 0 | 3 | 10 |
| FP Expiry | 60 days | 90 days | Never |

---

*VenlaxIQ Admin Guide — Internal Use Only*

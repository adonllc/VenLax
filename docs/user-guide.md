# VenlaxIQ User Guide

**VenlaxIQ** is a prediction market and community review platform. You earn **ForecastPoints (FP)** by accurately predicting real-world outcomes, completing daily missions, and writing helpful reviews — then redeem those points for rewards.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [ForecastPoints (FP) — Your In-App Currency](#2-forecastpoints-fp--your-in-app-currency)
3. [Daily Login & Streak Rewards](#3-daily-login--streak-rewards)
4. [Prediction Markets](#4-prediction-markets)
5. [Your Forecasts](#5-your-forecasts)
6. [Reviews](#6-reviews)
7. [Rewards](#7-rewards)
8. [Leaderboard](#8-leaderboard)
9. [Missions](#9-missions)
10. [Badges & XP Levels](#10-badges--xp-levels)
11. [Social — Following Other Users](#11-social--following-other-users)
12. [Your Profile](#12-your-profile)
13. [Subscription Tiers](#13-subscription-tiers)
14. [Notifications](#14-notifications)
15. [Account Settings](#15-account-settings)

---

## 1. Getting Started

### Creating an Account

1. Go to the app and click **Register**
2. Enter your **email address**, a **username**, and a **password**
3. Click **Create Account** — you're in immediately
4. You start on the **Free tier** with access to all core features

### Logging In

1. Click **Login**
2. Enter your email and password
3. Click **Sign In**

### Your Home Dashboard

After logging in you land on your **Home Dashboard**, which shows:

- Your **daily FP claim** button (earn FP just for logging in)
- Your current **login streak** and multiplier
- A snapshot of **Active Markets**
- Your **Daily Missions** and completion status

---

## 2. ForecastPoints (FP) — Your In-App Currency

FP is the currency that powers everything on VenlaxIQ. You earn it, spend it, and redeem it for real rewards.

### How You Earn FP

| Source | How |
|---|---|
| Daily Login | Claim every day — streak multiplier increases over time |
| Correct Forecasts | Win FP when a market resolves in your favour |
| Daily Missions | Complete tasks for FP + XP bonuses |
| Admin Bonuses | Promotional credits from the platform |

### How You Spend FP

| Action | FP Used |
|---|---|
| Entering a Forecast | FP is deployed as your stake |
| Redeeming a Reward | FP deducted from your balance |

### FP Expiry

FP does **not** last forever on the Free tier. How long it lasts depends on your subscription:

| Tier | FP Expiry |
|---|---|
| Free | 60 days |
| Pro | 90 days |
| Elite | Never expires |

### Checking Your Balance

Your current FP balance is always visible in your **Rewards** page and your **Profile**.

---

## 3. Daily Login & Streak Rewards

Every day you log in, you can claim a **Daily FP Bonus**. The longer your streak, the more FP you earn per day.

### Streak Multipliers

| Streak | Multiplier | Daily FP Earned |
|---|---|---|
| Day 1 | 1.0× | 100 FP |
| Day 2–4 | 1.1× | 110 FP |
| Day 5–29 | 1.5× | 150 FP |
| Day 30+ | 2.0× | 200 FP |

### Rules

- You must click **Claim** on the Home Dashboard each day
- Missing a day **resets your streak to 0**
- Daily FP from this bonus expires after **30 days** (use it or lose it)

---

## 4. Prediction Markets

A prediction market is a yes/no question about a real-world event. You stake FP on your answer and earn more FP if you're right.

### Browsing Markets

Go to **Markets** in the navigation. You can:

- **Filter** by category: All, Sports, Politics, Open
- **Search** by keyword
- See the current **YES probability** on each market card (updated live as people forecast)
- See the **close date** and total **FP volume** in each market

### Market Lifecycle

```
Draft → Open → Closed → Resolved → Settled
```

| Status | Meaning |
|---|---|
| Open | Forecasts accepted — you can enter and withdraw |
| Closed | Forecasting period ended — awaiting resolution |
| Resolved | Outcome declared (YES or NO) |
| Settled | FP paid out to winning positions |

### Market Detail Page

Click any market to see:

- Full **title and description**
- **YES/NO probability bar** — shows the crowd's current consensus
- **Resolution criteria** — exactly what has to happen for YES to win
- **Resolution source** — where the outcome will be verified
- **Close date** and **resolution date**
- The **forecast entry form** (if the market is Open)

### How Pricing Works (LMSR)

VenlaxIQ uses a mathematical model called **LMSR (Logarithmic Market Scoring Rule)** to price forecasts. This means:

- The more people bet YES, the higher the YES price gets
- The more people bet NO, the lower the YES price gets
- You always get a **fair number of shares** based on the current market state
- Early forecasters get more shares per FP spent (lower price = more upside)

---

## 5. Your Forecasts

### Placing a Forecast

1. Open any **Open** market
2. Enter the **FP amount** you want to stake (must be within your daily limit)
3. Choose **YES** or **NO**
4. See the **shares you'll receive** (calculated live by LMSR)
5. Click **Submit Forecast**

Your FP is immediately debited and you receive shares in that market.

**Limits by tier:**

| Tier | Max Open Positions | Daily FP Available |
|---|---|---|
| Free | 5 positions | 500 FP |
| Pro | 15 positions | 2,000 FP |
| Elite | 50 positions | 6,000 FP |

### Withdrawing a Forecast

You can withdraw an open forecast **before the market closes**:

1. Go to **Forecasts** in the navigation
2. Find the position you want to exit
3. Click **Withdraw**
4. You receive a partial FP refund (the withdrawal price, which may be less than you paid in depending on how the market moved)

### Viewing Your Positions

The **Forecasts** page shows all your positions:

- **Status:** Open, Settled, or Withdrawn
- **Side:** YES or NO
- **FP Deployed:** what you staked
- **Shares:** how many shares you hold
- **FP Earned:** filled in after settlement (only for Settled positions)

You can also **export your full forecast history to CSV**.

### Settlement — Getting Paid

When a market resolves:

- **Winning side** receives FP proportional to their shares
- **Losing side** receives 0 FP
- All positions are automatically settled — no action needed from you
- FP appears in your balance immediately after settlement

---

## 6. Reviews

VenlaxIQ has a community product review system where writing good reviews can earn you recognition and trust.

### Browsing Reviews

Go to **Reviews** in the navigation to:

- Browse recent community reviews
- See star ratings (1–5), author, and excerpt
- Filter by category or rating

> All reviews include an FTC disclosure notice.

### Writing a Review

1. Click **Write a Review**
2. **Step 1:** Enter or select the **Product ID** (UUID) of the product you're reviewing
3. **Step 2:** Fill in:
   - **Title** — short summary of your experience
   - **Body** — detailed review text
   - **Rating** — 1 to 5 stars
4. Click **Submit**

Your review enters a **moderation queue**. An AI trust score is calculated automatically, and the admin team reviews it before it's published.

### Review Badges

Once published, reviews can earn badges based on community feedback:

| Badge | Meaning |
|---|---|
| (none) | Standard published review |
| Verified | Receipt or purchase confirmed |
| Community Trusted | High helpful vote ratio from the community |

### Voting on Reviews

On any published review you can vote **Helpful** or **Not Helpful**. Your votes help surface the best community content and can earn reviews the **Community Trusted** badge.

---

## 7. Rewards

Spend your earned FP on real rewards from the catalog.

### Browsing the Catalog

Go to **Rewards** in the navigation. You'll see:

- **Reward name and category**
- **FP Cost** — how many FP to redeem
- **Image and description**

Rewards you can't afford are shown greyed out (insufficient FP balance).

### Redeeming a Reward

1. Click **Redeem** on any reward you can afford
2. Your FP balance is immediately debited
3. A **redemption code** is shown on screen — save it, this is your reward code
4. You can also view all past redemptions in your **Redemption History**

---

## 8. Leaderboard

The **Leaderboard** ranks all VenlaxIQ users. Go to **Leaderboard** in the navigation.

### What's Displayed

| Column | Description |
|---|---|
| Rank | Your global position |
| Username & Avatar | User identity |
| Accuracy % | Percentage of forecasts that resolved correctly |
| FP Earned | Total FP earned from settled markets |

Your own row is **highlighted** so you can find yourself quickly.

### Sorting

You can sort the leaderboard by:
- **Accuracy** — who is most consistently correct
- **FP Earned** — who has earned the most from markets

---

## 9. Missions

Daily Missions are short tasks you can complete each day for **FP and XP bonuses**. Check them on your **Home Dashboard**.

### How Missions Work

- A fresh set of missions appears each day
- Each mission shows: title, description, FP reward, XP reward, and whether it's completed
- Complete the stated action and click **Complete** to claim your rewards
- Missions reset at midnight

### Example Missions

- Enter a forecast on any market
- Write a review
- Visit the leaderboard
- Log in for 5 consecutive days

---

## 10. Badges & XP Levels

### XP Levels

As you complete missions and earn achievements, you accumulate **XP (Experience Points)**. Your level is shown on your profile.

| Level | Name |
|---|---|
| 1 | Rookie |
| 2 | Analyst |
| 3 | Expert |
| 4 | Master |
| 5 | Legend |

Your profile shows a **progress bar** toward the next level.

### Badges

Badges are awarded for specific achievements (e.g., first forecast, high accuracy, long streak). They appear on your profile and your public profile page for others to see.

---

## 11. Social — Following Other Users

### Finding Other Users

You can find other users via the **Leaderboard** — click any username to go to their public profile.

### Following

On another user's profile:

- Click **Follow** to follow them
- Click **Unfollow** to stop following

Your profile shows your **Followers** count and **Following** count.

> You cannot follow yourself — the button is disabled on your own profile.

---

## 12. Your Profile

Go to **Profile** in the navigation to view your own profile.

### What's On Your Profile

| Section | Details |
|---|---|
| Avatar & Username | Your identity on the platform |
| Tier Badge | Free, Pro, or Elite |
| XP Level | Rookie → Legend |
| Accuracy % | Your market prediction accuracy |
| Win Rate | Percentage of positions that settled positively |
| Followers / Following | Social counts |
| XP Progress Bar | Progress toward next level |
| Earned Badges | All badges you've unlocked, with earn dates |

### Viewing Other Profiles

Click any username on the Leaderboard to view their public profile. You'll see their tier, level, accuracy, and badges. You can follow/unfollow from this page.

---

## 13. Subscription Tiers

VenlaxIQ offers three tiers. You start on **Free** and can upgrade at any time.

### Tier Comparison

| Feature | Free | Pro | Elite |
|---|---|---|---|
| Daily FP Available | 500 | 2,000 | 6,000 |
| Max Open Positions | 5 | 15 | 50 |
| Accuracy Multiplier | 1.0× | 1.25× | 1.75× |
| Monthly Bonus FP | 0 | 5,000 | 20,000 |
| AI Signals Per Day | 0 | 3 | 10 |
| FP Expiry | 60 days | 90 days | Never |

### AI Insight Signals (Pro & Elite only)

Pro and Elite subscribers can view **AI-generated insight signals** on market detail pages. These show:

- A **suggested probability** (1–99%)
- A **confidence score** (1–5 stars)
- **Key factors** influencing the signal
- **Sentiment score** based on news analysis
- **Source URLs** for the news used

Signals are generated every 6 hours by the platform's AI engine using live news data.

### How to Upgrade

1. Go to **Settings → Subscription**
2. Click **Upgrade to Pro** or **Upgrade to Elite**
3. You're taken to a secure **Stripe checkout** page
4. Complete payment — your tier is upgraded instantly

### Cancelling

Manage or cancel your subscription through the Stripe customer portal (accessible from the Subscription page).

---

## 14. Notifications

VenlaxIQ can send push notifications to your mobile device for market updates and settlements.

### Enabling Notifications

1. Go to **Settings**
2. Toggle **Enable Push Notifications**
3. Allow the browser/app permission prompt
4. Your device is registered for notifications

---

## 15. Account Settings

Go to **Settings** in the navigation.

### Available Settings

| Setting | What It Does |
|---|---|
| Subscription | View your current tier and upgrade options |
| Push Notifications | Enable or disable push alerts |
| Sign Out | Log out of your account |

---

## Quick Reference

### FP Sources Summary

| Action | FP Earned |
|---|---|
| Daily login (day 1) | 100 FP |
| Daily login (day 5–29) | 150 FP |
| Daily login (day 30+) | 200 FP |
| Correct forecast | Proportional to shares × outcome |
| Mission completion | Varies per mission |
| Pro monthly bonus | 5,000 FP/month |
| Elite monthly bonus | 20,000 FP/month |

### Tier at a Glance

| | Free | Pro | Elite |
|---|---|---|---|
| Price | $0 | $9/mo | $19/mo |
| Daily FP | 500 | 2,000 | 6,000 |
| Positions | 5 | 15 | 50 |
| AI Signals | ✗ | 3/day | 10/day |
| FP Expiry | 60 days | 90 days | Never |

---

*VenlaxIQ — Predict. Review. Earn.*

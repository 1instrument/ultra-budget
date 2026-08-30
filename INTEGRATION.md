# 🚀 Deployment & Integration Guide

Welcome to your mobile-ready **Ultra Budget** setup. Follow these steps to get everything running on your iPhone and sync your real-time data.

---

## 📱 Step 1: Deploy to Vercel (Mobile Access)
To access the app on your iPhone anywhere in the world, you need a live URL.

1. **Push to GitHub**:
   - Create a private repository on GitHub (e.g., `ultra-budget`).
   - Run `git init`, `git add .`, and `git commit -m "initial commit"`.
   - Push your code to the repo.
2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com) and sign in.
   - Click "Add New" > "Project".
   - Select your `ultra-budget` repo.
   - Click **Deploy**. Vercel will give you a URL (e.g., `ultra-budget.vercel.app`).

### On your iPhone:
1. Open the Vercel URL in **Safari**.
2. Tap the **Share** button (box with upward arrow).
3. Tap **Add to Home Screen**.
4. The app will now launch full-screen with your premium **Ultra Budget** icon!

---

## 💰 Step 2: Connect Lunch Money
Sync your real-world transactions with your budget.

1. **Get your API Key**:
   - Log in to your [Lunch Money](https://lunchmoney.app) developer settings.
   - Generate an **Access Token**.
2. **Add to Vercel**:
   - In your Vercel project settings, go to **Environment Variables**.
   - Add a new variable: `LUNCH_MONEY_API_KEY`.
   - Paste your token.
   - **Note**: This key is kept secure on the server and is NOT exposed to the browser.
3. **Redeploy**:
   - Vercel will automatically trigger a build, and your app will now have access to your live data.

---

## 🛠️ Tech Stack Note
- **State**: The app uses `localStorage` for high-speed persistence on your phone.
- **PWA**: Using a `manifest.json` for native-feeling navigation.
- **UI**: Optimized for the iPhone 12 Pro's screen dimensions and safe areas.

---

## Daily financial-health email and transaction storage

1. Run `TRANSACTIONS_AND_EMAIL.sql` once in the Supabase SQL editor.
2. Add these Vercel environment variables:
   - `SUPABASE_SERVICE_KEY` — the Supabase service-role key (server-side only).
   - `RESEND_API_KEY` — an API key from Resend.
   - `CRON_SECRET` — a long random value used by Vercel to authenticate cron calls.
   - `REPORT_EMAIL` — destination address (optional; defaults to the app user's email).
   - `REPORT_FROM_EMAIL` — verified sender such as `Ultra Budget <budget@yourdomain.com>` (optional while testing).
3. Redeploy. The cron in `vercel.json` runs daily at 13:00 UTC (7:00 AM CST / 8:00 AM CDT).

Opening Transactions syncs SimpleFIN and upserts transactions into Supabase. The daily job also syncs first, so reports stay current when the app is not opened. Preview `/api/financial-digest` with the `x-ultra-secret` header; add `?send=1` to send a manual test email.

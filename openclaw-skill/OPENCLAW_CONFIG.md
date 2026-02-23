# Ultra Budget Skill — OpenClaw Setup

## What This Does

Lets OpenClaw read your **Ultra Budget app state** — your salary draw, budget
allocations, financial goals, balances, and notes — by calling a secure
Vercel endpoint that reads your Supabase data.

---

## Step 1: Add Environment Variables to Vercel

You need **4 environment variables** set in your Vercel project
(**Settings → Environment Variables**):

| Variable | What it is | Where to get it |
|---|---|---|
| `ULTRA_APP_SECRET` | Secret header key protecting the API | Generate with `openssl rand -hex 32` |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (server-only) | Supabase dashboard → Project Settings → API → `service_role` key |
| `LUNCH_MONEY_API_KEY` | Already set ✅ | — |

> ⚠️ `SUPABASE_SERVICE_KEY` is the **service_role** key, NOT the anon key.
> It bypasses row-level security and must never be exposed to the browser.
> It is safe here because it only lives on Vercel's server, never in frontend code.

After adding variables, Vercel will auto-redeploy.

---

## Step 2: Copy the Skill to OpenClaw

```bash
cp -r ultra-budget ~/.openclaw/skills/ultra-budget
```

---

## Step 3: Add Secrets to openclaw.json

Open `~/.openclaw/openclaw.json` and add this block:

```json
{
  "skills": {
    "entries": {
      "ultra-budget": {
        "enabled": true,
        "env": {
          "ULTRA_APP_SECRET": "YOUR_ULTRA_APP_SECRET_HERE",
          "ULTRA_BUDGET_URL": "https://your-app.vercel.app"
        }
      }
    }
  }
}
```

Replace:
- `YOUR_ULTRA_APP_SECRET_HERE` → the value of `ULTRA_APP_SECRET` you set in Vercel
- `https://your-app.vercel.app` → your actual deployed Vercel URL

> The secrets are injected at runtime per OpenClaw docs and are never
> stored in the skill file. Do not commit `openclaw.json` to GitHub.

---

## Step 4: Restart OpenClaw

```bash
openclaw restart
```

---

## Step 5: Test It

Ask OpenClaw naturally:

- *"What's my budget?"*
- *"How are my financial goals doing?"*
- *"What's my salary draw?"*
- *"Am I over budget this month?"*
- *"What's my personal balance?"*

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Skill not appearing | Check folder name is exactly `ultra-budget` and contains `SKILL.md` |
| "Unauthorized" errors | `ULTRA_APP_SECRET` in `openclaw.json` doesn't match Vercel |
| "Supabase credentials missing" | `SUPABASE_URL` or `SUPABASE_SERVICE_KEY` not set in Vercel |
| "No budget state found" | Open the Ultra Budget app, log in, and make any small change to sync |
| Old/stale data | Open the app — it syncs to Supabase automatically on every change |

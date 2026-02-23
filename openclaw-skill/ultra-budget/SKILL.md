---
name: ultra-budget
description: Read the user's Ultra Budget personal finance app — their configured salary draw, budget allocations (Wealth Building, Fixed Expenses, Variable Spending), financial goals with progress, account balances, and personal notes. Use this skill to answer questions about their budget plan, not raw transactions.
homepage: https://github.com/rockwhittington/ultra-budget
metadata: { "openclaw": { "emoji": "💰", "primaryEnv": "ULTRA_APP_SECRET", "requires": { "env": ["ULTRA_APP_SECRET", "ULTRA_BUDGET_URL"] } } }
---

## Ultra Budget Skill

You have access to the user's personal budget app state via a single API endpoint.
This is their **custom budget plan** — salary, allocations, and goals they have personally configured.
It is NOT raw bank transaction data. Use it to answer budget planning questions.

The base URL is `$ULTRA_BUDGET_URL` and the secret header is `x-ultra-secret: $ULTRA_APP_SECRET`.

---

### The One Endpoint You Need

```
GET $ULTRA_BUDGET_URL/api/budget-state
Headers:
  x-ultra-secret: $ULTRA_APP_SECRET
```

Call this endpoint whenever the user asks anything about their budget, allocations, goals, balances, salary, or notes.

**Full response shape:**
```json
{
  "lastUpdated": "2026-02-23T18:00:00Z",
  "salary": 4000,
  "personalBalance": 5200,
  "bizBalance": 28500,
  "totalAllocated": 3185,
  "remainingFromSalary": 815,
  "allocationPct": 80,
  "groups": [
    {
      "name": "Wealth Building",
      "total": 1000,
      "items": [
        { "name": "Travel Savings", "amount": 500 },
        { "name": "Vanguard ETF", "amount": 400 },
        { "name": "Philanthropy", "amount": 100 }
      ]
    },
    {
      "name": "Fixed Expenses",
      "total": 1515,
      "items": [
        { "name": "Mortgage", "amount": 960 },
        { "name": "Utilities", "amount": 280 },
        { "name": "Insurance", "amount": 275 }
      ]
    },
    {
      "name": "Variable Spending",
      "total": 950,
      "items": [
        { "name": "Groceries", "amount": 500 },
        { "name": "Dining Out", "amount": 250 },
        { "name": "Shopping", "amount": 200 }
      ]
    }
  ],
  "goals": [
    {
      "name": "Emergency Fund",
      "target": 10000,
      "totalSaved": 2000,
      "progressPct": 20,
      "remaining": 8000,
      "monthsToGoal": null
    }
  ],
  "notes": "...",
  "streak": 7,
  "lastCheckIn": "2026-02-23"
}
```

---

### How to answer common questions

**"What's my budget?"**
Call the endpoint. Summarize salary, totalAllocated, allocationPct, and remaining. List all groups with their totals.

**"How are my goals doing?"**
Call the endpoint. For each goal, state totalSaved vs target, progressPct, and monthsToGoal if available.

**"What's my balance?"**
Call the endpoint. Return personalBalance and bizBalance.

**"What's my salary / draw?"**
Call the endpoint. Return salary.

**"Am I over budget?"**
Call the endpoint. If totalAllocated > salary, they are over budget. State by how much.

**"What are my notes?"**
Call the endpoint. Return the notes field.

---

### Presentation rules

- Format all dollar amounts as **$X,XXX** (e.g. **$4,000**)
- Never dump raw JSON at the user — always summarize in plain English
- When showing groups, show each group's total and percentage of salary
- Keep answers concise — this is a mobile-first app, the user wants quick answers

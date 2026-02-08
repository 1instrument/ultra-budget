# Lunch Money Category Setup

Since you are new to Lunch Money, here is the exact "Advanced" code block to paste into that box. This mirrors your Ultra Budget structure perfectly.

### Instructions
1.  Copy the code block below.
2.  Paste it into the **"Custom (Advanced)"** text box on the Lunch Money setup screen.
3.  Click **Create Categories**.

---

### 📋 Copy This Code Block

```text
Income [income]
- Salary // Personal paycheck
- Business Revenue // Business income
- Other Income // Side hustles, gifts, etc.

Wealth Building
- Emergency Fund [exclude_from_budget] // Transfers to savings
- Investments [exclude_from_budget] // Transfers to brokerage
- Philanthropy
- Business Buffer [exclude_from_budget] // Retained earnings
- Travel Savings [exclude_from_budget]

Fixed Expenses
- Mortgage // or Rent
- Utilities // Electric, Water, Internet
- Insurance // Health, Auto, Life
- Subscriptions // Software, Streaming

Variable Spending
- Groceries
- Dining Out
- Shopping
- Entertainment
- Transport // Gas, Uber, etc.
- Health & Wellness // Gym, Pharmacy

Business Expenses [exclude_from_budget]
- Software & Tools
- Contractors
- Office Supplies
- Marketing
- Taxes // Estimated tax payments

System [exclude_from_totals]
- Transfers // Moving money between accounts
- Credit Card Payments // Paying off CC
- Reimbursements
```

---

### 🧠 How this works
- **Groups**: The top-level items (e.g., `Wealth Building`, `Fixed Expenses`) become your main Category Groups.
- **Categories**: The indented items (e.g., `- Groceries`) become the specific categories you assign transactions to.
- **Tags**: 
  - `[income]`: Marks these as income sources so they count positively.
  - `[exclude_from_budget]`: Useful for savings transfers so they don't look like "spending" in some views, though you can adjust this later.
  - `[exclude_from_totals]`: Critical for things like "Credit Card Payments" to avoid double-counting spending.

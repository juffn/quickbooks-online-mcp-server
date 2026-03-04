# QuickBooks Online MCP Server

MCP server giving Claude live read/write access to QuickBooks Online. Works in Claude Desktop (stdio) and Cowork (HTTP).

## Setup

```bash
npm install
```

Create `.env`:
```env
QUICKBOOKS_CLIENT_ID=your_client_id
QUICKBOOKS_CLIENT_SECRET=your_client_secret
QUICKBOOKS_ENVIRONMENT=sandbox        # or production
QUICKBOOKS_REDIRECTURI=http://localhost:3000/callback
QUICKBOOKS_REFRESH_TOKEN=             # filled in by auth flow
QUICKBOOKS_REALM_ID=                  # filled in by auth flow
```

Get credentials from [developer.intuit.com](https://developer.intuit.com) — add `http://localhost:3000/callback` as a Redirect URI on your app.

## Authentication

```bash
npm run auth
```

Opens your browser → QuickBooks login → saves tokens to `.env` automatically.

## Running

**Claude Desktop (stdio):**
Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "quickbooks": {
      "command": "node",
      "args": ["C:\\path\\to\\dist\\index.js"],
      "env": { ...your .env vars... }
    }
  }
}
```

**Cowork / HTTP clients:**
```bash
npm run http    # starts HTTP server on port 3100
```
Point your MCP client at `http://localhost:3100/mcp`.

## Scripts

| Script | Description |
|---|---|
| `npm run build` | Compile TypeScript |
| `npm run auth` | Run OAuth flow to get tokens |
| `npm run http` | Start HTTP MCP server (port 3100) |

## Available Tools (62 total)

### Entity CRUD (50 tools)
Create, Get/Read, Update, Delete, Search for:
- **Account** — chart of accounts
- **Bill** + **Bill Payment**
- **Customer**
- **Employee**
- **Estimate**
- **Invoice**
- **Item** — products and services
- **Journal Entry**
- **Purchase**
- **Vendor**

### Financial Reports (7 tools)

| Tool | Description | Key Parameters |
|---|---|---|
| `get_profit_and_loss` | P&L / Income Statement | `start_date`, `end_date`, `accounting_method`, `summarize_column_by` |
| `get_balance_sheet` | Balance Sheet | `date`, `accounting_method` |
| `get_trial_balance` | Trial Balance | `start_date`, `end_date` |
| `get_general_ledger` | General Ledger (transaction-level) | `start_date`, `end_date`, `account` |
| `get_ar_aging` | Aged Receivables | `date`, `aging_period`, `num_periods` |
| `get_ap_aging` | Aged Payables | `date`, `aging_period`, `num_periods` |
| `get_transaction_list` | Filtered transaction list | `start_date`, `end_date`, `transaction_type`, `account` |

### Query Tool (1 tool)

`query_qbo` — Run SQL-like SELECT queries against any QBO entity:
```
SELECT * FROM JournalEntry WHERE TxnDate > '2026-02-01'
SELECT * FROM Invoice WHERE Balance > '0'
SELECT * FROM Account WHERE AccountType = 'Expense'
SELECT COUNT(*) FROM Customer WHERE Active = true
```

### Journal Entry Confirmation (2 tools)

Two-phase write confirmation — Claude shows you a preview before posting:

1. `prepare_journal_entry` — validates, formats preview, returns `confirmation_id` (30-min TTL)
2. `confirm_journal_entry` — takes `confirmation_id`, posts to QBO

## Example Workflows

**Month-end close:**
> "Pull this month's trial balance and flag any accounts with unusual balances vs last month"

**P&L variance:**
> "Get February and January P&L and compare them — what changed the most?"

**AR monitoring:**
> "Show me the AR aging report and list any customers over 60 days"

**Journal entry:**
> "Prepare a journal entry to accrue $8,500 in consulting expense for February"
> *(Review the preview, then: "Confirm it")*

**Ad-hoc query:**
> "Find all open invoices over $10,000"
> → `SELECT * FROM Invoice WHERE Balance > '10000'`

**Prepaid amortization:**
> "We paid $12,000 for annual software in March. Prepare the reclassification to prepaid expenses and the 12 monthly amortization entries"

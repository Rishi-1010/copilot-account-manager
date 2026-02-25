# SpacetimeDB Setup Guide

Step-by-step commands to get the SpacetimeDB backend running with the
Copilot Account Manager frontend.

---

## Prerequisites

| Tool                | Version | Install                                           |
| ------------------- | ------- | ------------------------------------------------- |
| **SpacetimeDB CLI** | ≥ 2.0.1 | `curl -sSf https://install.spacetimedb.com \| sh` |
| **Node.js**         | ≥ 18    | `brew install node` (or nvm)                      |
| **Bun** (optional)  | ≥ 1.x   | `curl -fsSL https://bun.sh/install \| bash`       |

Verify the CLI:

```bash
spacetime version
# Expected: spacetimedb tool version 2.0.x
```

---

## Step 1 — Register a local server alias on port 4000

Next.js dev server uses port 3000, so SpacetimeDB runs on **4000**.

```bash
spacetime server add local http://127.0.0.1:4000
```

> If the alias already exists:
>
> ```bash
> spacetime server remove local
> spacetime server add local http://127.0.0.1:4000
> ```

Set it as default:

```bash
spacetime server set-default local
```

Verify:

```bash
spacetime server list
# Should show:  *** local  →  http://127.0.0.1:4000
```

---

## Step 2 — Start the SpacetimeDB server

```bash
spacetime start -- --listen-addr 0.0.0.0:4000
```

> This runs in the foreground. Open a **new terminal** for the next steps.

Confirm it's reachable:

```bash
curl -s http://127.0.0.1:4000/database/ping
# Expected: "pong" (or similar health response)
```

---

## Step 3 — Build & publish the module

From the **project root**:

```bash
cd server
spacetime publish copilot-monitor -s http://127.0.0.1:4000
```

First publish output will look like:

```
Publishing module...
Created new database: copilot-monitor
```

If you changed the schema and need a clean slate:

```bash
spacetime publish copilot-monitor --clear-database -y -s http://127.0.0.1:4000
```

---

## Step 4 — Generate TypeScript client bindings

From the **project root**:

```bash
spacetime generate \
  --lang typescript \
  --out-dir src/lib/spacetimedb \
  --module-path server/spacetimedb
```

This overwrites the auto-generated files in `src/lib/spacetimedb/`:

| File                         | Purpose                                      |
| ---------------------------- | -------------------------------------------- |
| `index.ts`                   | `DbConnection`, `tables`, `reducers` exports |
| `copilot_account_table.ts`   | Table row schema                             |
| `add_account_reducer.ts`     | AddAccount param schema                      |
| `remove_account_reducer.ts`  | RemoveAccount param schema                   |
| `refresh_account_reducer.ts` | RefreshAccount param schema                  |
| `types.ts`                   | Inferred `CopilotAccount` type               |
| `types/reducers.ts`          | Reducer param type exports                   |

> **Do NOT hand-edit** these files — they are overwritten on every generate.
> The only manually-maintained file is `provider.tsx`.

---

## Step 5 — Configure the frontend environment

Create / verify `.env.local` in the **project root**:

```dotenv
NEXT_PUBLIC_SPACETIMEDB_URL=ws://127.0.0.1:4000
```

If this variable is **not set**, the app starts with an empty account list
and a console warning — no crash.

---

## Step 6 — Start the Next.js dev server

```bash
npm run dev
# or
bun dev
```

Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard).

---

## Step 7 — Verify the connection

1. Open the browser **DevTools → Console**.
2. You should see:
   ```
   [SpacetimeDB] Connected. Identity: a1b2c3d4e5f6…
   ```
3. The dashboard should show **"No accounts yet…"** with an **Add Account** button.
4. Click **Add Account**, paste a GitHub PAT, and submit.
5. The new account card/row should appear in real-time.

---

## Useful commands

```bash
# View server-side logs (reducer executions, errors)
spacetime logs copilot-monitor -s http://127.0.0.1:4000

# List all published databases on the local server
spacetime list -s http://127.0.0.1:4000

# Run an ad-hoc SQL query against the database
spacetime sql copilot-monitor "SELECT * FROM copilot_account" -s http://127.0.0.1:4000

# Delete the database entirely
spacetime delete copilot-monitor -s http://127.0.0.1:4000
```

---

## Troubleshooting

| Symptom                                     | Cause                | Fix                                                                       |
| ------------------------------------------- | -------------------- | ------------------------------------------------------------------------- |
| Console: `[SpacetimeDB] Connection error`   | Server not running   | Run `spacetime start -- --listen-addr 0.0.0.0:4000`                       |
| Console: `Set NEXT_PUBLIC_SPACETIMEDB_URL…` | Env var missing      | Create `.env.local` (Step 5), restart Next.js                             |
| `addAccount` silently does nothing          | Module not published | `cd server && spacetime publish copilot-monitor -s http://127.0.0.1:4000` |
| Type errors after schema change             | Stale bindings       | Re-run `spacetime generate …` (Step 4)                                    |
| Port 4000 already in use                    | Leftover process     | `lsof -ti:4000 \| xargs kill -9`, then restart                            |
| Dashboard stuck on "Loading accounts…"      | WebSocket blocked    | Check browser console for WS errors, ensure 4000 is accessible            |

---

## Architecture overview

```
Browser (Next.js on :3000)
    │
    │  WebSocket (ws://127.0.0.1:4000)
    │
    ▼
SpacetimeDB Server (:4000)
    │
    ├── copilot_account table  (real-time subscriptions → useTable)
    ├── add_account reducer    (called via useReducer)
    ├── remove_account reducer
    └── refresh_account reducer
```

The frontend uses the **official SpacetimeDB 2.0 React hooks**
(`spacetimedb/react`):

- `SpacetimeDBProvider` — manages WebSocket connection lifecycle
- `useTable(tables.copilotAccount)` — subscribes to real-time row updates
- `useReducer(reducers.addAccount)` — calls reducers with type safety
- `useSpacetimeDB()` — reads connection state (`isActive`, `identity`)

These are wrapped inside `src/lib/spacetimedb/provider.tsx` which exposes a
single `useAccounts()` hook to the rest of the app.

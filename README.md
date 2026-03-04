# Copilot Account Manager

A Next.js dashboard for tracking and managing GitHub Copilot account usage, backed by PostgreSQL.

## What this project does

- Displays account usage and status in card and table views
- Supports adding, refreshing, editing, and removing Copilot accounts
- Shows dashboard metrics and usage trends
- Uses a shared `GitHubCopilot` SVG component for consistent branding

## Tech stack

- Next.js 16 + React 19
- TypeScript
- Tailwind CSS + shadcn/ui
- PostgreSQL (via `pg` client)
- GitHub Billing API for usage tracking

## Prerequisites

- Node.js 20+
- npm
- PostgreSQL 12+ installed and running

## Environment setup

1. Create `.env.local`:

   ```bash
   DATABASE_URL=postgresql://username:password@localhost:5432/copilot_accounts
   ```

   Replace `username` and `password` with your PostgreSQL credentials.

2. Set up the database (see `docs/POSTGRESQL_SETUP.md` for details)

## Configuring quota limits

Since GitHub doesn't provide quota limits via API, the app uses **assumed monthly limits** for calculating usage percentages:

- **Request limit**: 300 requests/month (GitHub Copilot Premium limit)
- **Budget limit**: $50/month (default)

To customize these limits, edit [`src/lib/quota-config.ts`](src/lib/quota-config.ts):

```typescript
export const QUOTA_CONFIG = {
  MONTHLY_REQUEST_LIMIT: 300,   // Change to your expected limit
  MONTHLY_BUDGET_LIMIT: 50,     // Change to your monthly budget
  // ...
};
```

The app calculates usage percentages based on these limits and displays:
- Color-coded status badges (Healthy/Watch/Warning/Critical)
- Progress bars showing % used
- Remaining budget/requests

## Local development

### 1) Ensure PostgreSQL is running

Make sure your PostgreSQL server is running on `localhost:5432` (or update `DATABASE_URL` accordingly).

### 2) Run frontend

```bash
# From project root
npm install
npm run dev
```

Open http://localhost:3000.

## Helpful scripts

- `bun dev` — start Next.js dev server
- `bun run build` — production build
- `bun run start` — run production server
- `bun run lint` — lint codebase
- `npm run dev` — start Next.js dev server
- `npm run build` — production build
- `npm run start` — run production server
- `npm run lint` — lint codebase

## Project structure

- `src/app` — App Router pages/layouts
- `src/components` — reusable UI and feature components
- `src/lib/db` — database utilities + provider/hooks
- `src/app/api` — REST API routes for database operations
- `docs/` — setup documentation

## GitHubCopilot SVG component

The `GitHubCopilot` component is used in:
- Sidebar product mark
- Top site header title area
- Dashboard empty-state callout

To use it elsewhere:

```tsx
import { GitHubCopilot } from '@/components/GitHubCopilot';

<GitHubCopilot className="text-primary size-5" />;
```

## Notes

- Do not commit `.env.local`.
- For database setup details, see `docs/POSTGRESQL_SETUP.md`.
- For GitHub API information, see `docs/GITHUB_API.md`.
# Copilot Account Manager

A Next.js dashboard for tracking and managing GitHub Copilot account usage, backed by SpacetimeDB for real-time updates.

## What this project does

- Displays account usage and status in card and table views
- Supports adding, refreshing, editing, and removing Copilot accounts
- Shows dashboard metrics and usage trends
- Uses a shared `GitHubCopilot` SVG component for consistent branding

## Tech stack

- Next.js 16 + React 19
- TypeScript
- Tailwind CSS + shadcn/ui
- SpacetimeDB (`spacetimedb` + `spacetimedb/react`)

## Prerequisites

- Node.js 20+
- bun (preferred) or npm
- SpacetimeDB CLI installed

## Environment setup

1. Copy env template:

   ```bash
   cp .env.example .env.local
   ```

2. Verify or set:

   ```env
   NEXT_PUBLIC_SPACETIMEDB_URL=ws://127.0.0.1:4000
   ```

## Local development

### 1) Start SpacetimeDB

```bash
spacetime start -- --listen-addr 0.0.0.0:4000
```

### 2) Publish backend module

```bash
cd server
spacetime publish copilot-monitor -s http://127.0.0.1:4000
```

### 3) Run frontend

From project root:

```bash
bun install
bun dev
```

Or with npm:

```bash
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
- `src/lib/spacetimedb` — generated bindings + provider/hooks
- `server/spacetimedb` — SpacetimeDB module source

## Branding: GitHub Copilot logo component

The shared logo component lives at `src/components/GitHubCopilot.tsx` and is used in multiple UI locations:

- Sidebar product mark
- Top site header title area
- Dashboard empty-state callout

To use it elsewhere:

```tsx
import { GitHubCopilot } from '@/components/GitHubCopilot';

<GitHubCopilot className="text-primary size-5" />;
```

## Notes

- Keep secrets in `.env.local` only.
- Do not commit `.env.local`.
- For additional backend details, see `SPACETIMEDB_SETUP.md`.

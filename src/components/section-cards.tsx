'use client';

import {
  IconAlertCircle,
  IconShieldCheck,
  IconUsers,
  IconClock,
} from '@tabler/icons-react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { CopilotAccount } from '@/components/data-table';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** "in Xd Yh" countdown for the next reset date */
function countdownLabel(utc: string): string {
  const diff = new Date(utc).getTime() - Date.now();
  if (diff <= 0) return 'Resetting soon';
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  return d > 0 ? `in ${d}d ${h}h` : `in ${h}h`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SectionCards({ accounts }: { accounts: CopilotAccount[] }) {
  // 1. Total tracked accounts
  const total = accounts.length;

  // 2. Critical (< 30% remaining)
  const critical = accounts.filter(
    (a) => a.premiumPercentRemaining < 30
  ).length;

  // 3. Average premium remaining
  const avgRemaining =
    total > 0
      ? accounts.reduce((sum, a) => sum + a.premiumPercentRemaining, 0) / total
      : 0;

  // 4. Next quota reset — find the earliest reset date
  const nextReset =
    total > 0
      ? accounts.reduce((earliest, a) =>
          a.quotaResetDateUtc < earliest.quotaResetDateUtc ? a : earliest
        ).quotaResetDateUtc
      : null;

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* Card 1 — Total Accounts */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Tracked Accounts</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {total}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconUsers className="size-3" />
              All
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {total} GitHub Copilot account{total !== 1 ? 's' : ''} monitored
          </div>
          <div className="text-muted-foreground">
            Individual &amp; organisational plans
          </div>
        </CardFooter>
      </Card>

      {/* Card 2 — Critical Accounts */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Critical Accounts</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {critical}
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className={critical > 0 ? 'text-red-500' : 'text-green-500'}
            >
              <IconAlertCircle className="size-3" />
              {critical > 0 ? 'Needs action' : 'All clear'}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {critical > 0
              ? `${critical} account${critical !== 1 ? 's' : ''} below 30% premium quota`
              : 'No accounts in critical state'}
          </div>
          <div className="text-muted-foreground">
            Premium interactions running low
          </div>
        </CardFooter>
      </Card>

      {/* Card 3 — Avg Premium Remaining */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Avg Premium Remaining</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {avgRemaining.toFixed(1)}%
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className={
                avgRemaining >= 70
                  ? 'text-green-500'
                  : avgRemaining >= 30
                    ? 'text-yellow-500'
                    : 'text-red-500'
              }
            >
              <IconShieldCheck className="size-3" />
              {avgRemaining >= 70
                ? 'Healthy'
                : avgRemaining >= 30
                  ? 'Watch'
                  : 'Low'}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Average across all {total} accounts
          </div>
          <div className="text-muted-foreground">
            Based on last snapshot data
          </div>
        </CardFooter>
      </Card>

      {/* Card 4 — Next Quota Reset */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Next Quota Reset</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {nextReset ? countdownLabel(nextReset) : '—'}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconClock className="size-3" />
              IST
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {nextReset
              ? new Date(nextReset).toLocaleString('en-IN', {
                  timeZone: 'Asia/Kolkata',
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : 'No accounts found'}
          </div>
          <div className="text-muted-foreground">
            Earliest reset across all accounts
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

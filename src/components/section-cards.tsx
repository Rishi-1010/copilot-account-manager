'use client';

import {
  IconUsers,
  IconTrendingUp,
  IconCurrencyDollar,
  IconChartBar,
  IconPercentage,
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
import type { CopilotAccount } from '@/lib/db/types';
import { QUOTA_CONFIG, calculateUsagePercentage } from '@/lib/quota-config';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPeriod(timePeriod?: { year: number; month?: number }): string {
  if (!timePeriod) return 'Unknown';
  if (timePeriod.month) {
    const monthName = new Date(timePeriod.year, timePeriod.month - 1).toLocaleString('en-US', { month: 'short' });
    return `${monthName} ${timePeriod.year}`;
  }
  return `${timePeriod.year}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SectionCards({ accounts }: { accounts: CopilotAccount[] }) {
  // 1. Total tracked accounts
  const total = accounts.length;

  // 2. Accounts with usage
  const activeAccounts = accounts.filter(
    (a) => a.usageData && a.usageData.totalRequests > 0
  ).length;

  // 3. Total requests across all accounts
  const totalRequests = accounts.reduce(
    (sum, a) => sum + (a.usageData?.totalRequests || 0),
    0
  );

  // 4. Total amount spent
  const totalSpent = accounts.reduce(
    (sum, a) => sum + (a.usageData?.totalAmount || 0),
    0
  );
  
  // 5. Average usage percentage across all accounts
  const avgUsagePercentage = activeAccounts > 0
    ? accounts
        .filter((a) => a.usageData && a.usageData.totalRequests > 0)
        .reduce((sum, a) => {
          const requestsPct = calculateUsagePercentage(
            a.usageData?.totalRequests || 0,
            QUOTA_CONFIG.MONTHLY_REQUEST_LIMIT
          );
          const budgetPct = calculateUsagePercentage(
            a.usageData?.totalAmount || 0,
            QUOTA_CONFIG.MONTHLY_BUDGET_LIMIT
          );
          return sum + Math.max(requestsPct, budgetPct);
        }, 0) / activeAccounts
    : 0;
    
  // Total budget usage percentage
  const totalBudgetPct = calculateUsagePercentage(
    totalSpent,
    QUOTA_CONFIG.MONTHLY_BUDGET_LIMIT * total
  );

  // Get the period from first account with usage data
  const period = accounts.find((a) => a.usageData)?.usageData?.timePeriod;
  const periodLabel = formatPeriod(period);

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
            {activeAccounts} active in {periodLabel}
          </div>
        </CardFooter>
      </Card>

      {/* Card 2 — Active Accounts */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Accounts</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {activeAccounts}
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className={activeAccounts > 0 ? 'text-green-500' : 'text-muted-foreground'}
            >
              <IconChartBar className="size-3" />
              {activeAccounts > 0 ? 'Active' : 'Idle'}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {activeAccounts > 0
              ? `${activeAccounts} account${activeAccounts !== 1 ? 's' : ''} with usage`
              : 'No usage data this period'}
          </div>
          <div className="text-muted-foreground">
            Period: {periodLabel}
          </div>
        </CardFooter>
      </Card>

      {/* Card 3 — Average Usage */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Avg Usage</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {avgUsagePercentage.toFixed(1)}%
          </CardTitle>
          <CardAction>
            <Badge 
              variant="outline" 
              className={
                avgUsagePercentage >= 90
                  ? 'text-red-500'
                  : avgUsagePercentage >= 70
                    ? 'text-yellow-500'
                    : avgUsagePercentage >= 50
                      ? 'text-orange-500'
                      : 'text-green-500'
              }
            >
              <IconPercentage className="size-3" />
              {avgUsagePercentage >= 90
                ? 'Critical'
                : avgUsagePercentage >= 70
                  ? 'Warning'
                  : avgUsagePercentage >= 50
                    ? 'Watch'
                    : 'Healthy'}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {activeAccounts > 0
              ? `Average budget usage across ${activeAccounts} account${activeAccounts !== 1 ? 's' : ''}`
              : 'No active accounts'}
          </div>
          <div className="text-muted-foreground">
            Based on ${QUOTA_CONFIG.MONTHLY_BUDGET_LIMIT}/mo limit
          </div>
        </CardFooter>
      </Card>

      {/* Card 4 — Total Spent */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Spent</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            ${totalSpent.toFixed(2)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-green-500">
              <IconCurrencyDollar className="size-3" />
              USD
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {totalSpent > 0
              ? `$${(totalSpent / Math.max(activeAccounts, 1)).toFixed(2)} avg per active account`
              : 'No charges this period'}
          </div>
          <div className="text-muted-foreground">
            Billing for {periodLabel}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

'use client';

import * as React from 'react';
import {
  IconDotsVertical,
  IconEdit,
  IconRefresh,
  IconTrash,
  IconTrendingUp,
  IconCurrencyDollar,
  IconAlertCircle,
  IconShieldCheck,
} from '@tabler/icons-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import type { CopilotAccount } from '@/components/data-table';
import { QUOTA_CONFIG, calculateUsagePercentage, getUsageStatus } from '@/lib/quota-config';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(utc: string): string {
  try {
    return new Date(utc).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return utc;
  }
}

function formatPeriod(timePeriod?: { year: number; month?: number }): string {
  if (!timePeriod) return 'No data';
  if (timePeriod.month) {
    const monthName = new Date(timePeriod.year, timePeriod.month - 1).toLocaleString('en-US', { month: 'short' });
    return `${monthName} ${timePeriod.year}`;
  }
  return `${timePeriod.year}`;
}

// ─── AccountCard ───────────────────────────────────────────────────────────────

export function AccountCard({
  account,
  onRefresh,
  onEdit,
  onDelete,
}: {
  account: CopilotAccount;
  onRefresh?: (id: number) => void;
  onEdit?: (account: CopilotAccount) => void;
  onDelete?: (id: number) => void;
}) {
  const hasUsage = account.usageData && account.usageData.totalRequests > 0;
  const totalRequests = account.usageData?.totalRequests || 0;
  const totalAmount = account.usageData?.totalAmount || 0;
  const period = formatPeriod(account.usageData?.timePeriod);
  
  // Calculate usage percentages
  const requestsPercentage = calculateUsagePercentage(totalRequests, QUOTA_CONFIG.MONTHLY_REQUEST_LIMIT);
  const budgetPercentage = calculateUsagePercentage(totalAmount, QUOTA_CONFIG.MONTHLY_BUDGET_LIMIT);
  const usagePercentage = Math.max(requestsPercentage, budgetPercentage);
  const status = getUsageStatus(usagePercentage);

  return (
    <Card className="@container/card relative">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={account.avatarUrl}
              alt={account.login}
              className="size-10 rounded-full border"
            />
            <div className="min-w-0">
              <CardTitle className="truncate text-base">
                {account.login}
              </CardTitle>
              <CardDescription className="mt-0.5 flex items-center gap-1.5">
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                  {account.plan}
                </Badge>
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {hasUsage && (
              <Badge 
                variant={usagePercentage >= 90 ? 'destructive' : usagePercentage >= 70 ? 'secondary' : 'outline'}
                className="gap-1 text-xs"
              >
                {usagePercentage >= 90 ? <IconAlertCircle className="size-3" /> : <IconShieldCheck className="size-3" />}
                {status.label}
              </Badge>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7">
                  <IconDotsVertical className="size-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem onClick={() => onRefresh?.(account.id)}>
                  <IconRefresh className="mr-2 size-4" />
                  Refresh
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(account)}>
                  <IconEdit className="mr-2 size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete?.(account.id)}
                >
                  <IconTrash className="mr-2 size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {/* Usage Stats */}
        {hasUsage ? (
          <>
            {/* Usage percentage bar */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Budget Used</span>
                <span className={`font-semibold ${status.color}`}>
                  {usagePercentage.toFixed(1)}%
                </span>
              </div>
              <Progress value={usagePercentage} className={`h-2 ${status.bgColor}`} />
              <div className="text-muted-foreground flex justify-between text-[11px]">
                <span>
                  {usagePercentage < 100 
                    ? `${(100 - usagePercentage).toFixed(0)}% remaining`
                    : 'Over budget'
                  }
                </span>
                <span>{period}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-muted/50 rounded-md p-2.5">
                <div className="flex items-center gap-1 text-muted-foreground mb-1">
                  <IconTrendingUp className="size-3" />
                  <span className="text-[10px] uppercase tracking-wide">Requests</span>
                </div>
                <span className="font-semibold text-base">
                  {totalRequests.toLocaleString()}
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  {requestsPercentage.toFixed(0)}% of {QUOTA_CONFIG.MONTHLY_REQUEST_LIMIT}
                </span>
              </div>
              <div className="bg-muted/50 rounded-md p-2.5">
                <div className="flex items-center gap-1 text-muted-foreground mb-1">
                  <IconCurrencyDollar className="size-3" />
                  <span className="text-[10px] uppercase tracking-wide">Spent</span>
                </div>
                <span className="font-semibold text-base">
                  ${totalAmount.toFixed(2)}
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  {budgetPercentage.toFixed(0)}% of ${QUOTA_CONFIG.MONTHLY_BUDGET_LIMIT}
                </span>
              </div>
            </div>

            {/* Model breakdown */}
            {account.usageData?.items && account.usageData.items.length > 0 && (
              <div className="flex flex-col gap-1.5 border-t pt-2">
                <span className="text-muted-foreground text-[10px] uppercase tracking-wide font-medium">Models Used</span>
                <div className="flex flex-col gap-1 text-xs">
                  {account.usageData.items.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-muted-foreground truncate flex-1 mr-2">{item.model}</span>
                      <span className="font-medium tabular-nums">{item.grossQuantity.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-muted/30 rounded-md p-4 text-center">
            <span className="text-muted-foreground text-xs">No usage data for {period}</span>
          </div>
        )}

        {/* Last Updated */}
        <div className="flex justify-between border-t pt-2 text-xs">
          <span className="text-muted-foreground">Period</span>
          <span className="font-medium">{period}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Last Updated</span>
          <span>{formatDate(account.lastSnapshotUtc)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Card Grid ────────────────────────────────────────────────────────────────

export function AccountCardGrid({
  accounts,
  onRefresh,
  onEdit,
  onDelete,
}: {
  accounts: CopilotAccount[];
  onRefresh?: (id: number) => void;
  onEdit?: (account: CopilotAccount) => void;
  onDelete?: (id: number) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {accounts.map((account) => (
        <AccountCard
          key={account.id}
          account={account}
          onRefresh={onRefresh}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

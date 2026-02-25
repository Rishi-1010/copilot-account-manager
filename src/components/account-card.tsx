'use client';

import * as React from 'react';
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconDotsVertical,
  IconEdit,
  IconRefresh,
  IconShieldCheck,
  IconTrash,
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

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getStatusInfo(pct: number) {
  if (pct < 10)
    return {
      label: 'Critical',
      variant: 'destructive' as const,
      icon: IconAlertCircle,
    };
  if (pct < 30)
    return {
      label: 'Low',
      variant: 'secondary' as const,
      icon: IconAlertTriangle,
    };
  if (pct < 70)
    return {
      label: 'Watch',
      variant: 'secondary' as const,
      icon: IconAlertTriangle,
    };
  return {
    label: 'Healthy',
    variant: 'outline' as const,
    icon: IconShieldCheck,
  };
}

function toIST(utc: string): string {
  try {
    return (
      new Date(utc).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }) + ' IST'
    );
  } catch {
    return utc;
  }
}

function countdown(utc: string): string {
  const diff = new Date(utc).getTime() - Date.now();
  const abs = Math.abs(diff);
  const d = Math.floor(abs / 86_400_000);
  const h = Math.floor((abs % 86_400_000) / 3_600_000);
  const label = d > 0 ? `${d}d ${h}h` : `${h}h`;
  return diff > 0 ? `in ${label}` : `${label} ago`;
}

function statusColor(pct: number) {
  if (pct < 10) return 'text-red-500';
  if (pct < 30) return 'text-orange-500';
  if (pct < 70) return 'text-yellow-500';
  return 'text-green-500';
}

function progressColor(pct: number) {
  if (pct < 10) return '[&>div]:bg-red-500';
  if (pct < 30) return '[&>div]:bg-orange-500';
  if (pct < 70) return '[&>div]:bg-yellow-500';
  return '[&>div]:bg-green-500';
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
  const pct = account.premiumPercentRemaining;
  const { label, variant, icon: StatusIcon } = getStatusInfo(pct);

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
            <Badge variant={variant} className="gap-1 text-xs">
              <StatusIcon className="size-3" />
              {label}
            </Badge>
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
        {/* Premium usage bar */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Premium Remaining</span>
            <span className={`font-semibold ${statusColor(pct)}`}>
              {pct.toFixed(1)}%
            </span>
          </div>
          <Progress value={pct} className={`h-2 ${progressColor(pct)}`} />
          <div className="text-muted-foreground flex justify-between text-[11px]">
            <span>
              {account.premiumUnitsRemaining} / {account.premiumEntitlement}{' '}
              units
            </span>
            <span>{(100 - pct).toFixed(1)}% used</span>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-muted/50 rounded-md p-2">
            <span className="text-muted-foreground block">Chat</span>
            <span className="font-medium">
              {account.chatUnlimited ? 'Unlimited' : 'Limited'}
            </span>
          </div>
          <div className="bg-muted/50 rounded-md p-2">
            <span className="text-muted-foreground block">Completions</span>
            <span className="font-medium">
              {account.completionsUnlimited ? 'Unlimited' : 'Limited'}
            </span>
          </div>
        </div>

        {/* Reset & Last Checked */}
        <div className="flex flex-col gap-1 border-t pt-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Resets</span>
            <span className="font-medium">
              {countdown(account.quotaResetDateUtc)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Checked</span>
            <span>{toIST(account.lastSnapshotUtc)}</span>
          </div>
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

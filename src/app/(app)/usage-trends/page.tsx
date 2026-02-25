'use client';

import * as React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';

import { useAccounts } from '@/lib/spacetimedb/provider';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// ─── Chart configuration ───────────────────────────────────────────────────────

const trendConfig = {
  premium: {
    label: 'Premium %',
    color: 'var(--primary)',
  },
} satisfies ChartConfig;

const distributionConfig = {
  accounts: {
    label: 'Accounts',
    color: 'var(--primary)',
  },
} satisfies ChartConfig;

// ─── Component ─────────────────────────────────────────────────────────────────

export default function UsageTrendsPage() {
  const { accounts, isLoading } = useAccounts();
  const [timeRange, setTimeRange] = React.useState('current');

  if (isLoading && accounts.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <span className="text-muted-foreground animate-pulse text-sm">
          Loading usage data…
        </span>
      </div>
    );
  }

  // Build current snapshot data for charts
  const accountTrendData = accounts
    .sort((a, b) => a.login.localeCompare(b.login))
    .map((a) => ({
      login: a.login,
      premium: a.premiumPercentRemaining,
      used: 100 - a.premiumPercentRemaining,
      units: a.premiumUnitsRemaining,
      total: a.premiumEntitlement,
    }));

  // Usage distribution buckets
  const buckets = [
    { range: '0-10%', min: 0, max: 10 },
    { range: '10-30%', min: 10, max: 30 },
    { range: '30-50%', min: 30, max: 50 },
    { range: '50-70%', min: 50, max: 70 },
    { range: '70-90%', min: 70, max: 90 },
    { range: '90-100%', min: 90, max: 101 },
  ];
  const distributionData = buckets.map((b) => ({
    range: b.range,
    accounts: accounts.filter(
      (a) =>
        a.premiumPercentRemaining >= b.min && a.premiumPercentRemaining < b.max
    ).length,
  }));

  // Averages
  const avgPremium =
    accounts.length > 0
      ? accounts.reduce((s, a) => s + a.premiumPercentRemaining, 0) /
        accounts.length
      : 0;
  const totalUnitsUsed = accounts.reduce(
    (s, a) => s + (a.premiumEntitlement - a.premiumUnitsRemaining),
    0
  );
  const totalEntitlement = accounts.reduce(
    (s, a) => s + a.premiumEntitlement,
    0
  );

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* Page header */}
      <div className="flex flex-col gap-1 px-4 lg:px-6">
        <h2 className="text-xl font-semibold">Usage Trends</h2>
        <p className="text-muted-foreground text-sm">
          Visualize premium usage across all monitored Copilot accounts.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-3 lg:px-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Premium Remaining</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {avgPremium.toFixed(1)}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={avgPremium} className="[&>div]:bg-primary h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Units Used</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {totalUnitsUsed.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">
              out of {totalEntitlement.toLocaleString()} total entitlement
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Accounts Below 30%</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {accounts.filter((a) => a.premiumPercentRemaining < 30).length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">
              of {accounts.length} total accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Premium remaining per account — Area chart */}
      <div className="px-4 lg:px-6">
        <Card className="@container/card">
          <CardHeader>
            <CardTitle>Premium Remaining by Account</CardTitle>
            <CardDescription>
              Current premium interaction quota remaining per account
            </CardDescription>
            <CardAction>
              <Badge variant="outline" className="text-xs">
                Current Snapshot
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            <ChartContainer
              config={trendConfig}
              className="aspect-auto h-[300px] w-full"
            >
              <AreaChart data={accountTrendData}>
                <defs>
                  <linearGradient id="fillPremium" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-premium)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-premium)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="login"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={11}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  fontSize={11}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => value}
                      indicator="dot"
                    />
                  }
                />
                <Area
                  dataKey="premium"
                  type="monotone"
                  fill="url(#fillPremium)"
                  stroke="var(--color-premium)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Distribution chart */}
      <div className="px-4 lg:px-6">
        <Card className="@container/card">
          <CardHeader>
            <CardTitle>Usage Distribution</CardTitle>
            <CardDescription>
              How accounts are distributed across premium usage buckets
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            <ChartContainer
              config={distributionConfig}
              className="aspect-auto h-[250px] w-full"
            >
              <BarChart data={distributionData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="range"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={11}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  allowDecimals={false}
                  fontSize={11}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Bar
                  dataKey="accounts"
                  fill="var(--color-accounts)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Per-account breakdown table */}
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Breakdown</CardTitle>
            <CardDescription>
              Detailed usage for each monitored account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {accountTrendData.map((row) => (
                <div
                  key={row.login}
                  className="flex items-center gap-4 rounded-lg border p-3"
                >
                  <span className="min-w-[120px] truncate text-sm font-medium">
                    {row.login}
                  </span>
                  <div className="flex-1">
                    <Progress
                      value={row.premium}
                      className={`h-2 ${
                        row.premium < 10
                          ? '[&>div]:bg-red-500'
                          : row.premium < 30
                            ? '[&>div]:bg-orange-500'
                            : row.premium < 70
                              ? '[&>div]:bg-yellow-500'
                              : '[&>div]:bg-green-500'
                      }`}
                    />
                  </div>
                  <span className="min-w-[60px] text-right text-sm font-medium tabular-nums">
                    {row.premium.toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground min-w-[100px] text-right text-xs tabular-nums">
                    {row.units} / {row.total} units
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

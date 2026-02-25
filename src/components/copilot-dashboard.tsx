'use client';

import { DataTable } from '@/components/data-table';
import { SectionCards } from '@/components/section-cards';
import { ChartAreaInteractive } from '@/components/chart-area-interactive';
import { useAccounts } from '@/lib/spacetimedb/provider';

export function CopilotDashboard() {
  const { accounts, isLoading } = useAccounts();

  if (isLoading && accounts.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <span className="text-muted-foreground animate-pulse text-sm">
          Connecting to SpacetimeDB…
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards accounts={accounts} />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <DataTable data={accounts} />
    </div>
  );
}

'use client';

import * as React from 'react';
import { IconLayoutGrid, IconTable, IconRefresh } from '@tabler/icons-react';

import { useAccounts } from '@/lib/db/provider';
import { SectionCards } from '@/components/section-cards';
import { DataTable } from '@/components/data-table';
import { AccountsManager } from '@/components/accounts-manager';
import { AddAccountModal } from '@/components/add-account-modal';
import { GitHubCopilot } from '@/components/GitHubCopilot';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export default function DashboardPage() {
  const { accounts, isLoading, refresh, addAccount, removeAccount } =
    useAccounts();
  const [view, setView] = React.useState<string>('cards');

  if (isLoading && accounts.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <span className="text-muted-foreground animate-pulse text-sm">
          Loading accounts…
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards accounts={accounts} />

      {/* View toggle toolbar */}
      <div className="flex items-center justify-between px-4 lg:px-6">
        <h2 className="text-lg font-semibold">All Accounts</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => accounts.forEach((a) => refresh(a.id))}
          >
            <IconRefresh className="mr-1.5 size-4" />
            Refresh All
          </Button>
          {/* Add Account — shared AddAccountModal, no code duplication */}
          <AddAccountModal onAdd={addAccount} />
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(v) => v && setView(v)}
            variant="outline"
          >
            <ToggleGroupItem value="cards" aria-label="Card view">
              <IconLayoutGrid className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="table" aria-label="Table view">
              <IconTable className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Card view */}
      {view === 'cards' && (
        <div className="px-4 lg:px-6">
          {accounts.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-20">
              <GitHubCopilot className="text-primary mb-1 size-12" />
              <p className="text-muted-foreground text-sm">
                No accounts yet. Add your first GitHub Copilot account to get
                started.
              </p>
              <AddAccountModal onAdd={addAccount} />
            </div>
          ) : (
            // AccountsManager owns edit + delete state & modals — no duplication
            <AccountsManager />
          )}
        </div>
      )}

      {/* Table view — Add Account + Refresh/Remove wired to real reducers */}
      {view === 'table' && (
        <DataTable
          data={accounts}
          onRefresh={refresh}
          onDelete={removeAccount}
          onAdd={addAccount}
        />
      )}
    </div>
  );
}

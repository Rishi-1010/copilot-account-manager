'use client';

import * as React from 'react';
import { IconRefresh } from '@tabler/icons-react';

import { useAccounts } from '@/lib/db/provider';
import { AccountsManager } from '@/components/accounts-manager';
import { AddAccountModal } from '@/components/add-account-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AccountsPage() {
  const { accounts, isLoading, refresh, refreshAccount, addAccount } = useAccounts();
  const [search, setSearch] = React.useState('');

  // Filter accounts by search (passed to AccountsManager as overridden list)
  const filtered = React.useMemo(() => {
    if (!search.trim()) return accounts;
    const q = search.toLowerCase();
    return accounts.filter(
      (a) =>
        a.login.toLowerCase().includes(q) || a.plan.toLowerCase().includes(q)
    );
  }, [accounts, search]);

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
      {/* Header toolbar */}
      <div className="flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <div>
          <h2 className="text-xl font-semibold">Accounts</h2>
          <p className="text-muted-foreground text-sm">
            Manage your GitHub Copilot accounts. Add tokens, refresh usage data,
            or remove accounts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              for (const account of accounts) {
                try {
                  await refreshAccount(account.id);
                } catch (err) {
                  console.error(`Failed to refresh account ${account.login}:`, err);
                }
              }
            }}
          >
            <IconRefresh className="mr-1.5 size-4" />
            Refresh All
          </Button>
          <AddAccountModal onAdd={addAccount} />
        </div>
      </div>

      {/* Search */}
      <div className="px-4 lg:px-6">
        <Input
          placeholder="Search accounts by login or plan…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Cards grid — AccountsManager owns Edit/Delete state & modals (DRY) */}
      {filtered.length > 0 ? (
        <div className="px-4 lg:px-6">
          <AccountsManager accounts={filtered} />
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-20">
          <p className="text-muted-foreground text-sm">
            {accounts.length === 0
              ? 'No accounts yet. Add your first GitHub Copilot account to get started.'
              : 'No accounts match your search.'}
          </p>
          {accounts.length === 0 && <AddAccountModal onAdd={addAccount} />}
        </div>
      )}
    </div>
  );
}

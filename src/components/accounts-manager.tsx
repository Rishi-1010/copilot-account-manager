'use client';

/**
 * AccountsManager
 *
 * DRY shared component that renders AccountCardGrid with fully wired
 * Edit and Delete actions. Reads useAccounts() internally so callers
 * don't need to manage their own edit/delete state.
 *
 * Pass an optional `accounts` prop to feed a pre-filtered list (e.g. from
 * the Accounts page search box). Omit it to show all accounts.
 */

import * as React from 'react';

import { useAccounts } from '@/lib/spacetimedb/provider';
import { AccountCardGrid } from '@/components/account-card';
import { EditAccountModal } from '@/components/edit-account-modal';
import { DeleteAccountDialog } from '@/components/delete-account-dialog';
import type { CopilotAccount } from '@/components/data-table';

interface AccountsManagerProps {
  /** Pre-filtered list — falls back to the full list from context when omitted */
  accounts?: CopilotAccount[];
}

export function AccountsManager({
  accounts: propAccounts,
}: AccountsManagerProps) {
  const {
    accounts: ctxAccounts,
    refresh,
    removeAccount,
    updateAccount,
  } = useAccounts();

  // Use the caller-supplied list (filtered) or the full context list
  const accounts = propAccounts ?? ctxAccounts;

  const [editAccount, setEditAccount] = React.useState<CopilotAccount | null>(
    null
  );
  const [deleteId, setDeleteId] = React.useState<number | null>(null);

  // Look up login from the full context list so deletes work even when
  // propAccounts is a filtered subset
  const deleteLogin = ctxAccounts.find((a) => a.id === deleteId)?.login ?? null;

  return (
    <>
      <AccountCardGrid
        accounts={accounts}
        onRefresh={refresh}
        onEdit={setEditAccount}
        onDelete={setDeleteId}
      />

      {/* ─── Edit token modal ─────────────────────────────────────── */}
      <EditAccountModal
        account={editAccount}
        open={!!editAccount}
        onOpenChange={(open) => {
          if (!open) setEditAccount(null);
        }}
        onSave={(id, token) => {
          updateAccount(id, token);
          setEditAccount(null);
        }}
      />

      {/* ─── Delete confirmation dialog ───────────────────────────── */}
      <DeleteAccountDialog
        accountLogin={deleteLogin}
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        onConfirm={() => {
          if (deleteId !== null) removeAccount(deleteId);
          setDeleteId(null);
        }}
      />
    </>
  );
}

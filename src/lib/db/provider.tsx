'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { CopilotAccount, CreateAccountInput, UpdateAccountInput } from '@/lib/db/types';

interface AccountsContextType {
  accounts: CopilotAccount[];
  loading: boolean;
  isLoading: boolean; // alias for loading
  error: string | null;
  addAccount: (input: CreateAccountInput) => Promise<void>;
  updateAccount: (input: UpdateAccountInput) => Promise<void>;
  removeAccount: (id: number) => Promise<void>;
  refreshAccount: (id: number) => Promise<void>; // refresh single account from GitHub
  refresh: () => Promise<void>; // alias for refreshAccounts
  refreshAccounts: () => Promise<void>;
}

const AccountsContext = createContext<AccountsContextType | undefined>(undefined);

export function AccountsProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<CopilotAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/accounts');
      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }
      const data = await response.json();
      setAccounts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const addAccount = async (input: CreateAccountInput) => {
    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create account');
      }
      
      await fetchAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const updateAccount = async (input: UpdateAccountInput) => {
    try {
      const response = await fetch(`/api/accounts/${input.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update account');
      }
      
      await fetchAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const removeAccount = async (id: number) => {
    try {
      const response = await fetch(`/api/accounts/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete account');
      }
      
      await fetchAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const refreshAccount = async (id: number) => {
    try {
      // Find the account to get its token and username
      const account = accounts.find(a => a.id === id);
      if (!account) {
        throw new Error('Account not found');
      }

      // Fetch fresh usage data from our API route
      const quotaResponse = await fetch('/api/github/quota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: account.tokenEncrypted,
          username: account.login 
        }),
      });

      if (!quotaResponse.ok) {
        const errorData = await quotaResponse.json();
        throw new Error(errorData.error || 'Failed to fetch usage data');
      }

      const data = await quotaResponse.json();

      // Update account with fresh data including usageData
      await updateAccount({
        id,
        premiumPercentRemaining: data.premiumPercentRemaining,
        premiumUnitsRemaining: data.premiumUnitsRemaining,
        premiumEntitlement: data.premiumEntitlement,
        chatUnlimited: data.chatUnlimited,
        completionsUnlimited: data.completionsUnlimited,
        quotaResetDateUtc: data.quotaResetDateUtc,
        lastSnapshotUtc: new Date().toISOString(),
        usageData: data.usageData,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const refreshAccounts = async () => {
    await fetchAccounts();
  };

  return (
    <AccountsContext.Provider
      value={{
        accounts,
        loading,
        isLoading: loading,
        error,
        addAccount,
        updateAccount,
        removeAccount,
        refreshAccount,
        refresh: fetchAccounts,
        refreshAccounts: fetchAccounts,
      }}
    >
      {children}
    </AccountsContext.Provider>
  );
}

export function useAccounts() {
  const context = useContext(AccountsContext);
  if (context === undefined) {
    throw new Error('useAccounts must be used within an AccountsProvider');
  }
  return context;
}

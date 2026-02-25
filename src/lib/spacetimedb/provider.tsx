'use client';

/**
 * SpacetimeDB 2.0 – React provider + useAccounts hook
 *
 * Uses the OFFICIAL SpacetimeDB React integration from `spacetimedb/react`:
 *   - SpacetimeDBProvider — manages WebSocket lifecycle
 *   - useTable            — real-time reactive table subscriptions
 *   - useReducer          — type-safe reducer calls
 *   - useSpacetimeDB      — connection state (isActive, identity, etc.)
 *
 * Set NEXT_PUBLIC_SPACETIMEDB_URL (e.g. ws://127.0.0.1:4000) to enable.
 * If unset the app starts with an empty account list.
 *
 * SDK reference: https://spacetimedb.com/docs/clients/typescript
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import {
  SpacetimeDBProvider,
  useSpacetimeDB,
  useTable,
  useReducer as useStdbReducer,
} from 'spacetimedb/react';

import type { CopilotAccount } from './types';
import { DbConnection, tables, reducers } from './index';

// ────────────────────────────────────────────────────────────────────────────
// Context shape (public API — unchanged for consumers)
// ────────────────────────────────────────────────────────────────────────────
export interface SpacetimeState {
  accounts: CopilotAccount[];
  isConnected: boolean;
  isLoading: boolean;
  /** Call to trigger a server-side quota refresh for one account */
  refresh: (id: number) => void;
  /** Add a new account by providing a GitHub token */
  addAccount: (token: string) => void;
  /** Remove an account by id */
  removeAccount: (id: number) => void;
  /** Update an account's token */
  updateAccount: (id: number, token: string) => void;
}

const defaultState: SpacetimeState = {
  accounts: [],
  isConnected: false,
  isLoading: true,
  refresh: () => {},
  addAccount: () => {},
  removeAccount: () => {},
  updateAccount: () => {},
};

const SpacetimeContext = createContext<SpacetimeState>(defaultState);

// ────────────────────────────────────────────────────────────────────────────
// Public hook used by any client component in the dashboard
// ────────────────────────────────────────────────────────────────────────────
export function useAccounts(): SpacetimeState {
  return useContext(SpacetimeContext);
}

// ────────────────────────────────────────────────────────────────────────────
// Top-level provider – picks live vs empty based on env var
// ────────────────────────────────────────────────────────────────────────────
export function SpacetimeCopilotProvider({
  children,
}: {
  children: ReactNode;
}) {
  const url = process.env.NEXT_PUBLIC_SPACETIMEDB_URL;

  if (url) {
    return <LiveProvider url={url}>{children}</LiveProvider>;
  }

  // No URL configured — start with empty list, user can add accounts via UI
  return <EmptyProvider>{children}</EmptyProvider>;
}

// ────────────────────────────────────────────────────────────────────────────
// EmptyProvider – used when no SpacetimeDB URL is configured.
// ────────────────────────────────────────────────────────────────────────────
function EmptyProvider({ children }: { children: ReactNode }) {
  return (
    <SpacetimeContext.Provider
      value={{
        accounts: [],
        isConnected: false,
        isLoading: false,
        refresh: () => {},
        addAccount: () =>
          console.warn(
            '[SpacetimeDB] Set NEXT_PUBLIC_SPACETIMEDB_URL to enable live data.'
          ),
        removeAccount: () => {},
        updateAccount: () => {},
      }}
    >
      {children}
    </SpacetimeContext.Provider>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// LiveProvider – wraps the official SpacetimeDBProvider and bridges its hooks
// into our SpacetimeContext so that `useAccounts()` works everywhere.
//
// Flow:
//   SpacetimeDBProvider (manages WebSocket + SDK internals)
//     └─ LiveAccountsBridge (reads useTable/useReducer, writes our context)
//          └─ {children}
// ────────────────────────────────────────────────────────────────────────────
function LiveProvider({ url, children }: { url: string; children: ReactNode }) {
  // Build the connection builder ONCE (stable across renders).
  // Do NOT call .build() — SpacetimeDBProvider does that.
  const connectionBuilder = useMemo(
    () =>
      DbConnection.builder()
        .withUri(url)
        .withDatabaseName('copilot-monitor')
        .onConnect((_conn, identity, _token) => {
          console.info(
            '[SpacetimeDB] Connected. Identity:',
            identity.toHexString().slice(0, 12) + '…'
          );
        })
        .onDisconnect(() => {
          console.info('[SpacetimeDB] Disconnected.');
        })
        .onConnectError((_ctx, err) => {
          console.warn('[SpacetimeDB] Connection error:', err.message);
        }),
    [url]
  );

  return (
    <SpacetimeDBProvider connectionBuilder={connectionBuilder}>
      <LiveAccountsBridge>{children}</LiveAccountsBridge>
    </SpacetimeDBProvider>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// LiveAccountsBridge – must be a CHILD of SpacetimeDBProvider so the hooks
// (`useTable`, `useReducer`, `useSpacetimeDB`) resolve correctly.
// ────────────────────────────────────────────────────────────────────────────
function LiveAccountsBridge({ children }: { children: ReactNode }) {
  const { isActive, connectionError } = useSpacetimeDB();

  // useTable subscribes to all rows in copilot_account.
  // Returns [rows, isReady]. isReady = true once the initial snapshot loaded.
  const [accounts, isReady] = useTable(tables.copilot_account);

  // useReducer returns a typed async function to call each reducer.
  const callAdd = useStdbReducer(reducers.addAccount);
  const callRemove = useStdbReducer(reducers.removeAccount);
  const callRefresh = useStdbReducer(reducers.refreshAccount);

  const refresh = useCallback(
    (id: number) => {
      callRefresh({
        id,
        premiumPercentRemaining: 0,
        premiumUnitsRemaining: 0,
        premiumEntitlement: 300,
        chatUnlimited: true,
        completionsUnlimited: true,
        quotaResetDateUtc: '',
        lastSnapshotUtc: new Date().toISOString(),
      });
    },
    [callRefresh]
  );

  const addAccount = useCallback(
    (token: string) => {
      callAdd({
        login: '',
        avatarUrl: '',
        plan: '',
        accessTypeSku: '',
        tokenEncrypted: token,
      });
    },
    [callAdd]
  );

  const removeAccount = useCallback(
    (id: number) => {
      callRemove({ id });
    },
    [callRemove]
  );

  const updateAccount = useCallback(
    async (id: number, token: string) => {
      // Wait for the remove to complete before re-adding (avoids race condition)
      await callRemove({ id });
      await callAdd({
        login: '',
        avatarUrl: '',
        plan: '',
        accessTypeSku: '',
        tokenEncrypted: token,
      });
    },
    [callRemove, callAdd]
  );

  const value: SpacetimeState = useMemo(
    () => ({
      accounts: accounts as CopilotAccount[],
      isConnected: isActive && !connectionError,
      // Avoid permanent "Loading accounts…" when WS connection fails.
      // In error state, expose empty accounts + disconnected state instead.
      isLoading: !isReady && !connectionError,
      refresh,
      addAccount,
      removeAccount,
      updateAccount,
    }),
    [
      accounts,
      isActive,
      connectionError,
      isReady,
      refresh,
      addAccount,
      removeAccount,
      updateAccount,
    ]
  );

  return (
    <SpacetimeContext.Provider value={value}>
      {children}
    </SpacetimeContext.Provider>
  );
}

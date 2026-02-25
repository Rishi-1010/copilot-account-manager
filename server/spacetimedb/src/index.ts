import { schema, table, t } from 'spacetimedb/server';

// ── copilot_account table ──────────────────────────────────────────────────
// Mirrors the CopilotAccount type in src/lib/spacetimedb/module_bindings.ts.
// After publishing, run:
//   spacetime generate --lang typescript \
//     --out-dir src/lib/spacetimedb \
//     --module-path server/spacetimedb
// from the project root to regenerate the client bindings.

const spacetimedb = schema({
  copilotAccount: table(
    { name: 'copilot_account', public: true },
    {
      id: t.u32().primaryKey().autoInc(),
      login: t.string(),
      avatarUrl: t.string(),
      plan: t.string(),
      accessTypeSku: t.string(),
      premiumPercentRemaining: t.f64(),
      premiumUnitsRemaining: t.u32(),
      premiumEntitlement: t.u32(),
      chatUnlimited: t.bool(),
      completionsUnlimited: t.bool(),
      quotaResetDateUtc: t.string(),
      lastSnapshotUtc: t.string(),
      /** AES-encrypted PAT – never returned to clients in plaintext */
      tokenEncrypted: t.string(),
    }
  ),
});
export default spacetimedb;

// ── Lifecycle ─────────────────────────────────────────────────────────────
export const init = spacetimedb.init((_ctx) => {
  console.info('copilot-monitor module initialised');
});

export const onConnect = spacetimedb.clientConnected((_ctx) => {});
export const onDisconnect = spacetimedb.clientDisconnected((_ctx) => {});

// ── Reducers ──────────────────────────────────────────────────────────────

/** Add a new Copilot account to monitor. */
export const addAccount = spacetimedb.reducer(
  {
    login: t.string(),
    avatarUrl: t.string(),
    plan: t.string(),
    accessTypeSku: t.string(),
    tokenEncrypted: t.string(),
  },
  (ctx, { login, avatarUrl, plan, accessTypeSku, tokenEncrypted }) => {
    ctx.db.copilotAccount.insert({
      id: 0, // auto-incremented by SpacetimeDB
      login,
      avatarUrl,
      plan,
      accessTypeSku,
      premiumPercentRemaining: 100,
      premiumUnitsRemaining: 300,
      premiumEntitlement: 300,
      chatUnlimited: true,
      completionsUnlimited: true,
      quotaResetDateUtc: '',
      lastSnapshotUtc: new Date().toISOString(),
      tokenEncrypted,
    });
  }
);

/** Remove a monitored account by id. */
export const removeAccount = spacetimedb.reducer(
  { id: t.u32() },
  (ctx, { id }) => {
    ctx.db.copilotAccount.id.delete(id);
  }
);

/**
 * Refresh quota snapshot for one account by calling the GitHub API.
 * The actual HTTP fetch should be done server-side here using the stored token.
 */
export const refreshAccount = spacetimedb.reducer(
  {
    id: t.u32(),
    premiumPercentRemaining: t.f64(),
    premiumUnitsRemaining: t.u32(),
    premiumEntitlement: t.u32(),
    chatUnlimited: t.bool(),
    completionsUnlimited: t.bool(),
    quotaResetDateUtc: t.string(),
    lastSnapshotUtc: t.string(),
  },
  (ctx, snapshot) => {
    const existing = ctx.db.copilotAccount.id.find(snapshot.id);
    if (!existing) return;
    ctx.db.copilotAccount.id.update({
      ...existing,
      premiumPercentRemaining: snapshot.premiumPercentRemaining,
      premiumUnitsRemaining: snapshot.premiumUnitsRemaining,
      premiumEntitlement: snapshot.premiumEntitlement,
      chatUnlimited: snapshot.chatUnlimited,
      completionsUnlimited: snapshot.completionsUnlimited,
      quotaResetDateUtc: snapshot.quotaResetDateUtc,
      lastSnapshotUtc: snapshot.lastSnapshotUtc,
    });
  }
);

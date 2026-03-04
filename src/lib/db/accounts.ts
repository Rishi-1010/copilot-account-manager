import { query, queryOne } from './index';
import type { CopilotAccount, CreateAccountInput, UpdateAccountInput } from './types';

export async function getAllAccounts(): Promise<CopilotAccount[]> {
  const rows = await query<any>(`
    SELECT 
      id,
      login,
      avatar_url as "avatarUrl",
      plan,
      access_type_sku as "accessTypeSku",
      premium_percent_remaining as "premiumPercentRemaining",
      premium_units_remaining as "premiumUnitsRemaining",
      premium_entitlement as "premiumEntitlement",
      chat_unlimited as "chatUnlimited",
      completions_unlimited as "completionsUnlimited",
      quota_reset_date_utc as "quotaResetDateUtc",
      last_snapshot_utc as "lastSnapshotUtc",
      token_encrypted as "tokenEncrypted",
      created_at as "createdAt",
      updated_at as "updatedAt",
      usage_data as "usageData"
    FROM copilot_account
    ORDER BY id ASC
  `);
  
  return rows.map(row => ({
    ...row,
    quotaResetDateUtc: row.quotaResetDateUtc ? row.quotaResetDateUtc.toISOString() : '',
    lastSnapshotUtc: row.lastSnapshotUtc ? row.lastSnapshotUtc.toISOString() : '',
  }));
}

export async function getAccountById(id: number): Promise<CopilotAccount | null> {
  const row = await queryOne<any>(
    `
    SELECT 
      id,
      login,
      avatar_url as "avatarUrl",
      plan,
      access_type_sku as "accessTypeSku",
      premium_percent_remaining as "premiumPercentRemaining",
      premium_units_remaining as "premiumUnitsRemaining",
      premium_entitlement as "premiumEntitlement",
      chat_unlimited as "chatUnlimited",
      completions_unlimited as "completionsUnlimited",
      quota_reset_date_utc as "quotaResetDateUtc",
      last_snapshot_utc as "lastSnapshotUtc",
      token_encrypted as "tokenEncrypted",
      created_at as "createdAt",
      updated_at as "updatedAt",
      usage_data as "usageData"
    FROM copilot_account
    WHERE id = $1
  `,
    [id]
  );
  
  if (!row) return null;
  
  return {
    ...row,
    quotaResetDateUtc: row.quotaResetDateUtc ? row.quotaResetDateUtc.toISOString() : '',
    lastSnapshotUtc: row.lastSnapshotUtc ? row.lastSnapshotUtc.toISOString() : '',
  };
}

export async function createAccount(input: CreateAccountInput): Promise<CopilotAccount> {
  const row = await queryOne<any>(
    `
    INSERT INTO copilot_account (
      login,
      avatar_url,
      plan,
      access_type_sku,
      token_encrypted,
      last_snapshot_utc
    ) VALUES ($1, $2, $3, $4, $5, NOW())
    RETURNING 
      id,
      login,
      avatar_url as "avatarUrl",
      plan,
      access_type_sku as "accessTypeSku",
      premium_percent_remaining as "premiumPercentRemaining",
      premium_units_remaining as "premiumUnitsRemaining",
      premium_entitlement as "premiumEntitlement",
      chat_unlimited as "chatUnlimited",
      completions_unlimited as "completionsUnlimited",
      quota_reset_date_utc as "quotaResetDateUtc",
      last_snapshot_utc as "lastSnapshotUtc",
      token_encrypted as "tokenEncrypted",
      created_at as "createdAt",
      updated_at as "updatedAt",
      usage_data as "usageData"
  `,
    [input.login, input.avatarUrl, input.plan, input.accessTypeSku, input.tokenEncrypted]
  );
  
  return {
    ...row!,
    quotaResetDateUtc: row!.quotaResetDateUtc ? row!.quotaResetDateUtc.toISOString() : '',
    lastSnapshotUtc: row!.lastSnapshotUtc ? row!.lastSnapshotUtc.toISOString() : '',
  };
}

export async function updateAccount(input: UpdateAccountInput): Promise<CopilotAccount | null> {
  // Build dynamic SQL based on whether token/usageData is being updated
  const updateFields = [
    'premium_percent_remaining = $2',
    'premium_units_remaining = $3',
    'premium_entitlement = $4',
    'chat_unlimited = $5',
    'completions_unlimited = $6',
    'quota_reset_date_utc = $7',
    'last_snapshot_utc = $8',
    'updated_at = NOW()',
  ];
  
  const params: any[] = [
    input.id,
    input.premiumPercentRemaining,
    input.premiumUnitsRemaining,
    input.premiumEntitlement,
    input.chatUnlimited,
    input.completionsUnlimited,
    input.quotaResetDateUtc,
    input.lastSnapshotUtc,
  ];
  
  if (input.tokenEncrypted) {
    updateFields.push(`token_encrypted = $${params.length + 1}`);
    params.push(input.tokenEncrypted);
  }
  
  if (input.usageData !== undefined) {
    updateFields.push(`usage_data = $${params.length + 1}`);
    params.push(input.usageData ? JSON.stringify(input.usageData) : null);
  }
  
  const row = await queryOne<any>(
    `
    UPDATE copilot_account
    SET ${updateFields.join(', ')}
    WHERE id = $1
    RETURNING 
      id,
      login,
      avatar_url as "avatarUrl",
      plan,
      access_type_sku as "accessTypeSku",
      premium_percent_remaining as "premiumPercentRemaining",
      premium_units_remaining as "premiumUnitsRemaining",
      premium_entitlement as "premiumEntitlement",
      chat_unlimited as "chatUnlimited",
      completions_unlimited as "completionsUnlimited",
      quota_reset_date_utc as "quotaResetDateUtc",
      last_snapshot_utc as "lastSnapshotUtc",
      token_encrypted as "tokenEncrypted",
      created_at as "createdAt",
      updated_at as "updatedAt",
      usage_data as "usageData"
  `,
    params
  );
  
  if (!row) return null;
  
  return {
    ...row,
    quotaResetDateUtc: row.quotaResetDateUtc ? row.quotaResetDateUtc.toISOString() : '',
    lastSnapshotUtc: row.lastSnapshotUtc ? row.lastSnapshotUtc.toISOString() : '',
  };
}

export async function deleteAccount(id: number): Promise<boolean> {
  const result = await query('DELETE FROM copilot_account WHERE id = $1', [id]);
  return true;
}

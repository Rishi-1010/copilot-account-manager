-- Setup script for copilot_accounts database
-- Run this script against the copilot_accounts database

-- Create the copilot_account table
CREATE TABLE IF NOT EXISTS copilot_account (
    id SERIAL PRIMARY KEY,
    login VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    plan VARCHAR(100),
    access_type_sku VARCHAR(100),
    premium_percent_remaining DOUBLE PRECISION DEFAULT 100,
    premium_units_remaining INTEGER DEFAULT 300,
    premium_entitlement INTEGER DEFAULT 300,
    chat_unlimited BOOLEAN DEFAULT TRUE,
    completions_unlimited BOOLEAN DEFAULT TRUE,
    quota_reset_date_utc TIMESTAMP,
    last_snapshot_utc TIMESTAMP DEFAULT NOW(),
    token_encrypted TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on login for faster lookups
CREATE INDEX IF NOT EXISTS idx_copilot_account_login ON copilot_account(login);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_copilot_account_created_at ON copilot_account(created_at);

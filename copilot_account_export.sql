-- PostgreSQL Database Export
-- Database: postgres
-- Table: copilot_account
-- Export Date: March 4, 2026
-- Total Records: 7

-- Drop table if exists (uncomment if needed)
-- DROP TABLE IF EXISTS copilot_account CASCADE;

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
    updated_at TIMESTAMP DEFAULT NOW(),
    usage_data JSONB
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_copilot_account_login ON copilot_account(login);
CREATE INDEX IF NOT EXISTS idx_copilot_account_created_at ON copilot_account(created_at);

-- Add comment on usage_data column
COMMENT ON COLUMN copilot_account.usage_data IS 'GitHub billing usage data from Premium Request API';

-- Insert data (NOTE: Replace placeholder tokens with real tokens after deployment)
INSERT INTO copilot_account (id, login, avatar_url, plan, access_type_sku, premium_percent_remaining, premium_units_remaining, premium_entitlement, chat_unlimited, completions_unlimited, quota_reset_date_utc, last_snapshot_utc, token_encrypted, created_at, updated_at, usage_data) VALUES 
(1, 'user1', 'https://avatars.githubusercontent.com/u/262495467?v=4', 'active', 'copilot_individual', 100, 0, 0, false, false, '2026-03-03 01:54:27.873', '2026-03-03 01:54:27.877', 'ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', '2026-03-03 07:24:23.743', '2026-03-03 07:24:29.389', '{"items": [], "currency": "USD", "timePeriod": {"year": 2026, "month": 3}, "totalAmount": 0, "totalRequests": 0}'),

(2, 'user2', 'https://avatars.githubusercontent.com/u/261620368?v=4', 'premium', 'Copilot Premium Request', 100, 234, 234, false, false, '2026-03-03 06:37:26.566', '2026-03-03 06:37:26.737', 'ghp_YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY', '2026-03-03 07:24:44.139', '2026-03-03 12:07:30.458', '{"items": [{"sku": "Copilot Premium Request", "model": "Auto: GPT-5.3-Codex", "product": "Copilot", "unitType": "requests", "netAmount": 0, "grossAmount": 0.288, "netQuantity": 0, "pricePerUnit": 0.04, "grossQuantity": 7.2, "discountAmount": 0.288, "discountQuantity": 7.2}, {"sku": "Copilot Premium Request", "model": "Claude Sonnet 4.5", "product": "Copilot", "unitType": "requests", "netAmount": 0, "grossAmount": 8, "netQuantity": 0, "pricePerUnit": 0.04, "grossQuantity": 200, "discountAmount": 8, "discountQuantity": 200}, {"sku": "Copilot Premium Request", "model": "Claude Sonnet 4.6", "product": "Copilot", "unitType": "requests", "netAmount": 0, "grossAmount": 1.08, "netQuantity": 0, "pricePerUnit": 0.04, "grossQuantity": 27, "discountAmount": 1.08, "discountQuantity": 27}], "currency": "USD", "timePeriod": {"year": 2026, "month": 3}, "totalAmount": 9.368, "totalRequests": 234.2}');

-- NOTE: This is sample data for demonstration. 
-- After deployment, you can add your actual accounts through the UI.

-- Update sequence to continue from current max ID
SELECT setval('copilot_account_id_seq', (SELECT MAX(id) FROM copilot_account));

-- Export Summary:
-- Sample records: 2 (with placeholder tokens)
-- Columns: 16
-- Includes: Table schema, indexes, comments, and sample data
-- NOTE: Add your actual accounts through the UI after deployment

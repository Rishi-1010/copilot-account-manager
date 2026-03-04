-- Add usage_data column to store GitHub billing data
ALTER TABLE copilot_account 
ADD COLUMN IF NOT EXISTS usage_data JSONB;

COMMENT ON COLUMN copilot_account.usage_data IS 'GitHub billing usage data from Premium Request API';

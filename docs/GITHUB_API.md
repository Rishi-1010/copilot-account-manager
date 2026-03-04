this# GitHub Copilot API Integration

This document explains how the application integrates with GitHub's API to track Copilot usage.

## Important: No Real-Time Quota API

⚠️ **GitHub does not provide a public API endpoint for real-time Copilot quota tracking.**

The `/user/copilot/quota` endpoint does not exist. This is a documented limitation that the GitHub community has requested.

**Reference:** [GitHub Community Discussion #157693](https://github.com/orgs/community/discussions/157693)

## What IS Available: GitHub Billing API

GitHub provides historical usage data through the **Enhanced Billing API**:

### Endpoints Used

```bash
# Premium Request Usage (Individual User)
GET /users/{username}/settings/billing/premium_request/usage

# Usage Summary
GET /users/{username}/settings/billing/usage/summary

# General Billing Usage
GET /users/{username}/settings/billing/usage
```

### Authentication

**Required Headers:**
```http
Authorization: Bearer ghp_xxxxxxxxxxxx
Accept: application/vnd.github+json
X-GitHub-Api-Version: 2022-11-28
```

**Note:** Use `Bearer` prefix, not the old `token` prefix.

### Required Token Scopes

| Token Type | Required Permission |
|---|---|
| **Fine-grained PAT** | `Billing` → User permissions (read) |
| **Classic PAT** | `user` scope |

### Example Response

```json
{
  "timePeriod": { "year": 2026 },
  "user": "username",
  "usageItems": [
    {
      "product": "Copilot",
      "sku": "Copilot Premium Request",
      "model": "claude-sonnet-4-6",
      "unitType": "requests",
      "pricePerUnit": 0.04,
      "grossQuantity": 87,
      "grossAmount": 3.48,
      "netQuantity": 87,
      "netAmount": 3.48
    }
  ]
}
```

## What This Means for the App

### ✅ What Works

- **Account Management** - Add, edit, delete accounts
- **User Information** - Login, avatar, profile data
- **Historical Usage** - Past billing/usage data (if billing scope granted)
- **Basic Status** - Account active/inactive

### ❌ What Doesn't Work

- **Real-time quota remaining** - Not available via API
- **Usage percentage** - Cannot calculate without quota limit
- **Rate limit tracking** - No live rate limit data
- **Allowance resets** - Reset dates not exposed

## Workarounds

The app uses the billing API to show:
- Total requests made (historical)
- Total amount billed
- Usage by model/SKU

These are displayed as "entitlement" since actual quota limits aren't available.

## Organization Accounts

If your Copilot is paid by an organization:
- Individual billing endpoints return empty
- You need org-level billing access
- Use organization endpoints instead:
  ```
  GET /orgs/{org}/settings/billing/premium_request/usage
  ```

## Official Documentation

- [GitHub REST API - Billing Usage](https://docs.github.com/en/rest/billing/usage)
- [Enhanced Billing Platform](https://docs.github.com/en/billing/using-the-enhanced-billing-platform)
- [API Versioning](https://docs.github.com/en/rest/about-the-rest-api/api-versions)

## Token Generation

### Classic PAT

1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes:
   - ✅ `read:user` - Read user profile
   - ✅ `user` - Full user access (includes billing)
4. Generate and copy the token

### Fine-grained PAT

1. Go to https://github.com/settings/personal-access-tokens/new
2. Set permissions:
   - **User permissions**:
     - Billing: Read-only
     - Profile: Read-only
3. Generate and copy the token

## Limitations to Be Aware Of

1. **No quota limits** - GitHub doesn't expose allowance/limits
2. **Historical only** - Data is billing-based, not real-time
3. **Scope requirements** - Billing scope is sensitive
4. **Org vs User** - Different endpoints for different billing contexts
5. **Time lag** - Usage data may not be immediate

## Future Improvements

If GitHub releases a quota API in the future, the app can be updated by modifying:
- `/src/app/api/github/quota/route.ts`
- `/src/app/api/github/validate-token/route.ts`

The database schema already supports quota fields for forward compatibility.

# PostgreSQL Setup Guide

This application uses PostgreSQL as its database backend.

## Prerequisites

- PostgreSQL 12 or higher installed locally
- PostgreSQL MCP server configured (for development)

## Database Setup

### 1. Create Database

The database `copilot_accounts` should already be created. If not, create it:

```sql
CREATE DATABASE copilot_accounts;
```

### 2. Create Table

Connect to the `copilot_accounts` database and run:

```sql
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
```

### 3. Configure Environment

Update your `.env.local` file with your PostgreSQL connection string:

```bash
DATABASE_URL=postgresql://username:password@localhost:5432/copilot_accounts
```

Replace:
- `username` with your PostgreSQL username
- `password` with your PostgreSQL password
- `localhost:5432` with your PostgreSQL server address if different

## Database Operations

The application provides a REST API for managing accounts:

- `GET /api/accounts` - List all accounts
- `POST /api/accounts` - Create a new account
- `GET /api/accounts/[id]` - Get account by ID
- `PUT /api/accounts/[id]` - Update account
- `DELETE /api/accounts/[id]` - Delete account

## Development

The application will automatically connect to PostgreSQL when you run:

```bash
npm run dev
```

Make sure your PostgreSQL server is running before starting the application.

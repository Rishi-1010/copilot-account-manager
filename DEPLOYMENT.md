# Deployment Guide - Vercel + Neon Database

This guide will help you deploy the Copilot Account Manager to Vercel with a Neon PostgreSQL database.

## Why Neon?

- **3GB free storage** (vs Vercel Postgres 256MB or Supabase 500MB)
- Serverless, auto-scaling PostgreSQL
- Fast cold starts
- Free tier includes:
  - 3GB storage
  - Unlimited compute hours
  - Branch management
  - Point-in-time restore

---

## Step 1: Set Up Neon Database

### 1.1 Create Neon Account
1. Go to [https://neon.tech](https://neon.tech)
2. Sign up with GitHub (recommended for integration)
3. Create a new project

### 1.2 Get Database Connection String
1. In your Neon dashboard, click **"Connection Details"**
2. Copy the connection string (it looks like):
   ```
   postgresql://username:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```
3. Save this for later!

### 1.3 Import Your Database
1. In Neon dashboard, click **"SQL Editor"**
2. Copy the entire content from `copilot_account_export.sql`
3. Paste and run it in the SQL Editor
4. Verify: You should see 7 records imported

**Alternative Method (if you have PostgreSQL tools):**
```bash
psql "postgresql://username:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require" < copilot_account_export.sql
```

---

## Step 2: Deploy to Vercel

### 2.1 Push Code to GitHub
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit for Vercel deployment"

# Create a GitHub repository and push
git remote add origin https://github.com/your-username/cp-account-manager.git
git branch -M main
git push -u origin main
```

### 2.2 Connect to Vercel
1. Go to [https://vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click **"Add New Project"**
4. Import your GitHub repository
5. Configure project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `cp-account-manager` (if needed)
   - **Build Command**: `npm run build` (auto-detected)

### 2.3 Add Environment Variable
1. In Vercel project settings, go to **"Environment Variables"**
2. Add:
   - **Key**: `DATABASE_URL`
   - **Value**: Your Neon connection string
   - **Environment**: Production, Preview, Development (select all)
3. Click **"Save"**

### 2.4 Deploy
1. Click **"Deploy"**
2. Wait for build to complete (~2-3 minutes)
3. Your app will be live at: `https://your-project.vercel.app`

---

## Step 3: Verify Deployment

1. Visit your Vercel URL
2. Navigate to `/accounts` or `/dashboard`
3. You should see your 7 imported accounts
4. Test adding a new account through the UI

---

## Managing Your Database

### Adding More Accounts
You can add accounts through:
1. **Your deployed app UI** (recommended)
2. **Neon SQL Editor** (for bulk operations)
3. **Direct API calls** to `/api/accounts`

### Viewing Data
- **Neon Dashboard**: SQL Editor → `SELECT * FROM copilot_account;`
- **Your App**: Visit `/accounts` page

### Backing Up Data
Neon provides automatic backups with point-in-time restore. You can also:
```bash
# Export current data
pg_dump "your-neon-connection-string" > backup.sql
```

---

## Troubleshooting

### Build Fails
- Check environment variables are set correctly
- Ensure `DATABASE_URL` is added to Vercel

### Database Connection Issues
- Verify Neon connection string includes `?sslmode=require`
- Check if database is in active state (not paused)
- Ensure Neon project is not in sleep mode

### Data Not Showing
- Verify SQL import was successful in Neon SQL Editor
- Check browser console for API errors
- Review Vercel function logs

---

## Cost Considerations

### Neon Free Tier Limits
- 3GB storage (plenty for thousands of accounts)
- Unlimited compute hours
- Projects auto-pause after 5 minutes of inactivity (instant wake)

### Vercel Free Tier Limits
- 100GB bandwidth/month
- Unlimited websites
- Serverless function execution: 100GB-hours

Both are **completely free** for this project's usage! 🎉

---

## Optional: Custom Domain

1. In Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. SSL is automatic and free

---

## Next Steps

✅ Database is hosted on Neon (3GB free)  
✅ App is deployed on Vercel  
✅ Existing 7 accounts are imported  
✅ You can add more accounts via the UI  

**Your Copilot Account Manager is now live!** 🚀

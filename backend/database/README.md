# Database (PostgreSQL / Supabase)

This project uses **PostgreSQL only** (local or Supabase).

## Environment

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
JWT_SECRET=your-secret-at-least-32-characters
```

For Vercel/serverless, use the **Transaction pooler** URI (port `6543`).

## Setup

```bash
cd backend
npm run db:setup
```

This runs:
- `database/schema.postgres.sql` — creates all tables
- `database/seed.postgres.sql` — inserts categories, products, and test users

## Test accounts

| Email | Password | Role |
|-------|----------|------|
| admin@ibnsina.tn | admin123 | staff |
| adelmoula9hwa1234@gmail.com | M14WpSo3XvDiAKXd1ecvgnP3UdOKVjRGpq | staff |

## Vercel deployment

Set in Vercel → Settings → Environment Variables:

```
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=...
CORS_ORIGIN=https://your-frontend.vercel.app
```

Then redeploy the backend.

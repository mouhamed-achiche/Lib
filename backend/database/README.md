# IBN SINA MySQL Database

Implements [STEP_02_DATABASE_SCHEMA.md](../../STEP_02_DATABASE_SCHEMA.md).

## Prerequisites

- MySQL 8+ (or MariaDB) running locally
- `backend/.env` with database credentials (copy from `.env.example`)

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ibn_sina_db
```

## Setup (one command)

```bash
cd backend
npm run db:setup
```

This runs:

1. `schema.sql` — database, 11 tables, indexes
2. `seed.sql` — categories, brands, products, admin + staff users

## Verify

```sql
USE ibn_sina_db;
SHOW TABLES;
SELECT COUNT(*) FROM products;
SELECT email, role FROM users;
```

Expected: **11 tables**, **9 products**, users `admin@ibnsina.tn` and `staff@ibnsina.tn` (password `admin123`).

## After setup

Restart the API so it connects to MySQL:

```bash
npm run dev
```

You should see: `MySQL connected` instead of in-memory mode.

## Files

| File | Purpose |
|------|---------|
| `schema.sql` | Tables + indexes (idempotent `IF NOT EXISTS`) |
| `seed.sql` | Demo catalog and staff accounts (`INSERT IGNORE`) |

## Order status values

The `orders.status` column uses the staff workflow enum (call approval → delivery), not the legacy pending/shipped values from the original step doc.

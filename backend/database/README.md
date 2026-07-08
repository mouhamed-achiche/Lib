# Database Configuration

This project supports both SQLite (for development) and PostgreSQL (for production via Supabase).

## Database Options

### Development: SQLite
- **File**: `database.sqlite`
- **Configuration**: `.env.development`
- **Use case**: Local development and testing
- **Benefits**: Simple setup, no external dependencies

### Production: PostgreSQL (Supabase)
- **Host**: Supabase PostgreSQL database
- **Configuration**: `.env.production`
- **Use case**: Production deployment on Vercel
- **Benefits**: Scalability, concurrent connections, better performance

## Environment Configuration

### Development Environment (.env.development)
```env
NODE_ENV=development
DB_PATH=./database.sqlite
DATABASE_URL=sqlite:./database.sqlite
```

### Production Environment (.env.production)
```env
NODE_ENV=production
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.fvtlnczpoehcfwelizty.supabase.co:5432/postgres
DB_PATH=
```

## Database Schema

### Schema Files
- **SQLite**: `database/schema.sqlite.sql`
- **PostgreSQL**: `database/schema.postgres.sql`

### Tables
- `users` - User accounts and authentication
- `categories` - Product categories with hierarchical structure
- `brands` - Product brands
- `products` - Product catalog
- `product_images` - Product image gallery
- `carts` - Shopping carts
- `cart_items` - Items in shopping carts
- `orders` - Customer orders
- `order_items` - Items in orders
- `wishlist` - User wishlists
- `newsletter_subscribers` - Newsletter subscriptions
- `refresh_tokens` - JWT refresh tokens
- `promotions` - Discount codes and promotions
- `banners` - Homepage banners
- `homepage_sections` - Homepage sections
- `homepage_section_products` - Products in homepage sections
- `deals` - Special deals and offers

## Database Setup

### Initial Setup (SQLite)
```bash
npm run db:setup
```

This command:
1. Creates the SQLite database
2. Sets up all tables
3. Loads seed data
4. Creates default admin user

### Migration to PostgreSQL

#### Prerequisites
1. Set up a Supabase project
2. Get your PostgreSQL connection string
3. Update `.env.production` with your database credentials

#### Migration Steps
```bash
# 1. Install new dependencies
npm install

# 2. Set DATABASE_URL in your environment
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.fvtlnczpoehcfwelizty.supabase.co:5432/postgres"

# 3. Run migration
npm run db:migrate
```

The migration script:
- Creates a backup of your SQLite database
- Reads all data from SQLite
- Creates PostgreSQL schema
- Migrates data with proper transformations
- Resets PostgreSQL sequences
- Validates the migration

#### Rollback
If you need to rollback to SQLite:
```bash
npm run db:rollback
```

Options:
- `--clear-postgres` - Also clear the PostgreSQL database
- `--no-restore` - Skip restoring from backup

## Database Scripts

### Available NPM Scripts
- `npm run db:setup` - Initialize SQLite database
- `npm run db:migrate` - Migrate SQLite to PostgreSQL
- `npm run db:rollback` - Rollback to SQLite

## Data Types

### SQLite to PostgreSQL Conversion
- `INTEGER PRIMARY KEY AUTOINCREMENT` → `SERIAL PRIMARY KEY`
- `DATETIME` → `TIMESTAMP`
- `DECIMAL(10,2)` → `NUMERIC(10,2)`
- `INTEGER` (boolean flags) → `BOOLEAN`

## Foreign Keys

All foreign key relationships are maintained in both databases:
- Cascade deletes are preserved
- Referential integrity is enforced
- Indexes are created for performance

## Troubleshooting

### Migration Issues

**Problem**: Connection refused during migration
```
Solution: Verify your DATABASE_URL is correct and the database is accessible
```

**Problem**: Sequence errors after migration
```
Solution: The migration script automatically resets sequences. If issues persist, manually reset:
SELECT setval('table_name_id_seq', (SELECT MAX(id) FROM table_name));
```

**Problem**: Data type mismatches
```
Solution: Check the transformValue function in scripts/migrate-to-postgres.js
```

### Development Issues

**Problem**: SQLite database locked
```
Solution: Close all database connections and delete database.sqlite-wal and database.sqlite-shm files
```

**Problem**: Foreign key constraint fails
```
Solution: Ensure PRAGMA foreign_keys = ON is set (handled automatically in db.js)
```

## Backup and Recovery

### Automatic Backups
The migration script automatically creates backups with timestamps:
```
database.sqlite.backup.2024-01-15T10-30-45
```

### Manual Backup
```bash
cp database.sqlite database.sqlite.backup
```

### Restore from Backup
```bash
cp database.sqlite.backup database.sqlite
```

## Performance Optimization

### SQLite Optimizations (Automatic)
- WAL mode enabled
- Normal synchronous mode
- 64MB cache size
- Temporary store in memory

### PostgreSQL Optimizations
- Connection pooling (max 20 connections)
- SSL enabled for production
- 30-second idle timeout
- 2-second connection timeout

## Security Notes

### Important Security Practices
1. **Never commit** `.env` files to version control
2. **Use strong passwords** for PostgreSQL
3. **Enable SSL** for production database connections
4. **Rotate secrets** regularly (JWT_SECRET, database passwords)
5. **Limit database user permissions** to only what's needed

### Environment Variables
- `JWT_SECRET` - Change from default in production
- `DATABASE_URL` - Contains sensitive credentials
- `DB_PATH` - Local file path (development only)

## Production Deployment

### Vercel Environment Variables
Set these in your Vercel project settings:
```
NODE_ENV=production
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.fvtlnczpoehcfwelizty.supabase.co:5432/postgres
JWT_SECRET=your-production-secret
CORS_ORIGIN=https://your-production-domain.com
PORT=5000
FREE_SHIPPING_THRESHOLD=8000
```

### Deployment Steps
1. Push code to Git repository
2. Configure environment variables in Vercel
3. Run migration locally first to test
4. Deploy to Vercel
5. Run migration in production if needed
6. Verify application functionality

## Maintenance

### Regular Tasks
- Monitor database size and performance
- Clean up expired refresh tokens
- Archive old orders if needed
- Update statistics and indexes

### Database Health Checks
```sql
-- Check table sizes (PostgreSQL)
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check record counts
SELECT 'users' as table_name, COUNT(*) FROM users
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'orders', COUNT(*) FROM orders;
```

## Support

For issues related to:
- **Database migration**: Check migration script logs
- **Connection issues**: Verify environment variables
- **Performance**: Review indexes and query optimization
- **Data integrity**: Run validation queries

## Additional Resources

- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [Node-postgres (pg)](https://node-postgres.com/)

/**
 * Rollback script for PostgreSQL migration
 * Usage: node scripts/rollback-migration.js
 * 
 * This script:
 * 1. Restores SQLite as the primary database
 * 2. Optionally clears PostgreSQL database
 * 3. Updates environment configuration
 * 4. Verifies application functionality with SQLite
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')

// Configuration
const SQLITE_DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'database.sqlite')
const POSTGRES_URL = process.env.DATABASE_URL

// Find the most recent backup
function findLatestBackup() {
  const dbDir = path.dirname(SQLITE_DB_PATH)
  const dbFileName = path.basename(SQLITE_DB_PATH)
  const backupPattern = new RegExp(`^${dbFileName}\\.backup\\.\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2}`)
  
  const files = fs.readdirSync(dbDir)
  const backups = files
    .filter(f => backupPattern.test(f))
    .sort((a, b) => b.localeCompare(a)) // Sort descending (newest first)
  
  return backups.length > 0 ? path.join(dbDir, backups[0]) : null
}

// Restore from backup
function restoreFromBackup(backupPath) {
  if (!backupPath || !fs.existsSync(backupPath)) {
    console.error('❌ No valid backup found')
    return false
  }
  
  console.log(`📦 Restoring from backup: ${backupPath}`)
  fs.copyFileSync(backupPath, SQLITE_DB_PATH)
  console.log('✅ SQLite database restored from backup')
  return true
}

// Clear PostgreSQL database (optional)
async function clearPostgresDatabase() {
  if (!POSTGRES_URL) {
    console.log('⏭️  Skipping PostgreSQL clear (DATABASE_URL not set)')
    return true
  }

  console.log('\n🧹 Clearing PostgreSQL database...')
  
  const pool = new Pool({
    connectionString: POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  })

  try {
    // Get all tables
    const tables = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `)

    // Drop all tables
    for (const table of tables.rows) {
      await pool.query(`DROP TABLE IF EXISTS ${table.tablename} CASCADE`)
      console.log(`🗑️  Dropped table: ${table.tablename}`)
    }

    await pool.end()
    console.log('✅ PostgreSQL database cleared')
    return true
  } catch (err) {
    console.error('❌ Error clearing PostgreSQL:', err.message)
    await pool.end()
    return false
  }
}

// Verify SQLite database
function verifySQLiteDatabase() {
  console.log('\n🔍 Verifying SQLite database...')
  
  if (!fs.existsSync(SQLITE_DB_PATH)) {
    console.error('❌ SQLite database not found')
    return false
  }

  const sqlite3 = require('sqlite3').verbose()
  
  return new Promise((resolve) => {
    const db = new sqlite3.Database(SQLITE_DB_PATH, (err) => {
      if (err) {
        console.error('❌ Cannot open SQLite database:', err.message)
        resolve(false)
        return
      }

      db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
        db.close()
        if (err) {
          console.error('❌ SQLite database verification failed:', err.message)
          resolve(false)
        } else {
          console.log(`✅ SQLite database verified (${row.count} users)`)
          resolve(true)
        }
      })
    })
  })
}

// Update environment configuration
function updateEnvironmentConfig() {
  console.log('\n⚙️  Environment configuration reminder:')
  console.log('To rollback to SQLite, ensure your .env file has:')
  console.log('  NODE_ENV=development')
  console.log('  DB_PATH=./database.sqlite')
  console.log('  DATABASE_URL=sqlite:./database.sqlite')
  console.log('\nTo use PostgreSQL, ensure your .env file has:')
  console.log('  NODE_ENV=production')
  console.log('  DATABASE_URL=postgresql://...')
  console.log('  DB_PATH=')
}

// Main rollback function
async function rollback(options = {}) {
  console.log('🔄 Starting rollback process...\n')

  const { clearPostgres = false, restoreBackup = true } = options

  try {
    // Find and restore backup
    if (restoreBackup) {
      const backupPath = findLatestBackup()
      if (!backupPath) {
        console.error('❌ No backup found. Cannot restore.')
        console.log('💡 If you want to continue without restoring, run with --no-restore')
        process.exit(1)
      }

      const restored = restoreFromBackup(backupPath)
      if (!restored) {
        process.exit(1)
      }
    }

    // Clear PostgreSQL if requested
    if (clearPostgres) {
      const cleared = await clearPostgresDatabase()
      if (!cleared) {
        console.warn('⚠️  Failed to clear PostgreSQL database')
      }
    }

    // Verify SQLite
    const verified = await verifySQLiteDatabase()
    if (!verified) {
      console.error('❌ SQLite database verification failed')
      process.exit(1)
    }

    // Environment configuration reminder
    updateEnvironmentConfig()

    console.log('\n✅ Rollback completed successfully!')
    console.log('\n💡 Next steps:')
    console.log('1. Update your .env file to use SQLite configuration')
    console.log('2. Restart the application: npm run dev')
    console.log('3. Verify application functionality')

  } catch (err) {
    console.error('\n❌ Rollback failed:', err.message)
    console.error(err.stack)
    process.exit(1)
  }
}

// Parse command line arguments
const args = process.argv.slice(2)
const options = {
  clearPostgres: args.includes('--clear-postgres'),
  restoreBackup: !args.includes('--no-restore')
}

// Run rollback
rollback(options).catch(err => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})

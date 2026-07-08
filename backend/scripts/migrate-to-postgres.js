/**
 * Automated migration script from SQLite to PostgreSQL (Supabase)
 * Usage: node scripts/migrate-to-postgres.js
 * 
 * This script:
 * 1. Creates a backup of the SQLite database
 * 2. Reads all data from SQLite
 * 3. Creates PostgreSQL schema
 * 4. Migrates data with proper transformations
 * 5. Resets PostgreSQL sequences
 * 6. Validates the migration
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const fs = require('fs')
const path = require('path')
const sqlite3 = require('sqlite3').verbose()
const { Pool } = require('pg')

// Configuration
const SQLITE_DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'database.sqlite')
const POSTGRES_URL = process.env.DATABASE_URL

// Migration order (respecting foreign key dependencies)
const MIGRATION_ORDER = [
  'users',
  'categories', 
  'brands',
  'products',
  'product_images',
  'homepage_sections',
  'homepage_section_products',
  'banners',
  'deals',
  'promotions',
  'carts',
  'cart_items',
  'orders',
  'order_items',
  'wishlist',
  'newsletter_subscribers',
  'refresh_tokens'
]

// Data type transformations
function transformValue(value, fieldName) {
  if (value === null || value === undefined) return null
  
  // Handle INTEGER to BOOLEAN conversion for is_active fields
  if (fieldName.includes('is_active') || fieldName.includes('is_available')) {
    return value === 1 || value === '1' || value === true
  }
  
  // Handle date/time fields
  if (fieldName.includes('date') || fieldName.includes('time') || fieldName.includes('created_at') || fieldName.includes('updated_at')) {
    if (typeof value === 'string') {
      const date = new Date(value)
      return isNaN(date.getTime()) ? null : date.toISOString()
    }
    return value
  }
  
  // Handle numeric fields
  if (fieldName.includes('price') || fieldName.includes('cost') || fieldName.includes('qty') || fieldName.includes('count')) {
    return parseFloat(value) || 0
  }
  
  return value
}

function transformRow(row, table) {
  const transformed = {}
  for (const [key, value] of Object.entries(row)) {
    transformed[key] = transformValue(value, key)
  }
  return transformed
}

// Create backup
function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const backupPath = `${SQLITE_DB_PATH}.backup.${timestamp}`
  fs.copyFileSync(SQLITE_DB_PATH, backupPath)
  console.log(`✅ Backup created: ${backupPath}`)
  return backupPath
}

// Read SQLite data
async function readSQLiteData() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(SQLITE_DB_PATH, (err) => {
      if (err) {
        reject(err)
        return
      }
    })

    const data = {}

    const readTable = (index) => {
      if (index >= MIGRATION_ORDER.length) {
        db.close()
        resolve(data)
        return
      }

      const table = MIGRATION_ORDER[index]
      db.all(`SELECT * FROM ${table}`, (err, rows) => {
        if (err) {
          console.warn(`⚠️  Warning reading ${table}:`, err.message)
          data[table] = []
        } else {
          data[table] = rows || []
          console.log(`📖 Read ${rows.length} rows from ${table}`)
        }
        readTable(index + 1)
      })
    }

    readTable(0)
  })
}

// Create PostgreSQL schema
async function createPostgresSchema(pool) {
  console.log('\n🔨 Creating PostgreSQL schema...')
  const schemaPath = path.join(__dirname, '..', 'database', 'schema.postgres.sql')
  const schema = fs.readFileSync(schemaPath, 'utf8')
  
  // Split schema into individual statements
  const statements = schema.split(';').filter(s => s.trim())
  
  for (const statement of statements) {
    try {
      await pool.query(statement)
    } catch (err) {
      if (!err.message.includes('already exists')) {
        console.warn(`⚠️  Schema warning: ${err.message}`)
      }
    }
  }
  
  console.log('✅ PostgreSQL schema created')
}

// Insert data into PostgreSQL
async function insertPostgresData(pool, data) {
  console.log('\n📝 Migrating data to PostgreSQL...')
  
  for (const table of MIGRATION_ORDER) {
    const rows = data[table]
    if (rows.length === 0) {
      console.log(`⏭️  Skipping ${table} (no data)`)
      continue
    }

    try {
      // Get column names from the first row
      const columns = Object.keys(rows[0])
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ')
      const columnNames = columns.join(', ')
      
      // Insert each row
      for (const row of rows) {
        const transformed = transformRow(row, table)
        const values = columns.map(col => transformed[col])
        
        try {
          await pool.query(
            `INSERT INTO ${table} (${columnNames}) VALUES (${placeholders})`,
            values
          )
        } catch (err) {
          if (!err.message.includes('duplicate key')) {
            console.warn(`⚠️  Warning inserting into ${table}: ${err.message}`)
          }
        }
      }
      
      console.log(`✅ Migrated ${rows.length} rows to ${table}`)
    } catch (err) {
      console.error(`❌ Error migrating ${table}:`, err.message)
      throw err
    }
  }
}

// Reset PostgreSQL sequences
async function resetSequences(pool) {
  console.log('\n🔄 Resetting PostgreSQL sequences...')
  
  for (const table of MIGRATION_ORDER) {
    try {
      // Get the max ID for the table
      const result = await pool.query(`SELECT MAX(id) as max_id FROM ${table}`)
      const maxId = result.rows[0].max_id
      
      if (maxId) {
        await pool.query(`SELECT setval('${table}_id_seq', ${maxId}, true)`)
        console.log(`🔄 Reset ${table}_id_seq to ${maxId}`)
      }
    } catch (err) {
      // Some tables might not have sequences or different naming
      console.warn(`⚠️  Could not reset sequence for ${table}: ${err.message}`)
    }
  }
  
  console.log('✅ Sequences reset')
}

// Validate migration
async function validateMigration(pool, sqliteData) {
  console.log('\n🔍 Validating migration...')
  
  let allValid = true
  
  for (const table of MIGRATION_ORDER) {
    const sqliteCount = sqliteData[table].length
    
    try {
      const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`)
      const postgresCount = parseInt(result.rows[0].count)
      
      if (sqliteCount === postgresCount) {
        console.log(`✅ ${table}: ${sqliteCount} rows (matched)`)
      } else {
        console.warn(`⚠️  ${table}: SQLite=${sqliteCount}, PostgreSQL=${postgresCount} (mismatch)`)
        allValid = false
      }
    } catch (err) {
      console.error(`❌ Error validating ${table}:`, err.message)
      allValid = false
    }
  }
  
  return allValid
}

// Main migration function
async function migrate() {
  console.log('🚀 Starting SQLite to PostgreSQL migration...\n')
  
  // Validate environment
  if (!POSTGRES_URL) {
    console.error('❌ DATABASE_URL not set in environment variables')
    process.exit(1)
  }
  
  if (!fs.existsSync(SQLITE_DB_PATH)) {
    console.error(`❌ SQLite database not found: ${SQLITE_DB_PATH}`)
    process.exit(1)
  }

  try {
    // Create backup
    const backupPath = createBackup()
    
    // Read SQLite data
    console.log('\n📖 Reading data from SQLite...')
    const sqliteData = await readSQLiteData()
    
    // Connect to PostgreSQL
    console.log('\n🔌 Connecting to PostgreSQL...')
    const pool = new Pool({
      connectionString: POSTGRES_URL,
      ssl: { rejectUnauthorized: false }
    })
    
    // Test connection
    await pool.query('SELECT NOW()')
    console.log('✅ Connected to PostgreSQL')
    
    // Create schema
    await createPostgresSchema(pool)
    
    // Migrate data
    await insertPostgresData(pool, sqliteData)
    
    // Reset sequences
    await resetSequences(pool)
    
    // Validate
    const isValid = await validateMigration(pool, sqliteData)
    
    // Close connection
    await pool.end()
    
    if (isValid) {
      console.log('\n✅ Migration completed successfully!')
      console.log(`📦 Backup saved at: ${backupPath}`)
      console.log('\n💡 Next steps:')
      console.log('1. Test the application with PostgreSQL')
      console.log('2. Update DATABASE_URL in production environment')
      console.log('3. Deploy to Vercel')
    } else {
      console.log('\n⚠️  Migration completed with validation warnings')
      console.log('Please review the warnings above')
    }
    
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message)
    console.error(err.stack)
    process.exit(1)
  }
}

// Run migration
migrate().catch(err => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})

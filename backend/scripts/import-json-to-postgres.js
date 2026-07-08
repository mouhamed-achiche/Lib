/**
 * Import JSON data to PostgreSQL
 * Usage: node scripts/import-json-to-postgres.js
 * 
 * This script imports JSON data exported from SQLite into PostgreSQL
 * Can run from any environment with PostgreSQL connectivity (e.g., Vercel)
 */

require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')

const IMPORT_DIR = path.join(__dirname, '..', 'migrations', 'data')
const IMPORT_FILE = path.join(IMPORT_DIR, 'sqlite-export.json')
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

// Read JSON data
function readJSONData() {
  if (!fs.existsSync(IMPORT_FILE)) {
    throw new Error(`Export file not found: ${IMPORT_FILE}`)
  }
  
  const data = JSON.parse(fs.readFileSync(IMPORT_FILE, 'utf8'))
  console.log('📖 JSON data loaded successfully')
  return data
}

// Create PostgreSQL schema
async function createPostgresSchema(pool) {
  console.log('\n🔨 Creating PostgreSQL schema...')
  const schemaPath = path.join(__dirname, '..', 'database', 'schema.postgres.sql')
  const schema = fs.readFileSync(schemaPath, 'utf8')
  
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
  console.log('\n📝 Importing data to PostgreSQL...')
  
  for (const table of MIGRATION_ORDER) {
    const rows = data[table]
    if (!rows || rows.length === 0) {
      console.log(`⏭️  Skipping ${table} (no data)`)
      continue
    }

    try {
      const columns = Object.keys(rows[0])
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ')
      const columnNames = columns.join(', ')
      
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
      
      console.log(`✅ Imported ${rows.length} rows to ${table}`)
    } catch (err) {
      console.error(`❌ Error importing ${table}:`, err.message)
      throw err
    }
  }
}

// Reset PostgreSQL sequences
async function resetSequences(pool) {
  console.log('\n🔄 Resetting PostgreSQL sequences...')
  
  for (const table of MIGRATION_ORDER) {
    try {
      const result = await pool.query(`SELECT MAX(id) as max_id FROM ${table}`)
      const maxId = result.rows[0].max_id
      
      if (maxId) {
        await pool.query(`SELECT setval('${table}_id_seq', ${maxId}, true)`)
        console.log(`🔄 Reset ${table}_id_seq to ${maxId}`)
      }
    } catch (err) {
      console.warn(`⚠️  Could not reset sequence for ${table}: ${err.message}`)
    }
  }
  
  console.log('✅ Sequences reset')
}

// Validate import
async function validateImport(pool, jsonData) {
  console.log('\n🔍 Validating import...')
  
  let allValid = true
  
  for (const table of MIGRATION_ORDER) {
    const jsonCount = jsonData[table]?.length || 0
    
    try {
      const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`)
      const postgresCount = parseInt(result.rows[0].count)
      
      if (jsonCount === postgresCount) {
        console.log(`✅ ${table}: ${jsonCount} rows (matched)`)
      } else {
        console.warn(`⚠️  ${table}: JSON=${jsonCount}, PostgreSQL=${postgresCount} (mismatch)`)
        allValid = false
      }
    } catch (err) {
      console.error(`❌ Error validating ${table}:`, err.message)
      allValid = false
    }
  }
  
  return allValid
}

// Main import function
async function importToPostgres() {
  console.log('🚀 Starting JSON to PostgreSQL import...\n')
  
  if (!POSTGRES_URL) {
    console.error('❌ DATABASE_URL not set in environment variables')
    process.exit(1)
  }

  try {
    // Read JSON data
    console.log('📖 Reading JSON data...')
    const jsonData = readJSONData()
    
    // Connect to PostgreSQL
    console.log('\n🔌 Connecting to PostgreSQL...')
    const pool = new Pool({
      connectionString: POSTGRES_URL,
      ssl: { rejectUnauthorized: false }
    })
    
    await pool.query('SELECT NOW()')
    console.log('✅ Connected to PostgreSQL')
    
    // Create schema
    await createPostgresSchema(pool)
    
    // Import data
    await insertPostgresData(pool, jsonData)
    
    // Reset sequences
    await resetSequences(pool)
    
    // Validate
    const isValid = await validateImport(pool, jsonData)
    
    await pool.end()
    
    if (isValid) {
      console.log('\n✅ Import completed successfully!')
    } else {
      console.log('\n⚠️  Import completed with validation warnings')
    }
    
  } catch (err) {
    console.error('\n❌ Import failed:', err.message)
    console.error(err.stack)
    process.exit(1)
  }
}

// Run import
importToPostgres().catch(err => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})

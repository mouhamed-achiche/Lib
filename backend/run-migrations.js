require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations on Supabase...')
    
    const schemaPath = path.join(__dirname, 'database', 'schema.postgres.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    await pool.query(schema)
    
    console.log('✅ Database migrations completed successfully!')
    
    // Verify tables were created
    const { rows } = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)
    
    console.log('📋 Created tables:', rows.map(r => r.table_name).join(', '))
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    throw error
  } finally {
    await pool.end()
  }
}

runMigrations()

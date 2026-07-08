/**
 * Creates PostgreSQL schema and seed data.
 * Usage: npm run db:setup
 * Requires DATABASE_URL in backend/.env
 */
require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')

const databaseDir = path.join(__dirname, '..', 'database')

function readSql(filename) {
  return fs.readFileSync(path.join(databaseDir, filename), 'utf8')
}

async function setup() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is required in backend/.env')
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('supabase')
      ? { rejectUnauthorized: false }
      : false,
  })

  try {
    console.log('🔧 Setting up PostgreSQL database...')

    const schema = readSql('schema.postgres.sql')
    await pool.query(schema)
    console.log('✅ Schema created')

    const seedPath = path.join(databaseDir, 'seed.postgres.sql')
    if (fs.existsSync(seedPath)) {
      const seed = readSql('seed.postgres.sql')
      await pool.query(seed)
      console.log('✅ Seed data inserted')
    }

    const { rows } = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)
    console.log(`📋 Tables: ${rows.map((r) => r.table_name).join(', ')}`)

    const { rows: users } = await pool.query('SELECT COUNT(*)::int AS count FROM users')
    console.log(`👤 Users: ${users[0].count}`)
  } finally {
    await pool.end()
  }

  console.log('\n🎉 Database setup complete')
  console.log('   Admin: admin@ibnsina.tn / admin123')
  console.log('   Staff: adelmoula9hwa1234@gmail.com / M14WpSo3XvDiAKXd1ecvgnP3UdOKVjRGpq')
}

setup().catch((err) => {
  console.error('❌ Setup failed:', err.message)
  process.exit(1)
})

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

const POOLER_REGIONS = [
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'us-east-1',
  'us-west-1',
  'ap-southeast-1',
  'ap-northeast-1',
  'sa-east-1',
  'ap-south-1',
  'ca-central-1',
]

function readSql(filename) {
  return fs.readFileSync(path.join(databaseDir, filename), 'utf8')
}

function maskPassword(url) {
  return url.replace(/:([^:@/]+)@/, ':****@')
}

function parseDirectSupabaseUrl(url) {
  try {
    const parsed = new URL(url)
    const hostMatch = parsed.hostname.match(/^db\.([^.]+)\.supabase\.co$/)
    if (!hostMatch || parsed.username !== 'postgres') return null

    return {
      password: decodeURIComponent(parsed.password),
      projectRef: hostMatch[1],
      database: parsed.pathname.replace(/^\//, '') || 'postgres',
    }
  } catch {
    return null
  }
}

function buildPoolerUrl({ projectRef, password, database, region, port }) {
  const encodedPassword = encodeURIComponent(password)
  const suffix = port === 6543 ? '?pgbouncer=true' : ''
  return `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-${region}.pooler.supabase.com:${port}/${database}${suffix}`
}

async function testConnection(connectionString) {
  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('supabase')
      ? { rejectUnauthorized: false }
      : false,
    connectionTimeoutMillis: 8000,
    max: 1,
  })

  try {
    await pool.query('SELECT 1 AS ok')
  } finally {
    await pool.end()
  }
}

async function resolveConnectionString(initialUrl) {
  try {
    await testConnection(initialUrl)
    return initialUrl
  } catch (error) {
    if (error.code !== 'ENOTFOUND' && error.code !== 'ETIMEDOUT') {
      throw error
    }

    const parsed = parseDirectSupabaseUrl(initialUrl)
    if (!parsed) {
      throw new Error(
        `${error.message}\n\nUse the Session pooler URI from Supabase → Project Settings → Database → Connection string.`,
      )
    }

    console.log('⚠️  Direct Supabase host is unreachable from this network (IPv6-only).')
    console.log('🔎 Trying Supabase connection pooler...')

    for (const region of POOLER_REGIONS) {
      for (const port of [5432, 6543]) {
        const candidate = buildPoolerUrl({ ...parsed, region, port })
        try {
          await testConnection(candidate)
          console.log(`✅ Connected via pooler: aws-0-${region}.pooler.supabase.com:${port}`)
          console.log(`\nUpdate backend/.env and Vercel with:\nDATABASE_URL=${maskPassword(candidate)}\n`)
          return candidate
        } catch {
          // try next region/port
        }
      }
    }

    throw new Error(
      'Could not connect to Supabase. Open Supabase → Project Settings → Database → Connection string, copy the Session pooler URI, and set DATABASE_URL.',
    )
  }
}

async function setup() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is required in backend/.env')
    process.exit(1)
  }

  const connectionString = await resolveConnectionString(process.env.DATABASE_URL)

  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('supabase')
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

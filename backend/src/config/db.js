require('dotenv').config()
const { Pool } = require('pg')

let pool = null
let wrappedPool = null
let lastPoolError = null

function getDatabaseUrl() {
  return (process.env.DATABASE_URL || '').trim()
}

function hasDbConfig() {
  return Boolean(getDatabaseUrl())
}

function setDbFailed(failed) {
  if (!failed) lastPoolError = null
}

function getConnectionString() {
  let url = getDatabaseUrl()
  if (!url) return url

  // pgbouncer=true is only for transaction pooler (port 6543), not session pooler (5432)
  if (url.includes('pooler.supabase.com') && url.includes(':6543') && !url.includes('pgbouncer=')) {
    url += `${url.includes('?') ? '&' : '?'}pgbouncer=true`
  }

  return url
}

function useSsl() {
  const url = getDatabaseUrl()
  return (
    process.env.NODE_ENV === 'production' ||
    url.includes('supabase.com') ||
    url.includes('supabase.co')
  )
}

function toPostgresSql(sql) {
  let text = sql
    .replace(/datetime\(\s*'now'\s*,\s*'-(\d+) days'\s*\)/gi, (_, days) => `NOW() - INTERVAL '${days} days'`)
    .replace(/datetime\(\s*'now'\s*\)/gi, 'NOW()')
    .replace(/strftime\(\s*'%Y'\s*,\s*created_at\s*\)/gi, "TO_CHAR(created_at, 'YYYY')")

  let index = 0
  text = text.replace(/\?/g, () => `$${++index}`)
  const trimmed = text.trim()

  if (/^INSERT/i.test(trimmed) && !/RETURNING/i.test(trimmed)) {
    return `${text.replace(/;\s*$/, '')} RETURNING id`
  }

  return text
}

function wrapDbError(err) {
  if (err.code === '42P01') {
    const error = new Error('Database tables are missing. Run npm run db:setup against your Supabase database.')
    error.statusCode = 503
    return error
  }

  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    const error = new Error('Cannot reach PostgreSQL. Use the Supabase Session pooler URI in DATABASE_URL.')
    error.statusCode = 503
    return error
  }

  if (err.code === 'XX000' || err.message?.includes('Tenant or user not found')) {
    const error = new Error('Invalid Supabase credentials in DATABASE_URL. Check username format: postgres.[project-ref]')
    error.statusCode = 503
    return error
  }

  return err
}

class PostgresPool {
  constructor(pgPool) {
    this.pgPool = pgPool
  }

  async query(sql, params = []) {
    const text = toPostgresSql(sql)

    try {
      const result = await this.pgPool.query(text, params)
      const isModification = /^\s*(INSERT|UPDATE|DELETE)/i.test(sql.trim())

      if (isModification) {
        return [{
          fieldCount: 0,
          affectedRows: result.rowCount,
          insertId: result.rows[0]?.id,
          info: '',
          serverStatus: 0,
          warningCount: 0,
        }]
      }

      return [result.rows, result.fields || []]
    } catch (err) {
      throw wrapDbError(err)
    }
  }

  async execute(sql, params = []) {
    return this.query(sql, params)
  }
}

function getPool() {
  const url = getDatabaseUrl()
  if (!url) {
    lastPoolError = 'DATABASE_URL is empty'
    return null
  }

  if (!pool) {
    try {
      pool = new Pool({
        connectionString: getConnectionString(),
        ssl: useSsl() ? { rejectUnauthorized: false } : false,
        max: process.env.VERCEL ? 1 : 10,
        idleTimeoutMillis: process.env.VERCEL ? 1000 : 30000,
        connectionTimeoutMillis: 15000,
      })

      pool.on('error', (err) => {
        console.error('Unexpected error on idle PostgreSQL client', err.message)
        lastPoolError = err.message
        pool = null
        wrappedPool = null
      })

      lastPoolError = null
    } catch (err) {
      console.error('PostgreSQL configuration error:', err.message)
      lastPoolError = err.message
      pool = null
      wrappedPool = null
      return null
    }
  }

  if (!wrappedPool && pool) {
    wrappedPool = new PostgresPool(pool)
  }

  return wrappedPool
}

async function testConnection() {
  if (!hasDbConfig()) {
    return { ok: false, error: 'DATABASE_URL is not set in environment variables' }
  }

  const dbPool = getPool()
  if (!dbPool) {
    return {
      ok: false,
      error: lastPoolError || 'Failed to create database pool',
      host: safeHost(getConnectionString()),
    }
  }

  try {
    await dbPool.query('SELECT 1 AS ok')

    const [users] = await dbPool.query('SELECT COUNT(*)::int AS count FROM users')
    const [products] = await dbPool.query('SELECT COUNT(*)::int AS count FROM products')

    return {
      ok: true,
      users: users[0]?.count ?? 0,
      products: products[0]?.count ?? 0,
      host: safeHost(getConnectionString()),
    }
  } catch (err) {
    pool = null
    wrappedPool = null
    lastPoolError = err.message
    return {
      ok: false,
      error: err.message,
      host: safeHost(getConnectionString()),
    }
  }
}

function safeHost(connectionString) {
  try {
    const parsed = new URL(connectionString)
    return parsed.hostname
  } catch {
    return null
  }
}

async function closeDb() {
  if (pool) {
    await pool.end()
    pool = null
    wrappedPool = null
  }
}

module.exports = getPool
module.exports.hasDbConfig = hasDbConfig
module.exports.setDbFailed = setDbFailed
module.exports.testConnection = testConnection
module.exports.closeDb = closeDb

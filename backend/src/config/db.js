require('dotenv').config()
const { Pool } = require('pg')

let pool = null
let wrappedPool = null
let dbFailed = false

function hasDbConfig() {
  return !dbFailed && Boolean(process.env.DATABASE_URL)
}

function setDbFailed(failed) {
  dbFailed = failed
}

function useSsl() {
  const url = process.env.DATABASE_URL || ''
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
    return text.replace(/;\s*$/, '') + ' RETURNING id'
  }

  return text
}

class PostgresPool {
  constructor(pgPool) {
    this.pgPool = pgPool
  }

  async query(sql, params = []) {
    const text = toPostgresSql(sql)
    const result = await this.pgPool.query(text, params)
    const isModification = /^\s*(INSERT|UPDATE|DELETE)/i.test(sql.trim())

    if (isModification) {
      return [[{
        fieldCount: 0,
        affectedRows: result.rowCount,
        insertId: result.rows[0]?.id,
        info: '',
        serverStatus: 0,
        warningCount: 0,
      }]]
    }

    return [result.rows, result.fields || []]
  }

  async execute(sql, params = []) {
    return this.query(sql, params)
  }
}

function getPool() {
  if (!hasDbConfig()) {
    console.error('DATABASE_URL is not configured')
    return null
  }

  if (!pool) {
    try {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: useSsl() ? { rejectUnauthorized: false } : false,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      })

      pool.on('error', (err) => {
        console.error('Unexpected error on idle PostgreSQL client', err)
        setDbFailed(true)
      })
    } catch (err) {
      console.error('PostgreSQL configuration error:', err)
      setDbFailed(true)
      return null
    }
  }

  if (!wrappedPool) {
    wrappedPool = new PostgresPool(pool)
  }

  return wrappedPool
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
module.exports.closeDb = closeDb

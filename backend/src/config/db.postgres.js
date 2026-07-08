require('dotenv').config()
const { Pool } = require('pg')

let pool = null
let dbFailed = false

function hasDbConfig() {
  return !dbFailed && Boolean(process.env.DATABASE_URL)
}

function setDbFailed(failed) {
  dbFailed = failed
}

function getPool() {
  if (!hasDbConfig()) {
    return null
  }
  if (!pool) {
    try {
      const connectionString = process.env.DATABASE_URL
      
      pool = new Pool({
        connectionString,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      })

      pool.on('error', (err) => {
        console.error('Unexpected error on idle client', err)
        setDbFailed(true)
      })

      // Test connection
      pool.query('SELECT NOW()', (err, res) => {
        if (err) {
          console.error('PostgreSQL connection error:', err)
          setDbFailed(true)
        } else {
          console.log('PostgreSQL connected successfully at:', res.rows[0].now)
        }
      })
    } catch (err) {
      console.error('PostgreSQL configuration error:', err)
      setDbFailed(true)
      return null
    }
  }
  return pool
}

async function closeDb() {
  if (pool) {
    await pool.end()
    pool = null
  }
}

module.exports = getPool
module.exports.hasDbConfig = hasDbConfig
module.exports.setDbFailed = setDbFailed
module.exports.closeDb = closeDb

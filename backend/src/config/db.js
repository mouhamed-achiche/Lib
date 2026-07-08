require('dotenv').config()
const path = require('path')

let db = null
let pool = null
let dbFailed = false
let sqlite3Module = null

// Determine which database to use based on environment
const isProduction = process.env.NODE_ENV === 'production'
const usePostgres =
  isProduction &&
  process.env.DATABASE_URL &&
  !process.env.DATABASE_URL.startsWith('sqlite:')

function getSqlite3() {
  if (!sqlite3Module) {
    sqlite3Module = require('sqlite3').verbose()
  }
  return sqlite3Module
}

function hasDbConfig() {
  if (isProduction) {
    return (
      !dbFailed &&
      Boolean(process.env.DATABASE_URL) &&
      !process.env.DATABASE_URL.startsWith('sqlite:')
    )
  }
  return !dbFailed
}

function setDbFailed(failed) {
  dbFailed = failed
}

function getDb() {
  if (isProduction || usePostgres) {
    return null
  }
  if (!hasDbConfig()) {
    return null
  }
  if (!db) {
    try {
      const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.sqlite')
      db = new getSqlite3().Database(dbPath, (err) => {
        if (err) {
          console.error('Database connection error:', err)
          setDbFailed(true)
        }
      })
      // Enable foreign keys
      db.run('PRAGMA foreign_keys = ON')
      // Performance optimizations
      db.run('PRAGMA journal_mode = WAL')
      db.run('PRAGMA synchronous = NORMAL')
      db.run('PRAGMA cache_size = -64000') // 64MB cache
      db.run('PRAGMA temp_store = MEMORY')
      // Create banners table if not exists
      db.run(`CREATE TABLE IF NOT EXISTS banners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        subtitle TEXT,
        image_url TEXT NOT NULL,
        link TEXT,
        is_active INTEGER DEFAULT 1,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`)
      // Create homepage_sections table if not exists
      db.run(`CREATE TABLE IF NOT EXISTS homepage_sections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        order_num INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`)
      // Create homepage_section_products junction table if not exists
      db.run(`CREATE TABLE IF NOT EXISTS homepage_section_products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        section_id INTEGER NOT NULL,
        product_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (section_id) REFERENCES homepage_sections(id) ON DELETE CASCADE,
        UNIQUE(section_id, product_id)
      )`)
      // Create deals table if not exists
      db.run(`CREATE TABLE IF NOT EXISTS deals (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        title TEXT NOT NULL,
        ref TEXT,
        description TEXT,
        original_price REAL NOT NULL,
        discount TEXT,
        sale_price REAL NOT NULL,
        expiry_timestamp DATETIME NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`)
    } catch (err) {
      console.error('Database error:', err)
      setDbFailed(true)
      return null
    }
  }
  return db
}

function closeDb() {
  if (db) {
    db.close()
    db = null
  }
}

// Create a MySQL-like interface for SQLite to minimize code changes
class SQLitePool {
  async query(sql, params = []) {
    return new Promise((resolve, reject) => {
      const db = getDb()
      if (!db) {
        reject(new Error('Database not initialized'))
        return
      }

      // Determine if this is a SELECT or modification query
      const isSelect = /^\s*SELECT/i.test(sql)
      
      if (isSelect) {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err)
          else resolve([rows || [], []])
        })
      } else {
        db.run(sql, params, function(err) {
          if (err) reject(err)
          else {
            // Return MySQL-like format for INSERT/UPDATE/DELETE
            resolve([{
              fieldCount: 0,
              affectedRows: this.changes,
              insertId: this.lastID,
              info: '',
              serverStatus: 0,
              warningCount: 0
            }])
          }
        })
      }
    })
  }

  async execute(sql, params = []) {
    return this.query(sql, params)
  }
}

function getPool() {
  if (!hasDbConfig()) {
    if (isProduction) {
      console.error('DATABASE_URL is not configured for production')
    }
    return null
  }
  
  if (usePostgres) {
    if (!pool) {
      const getPostgresPool = require('./db.postgres')
      pool = getPostgresPool()
    }
    return pool
  }
  
  // Use SQLite pool for development
  if (!pool) {
    pool = new SQLitePool()
  }
  return pool
}

module.exports = getPool
module.exports.hasDbConfig = hasDbConfig
module.exports.setDbFailed = setDbFailed
module.exports.closeDb = closeDb
module.exports.getDb = getDb


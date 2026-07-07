require('dotenv').config()
const path = require('path')
const Database = require('better-sqlite3')

let db = null
let dbFailed = false

function hasDbConfig() {
  return !dbFailed && Boolean(process.env.DB_PATH)
}

function setDbFailed(failed) {
  dbFailed = failed
}

function getDb() {
  if (!hasDbConfig()) {
    return null
  }
  if (!db) {
    try {
      const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.sqlite')
      db = new Database(dbPath)
      // Enable foreign keys for SQLite
      db.pragma('foreign_keys = ON')
    } catch (err) {
      console.error('Database connection error:', err)
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

module.exports = getDb
module.exports.hasDbConfig = hasDbConfig
module.exports.setDbFailed = setDbFailed
module.exports.closeDb = closeDb

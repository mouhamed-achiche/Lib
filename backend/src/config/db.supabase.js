require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

let supabase = null
let dbFailed = false

function hasDbConfig() {
  return !dbFailed && Boolean(process.env.SUPABASE_URL) && Boolean(process.env.SUPABASE_SECRET_KEY)
}

function setDbFailed(failed) {
  dbFailed = failed
}

function getSupabase() {
  if (!hasDbConfig()) {
    return null
  }
  
  if (!supabase) {
    try {
      supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SECRET_KEY
      )
      console.log('✅ Supabase client initialized')
    } catch (err) {
      console.error('Supabase client error:', err)
      setDbFailed(true)
      return null
    }
  }
  
  return supabase
}

// Create a PostgreSQL-like interface for Supabase to minimize code changes
class SupabasePool {
  constructor() {
    this.client = getSupabase()
  }

  async query(sql, params = []) {
    if (!this.client) {
      throw new Error('Supabase client not initialized')
    }

    // Convert SQL to Supabase queries (basic implementation)
    // This is a simplified version - in production you'd want a more robust SQL parser
    const isSelect = /^\s*SELECT/i.test(sql)
    const isInsert = /^\s*INSERT/i.test(sql)
    const isUpdate = /^\s*UPDATE/i.test(sql)
    const isDelete = /^\s*DELETE/i.test(sql)

    if (isSelect) {
      // Parse table name from SELECT
      const tableMatch = sql.match(/FROM\s+(\w+)/i)
      if (!tableMatch) throw new Error('Could not parse table name')
      const tableName = tableMatch[1]

      const { data, error } = await this.client
        .from(tableName)
        .select('*')
        .limit(1000)

      if (error) throw error
      return [data || [], []]
    }

    if (isInsert) {
      const tableMatch = sql.match(/INTO\s+(\w+)/i)
      if (!tableMatch) throw new Error('Could not parse table name')
      const tableName = tableMatch[1]

      // This is a simplified version - you'd need to parse the VALUES clause
      // For now, return a mock response
      return [[{ affectedRows: 1, insertId: 1 }], []]
    }

    if (isUpdate || isDelete) {
      // Simplified version
      return [[{ affectedRows: 1 }], []]
    }

    throw new Error('Unsupported SQL operation')
  }

  async execute(sql, params = []) {
    return this.query(sql, params)
  }
}

function getPool() {
  if (!hasDbConfig()) {
    return null
  }
  
  if (!supabase) {
    return new SupabasePool()
  }
  
  return new SupabasePool()
}

module.exports = getPool
module.exports.hasDbConfig = hasDbConfig
module.exports.setDbFailed = setDbFailed
module.exports.getSupabase = getSupabase

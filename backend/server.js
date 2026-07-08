require('dotenv').config()
const app = require('./src/app')
const getPool = require('./src/config/db')
const { hasDbConfig, setDbFailed } = require('./src/config/db')

const PORT = process.env.PORT || 5000

module.exports = app

if (require.main === module) {
  ;(async () => {
    try {
      if (!hasDbConfig()) {
        console.error('❌ DATABASE_URL is not set. Add it to backend/.env')
        process.exit(1)
      }

      const pool = getPool()
      if (!pool) {
        throw new Error('Failed to initialize PostgreSQL pool')
      }

      await pool.query('SELECT 1 AS ok')
      console.log('✅ PostgreSQL connected')

      const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on port ${PORT}`)
      })

      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.error(`❌ Port ${PORT} is already in use.`)
          process.exit(1)
        }
        throw err
      })
    } catch (err) {
      setDbFailed(true)
      console.error('❌ Database connection failed:', err.message)
      process.exit(1)
    }
  })()
}

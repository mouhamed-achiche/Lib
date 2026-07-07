require('dotenv').config()
const app = require('./src/app')
const { hasDbConfig, setDbFailed, getDb } = require('./src/config/db')

const PORT = process.env.PORT || 5000

;(async () => {
  try {
    if (!hasDbConfig()) {
      console.error('❌ SQLite database not configured. Please set DB_PATH in .env file.')
      process.exit(1)
    }

    const db = getDb()
    if (!db) {
      throw new Error('Failed to initialize database')
    }

    // Test the connection by querying SQLite master table
    db.get("SELECT 1", (err) => {
      if (err) {
        throw new Error('Database test failed: ' + err.message)
      }
      console.log('✅ SQLite database connected')
      startServer(PORT)
    })
  } catch (err) {
    setDbFailed(true)
    console.error('❌ Database connection failed:', err.message)
    process.exit(1)
  }
})()

function startServer(port) {
  const server = app.listen(port, '0.0.0.0', () => console.log(`🚀 Server running on port ${port}`))
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `❌ Port ${port} is already in use. Stop the other process or set PORT in .env to a free port.`,
      )
      console.error('Windows: netstat -ano | findstr :' + port)
      console.error('Then: taskkill /PID NUMBER_FROM_LAST_COLUMN /F')
      process.exit(1)
    }
    throw err
  })
}

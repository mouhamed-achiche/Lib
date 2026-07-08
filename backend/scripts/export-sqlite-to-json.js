/**
 * Export SQLite database to JSON for migration
 * Usage: node scripts/export-sqlite-to-json.js
 * 
 * This script exports all data from SQLite to JSON files
 * that can be imported into PostgreSQL from any environment.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const fs = require('fs')
const path = require('path')
const sqlite3 = require('sqlite3').verbose()

const SQLITE_DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'database.sqlite')
const EXPORT_DIR = path.join(__dirname, '..', 'migrations', 'data')

// Migration order (respecting foreign key dependencies)
const MIGRATION_ORDER = [
  'users',
  'categories', 
  'brands',
  'products',
  'product_images',
  'homepage_sections',
  'homepage_section_products',
  'banners',
  'deals',
  'promotions',
  'carts',
  'cart_items',
  'orders',
  'order_items',
  'wishlist',
  'newsletter_subscribers',
  'refresh_tokens'
]

function exportSQLiteToJSON() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(SQLITE_DB_PATH, (err) => {
      if (err) {
        reject(err)
        return
      }
    })

    // Create export directory
    if (!fs.existsSync(EXPORT_DIR)) {
      fs.mkdirSync(EXPORT_DIR, { recursive: true })
    }

    const data = {}

    const exportTable = (index) => {
      if (index >= MIGRATION_ORDER.length) {
        db.close()
        
        // Write all data to a single JSON file
        const exportFile = path.join(EXPORT_DIR, 'sqlite-export.json')
        fs.writeFileSync(exportFile, JSON.stringify(data, null, 2))
        
        console.log(`\n✅ Export complete! Data saved to: ${exportFile}`)
        console.log('\n📊 Export summary:')
        for (const table of MIGRATION_ORDER) {
          console.log(`  - ${table}: ${data[table]?.length || 0} rows`)
        }
        
        resolve(data)
        return
      }

      const table = MIGRATION_ORDER[index]
      db.all(`SELECT * FROM ${table}`, (err, rows) => {
        if (err) {
          console.warn(`⚠️  Warning exporting ${table}:`, err.message)
          data[table] = []
        } else {
          data[table] = rows || []
          console.log(`📤 Exported ${rows.length} rows from ${table}`)
        }
        exportTable(index + 1)
      })
    }

    exportTable(0)
  })
}

// Run export
exportSQLiteToJSON().catch(err => {
  console.error('❌ Export failed:', err.message)
  process.exit(1)
})

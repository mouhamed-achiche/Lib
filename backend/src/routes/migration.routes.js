const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

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
];

// Data type transformations
function transformValue(value, fieldName) {
  if (value === null || value === undefined) return null;
  
  if (fieldName.includes('is_active') || fieldName.includes('is_available')) {
    return value === 1 || value === '1' || value === true;
  }
  
  if (fieldName.includes('date') || fieldName.includes('time') || fieldName.includes('created_at') || fieldName.includes('updated_at')) {
    if (typeof value === 'string') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date.toISOString();
    }
    return value;
  }
  
  if (fieldName.includes('price') || fieldName.includes('cost') || fieldName.includes('qty') || fieldName.includes('count')) {
    return parseFloat(value) || 0;
  }
  
  return value;
}

function transformRow(row, table) {
  const transformed = {};
  for (const [key, value] of Object.entries(row)) {
    transformed[key] = transformValue(value, key);
  }
  return transformed;
}

// POST /api/migration/import - Import JSON data to PostgreSQL
router.post('/import', async (req, res) => {
  try {
    const POSTGRES_URL = process.env.DATABASE_URL;
    
    if (!POSTGRES_URL) {
      return res.status(500).json({ error: 'DATABASE_URL not set' });
    }

    const IMPORT_DIR = path.join(__dirname, '..', '..', '..', 'migrations', 'data');
    const IMPORT_FILE = path.join(IMPORT_DIR, 'sqlite-export.json');

    if (!fs.existsSync(IMPORT_FILE)) {
      return res.status(404).json({ error: 'Export file not found' });
    }

    const jsonData = JSON.parse(fs.readFileSync(IMPORT_FILE, 'utf8'));

    // Connect to PostgreSQL
    const pool = new Pool({
      connectionString: POSTGRES_URL,
      ssl: { rejectUnauthorized: false }
    });

    await pool.query('SELECT NOW()');

    // Create schema
    const schemaPath = path.join(__dirname, '..', '..', '..', 'database', 'schema.postgres.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    const statements = schema.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      try {
        await pool.query(statement);
      } catch (err) {
        if (!err.message.includes('already exists')) {
          console.warn(`Schema warning: ${err.message}`);
        }
      }
    }

    // Import data
    for (const table of MIGRATION_ORDER) {
      const rows = jsonData[table];
      if (!rows || rows.length === 0) continue;

      try {
        const columns = Object.keys(rows[0]);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        const columnNames = columns.join(', ');
        
        for (const row of rows) {
          const transformed = transformRow(row, table);
          const values = columns.map(col => transformed[col]);
          
          try {
            await pool.query(
              `INSERT INTO ${table} (${columnNames}) VALUES (${placeholders})`,
              values
            );
          } catch (err) {
            if (!err.message.includes('duplicate key')) {
              console.warn(`Warning inserting into ${table}: ${err.message}`);
            }
          }
        }
      } catch (err) {
        console.error(`Error importing ${table}:`, err.message);
      }
    }

    // Reset sequences
    for (const table of MIGRATION_ORDER) {
      try {
        const result = await pool.query(`SELECT MAX(id) as max_id FROM ${table}`);
        const maxId = result.rows[0].max_id;
        
        if (maxId) {
          await pool.query(`SELECT setval('${table}_id_seq', ${maxId}, true)`);
        }
      } catch (err) {
        console.warn(`Could not reset sequence for ${table}: ${err.message}`);
      }
    }

    await pool.end();

    res.json({ 
      success: true, 
      message: 'Migration completed successfully',
      tables: MIGRATION_ORDER.map(table => ({
        table,
        count: jsonData[table]?.length || 0
      }))
    });

  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

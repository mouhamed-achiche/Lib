/**
 * Convert JSON data to SQL INSERT statements
 * Usage: node scripts/convert-json-to-sql.js
 * 
 * This script converts the exported JSON data to SQL INSERT statements
 * that can be run directly in Supabase's SQL Editor.
 */

const fs = require('fs');
const path = require('path');

const IMPORT_DIR = path.join(__dirname, '..', 'migrations', 'data');
const IMPORT_FILE = path.join(IMPORT_DIR, 'sqlite-export.json');
const OUTPUT_FILE = path.join(IMPORT_DIR, 'postgres-inserts.sql');

// Read JSON data
const jsonData = JSON.parse(fs.readFileSync(IMPORT_FILE, 'utf8'));

// Data type transformations for PostgreSQL
function transformValue(value, fieldName) {
  if (value === null || value === undefined) return 'NULL';
  
  // Handle INTEGER to BOOLEAN conversion for is_active fields
  if (fieldName.includes('is_active') || fieldName.includes('is_available')) {
    return value === 1 || value === '1' || value === true ? 'TRUE' : 'FALSE';
  }
  
  // Handle date/time fields
  if (fieldName.includes('date') || fieldName.includes('time') || fieldName.includes('created_at') || fieldName.includes('updated_at')) {
    if (typeof value === 'string') {
      const date = new Date(value);
      if (isNaN(date.getTime())) return 'NULL';
      return `'${date.toISOString()}'`;
    }
    return `'${value}'`;
  }
  
  // Handle numeric fields
  if (fieldName.includes('price') || fieldName.includes('cost') || fieldName.includes('qty') || fieldName.includes('count')) {
    const num = parseFloat(value) || 0;
    return num.toString();
  }
  
  // Handle text fields - escape single quotes
  if (typeof value === 'string') {
    return `'${value.replace(/'/g, "''")}'`;
  }
  
  return value.toString();
}

function transformRow(row, table) {
  const transformed = {};
  for (const [key, value] of Object.entries(row)) {
    transformed[key] = transformValue(value, key);
  }
  return transformed;
}

// Migration order
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

// Generate SQL INSERT statements
let sqlStatements = '-- PostgreSQL INSERT statements from SQLite data\n';
sqlStatements += '-- Run this in Supabase SQL Editor after creating the schema\n\n';

for (const table of MIGRATION_ORDER) {
  const rows = jsonData[table];
  if (!rows || rows.length === 0) {
    sqlStatements += `-- Skipping ${table} (no data)\n\n`;
    continue;
  }

  sqlStatements += `-- Data for ${table}\n`;
  
  for (const row of rows) {
    const transformed = transformRow(row, table);
    const columns = Object.keys(transformed);
    const values = Object.values(transformed);
    
    sqlStatements += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
  }
  
  sqlStatements += '\n';
}

// Write to file
fs.writeFileSync(OUTPUT_FILE, sqlStatements);

console.log(`✅ SQL INSERT statements generated: ${OUTPUT_FILE}`);
console.log(`\n📊 Summary:`);
for (const table of MIGRATION_ORDER) {
  console.log(`  - ${table}: ${jsonData[table]?.length || 0} rows`);
}
console.log(`\n💡 Next steps:`);
console.log(`1. Run the schema in Supabase SQL Editor: database/schema.postgres.sql`);
console.log(`2. Run the INSERT statements: ${OUTPUT_FILE}`);

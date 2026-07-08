require('dotenv').config()
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SECRET_KEY

async function runMigrationsViaAPI() {
  try {
    console.log('🔄 Running database migrations via Supabase REST API...')
    
    const schemaPath = path.join(__dirname, 'database', 'schema.postgres.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`)
    
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ sql: statement })
        })
        
        if (response.ok) {
          successCount++
          console.log(`✅ Statement ${i + 1}/${statements.length} executed`)
        } else {
          errorCount++
          const error = await response.text()
          console.log(`⚠️  Statement ${i + 1}/${statements.length} failed:`, error)
        }
      } catch (err) {
        errorCount++
        console.log(`❌ Statement ${i + 1}/${statements.length} error:`, err.message)
      }
    }
    
    console.log(`\n📊 Migration summary: ${successCount} successful, ${errorCount} failed`)
    
    if (successCount > 0) {
      console.log('✅ Database migrations completed!')
    } else {
      console.log('❌ No migrations were executed successfully')
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    throw error
  }
}

runMigrationsViaAPI()

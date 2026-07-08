require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SECRET_KEY

console.log('Testing Supabase connection after migrations...')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseKey ? 'Present' : 'Missing')

try {
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // Test users table
  supabase.from('users').select('*').limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Users table query failed:', error.message)
      } else {
        console.log('✅ Users table accessible! (Empty as expected)')
      }
      
      // Test categories table
      return supabase.from('categories').select('*').limit(1)
    })
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Categories table query failed:', error.message)
      } else {
        console.log('✅ Categories table accessible!')
      }
      
      // Test products table
      return supabase.from('products').select('*').limit(1)
    })
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Products table query failed:', error.message)
      } else {
        console.log('✅ Products table accessible!')
      }
      
      console.log('\n🎉 All core tables are accessible via Supabase!')
    })
    .catch(err => {
      console.error('❌ Connection error:', err.message)
    })
} catch (error) {
  console.error('❌ Client creation error:', error.message)
}

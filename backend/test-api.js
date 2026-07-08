const http = require('http')

function testEndpoint(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'GET',
      headers: {
        'X-Forwarded-Proto': 'https'
      }
    }

    const req = http.request(options, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          resolve({ status: res.statusCode, data: json })
        } catch (e) {
          resolve({ status: res.statusCode, data: data })
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    req.end()
  })
}

async function runTests() {
  console.log('🧪 Testing API endpoints...\n')

  try {
    // Test health endpoint
    console.log('1. Testing /api/health')
    const health = await testEndpoint('/api/health')
    console.log(`   Status: ${health.status}`)
    console.log(`   Response:`, health.data)
    console.log()

    // Test products endpoint
    console.log('2. Testing /api/products')
    const products = await testEndpoint('/api/products')
    console.log(`   Status: ${products.status}`)
    if (products.data.success) {
      console.log(`   Products count: ${products.data.data.total}`)
      console.log(`   First product: ${products.data.data.items[0]?.name}`)
    }
    console.log()

    // Test categories endpoint
    console.log('3. Testing /api/categories')
    const categories = await testEndpoint('/api/categories')
    console.log(`   Status: ${categories.status}`)
    if (categories.data.success) {
      console.log(`   Categories count: ${categories.data.data.items.length}`)
      console.log(`   Categories: ${categories.data.data.items.map(c => c.name).join(', ')}`)
    }
    console.log()

    // Test brands endpoint
    console.log('4. Testing /api/brands')
    const brands = await testEndpoint('/api/brands')
    console.log(`   Status: ${brands.status}`)
    if (brands.data.success) {
      console.log(`   Brands count: ${brands.data.data.items.length}`)
      console.log(`   Brands: ${brands.data.data.items.map(b => b.name).join(', ')}`)
    }
    console.log()

    console.log('🎉 All API tests completed!')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

runTests()

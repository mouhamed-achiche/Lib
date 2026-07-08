require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SECRET_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...')

    // Insert categories
    console.log('📁 Inserting categories...')
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .insert([
        { id: 1, name: 'Books', slug: 'books', description: 'Reading and reference titles for thoughtful workspaces.', sort_order: 1 },
        { id: 2, name: 'Stationery', slug: 'stationery', description: 'Pens, notebooks, and writing tools.', sort_order: 2 },
        { id: 3, name: 'Art Supplies', slug: 'art-supplies', description: 'Paper, markers, and creative tools.', sort_order: 3 },
        { id: 4, name: 'Tech', slug: 'tech', description: 'Compact accessories that make the desk work harder.', sort_order: 4 },
        { id: 5, name: 'Gifts', slug: 'gifts', description: 'Objects that feel intentional and useful.', sort_order: 5 }
      ])
      .select()
    
    if (catError) {
      console.error('❌ Categories error:', catError.message)
    } else {
      console.log(`✅ Inserted ${categories.length} categories`)
    }

    // Insert brands
    console.log('🏷️  Inserting brands...')
    const { data: brands, error: brandError } = await supabase
      .from('brands')
      .insert([
        { id: 1, name: 'Pilot', slug: 'pilot' },
        { id: 2, name: 'Stabilo', slug: 'stabilo' },
        { id: 3, name: 'Lamy', slug: 'lamy' },
        { id: 4, name: 'Moleskine', slug: 'moleskine' },
        { id: 5, name: 'Muji', slug: 'muji' },
        { id: 6, name: 'Baseus', slug: 'baseus' },
        { id: 7, name: 'Canson', slug: 'canson' }
      ])
      .select()
    
    if (brandError) {
      console.error('❌ Brands error:', brandError.message)
    } else {
      console.log(`✅ Inserted ${brands.length} brands`)
    }

    // Insert products
    console.log('📦 Inserting products...')
    const products = [
      {
        id: 1,
        name: 'Pastel Highlighter Set (6 Pack)',
        slug: 'pastel-highlighter-set',
        description: 'Soft tones, clean lines, and a compact set for daily study.',
        price: 14.00,
        sale_price: 18.50,
        stock_qty: 80,
        category_id: 2,
        brand_id: 2,
        badge: 'Sale',
        image_url: 'https://lh3.googleusercontent.com/aida/AP1WRLsv-uhFk17KGk_jgPWP20N0eBNjMnQlQunwqaGwTOtr-LeOum-VbyDTF_JGvDqAD4PTNWzMsEs921_JaBUzaH4_0HPHJTU3AIzw0RRa5g4ee8_NgdyTsHBiRRtyXzcLitVrhjQUeQI1tQbZxoFcwwk9tzTt8xI-4ZxUXL8G7xq8q-4G4bNZbdCNd364KlkogXgEVl7YPrSYfLSsT6sazmRj5xawCjCQdFW7SPMX6Vj0jvq5VO0UIMEOews'
      },
      {
        id: 2,
        name: 'Classic Hardcover Journal - Navy Blue Edition',
        slug: 'classic-hardcover-journal-navy',
        description: 'A durable journal with smooth paper and a refined cloth cover.',
        price: 24.00,
        stock_qty: 32,
        category_id: 2,
        badge: null,
        image_url: 'https://lh3.googleusercontent.com/aida/AP1WRLuid_yohZZz3e_1vGozTwad7qCBPi3d2DPhrW3hfrfYpDLOjps7lytC4Ucly0xYGAWxHQe1L-tPfY_Is4BpsrTUh8Y2Lj7RDiLNe2g9yOTsm0Cd4lVMpSeu9rV92loraTjhu0i-m1OY13M5N1HpFHlQRbIIrNI17ZTCbvMh4JQjOyUgWBWObUZ62Ip8fH6Oy0uUZUNloniWvj-ygse8D7kpvZO_aFA8aMPm34aSjiaLdA7rYdglLpTjE3Dh'
      },
      {
        id: 3,
        name: 'Premium Fine-Liner Pen Set - Assorted Colors',
        slug: 'premium-fine-liner-pen-set',
        description: 'A clean, precise set for sketches, notes, and color coding.',
        price: 18.50,
        stock_qty: 18,
        category_id: 2,
        badge: null,
        image_url: 'https://lh3.googleusercontent.com/aida/AP1WRLvit1pqIelvrb7l1ouy_DtHsKyGudHeNZFRMKsWtZTzMPkBA2JogyGZTIItW1J1zYpdiMjTO4uXZIuCsIZYoI-DMyZa2uctLeworkGXMAf1RjRKP2Gcv-FxWIm1ApbkTffrArUWSN8jIGHS1Ucw9zOQ71lJ5ZigOzwfVXhcSQTQFCPmDZX24egIRoaRj4VADIyCGU94wtwJJn2C32KxpxsDyrR0yCJm9zFic7NKUxaszk5n1MZeSf8RNKcM'
      },
      {
        id: 4,
        name: 'Professional Sketchbook - Heavyweight Acid-Free Paper',
        slug: 'professional-sketchbook',
        description: 'A sturdy sketchbook built for studies, drafts, and finished work.',
        price: 32.00,
        stock_qty: 24,
        category_id: 3,
        badge: null,
        image_url: 'https://lh3.googleusercontent.com/aida/AP1WRLtWPEWZmlVrNUUjGdGyCRd8vhCVzND0rZLVw0GUmBpOQrJv2LKxYszZbp7OTRvcqnD_whehL_Q2SqCDzFLSMLqgIM6LrcnrsNzEA7BHg2SNMtzHoJJOJLMe6z1ozMWPRHT0kwY41Xy_-ebRvYVcoq6RPAjFPXuW7bDVCaX7Q4OY0RVR1UtiqTGjLt5ZOWZayA-jfgkMbFZYAj4gsADSkpGobArIW6qYdt36CbnEGq2fqBkz90JfMiOoMRo9'
      },
      {
        id: 5,
        name: 'Birch Wood Desk Organizer - Modular Design',
        slug: 'birch-wood-desk-organizer',
        description: 'A flexible desk organizer that keeps small tools in one place.',
        price: 45.00,
        stock_qty: 12,
        category_id: 5,
        badge: null,
        image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbQ4kFafv11pzds52xzwMDXM9To2vkwOTnnW0xuTx9J7ctLaSQ-K0bxzm-Poel9dC5-5NEJoTq1qvGcE8rC-MuAsWCLAeuJUgdzNvjHlBmI0GRvBpO88QQew_xvU016gzNyy7ebX6CNyGnUUJ7xvr7zpE0EUrLYZ-ft3B2zW6Qg-oWWcgK_OslZz2srNSJiK-OmwhD3rUFgknsWI7A2cpKGf4O4Jfb3u4kebC7lct0C7Z01kejDdz41ASCSy66v5RkKX8QTL3E0UcY'
      },
      {
        id: 6,
        name: 'Executive Fountain Pen Set',
        slug: 'executive-fountain-pen-set',
        description: 'A premium writing set with balanced weight and smooth ink flow.',
        price: 120.00,
        stock_qty: 8,
        category_id: 2,
        brand_id: 1,
        badge: 'Premium',
        image_url: 'https://lh3.googleusercontent.com/aida/AP1WRLvit1pqIelvrb7l1ouy_DtHsKyGudHeNZFRMKsWtZTzMPkBA2JogyGZTIItW1J1zYpdiMjTO4uXZIuCsIZYoI-DMyZa2uctLeworkGXMAf1RjRKP2Gcv-FxWIm1ApbkTffrArUWSN8jIGHS1Ucw9zOQ71lJ5ZigOzwfVXhcSQTQFCPmDZX24egIRoaRj4VADIyCGU94wtwJJn2C32KxpxsDyrR0yCJm9zFic7NKUxaszk5n1MZeSf8RNKcM'
      },
      {
        id: 7,
        name: 'USB-C Hub 7-in-1',
        slug: 'usb-c-hub-7-in-1',
        description: 'A compact hub for displays, storage, and fast charging.',
        price: 55.00,
        stock_qty: 9,
        category_id: 4,
        brand_id: 6,
        badge: 'New',
        image_url: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=1200&q=80'
      },
      {
        id: 8,
        name: 'The Creative Act: A Way of Being',
        slug: 'the-creative-act-way-of-being',
        description: 'A beautiful and gentle guide to the creative process by Rick Rubin.',
        price: 42.00,
        stock_qty: 15,
        category_id: 1,
        badge: null,
        image_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 9,
        name: 'Atomic Habits',
        slug: 'atomic-habits',
        description: 'An easy & proven way to build good habits & break bad ones.',
        price: 38.00,
        stock_qty: 40,
        category_id: 1,
        badge: null,
        image_url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 10,
        name: 'Minimalist Fountain Pen',
        slug: 'minimalist-fountain-pen',
        description: 'Refined matte finish writing instrument with smooth ink delivery.',
        price: 45.00,
        stock_qty: 25,
        category_id: 2,
        brand_id: 3,
        badge: null,
        image_url: 'https://images.unsplash.com/photo-1583485088034-697ab6a0800a?auto=format&fit=crop&w=600&q=80'
      }
    ]

    const { data: productsData, error: prodError } = await supabase
      .from('products')
      .insert(products)
      .select()
    
    if (prodError) {
      console.error('❌ Products error:', prodError.message)
    } else {
      console.log(`✅ Inserted ${productsData.length} products`)
    }

    // Insert users with hashed passwords
    console.log('👤 Inserting users...')
    const adminPassword = await bcrypt.hash('admin123', 12)
    const staffPassword = await bcrypt.hash('M14WpSo3XvDiAKXd1ecvgnP3UdOKVjRGpq', 12)

    const { data: users, error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: 1,
          name: 'Admin',
          email: 'admin@ibnsina.tn',
          password: adminPassword,
          role: 'staff'
        },
        {
          id: 2,
          name: 'Staff',
          email: 'adelmoula9hwa1234@gmail.com',
          password: staffPassword,
          role: 'staff'
        }
      ])
      .select()
    
    if (userError) {
      console.error('❌ Users error:', userError.message)
    } else {
      console.log(`✅ Inserted ${users.length} users`)
    }

    // Insert homepage sections
    console.log('🏠 Inserting homepage sections...')
    const { data: sections, error: sectionError } = await supabase
      .from('homepage_sections')
      .insert([
        {
          id: 1,
          title: 'All Products',
          slug: 'all-products',
          description: 'Browse our complete collection of products',
          order_num: 1,
          is_active: 1
        }
      ])
      .select()
    
    if (sectionError) {
      console.error('❌ Homepage sections error:', sectionError.message)
    } else {
      console.log(`✅ Inserted ${sections.length} homepage sections`)
    }

    console.log('\n🎉 Database seeding completed successfully!')
    console.log('\n📋 Test accounts:')
    console.log('   Admin: admin@ibnsina.tn / admin123')
    console.log('   Staff: adelmoula9hwa1234@gmail.com / M14WpSo3XvDiAKXd1ecvgnP3UdOKVjRGpq')

  } catch (error) {
    console.error('❌ Seeding failed:', error.message)
    throw error
  }
}

seedDatabase()

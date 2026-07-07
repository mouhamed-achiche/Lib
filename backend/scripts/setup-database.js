/**
 * Creates SQLite database with all tables and seed data.
 * Usage: npm run db:setup
 * Requires sqlite3 package installed
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'database.sqlite');
const databaseDir = path.join(__dirname, '..', 'database');

function readSql(filename) {
  return fs.readFileSync(path.join(databaseDir, filename), 'utf8');
}

function runSetup() {
  return new Promise((resolve, reject) => {
    console.log('🔧 Setting up SQLite database...');
    console.log(`📁 Database path: ${DB_PATH}`);

    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('❌ Failed to create/open database:', err.message);
        reject(err);
        return;
      }

      // Enable foreign keys
      db.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) {
          console.error('❌ Failed to enable foreign keys:', err.message);
          reject(err);
          return;
        }

        console.log('📋 Loading schema...');
        const schema = readSql('schema.sqlite.sql');
        const schemaStatements = schema.split(';').filter(s => s.trim());
        
        // Execute schema statements sequentially
        const executeSchemaStatements = (index) => {
          if (index >= schemaStatements.length) {
            console.log('✅ Schema loaded successfully');
            loadSeedData();
            return;
          }

          const statement = schemaStatements[index];
          db.exec(statement, (err) => {
            if (err) {
              console.warn(`⚠️  Schema statement ${index + 1} warning: ${err.message}`);
            }
            executeSchemaStatements(index + 1);
          });
        };

        executeSchemaStatements(0);
      });

      const loadSeedData = () => {
        console.log('🌱 Loading seed data...');
        const seed = readSql('seed.sqlite.sql');
        const seedStatements = seed.split(';').filter(s => s.trim());
        
        const executeSeedStatements = (index) => {
          if (index >= seedStatements.length) {
            console.log('✅ Seed data loaded successfully');
            verifyData();
            return;
          }

          const statement = seedStatements[index];
          db.exec(statement, (err) => {
            if (err) {
              console.warn(`⚠️  Seed statement ${index + 1} warning: ${err.message}`);
            }
            executeSeedStatements(index + 1);
          });
        };

        executeSeedStatements(0);
      };

      const verifyData = () => {
        // Get table names
        db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
          if (err) {
            console.error('❌ Failed to get tables:', err.message);
            db.close();
            reject(err);
            return;
          }

          console.log('\n✅ Setup complete. Tables created:');
          tables.forEach(t => console.log('  -', t.name));

          // Get record counts
          db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
            const users = err ? 0 : row.count;
            
            db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
              const products = err ? 0 : row.count;
              
              db.get('SELECT COUNT(*) as count FROM categories', (err, row) => {
                const categories = err ? 0 : row.count;

                console.log('\n📊 Database Summary:');
                console.log(`  👥 Users: ${users}`);
                console.log(`  🛍️  Products: ${products}`);
                console.log(`  📦 Categories: ${categories}`);

                console.log('\n🔑 Login credentials:');
                console.log('  Email: adelmoula9hwa1234@gmail.com');
                console.log('  Password: M14WpSo3XvDiAKXd1ecvgnP3UdOKVjRGpq');
                
                console.log('\n💡 Tip: Restart API with "npm run dev"');

                db.close();
                resolve();
              });
            });
          });
        });
      };
    });
  });
}

runSetup().catch((err) => {
  console.error('\n❌ Database setup failed:', err.message);
  process.exit(1);
});

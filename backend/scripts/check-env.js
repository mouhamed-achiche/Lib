require('dotenv').config();
const { hasDbConfig } = require('../src/config/db');

console.log('Environment check:');
console.log('DB_PATH:', process.env.DB_PATH);
console.log('hasDbConfig():', hasDbConfig());
console.log('Database should be:', hasDbConfig() ? 'ENABLED' : 'DISABLED (using in-memory store)');

process.exit(0);

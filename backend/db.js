const { Pool } = require('pg');
const pool = new Pool({
  user: "postgres",
  host: "localhost",    
  database: "AMDB",
  password: "ashfaq",
  port: 5432,
});

module.exports = pool;
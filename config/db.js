const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '1234',   // <-- change this
  database: 'gym_cluster_final',
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = pool.promise();

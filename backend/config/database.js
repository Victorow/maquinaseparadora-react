// backend/config/database.js
const mysql = require('mysql2/promise');

// Configuração recomendada para compatibilidade com acentos e segurança
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '', // Use sua senha real ou deixe vazio se não tiver
  database: process.env.DB_NAME || 'db_prod',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4' // <-- Importante para suportar acentos e emojis
});

console.log('Pool de conexões com o MySQL criado com sucesso.');

module.exports = pool;
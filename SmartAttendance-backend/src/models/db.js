import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Configuración del pool de conexiones PostgreSQL
const pool = new pg.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'smartattendance',
    password: process.env.DB_PASSWORD || 'smartattendance123',
    database: process.env.DB_NAME || 'smartattendance',
    max: 20, // Máximo de conexiones en el pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Manejo de errores del pool
pool.on('error', (err) => {
    console.error('❌ Error inesperado en el pool de PostgreSQL:', err);
});

pool.on('connect', () => {
    console.log('✅ Conexión a PostgreSQL establecida');
});

// Test de conexión al iniciar
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Error conectando a PostgreSQL:', err.message);
    } else {
        console.log('✅ Base de datos conectada correctamente');
    }
});

export default pool;


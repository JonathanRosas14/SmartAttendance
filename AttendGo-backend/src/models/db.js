import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Configuración del pool de conexiones PostgreSQL
const pool = new pg.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'attendgo',
    password: process.env.DB_PASSWORD || 'attendgo123',
    database: process.env.DB_NAME || 'attendgo',
    max: 20, // Máximo de conexiones en el pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Manejo de errores del pool
pool.on('error', (err) => {
    console.error('❌ Error inesperado en el pool de PostgreSQL:', err);
});

async function inicializarBaseDeDatos() {
    await pool.query('ALTER TABLE asistencias ADD COLUMN IF NOT EXISTS asistio BOOLEAN DEFAULT TRUE');
    await pool.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS idx_asistencias_estudiante_clase_fecha
         ON asistencias (estudiante_id, clase_id, fecha)`
    );
}

// Test de conexión al iniciar
pool.query('SELECT NOW()', async (err) => {
    if (err) {
        console.error('❌ Error conectando a PostgreSQL:', err.message);
    } else {
        try {
            await inicializarBaseDeDatos();
            console.log('✅ Base de datos conectada correctamente');
        } catch (migrationError) {
            console.error('❌ Error inicializando base de datos:', migrationError.message);
        }
    }
});

export default pool;

-- Tabla de profesores
CREATE TABLE IF NOT EXISTS profesores (
  id VARCHAR(50) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(100) UNIQUE NOT NULL,
  contrasena VARCHAR(255) NOT NULL,
  departamento VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de estudiantes
CREATE TABLE IF NOT EXISTS estudiantes (
  id VARCHAR(50) PRIMARY KEY,
  numero_identificacion VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(100) UNIQUE NOT NULL,
  contrasena VARCHAR(255) NOT NULL,
  celular VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de clases
CREATE TABLE IF NOT EXISTS clases (
  id VARCHAR(50) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  hora_inicio VARCHAR(10) NOT NULL,
  hora_fin VARCHAR(10) NOT NULL,
  profesor_id VARCHAR(50) NOT NULL REFERENCES profesores(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de estudiantes vinculados a clases
CREATE TABLE IF NOT EXISTS clase_estudiantes (
  id SERIAL PRIMARY KEY,
  clase_id VARCHAR(50) NOT NULL REFERENCES clases(id) ON DELETE CASCADE,
  estudiante_id VARCHAR(50) NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(clase_id, estudiante_id)
);

-- Tabla de asistencias
CREATE TABLE IF NOT EXISTS asistencias (
  id SERIAL PRIMARY KEY,
  estudiante_id VARCHAR(50) NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
  clase_id VARCHAR(50) NOT NULL REFERENCES clases(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  tipo VARCHAR(10) CHECK (tipo IN ('qr', 'manual')) NOT NULL,
  mac_address VARCHAR(50),
  verificado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de logs de errores
CREATE TABLE IF NOT EXISTS error_logs (
  id SERIAL PRIMARY KEY,
  estudiante_id VARCHAR(50) REFERENCES estudiantes(id) ON DELETE SET NULL,
  clase_id VARCHAR(50) REFERENCES clases(id) ON DELETE SET NULL,
  motivo VARCHAR(200) NOT NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

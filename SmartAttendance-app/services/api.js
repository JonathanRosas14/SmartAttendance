// services/api.js
// Cliente HTTP para comunicarse con el backend
// Todas las llamadas al servidor pasan por aquí

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

// Helper para hacer peticiones
async function request(endpoint, method = 'GET', body = null, token = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    };

    // Agregar token Authorization si está disponible
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      return { ok: false, mensaje: data.mensaje || 'Error en la solicitud' };
    }

    return data;
  } catch (error) {
    console.error('❌ Error en API:', error);
    return { ok: false, mensaje: 'Error conectando con el servidor: ' + error.message };
  }
}

// ─── Autenticación ───────────────────────────────────────────────────
export async function loginAPI(correo, contrasena, rol) {
  return request('/auth/login', 'POST', {
    correo,
    contrasena,
    rol,
  });
}

export async function registrarProfesorAPI(nombre, correo, contrasena, departamento) {
  return request('/auth/registro/profesor', 'POST', {
    nombre,
    correo,
    contrasena,
    departamento,
  });
}

export async function registrarEstudianteAPI(nombre, correo, contrasena, id, celular) {
  return request('/auth/registro/estudiante', 'POST', {
    nombre,
    correo,
    contrasena,
    id,
    celular,
  });
}

// ─── Clases ──────────────────────────────────────────────────────────
export async function crearClaseAPI(nombre, horaInicio, horaFin, token) {
  return request('/clases', 'POST', {
    nombre,
    horaInicio,
    horaFin,
  }, token);
}

export async function obtenerClasesAPI(token) {
  return request('/clases', 'GET', null, token);
}

export async function actualizarClaseAPI(id, nombre, horaInicio, horaFin, token) {
  return request(`/clases/${id}`, 'PUT', {
    nombre,
    horaInicio,
    horaFin,
  }, token);
}

export async function eliminarClaseAPI(id, token) {
  return request(`/clases/${id}`, 'DELETE', null, token);
}

// ─── Estudiantes ─────────────────────────────────────────────────────
export async function obtenerEstudiantesAPI(claseId, token) {
  return request(`/estudiantes/clase/${claseId}`, 'GET', null, token);
}

export async function agregarEstudianteAPI(nombre, numeroIdentificacion, celular, claseId, token) {
  return request('/estudiantes/vincular', 'POST', {
    numeroIdentificacion,
    nombre,
    celular,
    claseId,
  }, token);
}

export async function eliminarEstudianteAPI(estudianteId, claseId, token) {
  return request(`/estudiantes/clase/${claseId}/${estudianteId}`, 'DELETE', null, token);
}

// ─── Asistencia ──────────────────────────────────────────────────────
export async function registrarAsistenciaQRAPI(numeroIdentificacion, claseId, qrData, token) {
  return request('/asistencia/qr', 'POST', {
    numeroIdentificacion,
    claseId,
    qrData,
  }, token);
}

export async function registrarAsistenciaManualAPI(claseId, registros, token) {
  // registros es un array: [{ estudianteId: 1, asistio: true }, ...]
  return request('/asistencia/manual', 'POST', {
    claseId,
    registros,
  }, token);
}

export async function obtenerAsistenciasAPI(claseId, token) {
  return request(`/asistencia/sesiones/${claseId}`, 'GET', null, token);
}

export async function obtenerEstadisticasAsistenciaAPI(claseId, token) {
  return request(`/asistencia/estadisticas/${claseId}`, 'GET', null, token);
}

export async function obtenerAsistenciasDetalladoAPI(claseId, token) {
  return request(`/asistencia/detalle/${claseId}`, 'GET', null, token);
}

// ─── QR ──────────────────────────────────────────────────────────────
export async function generarQRAPI(claseId, duracion, token) {
  return request('/qr/generar', 'POST', {
    claseId,
    duracion,
  }, token);
}

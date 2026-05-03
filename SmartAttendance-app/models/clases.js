// models/clases.js
// Este archivo define todos los modelos de datos principales del sistema
// Aquí declaramos los arrays en memoria donde se guardan clases, asistencias, usuarios, etc.

import { eliminarClavesSmartAttendance } from '../utils/storage';
import { estudiantes } from './estudiantes';

// Arrays globales que almacenan los datos en memoria durante la sesión
export let clases = [];           // Lista de todas las clases creadas
export let asistencias = [];      // Registro de cada asistencia (estudiante, clase, fecha, hora)
export let errorLogs = [];        // Registro de errores para debugging

// Los usuarios registrados (profesores y estudiantes) con sus credenciales para login
// Incluye datos de demo para poder probar la app sin registrarse
export let usuariosRegistrados = {
  profesores: [
    {
      id: "PRO-2023-0001",
      nombre: "Profesor Demo",
      correo: "profesor@universidad.edu",
      contrasena: "1234",
      departamento: "Demostración",
    },
  ],
  estudiantes: [
    {
      id: "STU-2023-0001",
      nombre: "Estudiante Demo",
      correo: "estudiante@universidad.edu",
      contrasena: "1234",
      celular: "+1 (555) 000-0000",
    },
  ],
};

// Cuando la app inicia, limpiamos claves heredadas de storage y reiniciamos estado en memoria.
export async function cargarDatosDelStorage() {
  try {
    await eliminarClavesSmartAttendance();
    clases.splice(0, clases.length);
    asistencias.splice(0, asistencias.length);
    errorLogs.splice(0, errorLogs.length);
    estudiantes.splice(0, estudiantes.length);
  } catch (error) {
    console.error('❌ Error cargando datos:', error);
  }
}

export async function guardarAsistenciasEnStorage() {
  return;
}

export async function guardarClasesEnStorage() {
  return;
}

export async function guardarEstudiantesEnStorage() {
  return;
}

export async function guardarUsuariosEnStorage() {
  return;
}

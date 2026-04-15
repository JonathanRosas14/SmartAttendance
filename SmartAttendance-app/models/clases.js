// models/clases.js
// Este archivo define todos los modelos de datos principales del sistema
// Aquí declaramos los arrays en memoria donde se guardan clases, asistencias, usuarios, etc.

import { guardarEnStorage } from '../utils/storage';
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

// Cuando la app inicia, cargamos todos los datos que fueron guardados en el almacenamiento local
// Esto asegura que los datos persistan incluso si cierran la app
export async function cargarDatosDelStorage() {
  try {
    const { obtenerDelStorage } = await import('../utils/storage.js');
    
    // Cargar todas las clases creadas
    const clasesGuardadas = await obtenerDelStorage('sa_clases', []);
    clases.splice(0, clases.length, ...clasesGuardadas);
    console.log('✅ Clases cargadas:', clases.length);
    
    // Cargar todos los registros de asistencia
    const asistenciasGuardadas = await obtenerDelStorage('sa_asistencias', []);
    asistencias.splice(0, asistencias.length, ...asistenciasGuardadas);
    console.log('✅ Asistencias cargadas:', asistencias.length);
    
    // Cargar el registro de errores (para debugging)
    const errorLogsGuardados = await obtenerDelStorage('sa_errorLogs', []);
    errorLogs.splice(0, errorLogs.length, ...errorLogsGuardados);
    console.log('✅ Error logs cargados:', errorLogs.length);
    
    // Cargar los estudiantes vinculados a las clases
    const estudiantesGuardados = await obtenerDelStorage('sa_estudiantes_vinculados', []);
    estudiantes.splice(0, estudiantes.length, ...estudiantesGuardados);
    console.log('✅ Estudiantes vinculados cargados:', estudiantes.length);
    
    // Cargar los usuarios registrados (profesores y estudiantes de login)
    const usuariosGuardados = await obtenerDelStorage('sa_usuarios_registrados', usuariosRegistrados);
    usuariosRegistrados.profesores = usuariosGuardados.profesores || usuariosRegistrados.profesores;
    usuariosRegistrados.estudiantes = usuariosGuardados.estudiantes || usuariosRegistrados.estudiantes;
    console.log('✅ Usuarios registrados cargados:', usuariosRegistrados.profesores.length + usuariosRegistrados.estudiantes.length);
  } catch (error) {
    console.error('❌ Error cargando datos:', error);
  }
}

// Guardar el array de asistencias en el almacenamiento persistente
export async function guardarAsistenciasEnStorage() {
  try {
    await guardarEnStorage('sa_asistencias', asistencias);
    console.log('✅ Asistencias guardadas en storage');
  } catch (error) {
    console.error('❌ Error guardando asistencias:', error);
  }
}

// Guardar el array de clases en el almacenamiento persistente  
export async function guardarClasesEnStorage() {
  try {
    await guardarEnStorage('sa_clases', clases);
    console.log('✅ Clases guardadas en storage');
  } catch (error) {
    console.error('❌ Error guardando clases:', error);
  }
}

// Guardar los estudiantes vinculados a clases en el almacenamiento persistente
export async function guardarEstudiantesEnStorage() {
  try {
    await guardarEnStorage('sa_estudiantes_vinculados', estudiantes);
    console.log('✅ Estudiantes vinculados guardados en storage');
  } catch (error) {
    console.error('❌ Error guardando estudiantes:', error);
  }
}

// Guardar los usuarios registrados (profesores y estudiantes) en el almacenamiento persistente
export async function guardarUsuariosEnStorage() {
  try {
    await guardarEnStorage('sa_usuarios_registrados', usuariosRegistrados);
    console.log('✅ Usuarios registrados guardados en storage');
  } catch (error) {
    console.error('❌ Error guardando usuarios:', error);
  }
}

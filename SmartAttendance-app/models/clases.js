// estos son los modelos de datos para las clases, asistencias y logs de errores
import { guardarEnStorage } from '../utils/storage';
import { estudiantes } from './estudiantes';

export let clases = [];
export let asistencias = [];
export let errorLogs = [];

// Usuarios registrados (login)
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

/**
 * Cargar datos desde persistencia (debe llamarse al iniciar la app)
 */
export async function cargarDatosDelStorage() {
  try {
    const { obtenerDelStorage } = await import('../utils/storage.js');
    
    // Cargar clases
    const clasesGuardadas = await obtenerDelStorage('sa_clases', []);
    clases.splice(0, clases.length, ...clasesGuardadas);
    console.log('✅ Clases cargadas:', clases.length);
    
    // Cargar asistencias
    const asistenciasGuardadas = await obtenerDelStorage('sa_asistencias', []);
    asistencias.splice(0, asistencias.length, ...asistenciasGuardadas);
    console.log('✅ Asistencias cargadas:', asistencias.length);
    
    // Cargar error logs
    const errorLogsGuardados = await obtenerDelStorage('sa_errorLogs', []);
    errorLogs.splice(0, errorLogs.length, ...errorLogsGuardados);
    console.log('✅ Error logs cargados:', errorLogs.length);
    
    // Cargar estudiantes vinculados a clases
    const estudiantesGuardados = await obtenerDelStorage('sa_estudiantes_vinculados', []);
    estudiantes.splice(0, estudiantes.length, ...estudiantesGuardados);
    console.log('✅ Estudiantes vinculados cargados:', estudiantes.length);
    
    // Cargar usuarios registrados (profesores y estudiantes de login)
    const usuariosGuardados = await obtenerDelStorage('sa_usuarios_registrados', usuariosRegistrados);
    usuariosRegistrados.profesores = usuariosGuardados.profesores || usuariosRegistrados.profesores;
    usuariosRegistrados.estudiantes = usuariosGuardados.estudiantes || usuariosRegistrados.estudiantes;
    console.log('✅ Usuarios registrados cargados:', usuariosRegistrados.profesores.length + usuariosRegistrados.estudiantes.length);
  } catch (error) {
    console.error('❌ Error cargando datos:', error);
  }
}

/**
 * Guardar asistencias en persistencia
 */
export async function guardarAsistenciasEnStorage() {
  try {
    await guardarEnStorage('sa_asistencias', asistencias);
    console.log('✅ Asistencias guardadas en storage');
  } catch (error) {
    console.error('❌ Error guardando asistencias:', error);
  }
}

/**
 * Guardar clases en persistencia
 */
export async function guardarClasesEnStorage() {
  try {
    await guardarEnStorage('sa_clases', clases);
    console.log('✅ Clases guardadas en storage');
  } catch (error) {
    console.error('❌ Error guardando clases:', error);
  }
}

/**
 * Guardar estudiantes vinculados en persistencia
 */
export async function guardarEstudiantesEnStorage() {
  try {
    await guardarEnStorage('sa_estudiantes_vinculados', estudiantes);
    console.log('✅ Estudiantes vinculados guardados en storage');
  } catch (error) {
    console.error('❌ Error guardando estudiantes:', error);
  }
}

/**
 * Guardar usuarios registrados en persistencia
 */
export async function guardarUsuariosEnStorage() {
  try {
    await guardarEnStorage('sa_usuarios_registrados', usuariosRegistrados);
    console.log('✅ Usuarios registrados guardados en storage');
  } catch (error) {
    console.error('❌ Error guardando usuarios:', error);
  }
}

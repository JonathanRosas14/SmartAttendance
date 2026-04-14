// utils/exportExcel.js
// Exportar asistencias a Excel con formato: Nombre, ID, Teléfono, Asistió, No Asistió

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

/**
 * Generar CSV formateado para Excel
 * @param {Array} estudiantesClase - Array de estudiantes de la clase
 * @param {Array} asistenciasClase - Array de registros de asistencia
 * @param {String} nombreClase - Nombre de la clase
 * @returns {String} CSV formateado
 */
function generarCSV(estudiantesClase, asistenciasClase, nombreClase) {
  // Encabezados
  const encabezados = ['Nombre', 'ID', 'Teléfono', 'Asistió', 'No Asistió'];
  
  // Crear filas con datos de estudiantes
  const filas = estudiantesClase.map((estudiante) => {
    const asistio = asistenciasClase.some(
      (a) => a.estudianteId === estudiante.id
    );
    
    return [
      estudiante.nombre,
      estudiante.id,
      estudiante.celular,
      asistio ? 'Sí' : '',
      asistio ? '' : 'Sí',
    ];
  });

  // Construir CSV
  let csv = `REPORTE DE ASISTENCIA - ${nombreClase}\n`;
  csv += `Fecha de generación: ${new Date().toLocaleDateString()}\n\n`;
  csv += encabezados.join(',') + '\n';
  csv += filas.map((fila) => fila.map((celda) => `"${celda}"`).join(',')).join('\n');

  return csv;
}

/**
 * Exportar asistencias de una clase a un archivo Excel (CSV)
 * @param {String} claseId - ID de la clase
 * @param {String} nombreClase - Nombre de la clase
 * @param {Array} estudiantesClase - Array de estudiantes de la clase
 * @param {Array} asistenciasClase - Array de registros de asistencia
 * @returns {Promise<void>}
 */
export async function exportarAsistenciaExcel(
  claseId,
  nombreClase,
  estudiantesClase,
  asistenciasClase
) {
  try {
    // Generar CSV
    const csv = generarCSV(estudiantesClase, asistenciasClase, nombreClase);

    // Crear nombre del archivo
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `Asistencia_${nombreClase.replace(/\s+/g, '_')}_${fecha}.csv`;

    // En la web, descargar directamente
    if (Platform.OS === 'web') {
      const elemento = document.createElement('a');
      elemento.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
      elemento.setAttribute('download', nombreArchivo);
      elemento.style.display = 'none';
      document.body.appendChild(elemento);
      elemento.click();
      document.body.removeChild(elemento);
      return { ok: true, mensaje: 'Asistencia exportada exitosamente' };
    }

    // En dispositivos móviles (Android/iOS)
    const rutaArchivo = FileSystem.documentDirectory + nombreArchivo;

    // Escribir archivo
    await FileSystem.writeAsStringAsync(rutaArchivo, csv, {
      encoding: 'utf8',
    });

    // Intentar guardar en Galería/Descargas primero (Android)
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(rutaArchivo);
        console.log('✅ Archivo guardado en Galería');
        return { ok: true, mensaje: 'Archivo guardado en tu galería/descargas' };
      }
    } catch (error) {
      console.log('ℹ️ MediaLibrary no disponible, intentando Sharing...');
    }

    // Compartir archivo (fallback)
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(rutaArchivo, {
        mimeType: 'text/csv',
        dialogTitle: `Exportar Asistencia - ${nombreClase}`,
      });
      return { ok: true, mensaje: 'Asistencia exportada exitosamente' };
    } else {
      console.log('Sharing no disponible en este dispositivo');
      return { ok: true, mensaje: 'Archivo generado', rutaArchivo };
    }

  } catch (error) {
    console.error('Error al exportar Excel:', error);
    return { ok: false, mensaje: `Error: ${error.message}` };
  }
}

/**
 * Exportar asistencias por sesión/fecha
 * @param {String} nombreClase - Nombre de la clase
 * @param {Array} sesiones - Array de sesiones con fecha
 * @param {Array} estudiantes - Array de todos los estudiantes de la clase
 * @param {Array} asistencias - Array de todos los registros de asistencia
 * @returns {Promise<void>}
 */
export async function exportarAsistenciaPorSesion(
  nombreClase,
  sesiones,
  estudiantes,
  asistencias
) {
  try {
    // Encabezados
    const encabezados = ['Nombre', 'ID', 'Teléfono', ...sesiones.map((s) => s.fecha)];

    // Crear filas
    const filas = estudiantes.map((est) => {
      const fila = [est.nombre, est.id, est.celular];
      
      sesiones.forEach((sesion) => {
        const asistio = asistencias.some(
          (a) =>
            a.estudianteId === est.id &&
            a.fecha === sesion.fecha
        );
        fila.push(asistio ? 'Sí' : 'No');
      });

      return fila;
    });

    // Construir CSV
    let csv = `REPORTE DETALLADO DE ASISTENCIA - ${nombreClase}\n`;
    csv += `Fecha de generación: ${new Date().toLocaleDateString()}\n\n`;
    csv += encabezados.join(',') + '\n';
    csv += filas.map((fila) => fila.map((celda) => `"${celda}"`).join(',')).join('\n');

    // Crear nombre del archivo
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `Asistencia_Detallada_${nombreClase.replace(/\s+/g, '_')}_${fecha}.csv`;

    // En la web, descargar directamente
    if (Platform.OS === 'web') {
      const elemento = document.createElement('a');
      elemento.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
      elemento.setAttribute('download', nombreArchivo);
      elemento.style.display = 'none';
      document.body.appendChild(elemento);
      elemento.click();
      document.body.removeChild(elemento);
      return { ok: true, mensaje: 'Asistencia detallada exportada correctamente' };
    }

    // En dispositivos móviles
    const rutaArchivo = FileSystem.documentDirectory + nombreArchivo;

    // Escribir archivo
    await FileSystem.writeAsStringAsync(rutaArchivo, csv, {
      encoding: 'utf8',
    });

    // Intentar guardar en Galería/Descargas primero (Android)
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(rutaArchivo);
        console.log('✅ Archivo guardado en Galería');
        return { ok: true, mensaje: 'Archivo guardado en tu galería/descargas' };
      }
    } catch (error) {
      console.log('ℹ️ MediaLibrary no disponible, intentando Sharing...');
    }

    // Compartir archivo (fallback)
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(rutaArchivo, {
        mimeType: 'text/csv',
        dialogTitle: `Exportar Asistencia Detallada - ${nombreClase}`,
      });
      return { ok: true, mensaje: 'Asistencia detallada exportada exitosamente' };
    }

    return { ok: true, mensaje: 'Asistencia detallada exportada exitosamente' };
  } catch (error) {
    console.error('Error al exportar Excel detallado:', error);
    return { ok: false, mensaje: `Error: ${error.message}` };
  }
}

/**
 * Exportar todas las asistencias de todos los estudiantes
 * @param {Array} estudiantes - Array de todos los estudiantes
 * @param {Array} asistencias - Array de todos los registros
 * @returns {Promise<void>}
 */
export async function exportarAsistenciaGeneral(estudiantes, asistencias) {
  try {
    const encabezados = ['Nombre', 'ID', 'Teléfono', 'Total Asistencias'];

    const filas = estudiantes.map((est) => {
      const totalAsistencias = asistencias.filter(
        (a) => a.estudianteId === est.id
      ).length;

      return [est.nombre, est.id, est.celular, totalAsistencias];
    });

    // Construir CSV  
    let csv = `REPORTE GENERAL DE ASISTENCIAS\n`;
    csv += `Fecha de generación: ${new Date().toLocaleDateString()}\n\n`;
    csv += encabezados.join(',') + '\n';
    csv += filas.map((fila) => fila.map((celda) => `"${celda}"`).join(',')).join('\n');

    // Crear nombre del archivo
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `Asistencia_General_${fecha}.csv`;

    // En la web, descargar directamente
    if (Platform.OS === 'web') {
      const elemento = document.createElement('a');
      elemento.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
      elemento.setAttribute('download', nombreArchivo);
      elemento.style.display = 'none';
      document.body.appendChild(elemento);
      elemento.click();
      document.body.removeChild(elemento);
      return { ok: true, mensaje: 'Asistencias generales exportadas correctamente' };
    }

    // En dispositivos móviles
    const rutaArchivo = FileSystem.documentDirectory + nombreArchivo;

    // Escribir archivo
    await FileSystem.writeAsStringAsync(rutaArchivo, csv, {
      encoding: 'utf8',
    });

    // Intentar guardar en Galería/Descargas primero (Android)
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(rutaArchivo);
        console.log('✅ Archivo guardado en Galería');
        return { ok: true, mensaje: 'Archivo guardado en tu galería/descargas' };
      }
    } catch (error) {
      console.log('ℹ️ MediaLibrary no disponible, intentando Sharing...');
    }

    // Compartir archivo (fallback)
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(rutaArchivo, {
        mimeType: 'text/csv',
        dialogTitle: 'Exportar Asistencias Generales',
      });
      return { ok: true, mensaje: 'Asistencias generales exportadas exitosamente' };
    }

    return { ok: true, mensaje: 'Asistencias generales exportadas exitosamente' };
  } catch (error) {
    console.error('Error al exportar:', error);
    return { ok: false, mensaje: `Error: ${error.message}` };
  }
}

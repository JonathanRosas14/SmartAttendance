// utils/exportExcel.js
// Funciones para exportar reportes de asistencia a archivos CSV
// Los archivos se pueden descargar en web o compartir en dispositivos móviles

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

// Función auxiliar para generar el contenido CSV formateado
// Crea un reporte con encabezados y las filas de datos de estudiantes
function generarCSV(estudiantesClase, asistenciasClase, nombreClase) {
  const encabezados = ['Nombre', 'ID', 'Teléfono', 'Número de Serie del Dispositivo', 'Asistió', 'No Asistió'];
  
  // Para cada estudiante, verificamos si asistió (hay un registro de asistencia)
  const filas = estudiantesClase.map((estudiante) => {
    const asistencias = asistenciasClase.filter(
      (a) => a.estudianteId === estudiante.id
    );
    const asistio = asistencias.length > 0;
    const numeroSerie = asistencias.length > 0 ? asistencias[0].mac_address || 'N/A' : 'N/A';
    
    return [
      estudiante.nombre,
      estudiante.numero_identificacion || estudiante.id,
      estudiante.celular,
      numeroSerie,
      asistio ? 'Sí' : '',
      asistio ? '' : 'Sí',
    ];
  });

  // Construir CSV con encabezados y datos
  let csv = `REPORTE DE ASISTENCIA - ${nombreClase}\n`;
  csv += `Fecha de generación: ${new Date().toLocaleDateString()}\n\n`;
  csv += encabezados.join(',') + '\n';
  csv += filas.map((fila) => fila.map((celda) => `"${celda}"`).join(',')).join('\n');

  return csv;
}

// Exportar asistencia simple: mostrar si cada estudiante asistió o no
export async function exportarAsistenciaExcel(
  claseId,
  nombreClase,
  estudiantesClase,
  asistenciasClase
) {
  try {
    const csv = generarCSV(estudiantesClase, asistenciasClase, nombreClase);

    // Crear nombre del archivo con la fecha de hoy
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `Asistencia_${nombreClase.replace(/\s+/g, '_')}_${fecha}.csv`;

    // En navegador web, descargamos directamente
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

    // En dispositivos móviles, crear archivo en el sistema
    const rutaArchivo = FileSystem.documentDirectory + nombreArchivo;

    // Escribir el contenido CSV en el archivo
    await FileSystem.writeAsStringAsync(rutaArchivo, csv, {
      encoding: 'utf8',
    });

    // Intentar guardar en la galería/descargas del dispositivo
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

    // Si eso no funciona, compartir el archivo usando la opción de compartir del sistema
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

// Exportar asistencia con detalles por sesión/fecha
// Muestra una columna para cada día de clase y marca asistencia por día
export async function exportarAsistenciaPorSesion(
  nombreClase,
  sesiones,
  estudiantes,
  asistencias
) {
  try {
    // Los encabezados incluyen el nombre del estudiante y una columna para cada sesión (fecha)
    const encabezados = ['Nombre', 'ID', 'Teléfono', 'Número de Serie del Dispositivo', ...sesiones.map((s) => s.fecha)];

    // Crear filas con los datos de cada estudiante
    const filas = estudiantes.map((est) => {
      const fila = [est.nombre, est.numero_identificacion || est.id, est.celular];
      
      // Obtener Número de Serie de la primera asistencia (si existe)
      const primeraAsistencia = asistencias.find((a) => a.estudianteId === est.id);
      const numeroSerie = primeraAsistencia?.mac_address || 'N/A';
      fila.push(numeroSerie);
      
      // Para cada sesión, verificar si el estudiante asistió
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

    // Construir el CSV
    let csv = `REPORTE DETALLADO DE ASISTENCIA - ${nombreClase}\n`;
    csv += `Fecha de generación: ${new Date().toLocaleDateString()}\n\n`;
    csv += encabezados.join(',') + '\n';
    csv += filas.map((fila) => fila.map((celda) => `"${celda}"`).join(',')).join('\n');

    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `Asistencia_Detallada_${nombreClase.replace(/\s+/g, '_')}_${fecha}.csv`;

    // En web, descargar directamente
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

    // En móvil, guardar archivo
    const rutaArchivo = FileSystem.documentDirectory + nombreArchivo;

    await FileSystem.writeAsStringAsync(rutaArchivo, csv, {
      encoding: 'utf8',
    });

    // Intentar guardar en galería
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

    // Compartir archivo
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

// Exportar un reporte general de asistencias de todos los estudiantes
// Útil para ver un resumen total de asistencias sin detalles por fecha
export async function exportarAsistenciaGeneral(estudiantes, asistencias) {
  try {
    const encabezados = ['Nombre', 'ID', 'Teléfono', 'Total Asistencias'];

    // Para cada estudiante, contar cuántas asistencias registradas tiene
    const filas = estudiantes.map((est) => {
      const totalAsistencias = asistencias.filter(
        (a) => a.estudianteId === est.id
      ).length;

      return [est.nombre, est.id, est.celular, totalAsistencias];
    });

    // Construir el CSV
    let csv = `REPORTE GENERAL DE ASISTENCIAS\n`;
    csv += `Fecha de generación: ${new Date().toLocaleDateString()}\n\n`;
    csv += encabezados.join(',') + '\n';
    csv += filas.map((fila) => fila.map((celda) => `"${celda}"`).join(',')).join('\n');

    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `Asistencia_General_${fecha}.csv`;

    // En web, descargar directamente
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

    // En móvil, guardar archivo
    const rutaArchivo = FileSystem.documentDirectory + nombreArchivo;

    // Escribir archivo
    await FileSystem.writeAsStringAsync(rutaArchivo, csv, {
      encoding: 'utf8',
    });

    // Intentar guardar en Galería/Descargas
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

    // Compartir archivo
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

// utils/storage.js
// Sistema de persistencia de datos - funciona en web y en dispositivos móviles
// En web usa localStorage, en móvil usa AsyncStorage de React Native

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const isWeb = Platform.OS === 'web';
const SMART_ATTENDANCE_KEYS = [
  'sa_clases',
  'sa_asistencias',
  'sa_errorLogs',
  'sa_estudiantes_vinculados',
  'sa_usuarios_registrados',
];

// Guarda datos en el almacenamiento local (ya sea localStorage o AsyncStorage)
// La app puede recuperar estos datos aunque el usuario cierre la aplicación
export async function guardarEnStorage(key, data) {
  try {
    const jsonData = JSON.stringify(data);
    
    if (isWeb) {
      // En navegador usamos localStorage
      localStorage.setItem(key, jsonData);
    } else {
      // En dispositivos móviles usamos AsyncStorage
      await AsyncStorage.setItem(key, jsonData);
    }
  } catch (error) {
    console.error(`❌ Error guardando "${key}":`, error);
  }
}

// Obtiene datos que guardamos anteriormente. Si no existen, retorna el valor por defecto
export async function obtenerDelStorage(key, defaultValue = null) {
  try {
    let jsonData;
    
    if (isWeb) {
      jsonData = localStorage.getItem(key);
    } else {
      jsonData = await AsyncStorage.getItem(key);
    }
    
    // Si no encontramos nada, devolvemos el valor por defecto
    if (jsonData === null) {
      return defaultValue;
    }
    
    return JSON.parse(jsonData);
  } catch (error) {
    console.error(`❌ Error obteniendo "${key}":`, error);
    return defaultValue;
  }
}

// Borra un elemento específico del almacenamiento
export async function eliminarDelStorage(key) {
  try {
    if (isWeb) {
      localStorage.removeItem(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  } catch (error) {
    console.error(`❌ Error eliminando "${key}":`, error);
  }
}

// Limpia todo el almacenamiento - útil si queremos resetear la app
export async function limpiarStorage() {
  try {
    if (isWeb) {
      localStorage.clear();
    } else {
      await AsyncStorage.clear();
    }
  } catch (error) {
    console.error(`❌ Error limpiando storage:`, error);
  }
}

export async function eliminarClavesSmartAttendance() {
  try {
    if (isWeb) {
      SMART_ATTENDANCE_KEYS.forEach((key) => localStorage.removeItem(key));
      return;
    }

    await AsyncStorage.multiRemove(SMART_ATTENDANCE_KEYS);
  } catch (error) {
    console.error("❌ Error limpiando claves SmartAttendance:", error);
  }
}

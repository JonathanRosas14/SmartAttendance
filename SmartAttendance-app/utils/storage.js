// utils/storage.js
// Sistema de persistencia con localStorage para React Native Web
// y AsyncStorage para dispositivos móviles

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const isWeb = Platform.OS === 'web';

/**
 * Guardar datos en persistencia (localStorage para web, AsyncStorage para móvil)
 * @param {String} key - Clave
 * @param {any} data - Datos a guardar
 * @returns {Promise<void>}
 */
export async function guardarEnStorage(key, data) {
  try {
    const jsonData = JSON.stringify(data);
    
    if (isWeb) {
      // Web: usar localStorage
      localStorage.setItem(key, jsonData);
    } else {
      // Móvil: usar AsyncStorage
      await AsyncStorage.setItem(key, jsonData);
    }
    
    console.log(`✅ Datos guardados en storage: ${key}`);
  } catch (error) {
    console.error(`❌ Error guardando "${key}":`, error);
  }
}

/**
 * Obtener datos desde persistencia
 * @param {String} key - Clave
 * @param {any} defaultValue - Valor por defecto si no existe
 * @returns {Promise<any>}
 */
export async function obtenerDelStorage(key, defaultValue = null) {
  try {
    let jsonData;
    
    if (isWeb) {
      // Web: usar localStorage
      jsonData = localStorage.getItem(key);
    } else {
      // Móvil: usar AsyncStorage
      jsonData = await AsyncStorage.getItem(key);
    }
    
    if (jsonData === null) {
      return defaultValue;
    }
    
    return JSON.parse(jsonData);
  } catch (error) {
    console.error(`❌ Error obteniendo "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Eliminar datos desde persistencia
 * @param {String} key - Clave
 * @returns {Promise<void>}
 */
export async function eliminarDelStorage(key) {
  try {
    if (isWeb) {
      localStorage.removeItem(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
    console.log(`✅ Datos eliminados del storage: ${key}`);
  } catch (error) {
    console.error(`❌ Error eliminando "${key}":`, error);
  }
}

/**
 * Limpiar todo el storage
 * @returns {Promise<void>}
 */
export async function limpiarStorage() {
  try {
    if (isWeb) {
      localStorage.clear();
    } else {
      await AsyncStorage.clear();
    }
    console.log(`✅ Storage limpiado completamente`);
  } catch (error) {
    console.error(`❌ Error limpiando storage:`, error);
  }
}

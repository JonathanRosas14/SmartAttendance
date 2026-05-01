// EscanearQRViewStudent.js
// Pantalla donde el estudiante escanea QR de asistencia
// Abre la cámara, lee el QR, valida que sea correcto, y registra la asistencia automáticamente
// Si todo va bien, muestra un mensaje de confirmación

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
  Image,
  ActivityIndicator,
  ScrollView,
} from "react-native";

// Importamos las funciones de cámara de expo
import { useCameraPermissions } from "expo-camera";
import { CameraView } from "expo-camera";
// Importamos para obtener ID real del dispositivo
import * as Device from "expo-device";

import qr from "../assets/icons/qr.png";

// Importamos la función API para registrar asistencia
import { registrarAsistenciaQRAPI } from "../services/api";

import { Header, COLORS } from "../theme";

// Función para obtener el número de serie del dispositivo (único para cada teléfono)
function obtenerNumeroSerieDispositivo() {
  try {
    // Obtener información del dispositivo usando expo-device
    // En móviles reales da el serial number, en simuladores/web da un ID único
    const serialNumber = Device.serialNumber;
    
    if (serialNumber && serialNumber !== 'unknown') {
      return serialNumber;
    }
    
    // Si no está disponible serialNumber, usar osInternalBuildId
    if (Device.osInternalBuildId) {
      return Device.osInternalBuildId;
    }

    // Fallback: generar basado en datos disponibles del dispositivo
    const fallback = `${Device.manufacturer}-${Device.model}-${Device.osVersion}`;
    if (fallback !== 'undefined-undefined-undefined') {
      return fallback;
    }
    
    // Último recurso: ID aleatorio (solo si todo falla)
    return `DEVICE-${Math.random().toString(36).substring(2, 11)}`;
  } catch (error) {
    console.error('Error obteniendo número de serie:', error);
    return 'unknown';
  }
}

export default function EscanearQRViewStudent({ usuario, menuVisible, setMenuVisible, onLogout }) {
  // Controla si la cámara está abierta
  const [camaraAbierta, setCamaraAbierta] = useState(false);
  const [cargando, setCargando] = useState(false);
  // Permisos de cámara del dispositivo
  const [permission, requestPermission] = useCameraPermissions();
  // Ref para evitar procesar múltiples escaneos al mismo tiempo
  const scannedRef = useRef(false);

  // Función para abrir la cámara (primero pide permisos si es necesario)
  const handleAbrirCamara = async () => {
    if (permission?.granted) {
      setCamaraAbierta(true);
      scannedRef.current = false;
    } else {
      const { granted } = await requestPermission();
      if (granted) {
        setCamaraAbierta(true);
        scannedRef.current = false;
      } else {
        Alert.alert("Permiso denegado", "Necesitas permitir acceso a la cámara.");
      }
    }
  };

  // Cuando el scanner detecta un QR
  const handleBarcodeScanned = async ({ data }) => {
    // Evitar procesar múltiples escaneos simultáneamente
    if (scannedRef.current || !usuario?.numero_identificacion) return;
    scannedRef.current = true;

    setCargando(true);

    try {
      let qrData;
      try {
        qrData = JSON.parse(data);
      } catch {
        Alert.alert("QR inválido", "Formato incorrecto.");
        setCargando(false);
        scannedRef.current = false;
        return;
      }

      const { claseId, expiracion } = qrData;

      if (!claseId) {
        Alert.alert("QR inválido", "Clase no identificada.");
        setCargando(false);
        scannedRef.current = false;
        return;
      }

      if (Date.now() > expiracion) {
        Alert.alert("QR Expirado", "Solicita uno nuevo.");
        setCargando(false);
        scannedRef.current = false;
        setCamaraAbierta(false);
        return;
      }

      // Obtener el número de serie del dispositivo
      const numeroSerie = obtenerNumeroSerieDispositivo();

      // Llamar API para registrar asistencia
      const resultado = await registrarAsistenciaQRAPI(
        usuario.numero_identificacion,
        claseId,
        data,
        numeroSerie,
        usuario.token
      );

      setCargando(false);

      if (resultado.ok) {
        Alert.alert("✅ ¡Asistencia Registrada!", resultado.mensaje, [
          {
            text: "OK",
            onPress: () => {
              setCamaraAbierta(false);
              scannedRef.current = false;
            },
          },
        ]);
      } else {
        Alert.alert("❌ Error", resultado.mensaje, [
          {
            text: "Reintentar",
            onPress: () => { scannedRef.current = false; },
          },
          {
            text: "Cerrar",
            onPress: () => setCamaraAbierta(false),
          },
        ]);
      }
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "No se pudo procesar el QR");
      setCargando(false);
      scannedRef.current = false;
    }
  };

  // ✅ LIMPIAR ESTADO CUANDO EL COMPONENTE SE DESMONTA (ANDROID FIX)
  useEffect(() => {
    return () => {
      setCamaraAbierta(false);
      setCargando(false);
      scannedRef.current = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={COLORS.white} barStyle="dark-content" />

      <Header 
        menuVisible={menuVisible} 
        setMenuVisible={setMenuVisible} 
        onLogout={onLogout}
      />

      {!camaraAbierta ? (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.bienvenidoLabel}>BIENVENIDO,</Text>
          <Text style={styles.holaTexto}>
            Hola, <Text style={styles.holaAccent}>{usuario.nombre?.split(" ")[0]}</Text>
          </Text>

          <View style={styles.qrCard}>
            <TouchableOpacity style={styles.qrBoton} onPress={handleAbrirCamara} activeOpacity={0.85}>
              <Image source={qr} style={{ width: 100, height: 100 }} />
              <Text style={styles.qrBotonLabel}>ESCANEAR</Text>
            </TouchableOpacity>

            <Text style={styles.qrCardTitulo}>Escanear QR</Text>
            <Text style={styles.qrCardSub}>
              Posiciona la cámara frente al código que tu profesor genere para registrar tu asistencia.
            </Text>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.cameraContainer}>
          <CameraView
            facing="back"
            style={styles.camera}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={cargando ? undefined : handleBarcodeScanned}
          >
            <View style={styles.cameraOverlay}>
              <View style={styles.qrFrame} />
              <Text style={styles.cameraText}>Apunta el código QR al centro</Text>

              <TouchableOpacity
                style={styles.cerrarBtn}
                onPress={() => {
                  setCamaraAbierta(false);
                  scannedRef.current = false;
                }}
              >
                <Text style={styles.cerrarBtnText}>✕ CERRAR</Text>
              </TouchableOpacity>

              {cargando && (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color={COLORS.white} />
                  <Text style={styles.loadingText}>Procesando...</Text>
                </View>
              )}
            </View>
          </CameraView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  scroll: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 },

  bienvenidoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  holaTexto: { fontSize: 30, fontWeight: "800", color: COLORS.text, marginBottom: 28 },
  holaAccent: { color: COLORS.primary },

  qrCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  qrBoton: {
    width: 160,
    height: 160,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  qrBotonLabel: { fontSize: 11, fontWeight: "700", color: COLORS.white, letterSpacing: 2 },
  qrCardTitulo: { fontSize: 20, fontWeight: "800", color: COLORS.text, marginBottom: 8 },
  qrCardSub: { fontSize: 14, color: COLORS.textMuted, textAlign: "center", lineHeight: 20 },

  cameraContainer: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  cameraOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  qrFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: COLORS.green,
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  cameraText: { fontSize: 16, color: COLORS.white, fontWeight: "600", marginTop: 24 },
  cerrarBtn: {
    position: "absolute",
    bottom: 32,
    backgroundColor: COLORS.red,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  cerrarBtnText: { color: COLORS.white, fontWeight: "700", fontSize: 14 },
  loadingBox: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingVertical: 24,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
  },
  loadingText: { color: COLORS.white, marginTop: 12, fontWeight: "600" },
});

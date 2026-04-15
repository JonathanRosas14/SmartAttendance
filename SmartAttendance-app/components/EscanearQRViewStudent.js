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

import qr from "../assets/icons/qr.png";

// Importamos las funciones del controlador para registrar asistencia
import {
  registrarAsistenciaQRCompleto,
  obtenerEstudiantePorCorreo,
} from "../controllers/asistenciaController";

const COLORS = {
  primary: "#1A3A6B",
  accent: "#3B82F6",
  background: "#F0F4FA",
  card: "#FFFFFF",
  inputBg: "#F5F7FC",
  text: "#1A2B4A",
  textMuted: "#6B7A99",
  border: "#D8E2F0",
  white: "#FFFFFF",
  navBorder: "#E2E8F0",
  green: "#16A34A",
  red: "#DC2626",
};

export default function EscanearQRViewStudent({ usuario, menuVisible, setMenuVisible, onLogout }) {
  // Guardamos los datos del estudiante una vez que se carga
  const [estudiante, setEstudiante] = useState(null);
  // Controla si la cámara está abierta
  const [camaraAbierta, setCamaraAbierta] = useState(false);
  const [cargando, setCargando] = useState(false);
  // Permisos de cámara del dispositivo
  const [permission, requestPermission] = useCameraPermissions();
  // Ref para evitar procesar múltiples escaneos al mismo tiempo
  const scannedRef = useRef(false);

  // Cargar datos del estudiante cuando se monta el componente
  useEffect(() => {
    const est = obtenerEstudiantePorCorreo(usuario.correo);
    setEstudiante(est);
  }, [usuario]);

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
  const handleBarcodeScanned = ({ data }) => {
    // Evitar procesar múltiples escaneos simultáneamente
    if (scannedRef.current || !estudiante) return;
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

      const resultado = registrarAsistenciaQRCompleto({
        estudianteId: estudiante.id,
        celular: estudiante.celular,
        claseId,
        qrData: data,
      });

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={COLORS.white} barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => setMenuVisible(!menuVisible)}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SmartAttendance</Text>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarIcon}>👤</Text>
        </View>
      </View>

      {menuVisible && (
        <View style={styles.menuDropdown}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              if (onLogout) onLogout();
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.menuItemText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      )}

      {!camaraAbierta ? (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.bienvenidoLabel}>BIENVENIDO,</Text>
          <Text style={styles.holaTexto}>
            Hola, <Text style={styles.holaAccent}>{estudiante?.nombre?.split(" ")[0] || usuario.nombre}</Text>
          </Text>

          <View style={styles.qrCard}>
            <TouchableOpacity style={styles.qrBoton} onPress={handleAbrirCamara} activeOpacity={0.85}>
              <Image source={qr} style={{ width: 100, height: 100 }} />
              <Text style={styles.qrBotonLabel}>PULSAR</Text>
            </TouchableOpacity>

            <Text style={styles.qrCardTitulo}>Escanear QR</Text>
            <Text style={styles.qrCardSub}>
              Posiciona la cámara frente al código del aula para registrar tu asistencia de hoy.
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

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.navBorder,
  },
  menuBtn: { padding: 4 },
  menuIcon: { fontSize: 20, color: COLORS.primary },
  headerTitle: { fontSize: 17, fontWeight: "700", color: COLORS.primary, letterSpacing: 0.3 },
  avatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarIcon: { fontSize: 20 },

  menuDropdown: {
    position: "absolute",
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.navBorder,
    zIndex: 100,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuItemText: { fontSize: 15, fontWeight: "600", color: COLORS.text },

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

/**
 * ResultadoView.js
 * Vista del QR Generado — SmartAttendance
 *
 * Se muestra después de presionar "GENERAR QR" en QRView.
 * Recibe por params de navegación:
 *   - qrData     : string JSON del QR generado
 *   - claseNombre: nombre de la clase
 *   - claseId    : ID de la clase
 *   - expiracion : timestamp de expiración (Date.now() + segundos * 1000)
 *
 * Funcionalidades:
 *  - Muestra el QR generado en grande
 *  - Cuenta regresiva MM:SS hasta expiración
 *  - Botón "REFRESH CODIGO" regenera el QR sin salir de la vista
 *
 * ⚠️  REQUERIMIENTOS:
 *  Instalar las librerías del QR si aún no están:
 *    npx expo install react-native-svg
 *    npm install react-native-qrcode-svg
 *
 *  En QRView.js, al presionar GENERAR QR navega así:
 *    navigation.navigate("ResultadoView", {
 *      qrData:      resultado.qr,
 *      claseNombre: claseSeleccionada.nombre,
 *      claseId:     claseSeleccionada.id,
 *      expiracion:  Date.now() + 60 * 1000,
 *    });
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  SafeAreaView,
  Alert,
} from "react-native";

import { generarQRParaClase } from "../controllers/asistenciaController";

// Intentamos importar QRCode
let QRCode = null;
try {
  QRCode = require("react-native-qrcode-svg").default;
} catch {
  QRCode = null;
}

// ─── Paleta de colores ────────────────────────────────────────────────────────
const COLORS = {
  primary:    "#1A3A6B",
  accent:     "#3B82F6",
  background: "#F0F4FA",
  card:       "#FFFFFF",
  inputBg:    "#F5F7FC",
  text:       "#1A2B4A",
  textMuted:  "#6B7A99",
  border:     "#D8E2F0",
  white:      "#FFFFFF",
  navBorder:  "#E2E8F0",
  green:      "#16A34A",
  orange:     "#F97316",
  red:        "#DC2626",
  qrBg:       "#1A1A2E",   // fondo oscuro del QR como en el diseño
};

const QR_DURACION_SEG = 120; // 2 minutos como muestra el diseño (01:58)

// ─── Tabs de navegación ───────────────────────────────────────────────────────
const NAV_TABS = [
  { id: "classes",  label: "CLASSES",  icon: "📚" },
  { id: "students", label: "STUDENTS", icon: "👥" },
  { id: "qrscan",   label: "QR SCAN",  icon: "⊞"  },
  { id: "manual",   label: "MANUAL",   icon: "📋" },
  { id: "export",   label: "EXPORT",   icon: "↑"  },
];

const ROUTES = {
  classes:  "ProfesorView",
  students: "EstudianteView",
  qrscan:   "QRView",
  manual:   "ManualView",
  export:   "ExportView",
};

/** Formatea segundos → "MM:SS" */
function formatTimer(seg) {
  const m = Math.floor(seg / 60).toString().padStart(2, "0");
  const s = (seg % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ResultadoView({ route, navigation }) {

  // Parámetros recibidos desde QRView
  const {
    qrData:      qrDataInicial  = "",
    claseNombre: claseNombreParam = "",
    claseId:     claseIdParam    = "",
    expiracion:  expiracionParam = Date.now() + QR_DURACION_SEG * 1000,
  } = route?.params || {};

  // ── Estado ────────────────────────────────────────────────────────────────
  const [qrData,      setQrData]      = useState(qrDataInicial);
  const [claseNombre] = useState(claseNombreParam);
  const [claseId]     = useState(claseIdParam);
  const [segundos,    setSegundos]    = useState(() =>
    Math.max(0, Math.round((expiracionParam - Date.now()) / 1000))
  );
  const [expirado,    setExpirado]    = useState(false);
  const [refreshing,  setRefreshing]  = useState(false);

  // ── Navegación ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("qrscan");

  // ── Timer ─────────────────────────────────────────────────────────────────
  const timerRef = useRef(null);

  const iniciarTimer = useCallback((segs) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSegundos(segs);
    setExpirado(false);

    timerRef.current = setInterval(() => {
      setSegundos((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setExpirado(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    const segsRestantes = Math.max(
      0,
      Math.round((expiracionParam - Date.now()) / 1000)
    );
    iniciarTimer(segsRestantes);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // ── Color del timer ───────────────────────────────────────────────────────
  const timerColor =
    segundos > 60 ? COLORS.accent :
    segundos > 20 ? COLORS.orange :
    COLORS.red;

  // ── Refresh QR ────────────────────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    if (!claseId) {
      Alert.alert("Error", "No se puede regenerar el QR.");
      return;
    }

    setRefreshing(true);

    setTimeout(() => {
      const resultado = generarQRParaClase(claseId, QR_DURACION_SEG);

      if (!resultado.ok) {
        Alert.alert("Error", resultado.mensaje);
        setRefreshing(false);
        return;
      }

      setQrData(resultado.qr);
      setRefreshing(false);
      iniciarTimer(QR_DURACION_SEG);
    }, 400);
  }, [claseId, iniciarTimer]);

  // ── Navegación inferior ───────────────────────────────────────────────────
  const handleTabPress = (tab) => {
    setActiveTab(tab);
    const route = ROUTES[tab];
    if (route && navigation) navigation.navigate(route);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER PRINCIPAL
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={COLORS.white} barStyle="dark-content" />

      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => navigation?.goBack()}
          accessibilityLabel="Volver"
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SmartAttendance</Text>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarWrapText}>👤</Text>
        </View>
      </View>

      {/* ── CONTENIDO ─────────────────────────────────────────────────── */}
      <View style={styles.content}>

        {/* ── CONTEXTO DE ASISTENCIA ─────────────────────────────────── */}
        <View style={styles.contextoWrap}>
          <Text style={styles.contextoLabel}>CONTEXTO DE ASISTENCIA</Text>
          <View style={styles.contextoClase}>
            <Text style={styles.contextoClaseText}>{claseNombre}</Text>
          </View>
        </View>

        {/* ── QR GRANDE ──────────────────────────────────────────────── */}
        <View style={styles.qrCard}>
          <View style={styles.qrImageWrap}>
            {QRCode && qrData ? (
              <QRCode
                value={qrData}
                size={220}
                color={COLORS.white}
                backgroundColor={COLORS.qrBg}
              />
            ) : (
              /* Fallback visual si no hay librería */
              <View style={styles.qrFallback}>
                <Text style={styles.qrFallbackIcon}>⊞</Text>
                <Text style={styles.qrFallbackLabel}>SmartAttendance</Text>
              </View>
            )}

            {/* Overlay de expirado */}
            {expirado && (
              <View style={styles.expiradoOverlay}>
                <Text style={styles.expiradoOverlayText}>EXPIRADO</Text>
              </View>
            )}
          </View>

          {/* Marca de agua del diseño */}
          <Text style={styles.watermark}>Smft © Work k</Text>
        </View>

        {/* ── TIMER ──────────────────────────────────────────────────── */}
        <View style={styles.timerWrap}>
          <Text style={[styles.timerTexto, { color: timerColor }]}>
            🕐  Expira en {formatTimer(segundos)}
          </Text>
          <Text style={styles.timerSub}>
            {expirado
              ? "El código ha expirado"
              : "El código expirará pronto"}
          </Text>
        </View>

        {/* ── BOTÓN REFRESH ──────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.btnRefresh, refreshing && { opacity: 0.7 }]}
          onPress={handleRefresh}
          activeOpacity={0.85}
          disabled={refreshing}
          accessibilityLabel="Refresh código QR"
        >
          <Text style={styles.btnRefreshIcon}>
            {refreshing ? "⏳" : "🔄"}
          </Text>
          <Text style={styles.btnRefreshText}>
            {refreshing ? "GENERANDO..." : "REFRESH CODIGO"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── BOTTOM NAVIGATION ─────────────────────────────────────────── */}
      <View style={styles.navBar}>
        {NAV_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={styles.navItem}
            onPress={() => handleTabPress(tab.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.navIcon, activeTab === tab.id && styles.navIconActive]}>
              {tab.icon}
            </Text>
            <Text style={[styles.navLabel, activeTab === tab.id && styles.navLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },

  // Header
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
  menuBtn:    { padding: 4 },
  menuIcon:   { fontSize: 20, color: COLORS.primary },
  headerTitle: {
    fontSize: 18, fontWeight: "700",
    color: COLORS.primary, letterSpacing: 0.3,
  },
  avatarWrap: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center",
  },
  avatarWrapText: { fontSize: 20 },

  // Contenido principal (centrado verticalmente)
  content: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
    alignItems: "center",
  },

  // Contexto de asistencia
  contextoWrap: {
    width: "100%",
    marginBottom: 20,
  },
  contextoLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  contextoClase: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  contextoClaseText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: "500",
  },

  // Card del QR
  qrCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginBottom: 20,
    width: "100%",
  },
  qrImageWrap: {
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },

  // Fallback QR
  qrFallback: {
    width: 220, height: 220,
    backgroundColor: COLORS.qrBg,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  qrFallbackIcon:  { fontSize: 64, marginBottom: 12 },
  qrFallbackLabel: {
    fontSize: 14, color: COLORS.white,
    fontWeight: "600", letterSpacing: 1,
  },

  // Overlay expirado sobre el QR
  expiradoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.72)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  expiradoOverlayText: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 3,
  },

  // Marca de agua
  watermark: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 10,
    fontStyle: "italic",
    letterSpacing: 0.5,
  },

  // Timer
  timerWrap: {
    alignItems: "center",
    marginBottom: 24,
  },
  timerTexto: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  timerSub: {
    fontSize: 13,
    color: COLORS.textMuted,
  },

  // Botón refresh
  btnRefresh: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
  },
  btnRefreshIcon: { fontSize: 18 },
  btnRefreshText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 1.5,
  },

  // Bottom nav
  navBar: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderTopWidth: 1, borderTopColor: COLORS.navBorder,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 20 : 10,
    paddingHorizontal: 4,
  },
  navItem:        { flex: 1, alignItems: "center", justifyContent: "center" },
  navIcon:        { fontSize: 20, marginBottom: 2, color: COLORS.textMuted },
  navIconActive:  { color: COLORS.primary },
  navLabel:       { fontSize: 9, fontWeight: "600", color: COLORS.textMuted, letterSpacing: 0.6 },
  navLabelActive: { color: COLORS.primary },
});
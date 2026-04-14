/**
 * QRView.js
 * Generar QR de Asistencia — SmartAttendance
 *
 * Funcionalidades:
 *  - Seleccionar clase (dropdown)
 *  - Generar QR dinámico para la clase seleccionada
 *  - Mostrar QR generado con cuenta regresiva de expiración
 *  - Regenerar QR cuando expire
 *
 * Conexión al backend:
 *  - obtenerClases        → lista de clases para el selector
 *  - generarQRParaClase   → genera el string QR con token y expiración
 *
 * ⚠️  REQUERIMIENTOS PARA EL BACKEND:
 *  Para mostrar el QR como imagen necesitamos react-native-qrcode-svg.
 *  Pídele a tu compañero que instale:
 *
 *     npx expo install react-native-svg
 *     npm install react-native-qrcode-svg
 *
 *  Si no se puede instalar, el componente muestra el string QR en texto
 *  como fallback hasta que esté disponible.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  StatusBar,
  SafeAreaView,
  Modal,
  ActivityIndicator,
  Image
} from "react-native";

import qr from "../assets/icons/qr.png";

import {
  obtenerClases,
  generarQRParaClase,
} from "../controllers/asistenciaController";

// Intentamos importar QRCode — si no está instalado no rompe la app
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
  iconBg:     "#DDE8F8",
  text:       "#1A2B4A",
  textMuted:  "#6B7A99",
  border:     "#D8E2F0",
  white:      "#FFFFFF",
  navBorder:  "#E2E8F0",
  green:      "#16A34A",
  red:        "#DC2626",
  orange:     "#F97316",
};

// ─── Duración del QR en segundos ─────────────────────────────────────────────
const QR_DURACION_SEG = 60;

const ROUTES = {
  classes:  "ProfesorView",
  students: "EstudianteView",
  qrscan:   null,
  manual:   "ManualView",
  export:   "ExportView",
};

// ─── Componente principal ─────────────────────────────────────────────────────
export default function QRView({ setPantalla, onLogout }) {
  const [menuVisible, setMenuVisible] = useState(false);

  // ── Clases ────────────────────────────────────────────────────────────────
  const [clases] = useState(() => obtenerClases());
  const [claseSeleccionada, setClaseSeleccionada] = useState(
    () => obtenerClases()[0] || null
  );
  const [dropdownVisible, setDropdownVisible] = useState(false);

  // ── Estado del QR ─────────────────────────────────────────────────────────
  const [qrData,      setQrData]      = useState(null);   // string JSON del QR
  const [generando,   setGenerando]   = useState(false);
  const [segundos,    setSegundos]    = useState(0);       // cuenta regresiva
  const [expirado,    setExpirado]    = useState(false);

  // ── Timer ─────────────────────────────────────────────────────────────────
  const timerRef = useRef(null);

  // ── Navegación ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("qrscan");

  // ── Limpiar timer al desmontar ────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ── Generar QR ────────────────────────────────────────────────────────────
  const handleGenerarQR = useCallback(() => {
    if (!claseSeleccionada) {
      Alert.alert("Error", "Selecciona una clase primero.");
      return;
    }

    setGenerando(true);

    try {
      const resultado = generarQRParaClase(claseSeleccionada.id, QR_DURACION_SEG);

      if (!resultado.ok) {
        Alert.alert("Error", resultado.mensaje);
        setGenerando(false);
        return;
      }

      // Guardar el QR en estado
      setQrData(resultado.qr);
      setExpirado(false);
      setSegundos(QR_DURACION_SEG);
      setGenerando(false);

      // Limpiar timer anterior si existe
      if (timerRef.current) clearInterval(timerRef.current);

      // Iniciar cuenta regresiva
      timerRef.current = setInterval(() => {
        setSegundos((prev) => {
          if (prev <= 1) {
            setExpirado(true);
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error) {
      console.error("Error al generar QR:", error);
      Alert.alert("Error", "Hubo un error al generar el QR: " + error.message);
      setGenerando(false);
    }
  }, [claseSeleccionada]);

  // ── Color del timer según tiempo restante ─────────────────────────────────
  const timerColor =
    segundos > 30 ? COLORS.green :
    segundos > 10 ? COLORS.orange :
    COLORS.red;

  // ── Seleccionar clase ─────────────────────────────────────────────────────
  const handleSeleccionarClase = (clase) => {
    setClaseSeleccionada(clase);
    setDropdownVisible(false);
    // Limpiar QR anterior al cambiar de clase
    if (timerRef.current) clearInterval(timerRef.current);
    setQrData(null);
    setExpirado(false);
    setSegundos(0);
  };

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
          accessibilityLabel="Menú"
          onPress={() => setMenuVisible(!menuVisible)}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SmartAttendance</Text>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarWrapText}>👤</Text>
        </View>
      </View>

      {/* Menú desplegable */}
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

      {/* ── CONTENIDO ─────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── CARD PRINCIPAL ─────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Generar asistencia</Text>

          {/* Selector de clase */}
          <Text style={styles.cardLabel}>Seleccionar Clase</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setDropdownVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.dropdownText}>
              {claseSeleccionada
                ? claseSeleccionada.nombre
                : "Sin clases creadas"}
            </Text>
            <Text style={styles.dropdownArrow}>⌄</Text>
          </TouchableOpacity>

          {/* Botón Generar QR */}
          <TouchableOpacity
            style={[styles.btnGenerar, generando && styles.btnGenerandoDisabled]}
            onPress={handleGenerarQR}
            activeOpacity={0.85}
            disabled={generando}
            accessibilityLabel="Generar QR"
          >
            {generando ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <>
                <Image source={qr} style={{ width: 24, height: 24, tintColor: COLORS.white }} />
                <Text style={styles.btnGenerarText}>GENERAR QR</Text>
              </>
            )}
          </TouchableOpacity>

          {/* ── ÁREA DEL QR ──────────────────────────────────────────── */}
          {qrData && !expirado && (
            <View style={styles.qrArea}>
              {/* Imagen QR */}
              <View style={styles.qrImageWrap}>
                {QRCode ? (
                  <QRCode
                    value={qrData}
                    size={200}
                    color={COLORS.primary}
                    backgroundColor={COLORS.white}
                  />
                ) : (
                  /* Fallback si react-native-qrcode-svg no está instalado */
                  <View style={styles.qrFallback}>
                    <Text style={styles.qrFallbackIcon}>⊞</Text>
                    <Text style={styles.qrFallbackTitle}>QR Generado</Text>
                    <Text style={styles.qrFallbackSub}>
                      Instala react-native-qrcode-svg{"\n"}para ver la imagen
                    </Text>
                  </View>
                )}
              </View>

              {/* Cuenta regresiva */}
              <View style={styles.timerWrap}>
                <Text style={styles.timerLabel}>Expira en</Text>
                <Text style={[styles.timerSegundos, { color: timerColor }]}>
                  {segundos}s
                </Text>
              </View>

              {/* Barra de progreso */}
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(segundos / QR_DURACION_SEG) * 100}%`,
                      backgroundColor: timerColor,
                    },
                  ]}
                />
              </View>

              <Text style={styles.qrClaseNombre}>
                {claseSeleccionada?.nombre}
              </Text>
            </View>
          )}

          {/* ── QR EXPIRADO ───────────────────────────────────────────── */}
          {expirado && (
            <View style={styles.expiradoWrap}>
              <Text style={styles.expiradoTitulo}>QR Expirado</Text>
              <Text style={styles.expiradoSub}>
                Genera un nuevo QR para continuar
              </Text>
              <TouchableOpacity
                style={styles.btnRegenerar}
                onPress={handleGenerarQR}
                activeOpacity={0.85}
              >
                <Text style={styles.btnRegenerarText}>REGENERAR QR</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── MODAL DROPDOWN ────────────────────────────────────────────── */}
      <Modal
        visible={dropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDropdownVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Clase</Text>
            {clases.length === 0 ? (
              <Text style={styles.modalEmpty}>No hay clases creadas aún.</Text>
            ) : (
              clases.map((clase) => (
                <TouchableOpacity
                  key={clase.id}
                  style={[
                    styles.modalOption,
                    claseSeleccionada?.id === clase.id &&
                      styles.modalOptionActive,
                  ]}
                  onPress={() => handleSeleccionarClase(clase)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      claseSeleccionada?.id === clase.id &&
                        styles.modalOptionTextActive,
                    ]}
                  >
                    {clase.nombre}
                  </Text>
                  <Text style={styles.modalOptionHora}>
                    {clase.horaInicio} — {clase.horaFin}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 180,
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

  // Menú desplegable
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
  menuItemIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },

  // Card principal
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 22,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 20,
    textAlign: "center",
  },
  cardLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "600",
    marginBottom: 8,
  },

  // Dropdown
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 20,
  },
  dropdownText:  { fontSize: 15, color: COLORS.text, flex: 1 },
  dropdownArrow: { fontSize: 18, color: COLORS.textMuted },

  // Botón generar
  btnGenerar: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  btnGenerandoDisabled: {
    opacity: 0.7,
  },
  btnGenerarText: {
    color: COLORS.white, fontWeight: "700",
    fontSize: 14, letterSpacing: 1.5,
  },

  // Área del QR
  qrArea: {
    alignItems: "center",
    marginTop: 24,
  },
  qrImageWrap: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 16,
  },

  // Fallback cuando no está react-native-qrcode-svg
  qrFallback: {
    width: 200, height: 200,
    alignItems: "center", justifyContent: "center",
    backgroundColor: COLORS.iconBg,
    borderRadius: 12,
  },
  qrFallbackIcon:  { fontSize: 48, marginBottom: 10 },
  qrFallbackTitle: {
    fontSize: 16, fontWeight: "700",
    color: COLORS.primary, marginBottom: 6,
  },
  qrFallbackSub: {
    fontSize: 11, color: COLORS.textMuted,
    textAlign: "center", lineHeight: 16,
  },

  // Timer
  timerWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  timerLabel: {
    fontSize: 13, color: COLORS.textMuted, fontWeight: "500",
  },
  timerSegundos: {
    fontSize: 22, fontWeight: "800",
  },

  // Barra de progreso
  progressBar: {
    width: "100%",
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },

  qrClaseNombre: {
    fontSize: 13, color: COLORS.textMuted,
    fontWeight: "600", textAlign: "center",
  },

  // QR Expirado
  expiradoWrap: {
    alignItems: "center",
    marginTop: 24,
    paddingVertical: 20,
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
  },
  expiradoIcon:   { fontSize: 40, marginBottom: 10 },
  expiradoTitulo: {
    fontSize: 17, fontWeight: "700",
    color: COLORS.red, marginBottom: 6,
  },
  expiradoSub: {
    fontSize: 13, color: COLORS.textMuted,
    marginBottom: 16, textAlign: "center",
  },
  btnRegenerar: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  btnRegenerarText: {
    color: COLORS.white, fontWeight: "700",
    fontSize: 13, letterSpacing: 1,
  },

  // Modal dropdown
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center", alignItems: "center", padding: 24,
  },
  modalContent: {
    backgroundColor: COLORS.white, borderRadius: 16,
    padding: 20, width: "100%",
  },
  modalTitle: {
    fontSize: 16, fontWeight: "700",
    color: COLORS.text, marginBottom: 14,
  },
  modalEmpty: {
    fontSize: 14, color: COLORS.textMuted,
    textAlign: "center", paddingVertical: 20,
  },
  modalOption: {
    paddingVertical: 12, paddingHorizontal: 10,
    borderRadius: 8, marginBottom: 4,
  },
  modalOptionActive:     { backgroundColor: COLORS.iconBg },
  modalOptionText:       { fontSize: 15, color: COLORS.text, fontWeight: "600" },
  modalOptionTextActive: { color: COLORS.primary },
  modalOptionHora:       { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  // Bottom nav
  navBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
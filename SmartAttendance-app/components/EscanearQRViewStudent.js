/**
 * EscanearQRView.js
 * Pestaña Escanear QR — Estudiante
 *
 * Conexión al backend:
 *  - registrarAsistenciaQR     → registrar asistencia con el QR pegado
 *  - obtenerEstudiantePorCorreo → obtener datos del estudiante logueado
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image
} from "react-native";

import qr from "../assets/icons/qr.png";

import {
  registrarAsistenciaQR,
  obtenerEstudiantePorCorreo,
} from "../controllers/asistenciaController";

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
};

export default function EscanearQRView({ usuario, menuVisible, setMenuVisible, onLogout }) {
  const [estudiante, setEstudiante] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [qrTexto, setQrTexto]           = useState("");
  const [celular, setCelular]           = useState("");
  const [cargando, setCargando]         = useState(false);

  useEffect(() => {
    const est = obtenerEstudiantePorCorreo(usuario.correo);
    setEstudiante(est);
  }, [usuario]);

  const handleRegistrarQR = () => {
    if (!estudiante) {
      Alert.alert("Error", "No se encontró tu perfil de estudiante.");
      return;
    }
    if (!qrTexto.trim()) {
      Alert.alert("Error", "Pega el código QR en el campo.");
      return;
    }
    if (!celular.trim()) {
      Alert.alert("Error", "Ingresa tu número de celular.");
      return;
    }

    setCargando(true);

    setTimeout(() => {
      let claseId = "";
      try {
        const qrObj = JSON.parse(qrTexto.trim());
        claseId = qrObj.claseId || "";
      } catch {
        setCargando(false);
        Alert.alert("QR inválido", "El código QR no tiene el formato correcto.");
        return;
      }

      const resultado = registrarAsistenciaQR({
        estudianteId: estudiante.id,
        celular:      celular.trim(),
        claseId,
        qrData:       qrTexto.trim(),
      });

      setCargando(false);

      if (resultado.ok) {
        setModalVisible(false);
        setQrTexto("");
        setCelular("");
        Alert.alert("✅ Asistencia Registrada", resultado.mensaje);
      } else {
        Alert.alert("❌ Error", resultado.mensaje);
      }
    }, 500);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={COLORS.white} barStyle="dark-content" />

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.menuBtn}
          onPress={() => setMenuVisible(!menuVisible)}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SmartAttendance</Text>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarIcon}>👤</Text>
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

      {/* ── CONTENIDO ───────────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Saludo */}
        <Text style={styles.bienvenidoLabel}>BIENVENIDO,</Text>
        <Text style={styles.holaTexto}>
          Hola,{" "}
          <Text style={styles.holaAccent}>
            {estudiante?.nombre?.split(" ")[0] || usuario.nombre}
          </Text>
        </Text>

        {/* Card QR */}
        <View style={styles.qrCard}>
          <TouchableOpacity
            style={styles.qrBoton}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.85}
          >
            <Image source={qr} style={{ width: 100, height: 100 }} />
            <Text style={styles.qrBotonLabel}>PULSAR</Text>
          </TouchableOpacity>

          <Text style={styles.qrCardTitulo}>Escanear QR</Text>
          <Text style={styles.qrCardSub}>
            Posiciona la cámara frente al código del aula para registrar tu
            asistencia de hoy.
          </Text>
        </View>
      </ScrollView>

      {/* ── MODAL INGRESAR QR ───────────────────────────────────── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            <TouchableOpacity
              style={styles.modalCard}
              activeOpacity={1}
              onPress={() => {}}
            >
              <Text style={styles.modalTitulo}>Registrar Asistencia</Text>
              <Text style={styles.modalSub}>
                Pega el código QR que te compartió el profesor y confirma tu
                número de celular.
              </Text>

              <Text style={styles.modalLabel}>CÓDIGO QR</Text>
              <TextInput
                style={[styles.modalInput, { minHeight: 80 }]}
                placeholder='{"claseId":"...","token":"...","expiracion":...}'
                placeholderTextColor={COLORS.textMuted}
                value={qrTexto}
                onChangeText={setQrTexto}
                multiline
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={styles.modalLabel}>TU NÚMERO DE CELULAR</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="3001234567"
                placeholderTextColor={COLORS.textMuted}
                value={celular}
                onChangeText={setCelular}
                keyboardType="phone-pad"
              />

              <TouchableOpacity
                style={[styles.btnRegistrar, cargando && { opacity: 0.7 }]}
                onPress={handleRegistrarQR}
                activeOpacity={0.85}
                disabled={cargando}
              >
                <Text style={styles.btnRegistrarText}>
                  {cargando ? "VERIFICANDO..." : "✓  REGISTRAR ASISTENCIA"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnCancelar}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.btnCancelarText}>Cancelar</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: COLORS.white },
  scroll:    { flex: 1, backgroundColor: COLORS.background },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
  },

  header: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.navBorder,
  },
  menuBtn:     { padding: 4 },
  menuIcon:    { fontSize: 20, color: COLORS.primary },
  headerTitle: {
    fontSize: 17, fontWeight: "700",
    color: COLORS.primary, letterSpacing: 0.3,
  },
  avatarWrap: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center",
  },
  avatarIcon: { fontSize: 20 },

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

  // Contenido
  bienvenidoLabel: {
    fontSize: 11, fontWeight: "700",
    color: COLORS.textMuted, letterSpacing: 1.5, marginBottom: 4,
  },
  holaTexto: {
    fontSize: 30, fontWeight: "800",
    color: COLORS.text, marginBottom: 28,
  },
  holaAccent: { color: COLORS.primary },

  qrCard: {
    backgroundColor: COLORS.card, borderRadius: 20,
    padding: 28, alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.06,
    shadowRadius: 12, shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  qrBoton: {
    width: 160, height: 160, borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center",
    marginBottom: 20,
    shadowColor: COLORS.primary, shadowOpacity: 0.3,
    shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  qrBotonLabel: {
    fontSize: 11, fontWeight: "700",
    color: COLORS.white, letterSpacing: 2,
  },
  qrCardTitulo: {
    fontSize: 20, fontWeight: "800",
    color: COLORS.text, marginBottom: 8,
  },
  qrCardSub: {
    fontSize: 14, color: COLORS.textMuted,
    textAlign: "center", lineHeight: 20,
  },

  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
  },
  modalTitulo: {
    fontSize: 20, fontWeight: "800",
    color: COLORS.text, marginBottom: 6,
  },
  modalSub: {
    fontSize: 13, color: COLORS.textMuted,
    lineHeight: 18, marginBottom: 20,
  },
  modalLabel: {
    fontSize: 10, fontWeight: "700",
    color: COLORS.textMuted, letterSpacing: 1.2, marginBottom: 8,
  },
  modalInput: {
    backgroundColor: COLORS.inputBg, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 13, color: COLORS.text, marginBottom: 16,
  },
  btnRegistrar: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: "center", marginBottom: 10,
  },
  btnRegistrarText: {
    color: COLORS.white, fontWeight: "700",
    fontSize: 14, letterSpacing: 1.2,
  },
  btnCancelar:     { alignItems: "center", paddingVertical: 10 },
  btnCancelarText: { fontSize: 14, color: COLORS.textMuted, fontWeight: "600" },
});
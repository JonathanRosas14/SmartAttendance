/**
 * HistorialView.js
 * Pestaña Historial de Asistencias — Estudiante
 *
 * Conexión al backend:
 *  - obtenerHistorialEstudiante  → historial de asistencias del estudiante
 *  - obtenerEstudiantePorCorreo  → obtener datos del estudiante logueado
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image
} from "react-native";

import planning from "../assets/icons/planning.png";

import {
  obtenerHistorialEstudiante,
  obtenerEstudiantePorCorreo,
} from "../controllers/asistenciaController";

const COLORS = {
  primary:    "#1A3A6B",
  accent:     "#3B82F6",
  background: "#F0F4FA",
  card:       "#FFFFFF",
  text:       "#1A2B4A",
  textMuted:  "#6B7A99",
  border:     "#D8E2F0",
  white:      "#FFFFFF",
  navBorder:  "#E2E8F0",
};

// Formatea "YYYY-MM-DD" → "15 OCT, 2023"
function formatearFecha(fechaStr = "") {
  try {
    const [y, m, d] = fechaStr.split("-").map(Number);
    const meses = ["ENE","FEB","MAR","ABR","MAY","JUN",
                   "JUL","AGO","SEP","OCT","NOV","DIC"];
    return `${d} ${meses[m - 1]}, ${y}`;
  } catch {
    return fechaStr;
  }
}

export default function HistorialView({ usuario, menuVisible, setMenuVisible, onLogout }) {
  const [estudiante, setEstudiante] = useState(null);
  const [historial, setHistorial]   = useState([]);

  useEffect(() => {
    const est = obtenerEstudiantePorCorreo(usuario.correo);
    setEstudiante(est);
    if (est) {
      setHistorial(obtenerHistorialEstudiante(est.id));
    }
  }, [usuario]);

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
        <Text style={styles.titulo}>Tus Asistencias</Text>
        <Text style={styles.subtitulo}>
          Revisa el registro detallado de tu asistencia semestral.
        </Text>

        {historial.length === 0 ? (
          <View style={styles.emptyState}>
            <Image source={planning} style={{ width: 100, height: 100, tintColor: COLORS.textMuted }} />
            <Text style={styles.emptyText}>
              Aún no tienes asistencias registradas.
            </Text>
          </View>
        ) : (
          <FlatList
            data={historial}
            keyExtractor={(item, index) => `${item.claseId}-${index}`}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.cardFecha}>
                  {formatearFecha(item.fecha)}
                </Text>
                <Text style={styles.cardClase}>{item.claseNombre}</Text>
                <Text style={styles.cardDetalle}>
                  {item.tipo === "manual" ? "Registro manual" : "Aula"} •{" "}
                  {item.hora}
                </Text>
              </View>
            )}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  scroll:   { flex: 1, backgroundColor: COLORS.background },
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

  titulo: {
    fontSize: 28, fontWeight: "800",
    color: COLORS.primary, marginBottom: 6,
  },
  subtitulo: {
    fontSize: 14, color: COLORS.textMuted,
    lineHeight: 20, marginBottom: 20,
  },

  card: {
    backgroundColor: COLORS.card, borderRadius: 14,
    padding: 18,
    shadowColor: "#000", shadowOpacity: 0.04,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardFecha: {
    fontSize: 11, fontWeight: "700",
    color: COLORS.accent, letterSpacing: 0.8, marginBottom: 4,
  },
  cardClase: {
    fontSize: 18, fontWeight: "700",
    color: COLORS.text, marginBottom: 4,
  },
  cardDetalle: { fontSize: 13, color: COLORS.textMuted },

  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyText:  {
    fontSize: 14, color: COLORS.textMuted, textAlign: "center",
  },
});
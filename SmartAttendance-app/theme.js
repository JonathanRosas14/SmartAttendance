// theme.js - Colores y estilos globales de la app
// Centralizado para evitar ciclos de dependencias

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

// Paleta de colores usada en toda la app para mantener consistencia visual
export const COLORS = {
  primary: "#1A3A6B",
  primaryLight: "#2454A0",
  accent: "#3B82F6",
  background: "#F0F4FA",
  card: "#FFFFFF",
  cardAlt: "#EEF2FA",
  iconBg: "#DDE8F8",
  text: "#1A2B4A",
  textMuted: "#6B7A99",
  border: "#D8E2F0",
  error: "#EF4444",
  success: "#22C55E",
  white: "#FFFFFF",
  navBorder: "#E2E8F0",
  inputBg: "#F5F7FC",
};

// ─── Componente Header Reutilizable ─────────────────────────────────────────
export function Header({ menuVisible, setMenuVisible, onLogout, onSettings }) {
  return (
    <>
      {/* Header fijo */}
      <View style={headerStyles.header}>
        <TouchableOpacity 
          style={headerStyles.menuBtn}
          onPress={() => setMenuVisible(!menuVisible)}
        >
          <Text style={headerStyles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={headerStyles.headerTitle}>SmartAttendance</Text>
        <View style={headerStyles.avatarWrap}>
          <Text style={headerStyles.avatarText}>👤</Text>
        </View>
      </View>

      {/* Menú desplegable */}
      {menuVisible && (
        <View style={headerStyles.menuDropdown}>
          <TouchableOpacity
            style={headerStyles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              if (onLogout) onLogout();
            }}
            activeOpacity={0.7}
          >
            <Text style={headerStyles.menuItemText}>Cerrar sesión</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={headerStyles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              if (onSettings) onSettings();
            }}
            activeOpacity={0.7}
          >
            <Text style={headerStyles.menuItemText}>Configuración</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}

// Estilos del Header
export const headerStyles = StyleSheet.create({
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
    letterSpacing: 0.3,
  },
  avatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 20 },

  // Menú desplegable
  menuDropdown: {
    position: "absolute",
    top: 62,
    left: 0,
    right: 0,
    backgroundColor: COLORS.text,
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
  menuItemText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.white,
  },
});

/**
 * EstudianteMainView.js
 * Panel Principal del Estudiante — SmartAttendance
 * 
 * Navegación inferior con:
 *  - Escanear QR
 *  - Historial de Asistencias
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  Platform,
} from "react-native";

import qr from "../assets/icons/qr.png";
import plannig from "../assets/icons/planning.png";

import EscanearQRView from "./EscanearQRViewStudent";
import HistorialView from "./HistorialViewStudent";

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

export default function EstudianteMainView({ usuario, onLogout }) {
  const [pantalla, setPantalla] = useState("qr"); // "qr" | "historial"
  const [menuVisible, setMenuVisible] = useState(false);

  const renderPantalla = () => {
    switch (pantalla) {
      case "qr":
        return (
          <EscanearQRView 
            usuario={usuario}
            menuVisible={menuVisible}
            setMenuVisible={setMenuVisible}
            onLogout={onLogout}
          />
        );
      case "historial":
        return (
          <HistorialView 
            usuario={usuario}
            menuVisible={menuVisible}
            setMenuVisible={setMenuVisible}
            onLogout={onLogout}
          />
        );
      default:
        return <EscanearQRView usuario={usuario} onLogout={onLogout} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={COLORS.card} barStyle="dark-content" />

      {/* Contenido de pantalla */}
      <View style={styles.contentContainer}>{renderPantalla()}</View>

      {/* Bottom Navigation */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setPantalla("qr")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.navIcon,
              pantalla === "qr" && styles.navIconActive,
            ]}
          >
            <Image source={qr} style={{ width: 24, height: 24, tintColor: COLORS.textMuted }} />
          </Text>
          <Text
            style={[
              styles.navLabel,
              pantalla === "qr" && styles.navLabelActive,
            ]}
          >
            ESCANEAR
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setPantalla("historial")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.navIcon,
              pantalla === "historial" && styles.navIconActive,
            ]}
          >
            <Image source={plannig} style={{ width: 24, height: 24, tintColor: COLORS.textMuted }} />
          </Text>
          <Text
            style={[
              styles.navLabel,
              pantalla === "historial" && styles.navLabelActive,
            ]}
          >
            HISTORIAL
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.card,
  },
  contentContainer: {
    flex: 1,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.navBorder,
    paddingVertical: 8,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 20 : 8,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  navIcon: {
    fontSize: 20,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  navIconActive: {
    color: COLORS.primary,
    fontSize: 24,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  navLabelActive: {
    color: COLORS.primary,
    fontWeight: "800",
  },
});

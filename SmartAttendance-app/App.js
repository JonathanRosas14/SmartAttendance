// App.js
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Text,
  Image,
  Platform,
} from "react-native";

import ProfesorView from "./components/ProfesorView";
import EstudianteView from "./components/EstudianteView";
import QRView from "./components/QRView";
import ManualView from "./components/ManualView";
import ExportView from "./components/ExportView";

import book from "./assets/icons/book.png";
import user from "./assets/icons/user.png";

const COLORS = {
  primary: "#1A3A6B",
  primaryLight: "#2454A0",
  accent: "#3B82F6",
  background: "#F0F4FA",
  card: "#FFFFFF",
  text: "#1A2B4A",
  textMuted: "#6B7A99",
  navBorder: "#E2E8F0",
};

const NAV_TABS = [
  { id: "clases", label: "CLASSES", icon: book, isImage: true },
  { id: "estudiantes", label: "STUDENTS", icon: user, isImage: true },
  { id: "qr", label: "QR SCAN", icon: "⊞", isImage: false },
  { id: "manual", label: "MANUAL", icon: "📋", isImage: false },
  { id: "exportar", label: "EXPORT", icon: "↑", isImage: false },
];

export default function App() {
  const [pantalla, setPantalla] = useState("clases");

  const renderPantalla = () => {
    switch (pantalla) {
      case "clases":
        return <ProfesorView setPantalla={setPantalla} />;
      case "estudiantes":
        return <EstudianteView setPantalla={setPantalla} />;
      case "qr":
        return <QRView setPantalla={setPantalla} />;
      case "manual":
        return <ManualView setPantalla={setPantalla} />;
      case "exportar":
        return <ExportView setPantalla={setPantalla} />;
      default:
        return <ProfesorView setPantalla={setPantalla} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={COLORS.card} barStyle="dark-content" />

      {/* Contenido de pantalla */}
      <View style={styles.contentContainer}>
        {renderPantalla()}
      </View>

      {/* Bottom Navigation - GLOBAL Y FIJA */}
      <View style={styles.navBar}>
        {NAV_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={styles.navItem}
            onPress={() => setPantalla(tab.id)}
            activeOpacity={0.7}
          >
            {tab.isImage ? (
              <Image
                source={tab.icon}
                style={[
                  styles.navImageIcon,
                  pantalla === tab.id && styles.navImageIconActive,
                ]}
              />
            ) : (
              <Text
                style={[
                  styles.navIcon,
                  pantalla === tab.id && styles.navIconActive,
                ]}
              >
                {tab.icon}
              </Text>
            )}
            <Text
              style={[
                styles.navLabel,
                pantalla === tab.id && styles.navLabelActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
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
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.navBorder,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 20 : 10,
    paddingHorizontal: 4,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 2,
    color: COLORS.textMuted,
  },
  navIconActive: {
    color: COLORS.primary,
  },
  navImageIcon: {
    width: 20,
    height: 20,
    marginBottom: 2,
    resizeMode: "contain",
    tintColor: COLORS.textMuted,
  },
  navImageIconActive: {
    tintColor: COLORS.primary,
  },
  navLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: COLORS.textMuted,
    letterSpacing: 0.6,
  },
  navLabelActive: {
    color: COLORS.primary,
  },
});

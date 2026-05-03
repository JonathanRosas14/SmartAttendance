// EstudianteMainView.js
// Panel principal del estudiante cuando inicia sesión
// Tiene dos tabs: uno para escanear QR y otro para ver historial de asistencias
// Los estudiantes pueden navegar entre estas dos secciones usando botones en la parte inferior

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

// Importamos los componentes de escaneo y historial
import EscanearQRView from "./EscanearQRViewStudent";
import HistorialView from "./HistorialViewStudent";
import ProfileStudentView from "./ProfileStudentView";

import { Header, COLORS } from "../theme";

export default function EstudianteMainView({ usuario, onLogout, onPerfilActualizado }) {
  // Pantalla actual que se está viendo (qr o historial)
  const [pantalla, setPantalla] = useState("qr");
  const [menuVisible, setMenuVisible] = useState(false);

  // Función para renderizar la pantalla correcta según la tab seleccionada
  const renderPantalla = () => {
    switch (pantalla) {
      case "qr":
        return (
          <EscanearQRView 
            usuario={usuario}
            menuVisible={menuVisible}
            setMenuVisible={setMenuVisible}
            onLogout={onLogout}
            onSettings={() => setPantalla("perfil")}
          />
        );
      case "historial":
        return (
          <HistorialView 
            usuario={usuario}
            menuVisible={menuVisible}
            setMenuVisible={setMenuVisible}
            onLogout={onLogout}
            onSettings={() => setPantalla("perfil")}
          />
        );
      case "perfil":
        return (
          <ProfileStudentView
            usuario={usuario}
            onLogout={onLogout}
            onPerfilActualizado={onPerfilActualizado}
            onVolver={() => setPantalla("qr")}
          />
        );
      default:
        return (
          <EscanearQRView
            usuario={usuario}
            menuVisible={menuVisible}
            setMenuVisible={setMenuVisible}
            onLogout={onLogout}
            onSettings={() => setPantalla("perfil")}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={COLORS.card} barStyle="dark-content" />

      {/* Contenido de la pantalla actual */}
      <View style={styles.contentContainer}>{renderPantalla()}</View>

      {/* Barra de navegación inferior con tabs */}
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

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setPantalla("perfil")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.navIcon,
              pantalla === "perfil" && styles.navIconActive,
            ]}
          >
            👤
          </Text>
          <Text
            style={[
              styles.navLabel,
              pantalla === "perfil" && styles.navLabelActive,
            ]}
          >
            PERFIL
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

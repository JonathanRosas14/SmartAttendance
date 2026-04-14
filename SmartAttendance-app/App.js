// App.js
import React, { useState, useEffect } from "react";
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
import EstudianteMainView from "./components/EstudianteMainView";
import QRView from "./components/QRView";
import ManualView from "./components/ManualView";
import ExportView from "./components/ExportView";
import LoginView from "./components/LoginView";
import RegisterRolView from "./components/RegisterRolView";
import FormRegistroView from "./components/FormRegistroView";

// Cargar datos del storage al iniciar
import { cargarDatosDelStorage } from "./models/clases";

import book from "./assets/icons/book.png";
import user from "./assets/icons/user.png";
import qrIcon from "./assets/icons/qr.png";
import planning from "./assets/icons/planning.png";
import exporti from "./assets/icons/export.png";

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
  { id: "qr", label: "QR SCAN", icon: qrIcon, isImage: true },
  { id: "manual", label: "MANUAL", icon: planning, isImage: true },
  { id: "exportar", label: "EXPORT", icon: exporti, isImage: true },
];

export default function App() {
  const [usuario, setUsuario] = useState(null); // null = no logueado
  const [pantalla, setPantalla] = useState("clases");
  
  // Estados para el flujo de registro
  const [mostrarRegistro, setMostrarRegistro] = useState(false); // RegisterRolView
  const [rolSeleccionado, setRolSeleccionado] = useState(null); // Rol elegido
  const [mostrarFormulario, setMostrarFormulario] = useState(false); // FormRegistroView

  // Cargar datos al montar la app
  useEffect(() => {
    cargarDatosDelStorage();
  }, []);

  const handleLoginExitoso = (usuarioData) => {
    setUsuario(usuarioData);
    // Si es profesor va a clases, si es estudiante va a QR (no navega aquí porque EstudianteMainView maneja la navegación)
    if (usuarioData.rol === "profesor") {
      setPantalla("clases");
    }
  };

  const handleLogout = () => {
    setUsuario(null);
    setMostrarRegistro(false);
    setRolSeleccionado(null);
    setMostrarFormulario(false);
  };

  const handleRolSeleccionado = (rol) => {
    setRolSeleccionado(rol);
    setMostrarFormulario(true);
  };

  const handleRegistroExitoso = (rolOusuario) => {
    // Si recibe un objeto (usuario con auto-login)
    if (typeof rolOusuario === "object" && rolOusuario && rolOusuario.rol) {
      handleLoginExitoso(rolOusuario);
    } else {
      // Si recibe solo el rol (string), volver al login
      setMostrarFormulario(false);
      setRolSeleccionado(null);
      setMostrarRegistro(false);
      // Aquí se mostrará automáticamente el LoginView
    }
  };

  // Si no hay sesión, mostrar login, registro o formulario
  if (!usuario) {
    if (mostrarFormulario && rolSeleccionado) {
      return (
        <FormRegistroView 
          rol={rolSeleccionado}
          onRegistroExitoso={handleRegistroExitoso}
          onVolverLogin={() => {
            setMostrarFormulario(false);
            setRolSeleccionado(null);
            setMostrarRegistro(false);
          }}
        />
      );
    }
    
    if (mostrarRegistro) {
      return (
        <RegisterRolView 
          onRegistroExitoso={handleRolSeleccionado} 
          onVolverLogin={() => setMostrarRegistro(false)}
        />
      );
    }
    
    return (
      <LoginView 
        onLoginExitoso={handleLoginExitoso} 
        onIrAlRegistro={() => {
          setMostrarRegistro(true);
          setRolSeleccionado(null);
        }}
        rolInicial={rolSeleccionado}
      />
    );
  }

  const renderPantalla = () => {
    switch (pantalla) {
      case "clases":
        return <ProfesorView setPantalla={setPantalla} onLogout={handleLogout} />;
      case "estudiantes":
        return <EstudianteView setPantalla={setPantalla} onLogout={handleLogout} />;
      case "qr":
        return <QRView setPantalla={setPantalla} onLogout={handleLogout} />;
      case "manual":
        return <ManualView setPantalla={setPantalla} onLogout={handleLogout} />;
      case "exportar":
        return <ExportView setPantalla={setPantalla} onLogout={handleLogout} />;
      default:
        return <ProfesorView setPantalla={setPantalla} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={COLORS.card} barStyle="dark-content" />

      {/* Si es estudiante, mostrar EstudianteMainView */}
      {usuario && usuario.rol === "estudiante" ? (
        <EstudianteMainView usuario={usuario} onLogout={handleLogout} />
      ) : (
        <>
          {/* Contenido de pantalla (para profesores) */}
          <View style={styles.contentContainer}>{renderPantalla()}</View>

          {/* Bottom Navigation - GLOBAL Y FIJA (solo para profesores) */}
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
        </>
      )}
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

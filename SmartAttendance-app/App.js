// App.js - Componente principal de SmartAttendance
// Aquí manejamos el flujo de autenticación, la navegación entre pantallas
// y la estructura general de la app. Profesores y estudiantes tienen flujos muy diferentes

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

// Al iniciar la app, cargamos todos los datos que fueron guardados en almacenamiento local
import { cargarDatosDelStorage } from "./models/clases";

import { COLORS, Header } from "./theme";

import book from "./assets/icons/book.png";
import user from "./assets/icons/user.png";
import qrIcon from "./assets/icons/qr.png";
import planning from "./assets/icons/planning.png";
import exporti from "./assets/icons/export.png";

// Configuración de las tabs de navegación que solo ven los profesores
const NAV_TABS = [
  { id: "clases", label: "CLASSES", icon: book, isImage: true },
  { id: "estudiantes", label: "STUDENTS", icon: user, isImage: true },
  { id: "qr", label: "QR SCAN", icon: qrIcon, isImage: true },
  { id: "manual", label: "MANUAL", icon: planning, isImage: true },
  { id: "exportar", label: "EXPORT", icon: exporti, isImage: true },
];

export default function App() {
  // Este estado guarda el usuario logueado. Si es null, está en login
  const [usuario, setUsuario] = useState(null);
  
  // La pantalla actual que ve el profesor (clases, estudiantes, qr, etc)
  const [pantalla, setPantalla] = useState("clases");
  
  // Estos states controlan el flujo de registro que es bastante complejo
  // El usuario primero elige su rol, luego llena el formulario
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [rolSeleccionado, setRolSeleccionado] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Cuando la app se abre, cargamos todos los datos del almacenamiento
  // (clases, asistencias, estudiantes guardados anteriormente)
  useEffect(() => {
    cargarDatosDelStorage();
  }, []);

  // Se ejecuta cuando el login fue exitoso. Guardamos el usuario y lo redirigimos
  // a su pantalla correspondiente (profesores a clases, estudiantes a su flujo)
  const handleLoginExitoso = (usuarioData) => {
    setUsuario(usuarioData);
    if (usuarioData.rol === "profesor") {
      setPantalla("clases");
    }
  };

  // Cuando el usuario cierra sesión, limpiamos todo
  const handleLogout = () => {
    setUsuario(null);
    setMostrarRegistro(false);
    setRolSeleccionado(null);
    setMostrarFormulario(false);
  };

  // El usuario seleccionó un rol (profesor o estudiante) y ahora llena el formulario
  const handleRolSeleccionado = (rol) => {
    setRolSeleccionado(rol);
    setMostrarFormulario(true);
  };

  // Después de llenar el formulario, podemos recibir un usuario nuevo (auto-login)
  // o solo el rol (y volver al login)
  const handleRegistroExitoso = (rolOusuario) => {
    // Si recibe un objeto usuario, significa que se registró correctamente
    if (typeof rolOusuario === "object" && rolOusuario && rolOusuario.rol) {
      handleLoginExitoso(rolOusuario);
    } else {
      // Si solo recibe el rol (string), volvemos al login
      setMostrarFormulario(false);
      setRolSeleccionado(null);
      setMostrarRegistro(false);
    }
  };

  // Si no hay usuario logueado, mostramos el flujo de login/registro
  if (!usuario) {
    // Paso 3: El usuario está llenando el formulario de registro
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
    
    // Paso 2: El usuario está eligiendo su rol (profesor o estudiante)
    if (mostrarRegistro) {
      return (
        <RegisterRolView 
          onRegistroExitoso={handleRolSeleccionado} 
          onVolverLogin={() => setMostrarRegistro(false)}
        />
      );
    }
    
    // Paso 1: Pantalla de login o ir al registro
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

  // Función para renderizar la pantalla correcta según el tab seleccionado
  const renderPantalla = () => {
    switch (pantalla) {
      case "clases":
        return <ProfesorView usuario={usuario} setPantalla={setPantalla} onLogout={handleLogout} />;
      case "estudiantes":
        return <EstudianteView usuario={usuario} setPantalla={setPantalla} onLogout={handleLogout} />;
      case "qr":
        return <QRView usuario={usuario} setPantalla={setPantalla} onLogout={handleLogout} />;
      case "manual":
        return <ManualView usuario={usuario} setPantalla={setPantalla} onLogout={handleLogout} />;
      case "exportar":
        return <ExportView usuario={usuario} setPantalla={setPantalla} onLogout={handleLogout} />;
      default:
        return <ProfesorView usuario={usuario} setPantalla={setPantalla} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={COLORS.card} barStyle="dark-content" />

      {/* Los estudiantes tienen su propia interfaz: EstudianteMainView */}
      {usuario && usuario.rol === "estudiante" ? (
        <EstudianteMainView usuario={usuario} onLogout={handleLogout} />
      ) : (
        <View style={{ flex: 1, flexDirection: "column" }}>
          {/* Mostramos la pantalla actual del profesor */}
          <View style={styles.contentContainer}>{renderPantalla()}</View>

          {/* Barra de navegación en la parte inferior - solo para profesores */}
          {/* Permite cambiar entre clases, estudiantes, QR, manual y exportar */}
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
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.card,
    flexDirection: "column",
  },
  contentContainer: {
    flex: 1,
    overflow: "hidden",
  },
  navBar: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.navBorder,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 20 : 10,
    paddingHorizontal: 4,
    height: Platform.OS === "ios" ? 70 : 60,
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

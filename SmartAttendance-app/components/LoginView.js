// LoginView.js
// Pantalla donde los usuarios inician sesión en la app
// Los usuarios eligen si son estudiantes o profesores, luego ingresan sus credenciales
// Si las credenciales son correctas, se dirigirán a su panel correspondiente

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";

import school from "../assets/icons/school.png";
import teacher from "../assets/icons/teacher.png";
import fingerprint from "../assets/icons/fingerprint.png";
import verified from "../assets/icons/verified.png";
import auction from "../assets/icons/auction.png";

// Importamos la función login del controlador para validar credenciales
import { login } from "../controllers/asistenciaController";

// Paleta de colores consistente en toda la app
const COLORS = {
  primary:      "#1A3A6B",
  primaryLight: "#2454A0",
  accent:       "#3B82F6",
  background:   "#F0F4FA",
  card:         "#FFFFFF",
  inputBg:      "#F5F7FC",
  text:         "#1A2B4A",
  textMuted:    "#6B7A99",
  border:       "#D8E2F0",
  white:        "#FFFFFF",
  error:        "#EF4444",
};

export default function LoginView({ onLoginExitoso, onIrAlRegistro, rolInicial }) {
  // Estado para guardar el rol seleccionado (estudiante o profesor)
  const [rol, setRol]               = useState(rolInicial || "profesor");
  const [correo, setCorreo]         = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarPass, setMostrarPass] = useState(false);
  const [cargando, setCargando]     = useState(false);

  // Cuando el usuario presiona login, validamos sus credenciales
  const handleLogin = () => {
    if (!correo.trim() || !contrasena.trim()) {
      Alert.alert("Error", "Ingresa tu correo y contraseña.");
      return;
    }

    setCargando(true);

    // Simulamos un pequeño delay para darle sensación de que está procesando
    setTimeout(() => {
      // Llamamos a la función login del controlador para verificar credenciales
      const resultado = login({ correo: correo.trim(), contrasena, rol });
      setCargando(false);

      if (resultado.ok) {
        // Si el login fue exitoso, pasamos el usuario al App.js para que lo redirija
        onLoginExitoso(resultado.usuario);
      } else {
        // Si las credenciales son incorrectas, mostramos un error
        Alert.alert("Acceso denegado", resultado.mensaje);
      }
    }, 500);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={COLORS.background} barStyle="dark-content" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoArea}>
            <View style={styles.logoWrap}>
              <Text style={styles.logoIcon}>🏛</Text>
            </View>
            <Text style={styles.appName}>SmartAttendance</Text>
            <Text style={styles.appSubtitle}>Acceso Institucional</Text>
          </View>

          {/* ── CARD DE LOGIN ─────────────────────────────────────── */}
          <View style={styles.card}>

            {/* Selector de perfil */}
            <Text style={styles.inputLabel}>SELECCIONAR PERFIL</Text>
            <View style={styles.rolRow}>
              <TouchableOpacity
                style={[
                  styles.rolBtn,
                  rol === "estudiante" && styles.rolBtnActivo,
                ]}
                onPress={() => setRol("estudiante")}
                activeOpacity={0.8}
              >
                <Image source={school} style={[
                  { width: 16, height: 16 },
                  rol === "estudiante" ? styles.iconActivo : styles.iconInactivo
                ]} />
                <Text
                  style={[
                    styles.rolBtnText,
                    rol === "estudiante" && styles.rolBtnTextActivo,
                  ]}
                >
                  Estudiante
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.rolBtn,
                  rol === "profesor" && styles.rolBtnActivo,
                ]}
                onPress={() => setRol("profesor")}
                activeOpacity={0.8}
              >
                <Image source={teacher} style={[
                  { width: 16, height: 16 },
                  rol === "profesor" ? styles.iconActivo : styles.iconInactivo
                ]} />
                <Text
                  style={[
                    styles.rolBtnText,
                    rol === "profesor" && styles.rolBtnTextActivo,
                  ]}
                >
                  Profesor
                </Text>
              </TouchableOpacity>
            </View>

            {/* Correo */}
            <Text style={styles.inputLabel}>CORREO INSTITUCIONAL</Text>
            <TextInput
              style={styles.input}
              placeholder="nombre.apellido@universidad.edu"
              placeholderTextColor={COLORS.textMuted}
              value={correo}
              onChangeText={setCorreo}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Contraseña */}
            <View style={styles.passRow}>
              <Text style={styles.inputLabel}>CONTRASEÑA</Text>
              <TouchableOpacity onPress={() => {}}>
                <Text style={styles.olvidaste}>¿Olvidaste tu clave?</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.passInputWrap}>
              <TextInput
                style={styles.passInput}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textMuted}
                value={contrasena}
                onChangeText={setContrasena}
                secureTextEntry={!mostrarPass}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setMostrarPass(!mostrarPass)}
                style={styles.eyeBtn}
              >
              </TouchableOpacity>
            </View>

            {/* Botón iniciar sesión */}
            <TouchableOpacity
              style={[styles.btnLogin, cargando && styles.btnLoginDisabled]}
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={cargando}
            >
              <Text style={styles.btnLoginText}>
                {cargando ? "VERIFICANDO..." : "INICIAR SESIÓN"}
              </Text>
            </TouchableOpacity>

            {/* Biometría */}
            <TouchableOpacity style={styles.bioBtn} activeOpacity={0.7}>
              <Image source={fingerprint} style={{ width: 20, height: 20 }} />
              <Text style={styles.bioBtnText}>Usar Biometría</Text>
            </TouchableOpacity>
          </View>

          {/* ── FOOTER ────────────────────────────────────────────── */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              ¿No tienes cuenta?{" "}
              <Text 
                style={styles.footerLink}
                onPress={onIrAlRegistro}
              >
                Regístrate
              </Text>
            </Text>
            <View style={styles.footerLinks}>
              <Text style={styles.footerMini}> <Image source={verified} style={{ width: 16, height: 16 }} /> SECURE LINK</Text>
              <Text style={styles.footerMini}>  ·  </Text>
              <Text style={styles.footerMini}> <Image source={auction} style={{ width: 16, height: 16 }} /> POLÍTICAS</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({  
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
    alignItems: "center",
  },

  // Logo
  logoArea: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoWrap: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  logoIcon: { fontSize: 36 },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: "500",
  },

  // Card
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginBottom: 24,
  },

  // Selector rol
  rolRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 22,
  },
  rolBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: 6,
  },
  rolBtnActivo: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  rolBtnIcon: { fontSize: 16 },
  rolBtnIconActivo: { color: COLORS.white },
  rolBtnIconInactivo: { color: COLORS.textMuted },
  rolBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  rolBtnTextActivo: {
    color: COLORS.white,
  },
  iconActivo: {
    tintColor: COLORS.white,
  },
  iconInactivo: {
    tintColor: COLORS.textMuted,
  },

  // Labels
  inputLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 4,
  },

  // Input correo
  input: {
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.border,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 20,
  },

  // Contraseña
  passRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  olvidaste: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: "600",
  },
  passInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.border,
    marginBottom: 28,
  },
  passInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
  },
  eyeBtn: { padding: 4 },
  eyeIcon: { fontSize: 18 },

  // Botón login
  btnLogin: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 17,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  btnLoginDisabled: { opacity: 0.7 },
  btnLoginText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 1.5,
  },

  // Biometría
  bioBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 6,
  },
  bioBtnText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: "500",
  },

  // Footer
  footer: {
    alignItems: "center",
    gap: 10,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  footerLink: {
    color: COLORS.accent,
    fontWeight: "700",
  },
  footerLinks: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerMini: {
    fontSize: 10,
    color: COLORS.textMuted,
    letterSpacing: 0.8,
  },
});
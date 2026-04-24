// FormRegistroView.js
// Formulario para que nuevos usuarios se registren en el sistema
// El formulario cambia los campos según si es estudiante o profesor
// Los estudiantes ingresan celular, los profesores ingresan departamento

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";

// Importamos las funciones de API para registrar en la BD
import {
  registrarEstudianteAPI,
  registrarProfesorAPI,
  loginAPI,
} from "../services/api";

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

export default function FormRegistroView({ rol, onRegistroExitoso, onVolverLogin }) {
  // Determinamos si es estudiante para mostrar/ocultar campos específicos
  const esEstudiante = rol === "estudiante";

  // Form contiene todos los datos del usuarios según sea estudiante o profesor
  const [form, setForm] = useState({
    nombre:       "",
    id:           "",           // ID para estudiantes
    celular:      "",           // solo para estudiantes
    departamento: "",           // solo para profesores
    correo:       "",
    contrasena:   "",
  });

  const [mostrarPass, setMostrarPass] = useState(false);
  const [cargando, setCargando]       = useState(false);

  // Función auxiliar para actualizar campos del formulario
  const actualizar = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  // Cuando el usuario presiona registrarse, validamos todos los campos y llamamos al API
  const handleRegistro = async () => {
    // Validar campos obligatorios
    if (!form.nombre.trim()) {
      Alert.alert("Validación", "Por favor ingresa tu nombre completo.");
      return;
    }
    if (!form.correo.trim()) {
      Alert.alert("Validación", "Por favor ingresa tu correo institucional.");
      return;
    }
    // Validar que sea un correo válido
    if (!form.correo.includes("@")) {
      Alert.alert("Validación", "Por favor ingresa un correo válido.");
      return;
    }
    if (!form.contrasena.trim()) {
      Alert.alert("Validación", "Por favor ingresa una contraseña.");
      return;
    }
    // La contraseña debe tener al menos 6 caracteres para seguridad
    if (form.contrasena.length < 6) {
      Alert.alert("Validación", "La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    // Validaciones específicas por rol
    if (esEstudiante && !form.id.trim()) {
      Alert.alert("Validación", "Por favor ingresa tu ID o cédula del estudiante.");
      return;
    }
    if (esEstudiante && !form.celular.trim()) {
      Alert.alert("Validación", "Por favor ingresa tu número de teléfono.");
      return;
    }
    if (!esEstudiante && !form.departamento.trim()) {
      Alert.alert("Validación", "Por favor ingresa tu departamento.");
      return;
    }

    setCargando(true);

    try {
      let resultado;

      if (esEstudiante) {
        // Registrar estudiante en BD
        resultado = await registrarEstudianteAPI(
          form.nombre.trim(),
          form.correo.trim(),
          form.contrasena,
          form.id.trim(),
          form.celular.trim()
        );
      } else {
        // Registrar profesor en BD
        resultado = await registrarProfesorAPI(
          form.nombre.trim(),
          form.correo.trim(),
          form.contrasena,
          form.departamento.trim()
        );
      }

      if (resultado.ok) {
        Alert.alert("✅ Éxito", "¡Registro exitoso! Por favor inicia sesión.");
        // Volver al login
        onRegistroExitoso(rol);
      } else {
        Alert.alert("❌ Error en el registro", resultado.mensaje || "Error desconocido");
      }
    } catch (error) {
      console.error("Error en registro:", error);
      Alert.alert("❌ Error", "Error conectando con el servidor: " + error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={COLORS.white} barStyle="dark-content" />

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>🏛</Text>
          <Text style={styles.headerTitle}>SmartAttendance</Text>
        </View>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarIcon}>👤</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── CARD ──────────────────────────────────────────────── */}
          <View style={styles.card}>

            {/* Título */}
            <Text style={styles.titulo}>
              {esEstudiante ? "Registro de Estudiante" : "Registro de Profesor"}
            </Text>
            <Text style={styles.subtitulo}>
              {esEstudiante
                ? "Por favor, ingrese sus credenciales académicas a continuación."
                : "Por favor, ingrese sus datos institucionales a continuación."}
            </Text>

            {/* ── NOMBRE COMPLETO ─────────────────────────────────── */}
            <Text style={styles.inputLabel}>NOMBRE COMPLETO</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingrese su nombre legal"
              placeholderTextColor={COLORS.textMuted}
              value={form.nombre}
              onChangeText={(v) => actualizar("nombre", v)}
              autoCapitalize="words"
            />

            {/* ── NÚMERO DE IDENTIFICACIÓN (solo para estudiantes) ──────────*/}
            {esEstudiante && (
              <>
                <Text style={styles.inputLabel}>NÚMERO DE IDENTIFICACIÓN</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. 408094 o V-12345678"
                  placeholderTextColor={COLORS.textMuted}
                  value={form.id}
                  onChangeText={(v) => actualizar("id", v)}
                  autoCapitalize="characters"
                />
              </>
            )}

            {/* ── CAMPO EXCLUSIVO POR ROL ──────────────────────────── */}
            {esEstudiante ? (
              <>
                <Text style={styles.inputLabel}>NÚMERO DE TELÉFONO</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+1 (555) 000-0000"
                  placeholderTextColor={COLORS.textMuted}
                  value={form.celular}
                  onChangeText={(v) => actualizar("celular", v)}
                  keyboardType="phone-pad"
                />
              </>
            ) : (
              <>
                <Text style={styles.inputLabel}>DEPARTAMENTO</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. Ingeniería de Sistemas"
                  placeholderTextColor={COLORS.textMuted}
                  value={form.departamento}
                  onChangeText={(v) => actualizar("departamento", v)}
                  autoCapitalize="words"
                />
              </>
            )}

            {/* ── CORREO ──────────────────────────────────────────── */}
            <Text style={styles.inputLabel}>CORREO INSTITUCIONAL</Text>
            <TextInput
              style={styles.input}
              placeholder="nombre@universidad.edu"
              placeholderTextColor={COLORS.textMuted}
              value={form.correo}
              onChangeText={(v) => actualizar("correo", v)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* ── CONTRASEÑA ──────────────────────────────────────── */}
            <Text style={styles.inputLabel}>CONTRASEÑA</Text>
            <View style={styles.passWrap}>
              <TextInput
                style={styles.passInput}
                placeholder="••••••••••••"
                placeholderTextColor={COLORS.textMuted}
                value={form.contrasena}
                onChangeText={(v) => actualizar("contrasena", v)}
                secureTextEntry={!mostrarPass}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setMostrarPass(!mostrarPass)}
                style={styles.eyeBtn}
              >
              </TouchableOpacity>
            </View>

            {/* ── AVISO LEGAL ─────────────────────────────────────── */}
            <Text style={styles.avisoLegal}>
              {esEstudiante
                ? "Al registrarse, usted acepta el Código de Integridad Académica y la Política de Privacidad Digital de la Universidad."
                : "Al registrarse, usted reconoce que sus credenciales serán verificadas contra el registro central de la universidad para la integridad académica."}
            </Text>

            {/* ── BOTÓN REGISTRARSE ────────────────────────────────── */}
            <TouchableOpacity
              style={[styles.btnRegistro, cargando && styles.btnDisabled]}
              onPress={handleRegistro}
              activeOpacity={0.85}
              disabled={cargando}
            >
              <Text style={styles.btnRegistroText}>
                {cargando
                  ? "REGISTRANDO..."
                  : esEstudiante
                  ? "REGISTRARSE COMO ESTUDIANTE"
                  : "REGISTRARSE COMO PROFESOR"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── FOOTER ───────────────────────────────────────────── */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              ¿Ya tienes una cuenta?{" "}
              <Text style={styles.footerLink} onPress={onVolverLogin}>
                Inicia sesión aquí
              </Text>
            </Text>
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

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.navBorder,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIcon: { fontSize: 20 },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.primary,
    letterSpacing: 0.3,
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarIcon: { fontSize: 18 },

  // Scroll
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },

  // Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  // Título
  titulo: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitulo: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginBottom: 24,
  },

  // Labels e inputs
  inputLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 6,
  },
  input: {
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.border,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 16,
  },

  // Contraseña
  passWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.border,
    marginBottom: 20,
  },
  passInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
  },
  eyeBtn:  { padding: 4 },
  eyeIcon: { fontSize: 18 },

  // Aviso legal
  avisoLegal: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: 24,
  },

  // Botón
  btnRegistro: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 17,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  btnDisabled: { opacity: 0.7 },
  btnRegistroText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 1.2,
  },

  // Footer
  footer: {
    alignItems: "center",
    paddingBottom: 8,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  footerLink: {
    color: COLORS.accent,
    fontWeight: "700",
  },
});
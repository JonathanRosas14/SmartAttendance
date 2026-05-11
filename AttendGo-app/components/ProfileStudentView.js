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
  Alert,
} from "react-native";
import { COLORS, Header } from "../theme";
import { actualizarPerfilEstudianteAPI } from "../services/api";

// Vista de edición del perfil del estudiante.
// Permite actualizar datos básicos y contraseña opcional.
export default function ProfileStudentView({ usuario, onLogout, onPerfilActualizado, onVolver }) {
  // Estado local del menú superior y campos del formulario.
  const [menuVisible, setMenuVisible] = useState(false);
  const [nombre, setNombre] = useState(usuario?.nombre || "");
  const [celular, setCelular] = useState(usuario?.celular || "");
  const [correo, setCorreo] = useState(usuario?.correo || "");
  const [contrasena, setContrasena] = useState("");
  // Estado de envío para deshabilitar acciones mientras guarda.
  const [cargando, setCargando] = useState(false);

  // Ejecuta la llamada real al backend para persistir los cambios.
  const ejecutarGuardadoPerfil = async () => {
    setCargando(true);
    try {
      const resultado = await actualizarPerfilEstudianteAPI(
        nombre.trim(),
        celular.trim(),
        correo.trim(),
        contrasena.trim(),
        usuario.token
      );

      if (!resultado?.ok) {
        Alert.alert("Error", resultado?.mensaje || "No se pudo actualizar el perfil.");
        return;
      }

      if (onPerfilActualizado) {
        // Actualiza el estado global/superior para refrescar datos en toda la app.
        onPerfilActualizado({ ...usuario, ...resultado.usuario });
      }
      setContrasena("");
      Alert.alert("Éxito", resultado.mensaje || "Datos guardados correctamente.");
    } catch (error) {
      Alert.alert("Error", error.message || "No se pudo actualizar el perfil.");
    } finally {
      setCargando(false);
    }
  };

  // Valida formulario en cliente antes de mostrar confirmación y guardar.
  const handleGuardar = () => {
    if (!nombre.trim() || !celular.trim() || !correo.trim()) {
      Alert.alert("Validación", "Nombre, teléfono y correo son obligatorios.");
      return;
    }
    if (!correo.includes("@")) {
      Alert.alert("Validación", "Ingresa un correo válido.");
      return;
    }
    if (contrasena.trim() && contrasena.trim().length < 8) {
      Alert.alert("Validación", "La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    Alert.alert(
      "Confirmar acción",
      "¿Deseas guardar los cambios del perfil?",
      [
        { text: "Cancelar", style: "cancel" },
        // Solo si el usuario confirma se ejecuta el guardado en API.
        { text: "Guardar", onPress: ejecutarGuardadoPerfil },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={COLORS.white} barStyle="dark-content" />
      <Header
        menuVisible={menuVisible}
        setMenuVisible={setMenuVisible}
        onLogout={onLogout}
        // En esta pantalla ya estamos en configuración/perfil.
        onSettings={() => {}}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Perfil del estudiante</Text>
        <Text style={styles.subtitle}>Edita tus datos de contacto y acceso.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>NOMBRE</Text>
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Nombre completo"
            placeholderTextColor={COLORS.textMuted}
          />

          <Text style={styles.label}>NÚMERO DE TELÉFONO</Text>
          <TextInput
            style={styles.input}
            value={celular}
            onChangeText={setCelular}
            placeholder="+58 412 0000000"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>CORREO</Text>
          <TextInput
            style={styles.input}
            value={correo}
            onChangeText={setCorreo}
            placeholder="correo@universidad.edu"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>NUEVA CONTRASEÑA</Text>
          <TextInput
            style={styles.input}
            value={contrasena}
            onChangeText={setContrasena}
            placeholder="Opcional (min. 8 caracteres)"
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.btnPrimary, cargando && styles.btnDisabled]}
            onPress={handleGuardar}
            disabled={cargando}
            activeOpacity={0.85}
          >
            <Text style={styles.btnPrimaryText}>{cargando ? "GUARDANDO..." : "GUARDAR CAMBIOS"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnSecondary} onPress={onVolver} activeOpacity={0.8}>
            <Text style={styles.btnSecondaryText}>VOLVER</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  scrollView: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 80 },
  title: { fontSize: 26, fontWeight: "800", color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: COLORS.textMuted, marginBottom: 16 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  btnPrimary: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 24,
  },
  btnPrimaryText: { color: COLORS.white, fontWeight: "700", fontSize: 14, letterSpacing: 1.2 },
  btnSecondary: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnSecondaryText: { color: COLORS.textMuted, fontWeight: "700", fontSize: 14 },
  btnDisabled: { opacity: 0.7 },
});

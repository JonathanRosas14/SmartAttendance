// RegisterRolView.js
// Pantalla de selección de rol para nuevos usuarios
// El usuario elige si es estudiante o profesor, y luego se le envía al formulario de registro

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image
} from "react-native";

import teacher from "../assets/icons/teacher.png";
import school from "../assets/icons/school.png";

const COLORS = {
  primary:    "#1A3A6B",
  accent:     "#3B82F6",
  background: "#F0F4FA",
  card:       "#FFFFFF",
  iconBg:     "#DDE8F8",
  iconBgSoft: "#D6E8F5",
  text:       "#1A2B4A",
  textMuted:  "#6B7A99",
  border:     "#D8E2F0",
  white:      "#FFFFFF",
};

export default function RegisterRolView({ onRegistroExitoso, onVolverLogin }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={COLORS.background} barStyle="dark-content" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Encabezado con logo y título */}
        <View style={styles.headerArea}>
          <View style={styles.logoWrap}>
            <Text style={styles.logoIcon}>🏛</Text>
          </View>
          <Text style={styles.titulo}>Crear una cuenta</Text>
        </View>

        {/* Card para elegir rol de estudiante */}
        <View style={styles.card}>
          <View style={[styles.rolIconWrap, { backgroundColor: COLORS.iconBg }]}>
            <Image source={school} style={{
              height: 50, 
              width: 50,
              tintColor: COLORS.primary
            }} />
          </View>
          <Text style={styles.rolNombre}>Estudiante</Text>
          {/* Al presionar, reporta que eligió estudiante y va al formulario */}
          <TouchableOpacity
            style={styles.seleccionarBtn}
            onPress={() => onRegistroExitoso("estudiante")}
            activeOpacity={0.7}
          >
            <Text style={styles.seleccionarText}>SELECCIONAR ROL</Text>
            <Text style={styles.seleccionarArrow}> →</Text>
          </TouchableOpacity>
        </View>

        {/* Card para elegir rol de profesor */}
        <View style={styles.card}>
          <View style={[styles.rolIconWrap, { backgroundColor: COLORS.iconBgSoft }]}>
            <Image source={teacher} style={{
              height: 50, 
              width: 50,
              tintColor: COLORS.primary
            }} />
          </View>
          <Text style={styles.rolNombre}>Profesor</Text>
          {/* Al presionar, reporta que eligió profesor y va al formulario */}
          <TouchableOpacity
            style={styles.seleccionarBtn}
            onPress={() => onRegistroExitoso("profesor")}
            activeOpacity={0.7}
          >
            <Text style={styles.seleccionarText}>SELECCIONAR ROL</Text>
            <Text style={styles.seleccionarArrow}> →</Text>
          </TouchableOpacity>
        </View>

        {/* Footer con opción de volver al login */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ¿Ya tienes una cuenta?{" "}
            <Text style={styles.footerLink} onPress={onVolverLogin}>
              Iniciar sesión
            </Text>
          </Text>
        </View>
      </ScrollView>
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
    paddingTop: 48,
    paddingBottom: 32,
    alignItems: "center",
  },

  // Header
  headerArea: {
    alignItems: "center",
    marginBottom: 36,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  logoIcon: { fontSize: 32 },
  titulo: {
    fontSize: 30,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 0.3,
  },

  // Cards de rol
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    width: "100%",
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  rolIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  rolNombre: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 24,
  },
  seleccionarBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  seleccionarText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.accent,
    letterSpacing: 1.2,
  },
  seleccionarArrow: {
    fontSize: 16,
    color: COLORS.accent,
    fontWeight: "700",
  },

  // Footer
  footer: {
    marginTop: 16,
    alignItems: "center",
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
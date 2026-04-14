/**
 * ManualView.js
 * Asistencia Manual — SmartAttendance
 *
 * Funcionalidades:
 *  - Seleccionar clase (dropdown)
 *  - Buscar estudiante por nombre
 *  - Marcar ASISTIÓ / FALTÓ por estudiante
 *  - Card con borde verde (asistió) o rojo (faltó)
 *  - Guardar asistencia manual en lote
 *
 * Conexión al backend:
 *  - obtenerClases               → lista de clases para el selector
 *  - obtenerEstudiantesPorClase  → estudiantes de la clase seleccionada
 *  - guardarAsistenciaManual     → guardar registros en lote
 */

import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  StatusBar,
  SafeAreaView,
  Modal,
  Image
} from "react-native";

import planning from "../assets/icons/planning.png";

import {
  obtenerClases,
  obtenerEstudiantesPorClase,
  guardarAsistenciaManual,
} from "../controllers/asistenciaController";

// ─── Paleta de colores ────────────────────────────────────────────────────────
const COLORS = {
  primary:     "#1A3A6B",
  accent:      "#3B82F6",
  background:  "#F0F4FA",
  card:        "#FFFFFF",
  inputBg:     "#F5F7FC",
  iconBg:      "#DDE8F8",
  text:        "#1A2B4A",
  textMuted:   "#6B7A99",
  border:      "#D8E2F0",
  white:       "#FFFFFF",
  navBorder:   "#E2E8F0",
  green:       "#16A34A",
  greenLight:  "#DCFCE7",
  greenBorder: "#22C55E",
  red:         "#DC2626",
  redLight:    "#FEE2E2",
  redBorder:   "#EF4444",
};

// Colores para avatares de iniciales
const AVATAR_COLORS = [
  { bg: "#DDE8F8", text: "#1A3A6B" },
  { bg: "#FDE8E8", text: "#9B1C1C" },
  { bg: "#E8F0FD", text: "#1E40AF" },
  { bg: "#FEF3C7", text: "#92400E" },
  { bg: "#D1FAE5", text: "#065F46" },
  { bg: "#EDE9FE", text: "#5B21B6" },
];

function getIniciales(nombre = "") {
  const partes = nombre.trim().split(" ").filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0][0].toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}

function getAvatarColor(id = "") {
  const sum = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}


// ─── Componente principal ─────────────────────────────────────────────────────
export default function ManualView({ setPantalla, onLogout }) {
  const [menuVisible, setMenuVisible] = useState(false);

  // ── Clases ────────────────────────────────────────────────────────────────
  const [clases] = useState(() => obtenerClases());
  const [claseSeleccionada, setClaseSeleccionada] = useState(
    () => obtenerClases()[0] || null
  );
  const [dropdownVisible, setDropdownVisible] = useState(false);

  // ── Estudiantes y sus estados de asistencia ───────────────────────────────
  // estados: { [estudianteId]: "asistio" | "falto" | null }
  const [estudiantes, setEstudiantes] = useState(() =>
    claseSeleccionada
      ? obtenerEstudiantesPorClase(claseSeleccionada.id)
      : []
  );
  const [asistenciaMap, setAsistenciaMap] = useState({});

  // ── Búsqueda ──────────────────────────────────────────────────────────────
  const [busqueda, setBusqueda] = useState("");

  // ── Cargar estudiantes cuando se selecciona una clase ────────────────────
  useEffect(() => {
    if (claseSeleccionada) {
      setEstudiantes([...obtenerEstudiantesPorClase(claseSeleccionada.id)]);
      setAsistenciaMap({}); // Resetear selecciones
    }
  }, [claseSeleccionada]);

  // ── Seleccionar clase ─────────────────────────────────────────────────────
  const handleSeleccionarClase = (clase) => {
    setClaseSeleccionada(clase);
    setDropdownVisible(false);
    setBusqueda("");
    setAsistenciaMap({});
    setEstudiantes([...obtenerEstudiantesPorClase(clase.id)]);
  };

  // ── Marcar asistencia ─────────────────────────────────────────────────────
  const handleMarcar = (estudianteId, estado) => {
    setAsistenciaMap((prev) => {
      // Si ya tiene ese estado, lo deselecciona (toggle)
      if (prev[estudianteId] === estado) {
        const next = { ...prev };
        delete next[estudianteId];
        return next;
      }
      return { ...prev, [estudianteId]: estado };
    });
  };

  // ── Guardar asistencia ────────────────────────────────────────────────────
  const handleGuardar = () => {
    if (!claseSeleccionada) {
      Alert.alert("Error", "Selecciona una clase primero.");
      return;
    }

    const registros = estudiantes.map((est) => ({
      estudianteId: est.id,
      asistio: asistenciaMap[est.id] === "asistio",
    }));

    const resultado = guardarAsistenciaManual({
      claseId:   claseSeleccionada.id,
      registros,
    });

    if (resultado.ok) {
      Alert.alert("✅ Guardado", resultado.mensaje);
      setAsistenciaMap({});
    } else {
      Alert.alert("Error", resultado.mensaje);
    }
  };

  // ── Filtrar por búsqueda ──────────────────────────────────────────────────
  const estudiantesFiltrados = useMemo(() => {
    if (!busqueda.trim()) return estudiantes;
    return estudiantes.filter((e) =>
      e.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );
  }, [estudiantes, busqueda]);

  // ── Navegación inferior ───────────────────────────────────────────────────
  const handleTabPress = (tab) => {
    setActiveTab(tab);
    const route = ROUTES[tab];
    if (route && navigation) navigation.navigate(route);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER — ítem de estudiante
  // ─────────────────────────────────────────────────────────────────────────
  const renderEstudiante = ({ item }) => {
    const estado      = asistenciaMap[item.id] || null;
    const iniciales   = getIniciales(item.nombre);
    const avatarColor = getAvatarColor(item.id);

    const asistio = estado === "asistio";
    const falto   = estado === "falto";

    return (
      <View
        style={[
          styles.estCard,
          asistio && styles.estCardGreen,
          falto   && styles.estCardRed,
        ]}
      >
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: avatarColor.bg }]}>
          <Text style={[styles.avatarText, { color: avatarColor.text }]}>
            {iniciales}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.estInfo}>
          <Text style={styles.estNombre}>{item.nombre}</Text>
          <Text style={styles.estId}>ID: {item.id}</Text>

          {/* Botones ASISTIÓ / FALTÓ */}
          <View style={styles.botonesRow}>
            {/* ASISTIÓ */}
            <TouchableOpacity
              style={[
                styles.btnEstado,
                asistio ? styles.btnAsistioActivo : styles.btnEstadoInactivo,
              ]}
              onPress={() => handleMarcar(item.id, "asistio")}
              activeOpacity={0.8}
              accessibilityLabel={`Marcar asistió a ${item.nombre}`}
            >
              <Text style={asistio ? styles.btnEstadoIconActivo : styles.btnEstadoIconInactivo}>
                {asistio ? "✓" : "○"}
              </Text>
              <Text
                style={[
                  styles.btnEstadoText,
                  asistio ? styles.btnAsistioTextoActivo : styles.btnEstadoTextoInactivo,
                ]}
              >
                {asistio ? "ASISTIÓ" : "ASISTIO"}
              </Text>
            </TouchableOpacity>

            {/* FALTÓ */}
            <TouchableOpacity
              style={[
                styles.btnEstado,
                falto ? styles.btnFaltoActivo : styles.btnEstadoInactivo,
              ]}
              onPress={() => handleMarcar(item.id, "falto")}
              activeOpacity={0.8}
              accessibilityLabel={`Marcar faltó a ${item.nombre}`}
            >
              <Text style={falto ? styles.btnEstadoIconActivo : styles.btnEstadoIconInactivo}>
                {falto ? "✕" : "⊗"}
              </Text>
              <Text
                style={[
                  styles.btnEstadoText,
                  falto ? styles.btnFaltoTextoActivo : styles.btnEstadoTextoInactivo,
                ]}
              >
                FALTÓ
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER PRINCIPAL
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={COLORS.white} barStyle="dark-content" />

      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.menuBtn} 
          accessibilityLabel="Menú"
          onPress={() => setMenuVisible(!menuVisible)}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SmartAttendance</Text>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarWrapText}>👤</Text>
        </View>
      </View>

      {/* Menú desplegable */}
      {menuVisible && (
        <View style={styles.menuDropdown}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              if (onLogout) onLogout();
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.menuItemText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── CONTENIDO ─────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={true}
      >
        {/* Título */}
        <Text style={styles.panelTitle}>Asistencia Manual</Text>

        {/* ── SELECTOR DE CLASE ──────────────────────────────────────── */}
        <Text style={styles.inputLabel}>SELECCIONAR CLASE</Text>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setDropdownVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.dropdownText}>
            {claseSeleccionada ? claseSeleccionada.nombre : "Sin clases creadas"}
          </Text>
          <Text style={styles.dropdownArrow}>⌄</Text>
        </TouchableOpacity>

        {/* ── BUSCADOR ───────────────────────────────────────────────── */}
        <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search student name..."
            placeholderTextColor={COLORS.textMuted}
            value={busqueda}
            onChangeText={setBusqueda}
            returnKeyType="search"
          />
        </View>

        {/* ── LISTA DE ESTUDIANTES ───────────────────────────────────── */}
        {estudiantesFiltrados.length === 0 ? (
          <View style={styles.emptyState}>
            <Image source={planning} style={{ width: 100, height: 100, tintColor: COLORS.textMuted }} />
            <Text style={styles.emptyText}>
              {claseSeleccionada
                ? busqueda
                  ? "No se encontraron estudiantes."
                  : "No hay estudiantes en esta clase."
                : "Selecciona una clase para comenzar."}
            </Text>
          </View>
        ) : (
          <FlatList
            data={estudiantesFiltrados}
            keyExtractor={(item) => item.id}
            renderItem={renderEstudiante}
            scrollEnabled={false}
            nestedScrollEnabled={true}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          />
        )}

        {/* Espacio para el botón flotante */}
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ── BOTÓN GUARDAR ASISTENCIA (fijo sobre la nav bar) ────────── */}
      <View style={styles.guardarWrap}>
        <TouchableOpacity
          style={styles.btnGuardar}
          onPress={handleGuardar}
          activeOpacity={0.85}
          accessibilityLabel="Guardar asistencia"
        >
          <Text style={styles.btnGuardarText}>GUARDAR ASISTENCIA</Text>
        </TouchableOpacity>
      </View>

      {/* ── MODAL DROPDOWN ────────────────────────────────────────────── */}
      <Modal
        visible={dropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDropdownVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Clase</Text>
            {clases.length === 0 ? (
              <Text style={styles.modalEmpty}>No hay clases creadas aún.</Text>
            ) : (
              clases.map((clase) => (
                <TouchableOpacity
                  key={clase.id}
                  style={[
                    styles.modalOption,
                    claseSeleccionada?.id === clase.id && styles.modalOptionActive,
                  ]}
                  onPress={() => handleSeleccionarClase(clase)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      claseSeleccionada?.id === clase.id &&
                        styles.modalOptionTextActive,
                    ]}
                  >
                    {clase.nombre}
                  </Text>
                  <Text style={styles.modalOptionHora}>
                    {clase.horaInicio} — {clase.horaFin}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
    flexDirection: 'column',
    position: 'relative',
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 180,
  },

  // Header
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
  menuBtn:    { padding: 4 },
  menuIcon:   { fontSize: 20, color: COLORS.primary },
  headerTitle: {
    fontSize: 18, fontWeight: "700",
    color: COLORS.primary, letterSpacing: 0.3,
  },
  avatarWrap: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center",
  },
  avatarWrapText: { fontSize: 20 },

  // Menú desplegable
  menuDropdown: {
    position: "absolute",
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
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
  menuItemIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },

  // Título
  panelTitle: {
    fontSize: 26, fontWeight: "800",
    color: COLORS.text, marginBottom: 18,
  },

  // Selector clase
  inputLabel: {
    fontSize: 10, fontWeight: "700",
    color: COLORS.textMuted, letterSpacing: 1.2,
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 14,
  },
  dropdownText: { fontSize: 15, color: COLORS.text, flex: 1 },
  dropdownArrow: { fontSize: 18, color: COLORS.textMuted },

  // Buscador
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
  },

  // Card de estudiante
  estCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  estCardGreen: {
    borderColor: COLORS.greenBorder,
    backgroundColor: "#FAFFFC",
  },
  estCardRed: {
    borderColor: COLORS.redBorder,
    backgroundColor: "#FFFAFA",
  },

  // Avatar
  avatar: {
    width: 46, height: 46, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
    marginRight: 12, marginTop: 2,
  },
  avatarText: { fontSize: 15, fontWeight: "700" },

  // Info estudiante
  estInfo:   { flex: 1 },
  estNombre: {
    fontSize: 15, fontWeight: "700",
    color: COLORS.text, marginBottom: 2,
  },
  estId: {
    fontSize: 12, color: COLORS.textMuted, marginBottom: 10,
  },

  // Botones ASISTIÓ / FALTÓ
  botonesRow: {
    flexDirection: "row",
    gap: 8,
  },
  btnEstado: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 5,
  },
  btnEstadoInactivo: {
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  btnAsistioActivo: {
    borderColor: COLORS.greenBorder,
    backgroundColor: COLORS.green,
  },
  btnFaltoActivo: {
    borderColor: COLORS.redBorder,
    backgroundColor: COLORS.red,
  },
  btnEstadoText: {
    fontSize: 11, fontWeight: "700", letterSpacing: 0.8,
  },
  btnEstadoTextoInactivo: { color: COLORS.textMuted },
  btnAsistioTextoActivo:  { color: COLORS.white },
  btnFaltoTextoActivo:    { color: COLORS.white },
  btnEstadoIconActivo:    { color: COLORS.white, fontSize: 12 },
  btnEstadoIconInactivo:  { color: COLORS.textMuted, fontSize: 12 },

  // Botón guardar
  guardarWrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 70,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.navBorder,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  btnGuardar: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  btnGuardarText: {
    color: COLORS.white, fontWeight: "700",
    fontSize: 14, letterSpacing: 1.5,
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: COLORS.white,
    borderRadius: 12,
  },
  
  emptyText: {
    fontSize: 13, color: COLORS.textMuted,
    textAlign: "center", paddingHorizontal: 20,
  },

  // Modal dropdown
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center", alignItems: "center", padding: 24,
  },
  modalContent: {
    backgroundColor: COLORS.white, borderRadius: 16,
    padding: 20, width: "100%",
  },
  modalTitle: {
    fontSize: 16, fontWeight: "700",
    color: COLORS.text, marginBottom: 14,
  },
  modalEmpty: {
    fontSize: 14, color: COLORS.textMuted,
    textAlign: "center", paddingVertical: 20,
  },
  modalOption: {
    paddingVertical: 12, paddingHorizontal: 10,
    borderRadius: 8, marginBottom: 4,
  },
  modalOptionActive:     { backgroundColor: COLORS.iconBg },
  modalOptionText:       { fontSize: 15, color: COLORS.text, fontWeight: "600" },
  modalOptionTextActive: { color: COLORS.primary },
  modalOptionHora:       { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  // Bottom nav
  navBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderTopWidth: 1, borderTopColor: COLORS.navBorder,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 20 : 10,
    paddingHorizontal: 4,
  },
  navItem:        { flex: 1, alignItems: "center", justifyContent: "center" },
  navIcon:        { fontSize: 20, marginBottom: 2, color: COLORS.textMuted },
  navIconActive:  { color: COLORS.primary },
  navLabel:       { fontSize: 9, fontWeight: "600", color: COLORS.textMuted, letterSpacing: 0.6 },
  navLabelActive: { color: COLORS.primary },
});
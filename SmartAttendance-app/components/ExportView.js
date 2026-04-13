/**
 * ExportView.js
 * Exportar Asistencia — SmartAttendance
 *
 * Funcionalidades:
 *  - Seleccionar clase (dropdown)
 *  - Resumen de asistencia por sesión (fecha + cantidad de estudiantes)
 *  - Ver todas las sesiones (toggle)
 *  - Exportar a CSV usando expo-file-system y expo-sharing
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
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

import chart from "../assets/icons/chart.png";

// ✅ IMPORTAR EXPO FILE SYSTEM Y SHARING
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import {
  obtenerClases,
  obtenerSesionesPorClase,
  obtenerTodasLasSesiones,
  obtenerEstudiantesPorClase,
  calcularAsistenciaPorClase,
  obtenerTodosEstudiantes,
} from "../controllers/asistenciaController";

import {
  exportarAsistenciaExcel,
  exportarAsistenciaPorSesion,
} from "../utils/exportExcel";

// Para acceder a los datos de asistencia
import { asistencias } from "../models/clases";

// ─── Paleta de colores ────────────────────────────────────────────────────────
const COLORS = {
  primary:    "#1A3A6B",
  accent:     "#3B82F6",
  background: "#F0F4FA",
  card:       "#FFFFFF",
  inputBg:    "#F5F7FC",
  iconBg:     "#DDE8F8",
  text:       "#1A2B4A",
  textMuted:  "#6B7A99",
  border:     "#D8E2F0",
  white:      "#FFFFFF",
  navBorder:  "#E2E8F0",
  green:      "#16A34A",
  red:        "#DC2626",
};


/** Formatea una fecha "YYYY-MM-DD" → "Oct 24, 2023" */
function formatearFecha(fechaStr = "") {
  try {
    const [y, m, d] = fechaStr.split("-").map(Number);
    const meses = [
      "Jan","Feb","Mar","Apr","May","Jun",
      "Jul","Aug","Sep","Oct","Nov","Dec",
    ];
    return `${meses[m - 1]} ${d}, ${y}`;
  } catch {
    return fechaStr;
  }
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ExportView({ setPantalla, onLogout }) {
  const [menuVisible, setMenuVisible] = useState(false);

  // ── Clases ────────────────────────────────────────────────────────────────
  const [clases, setClases] = useState(() => obtenerClases());
  
  // ✅ CORREGIDO: Guardar solo el ID para evitar problemas de referencia
  const [claseSeleccionadaId, setClaseSeleccionadaId] = useState(
    () => obtenerClases()[0]?.id || null
  );
  
  // Obtener el objeto clase completo basado en el ID
  const claseSeleccionada = clases.find(c => c.id === claseSeleccionadaId) || null;
  
  const [dropdownVisible, setDropdownVisible] = useState(false);

  // ── Datos de asistencia ───────────────────────────────────────────────────
  const [sesiones, setSesiones] = useState([]);
  const [estadisticas, setEstadisticas] = useState([]);
  const [verTodas, setVerTodas] = useState(false);
  const [cargando, setCargando] = useState(false);

  // ── Navegación ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("export");

  // ✅ USEEFFECT CORREGIDO - Se ejecuta cuando cambia el ID de clase
  useEffect(() => {
    console.log('🔄 useEffect ejecutado - claseSeleccionadaId:', claseSeleccionadaId);
    refreshDatos();
  }, [claseSeleccionadaId]); // ✅ Dependencia simple: solo el ID

  // ✅ FUNCIÓN PARA RECARGAR DATOS REALES - CORREGIDA
  const refreshDatos = useCallback(() => {
    console.log('📊 refreshDatos llamado para claseId:', claseSeleccionadaId);
    
    if (!claseSeleccionadaId) {
      console.log('⚠️ No hay clase seleccionada');
      setSesiones([]);
      setEstadisticas([]);
      return;
    }

    setCargando(true);
    
    // Pequeño delay para mostrar feedback visual
    setTimeout(() => {
      // ✅ USAR EL ID DIRECTAMENTE - no dependemos del objeto
      const sesionesData = obtenerSesionesPorClase(claseSeleccionadaId);
      console.log('✅ Sesiones obtenidas:', sesionesData.length);
      setSesiones(sesionesData);

      // Obtener estadísticas de asistencia
      const statsData = calcularAsistenciaPorClase(claseSeleccionadaId);
      console.log('✅ Estadísticas obtenidas:', statsData.length);
      setEstadisticas(statsData);
      
      setCargando(false);
    }, 300);
  }, [claseSeleccionadaId]);

  // ── Seleccionar clase ─────────────────────────────────────────────────────
  const handleSeleccionarClase = (clase) => {
    console.log('👆 Clase seleccionada:', clase.id, clase.nombre);
    setClaseSeleccionadaId(clase.id); // ✅ Guardar solo el ID
    setDropdownVisible(false);
    setVerTodas(false);
    // Los datos se actualizarán automáticamente por el useEffect
  };

  // ✅✅✅ EXPORTAR A EXCEL - NUEVA IMPLEMENTACIÓN SIMPLIFICADA
  const handleExportar = async () => {
    console.log('📤 Iniciando exportación...');
    
    if (!claseSeleccionadaId) {
      Alert.alert("Error", "Selecciona una clase primero.");
      return;
    }

    if (sesiones.length === 0) {
      Alert.alert(
        "Sin datos", 
        "No hay sesiones de asistencia registradas para exportar.\n\n" +
        "Registra asistencia primero desde ManualView o escaneando QR."
      );
      return;
    }

    try {
      setCargando(true);
      
      // Obtener datos necesarios
      const estudiantesClase = obtenerEstudiantesPorClase(claseSeleccionadaId);
      const asistenciasClase = asistencias.filter(
        (a) => a.claseId === claseSeleccionadaId
      );
      
      // Llamar a la función de exportación
      const resultado = await exportarAsistenciaExcel(
        claseSeleccionadaId,
        claseSeleccionada?.nombre || "Asistencia",
        estudiantesClase,
        asistenciasClase
      );

      setCargando(false);
      
      if (resultado.ok) {
        Alert.alert(
          "✅ Exportado", 
          "Asistencia exportada correctamente a Excel"
        );
      } else {
        Alert.alert("Error", resultado.mensaje);
      }
      
    } catch (error) {
      console.error('❌ Error al exportar:', error);
      setCargando(false);
      Alert.alert("Error", "No se pudo exportar: " + error.message);
    }
  };

  // ✅ EXPORTAR POR SESIÓN (Detallado)
  const handleExportarDetallado = async () => {
    console.log('📊 Exportando detallado por sesión...');
    
    if (!claseSeleccionadaId) {
      Alert.alert("Error", "Selecciona una clase primero.");
      return;
    }

    if (sesiones.length === 0) {
      Alert.alert("Sin datos", "No hay sesiones para exportar.");
      return;
    }

    try {
      setCargando(true);
      
      const estudiantesClase = obtenerEstudiantesPorClase(claseSeleccionadaId);
      const asistenciasClase = asistencias.filter(
        (a) => a.claseId === claseSeleccionadaId
      );
      
      const resultado = await exportarAsistenciaPorSesion(
        claseSeleccionada?.nombre || "Asistencia",
        sesiones,
        estudiantesClase,
        asistenciasClase
      );

      setCargando(false);
      
      if (resultado.ok) {
        Alert.alert(
          "✅ Exportado", 
          "Asistencia detallada exportada correctamente"
        );
      } else {
        Alert.alert("Error", resultado.mensaje);
      }
      
    } catch (error) {
      console.error('❌ Error:', error);
      setCargando(false);
      Alert.alert("Error", error.message);
    }
  };

  // ── Ver todas las sesiones ────────────────────────────────────────────────
  const handleVerTodas = () => {
    setVerTodas(true);
  };

  // ── Navegación inferior ───────────────────────────────────────────────────
  const handleTabPress = (tab) => {
    setActiveTab(tab);
    const route = ROUTES[tab];
    if (route && navigation) navigation.navigate(route);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER — ítem de sesión
  // ─────────────────────────────────────────────────────────────────────────
  const sesionesMostradas = verTodas ? sesiones : sesiones.slice(0, 5);

  const renderSesion = ({ item, index }) => (
    <View style={styles.sesionRow}>
      <View style={styles.sesionInfo}>
        <Text style={styles.sesionFecha}>{formatearFecha(item.fecha)}</Text>
        <Text style={styles.sesionClase}>
          {claseSeleccionada?.nombre || "Clase"}
        </Text>
      </View>
      <View style={styles.sesionBadge}>
        <Text style={styles.sesionTotal}>{item.total}</Text>
        <Text style={styles.sesionLabel}>asistencias</Text>
      </View>
    </View>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER — ítem de estudiante con estadísticas
  // ─────────────────────────────────────────────────────────────────────────
  const renderEstudianteStats = ({ item }) => {
    const porcentaje = item.porcentaje || 0;
    const colorBarra = porcentaje >= 80 ? COLORS.green : 
                       porcentaje >= 50 ? COLORS.accent : COLORS.red;
    
    return (
    <View style={styles.estCard}>
        <View style={styles.estHeader}>
          <Text style={styles.estNombre}>{item.nombre}</Text>
          <Text style={[styles.estPorcentaje, { color: colorBarra }]}>
            {porcentaje}%
          </Text>
        </View>
        
        <View style={styles.estBarraContainer}>
          <View style={[styles.estBarra, { 
            width: `${porcentaje}%`, 
            backgroundColor: colorBarra 
          }]} />
        </View>
        
        <Text style={styles.estDetalle}>
          Asistencias: {item.asistencias} / {item.totalClases} clases
        </Text>
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
      >
        {/* Título */}
        <Text style={styles.panelTitle}>Exportar asistencia</Text>

        {/* DEBUG INFO - Quitar en producción */}
        <Text style={styles.debugText}>
          Clase ID: {claseSeleccionadaId || 'Ninguna'} | 
          Sesiones: {sesiones.length} | 
          Estudiantes: {estadisticas.length}
        </Text>

        {/* ── SELECTOR DE CLASE ──────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Seleccionar Clase</Text>
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
        </View>

        {/* ── RESUMEN DE SESIONES ────────────────────────────────────── */}
        <View style={styles.resumenCard}>
          <View style={styles.resumenHeader}>
            <Text style={styles.resumenTitulo}>SESIONES REGISTRADAS</Text>
            {cargando && <Text style={styles.cargandoText}>⟳</Text>}
          </View>

          {sesiones.length === 0 ? (
            <View style={styles.emptyState}>
              <Image source={chart} style={{ width: 64, height: 64, marginBottom: 12, tintColor: COLORS.textMuted }} />
              <Text style={styles.emptyText}>
                {claseSeleccionada
                  ? "No hay sesiones registradas para esta clase.\n\nRegistra asistencia desde ManualView o QR."
                  : "Selecciona una clase para ver el resumen."}
              </Text>
            </View>
          ) : (
            <>
              <FlatList
                data={sesionesMostradas}
                keyExtractor={(item, index) => `${item.fecha}-${index}`}
                renderItem={renderSesion}
                scrollEnabled={false}
                ItemSeparatorComponent={() => (
                  <View style={styles.sesionSeparator} />
                )}
              />

              {/* Ver todas las sesiones */}
              {!verTodas && sesiones.length > 5 && (
                <TouchableOpacity
                  style={styles.verTodasBtn}
                  onPress={handleVerTodas}
                  activeOpacity={0.7}
                >
                  <Text style={styles.verTodasText}>VER TODAS LAS SESIONES ({sesiones.length})</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* ── ESTADÍSTICAS POR ESTUDIANTE ────────────────────────────── */}
        {estadisticas.length > 0 && (
          <View style={styles.resumenCard}>
            <Text style={styles.resumenTitulo}>ASISTENCIA POR ESTUDIANTE</Text>
            <FlatList
              data={estadisticas}
              keyExtractor={(item) => item.id}
              renderItem={renderEstudianteStats}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── BOTÓN EXPORTAR A EXCEL (DOS OPCIONES) ──────── */}
      <View style={styles.exportWrap}>
        <TouchableOpacity
          style={[styles.btnExportar, sesiones.length === 0 && styles.btnExportarDisabled]}
          onPress={handleExportar}
          activeOpacity={0.85}
          disabled={sesiones.length === 0 || cargando}
          accessibilityLabel="Exportar a Excel básico"
        >
          <Text style={styles.btnExportarText}>
            {cargando ? "GENERANDO..." : sesiones.length === 0 ? "SIN DATOS" : "EXPORTAR EXCEL"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnExportar, styles.btnExportarSecondary, sesiones.length === 0 && styles.btnExportarDisabled]}
          onPress={handleExportarDetallado}
          activeOpacity={0.85}
          disabled={sesiones.length === 0 || cargando}
          accessibilityLabel="Exportar Excel detallado"
        >
          <Text style={styles.btnExportarText}>
            {cargando ? "GENERANDO..." : "DETALLADO"}
          </Text>
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
                    claseSeleccionadaId === clase.id && styles.modalOptionActive, // ✅ Comparar IDs
                  ]}
                  onPress={() => handleSeleccionarClase(clase)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      claseSeleccionadaId === clase.id && // ✅ Comparar IDs
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
    color: COLORS.text, marginBottom: 10,
  },

  // Debug text
  debugText: {
    fontSize: 11,
    color: COLORS.accent,
    marginBottom: 16,
    fontWeight: '600',
    backgroundColor: COLORS.iconBg,
    padding: 8,
    borderRadius: 6,
  },

  // Card selector clase
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "600",
    marginBottom: 10,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownText:  { fontSize: 15, color: COLORS.text, flex: 1 },
  dropdownArrow: { fontSize: 18, color: COLORS.textMuted },

  // Resumen card
  resumenCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  resumenHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  resumenTitulo: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: 1.2,
  },
  cargandoText: {
    fontSize: 16,
    color: COLORS.accent,
  },

  // Fila de sesión
  sesionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
  },
  sesionSeparator: {
    height: 1,
    backgroundColor: COLORS.navBorder,
  },
  sesionInfo: {
    flex: 1,
  },
  sesionFecha: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: "600",
  },
  sesionClase: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  sesionBadge: {
    alignItems: "flex-end",
  },
  sesionTotal: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.accent,
  },
  sesionLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    textTransform: "uppercase",
  },

  // Estadísticas por estudiante
  estCard: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    padding: 12,
  },
  estHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  estNombre: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    flex: 1,
  },
  estPorcentaje: {
    fontSize: 16,
    fontWeight: "800",
  },
  estBarraContainer: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  estBarra: {
    height: "100%",
    borderRadius: 3,
  },
  estDetalle: {
    fontSize: 11,
    color: COLORS.textMuted,
  },

  // Ver todas
  verTodasBtn: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 4,
  },
  verTodasText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.accent,
    letterSpacing: 0.8,
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 13, color: COLORS.textMuted,
    textAlign: "center", paddingHorizontal: 20,
    lineHeight: 18,
  },

  // Botón exportar
  exportWrap: {
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
    gap: 10,
  },
  btnExportar: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  btnExportarSecondary: {
    backgroundColor: COLORS.accent,
  },
  btnExportarDisabled: {
    backgroundColor: COLORS.textMuted,
    opacity: 0.6,
  },
  btnExportarText: {
    color: COLORS.white, fontWeight: "700",
    fontSize: 14, letterSpacing: 1.5,
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
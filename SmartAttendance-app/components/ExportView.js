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
} from "react-native";

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

// ─── Tabs de navegación ───────────────────────────────────────────────────────
const NAV_TABS = [
  { id: "classes",  label: "CLASSES",  icon: "📚" },
  { id: "students", label: "STUDENTS", icon: "👥" },
  { id: "qrscan",   label: "QR SCAN",  icon: "⊞"  },
  { id: "manual",   label: "MANUAL",   icon: "📋" },
  { id: "export",   label: "EXPORT",   icon: "↑"  },
];

const ROUTES = {
  classes:  "ProfesorView",
  students: "EstudianteView",
  qrscan:   "QRView",
  manual:   "ManualView",
  export:   null,
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
export default function ExportView({ navigation, route }) {

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

  // ✅✅✅ EXPORTAR A CSV - IMPLEMENTACIÓN COMPLETA
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
      
      // 1. Preparar datos para CSV
      const datosCSV = prepararDatosCSV();
      
      // 2. Generar archivo CSV
      const fileUri = await generarArchivoCSV(datosCSV);
      
      // 3. Compartir archivo
      await compartirArchivo(fileUri);
      
      setCargando(false);
      
      Alert.alert(
        "✅ Exportado", 
        `Archivo "${claseSeleccionada?.nombre || 'asistencias'}.csv" generado correctamente.`
      );
      
    } catch (error) {
      console.error('❌ Error al exportar:', error);
      setCargando(false);
      Alert.alert("Error", "No se pudo exportar: " + error.message);
    }
  };

  // Preparar datos en formato CSV
  const prepararDatosCSV = () => {
    const claseNombre = claseSeleccionada?.nombre || "Sin Clase";
    
    // Encabezados
    let csv = "Nombre del Estudiante,ID Estudiante,Clase,Fecha,Estado\n";
    
    // Obtener estudiantes de esta clase
    const estudiantesClase = obtenerEstudiantesPorClase(claseSeleccionadaId);
    
    // Para cada sesión (fecha), crear una fila por estudiante
    sesiones.forEach(sesion => {
      const fecha = sesion.fecha;
      const fechaFormateada = formatearFecha(fecha);
      
      estudiantesClase.forEach(est => {
        // Verificar si el estudiante asistió en esta fecha
        const asistio = verificarAsistencia(est.id, fecha);
        const estado = asistio ? "Asistió" : "No asistió";
        
        csv += `"${est.nombre}","${est.id}","${claseNombre}","${fechaFormateada}","${estado}"\n`;
      });
    });
    
    // Si no hay sesiones con estudiantes, exportar al menos las estadísticas
    if (sesiones.length === 0 || estudiantesClase.length === 0) {
      estadisticas.forEach(stat => {
        csv += `"${stat.nombre}","${stat.id}","${claseNombre}","General","${stat.porcentaje}% de asistencia"\n`;
      });
    }
    
    return csv;
  };

  // Verificar si un estudiante asistió en una fecha específica
  const verificarAsistencia = (estudianteId, fecha) => {
    // Importar asistencias del modelo (necesitamos acceder a los datos)
    const { asistencias } = require("../models/clases");
    
    return asistencias.some(a => 
      a.estudianteId === estudianteId && 
      a.claseId === claseSeleccionadaId && 
      a.fecha === fecha
    );
  };

  // Generar archivo CSV físico
  const generarArchivoCSV = async (contenidoCSV) => {
    const nombreArchivo = `asistencias_${claseSeleccionada?.nombre || 'clase'}_${new Date().toISOString().split('T')[0]}.csv`;
    
    if (Platform.OS === 'web') {
      // En web, crear blob y descargar
      const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", nombreArchivo);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return url;
    } else {
      // En móvil, usar expo-file-system
      const fileUri = FileSystem.documentDirectory + nombreArchivo;
      await FileSystem.writeAsStringAsync(fileUri, contenidoCSV, {
        encoding: FileSystem.EncodingType.UTF8
      });
      return fileUri;
    }
  };

  // Compartir archivo
  const compartirArchivo = async (fileUri) => {
    if (Platform.OS === 'web') {
      // En web ya se descargó automáticamente
      return;
    }
    
    // En móvil, usar expo-sharing
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert("Error", "La funcionalidad de compartir no está disponible");
      return;
    }
    
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: 'Exportar asistencias',
      UTI: 'public.comma-separated-values-text' // iOS
    });
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
        <TouchableOpacity style={styles.menuBtn} accessibilityLabel="Menú">
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SmartAttendance</Text>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarWrapText}>👤</Text>
        </View>
      </View>

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
              <Text style={styles.emptyIcon}>📊</Text>
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

      {/* ── BOTÓN EXPORTAR A CSV ──────── */}
      <View style={styles.exportWrap}>
        <TouchableOpacity
          style={[styles.btnExportar, sesiones.length === 0 && styles.btnExportarDisabled]}
          onPress={handleExportar}
          activeOpacity={0.85}
          disabled={sesiones.length === 0 || cargando}
          accessibilityLabel="Exportar a CSV"
        >
          <Text style={styles.btnExportarIcon}>⬆</Text>
          <Text style={styles.btnExportarText}>
            {cargando ? "GENERANDO..." : sesiones.length === 0 ? "SIN DATOS PARA EXPORTAR" : "EXPORTAR A CSV"}
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
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
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
  emptyIcon: { fontSize: 34, marginBottom: 10 },
  emptyText: {
    fontSize: 13, color: COLORS.textMuted,
    textAlign: "center", paddingHorizontal: 20,
    lineHeight: 18,
  },

  // Botón exportar
  exportWrap: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.background,
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
  btnExportarDisabled: {
    backgroundColor: COLORS.textMuted,
    opacity: 0.6,
  },
  btnExportarIcon: { fontSize: 16, color: COLORS.white },
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
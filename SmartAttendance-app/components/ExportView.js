// ExportView.js
// Pantalla para exportar reportes de asistencia a archivos CSV
// El profesor puede:
//   - Seleccionar una clase
//   - Ver un resumen de las sesiones de clase (cada día que se registró asistencia)
//   - Exportar a CSV usando el sistema de archivos del dispositivo

import React, { useState, useCallback, useEffect, useRef } from "react";
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
  Image,
  AppState
} from "react-native";

import chart from "../assets/icons/chart.png";
import warning from "../assets/icons/warning.png";

// Importamos funciones para trabajar con archivo (pero no usamos aquí, están disponibles)
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// Importamos funciones de API para obtener datos desde el backend
import {
  obtenerClasesAPI,
  obtenerAsistenciasAPI,
  obtenerEstadisticasAsistenciaAPI,
  obtenerAsistenciasDetalladoAPI,
  obtenerEstudiantesAPI,
} from "../services/api";

// Importamos la función para exportar a Excel
import {
  exportarAsistenciaExcel,
  exportarAsistenciaPorSesion,
} from "../utils/exportExcel";

import { Header, COLORS } from "../theme";

// Función auxiliar para convertir fechas a un formato más legible
// Por ejemplo: "2025-04-14" → "Apr 14, 2025"
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

// Función para detectar números de serie duplicados (suplantación)
function detectarSuplantacion(asistencias, estudiantes) {
  // Crear un mapa de número de serie → array de estudiantes
  const mapaSerieEstudiantes = {};
  
  asistencias.forEach(asistencia => {
    const numeroSerie = asistencia.mac_address || 'sin-serie';
    
    // Encontrar el estudiante asociado
    const estudiante = estudiantes.find(e => e.id === asistencia.estudianteId);
    
    if (!mapaSerieEstudiantes[numeroSerie]) {
      mapaSerieEstudiantes[numeroSerie] = [];
    }
    
    mapaSerieEstudiantes[numeroSerie].push(estudiante?.nombre || `Estudiante ${asistencia.estudianteId}`);
  });
  
  // Filtrar solo los números de serie que aparecen más de una vez
  const seriesDuplicadas = Object.entries(mapaSerieEstudiantes).filter(
    ([serie, estudiantes]) => estudiantes.length > 1
  );
  
  return seriesDuplicadas.length > 0 ? seriesDuplicadas : null;
}

// Función auxiliar para mostrar alerta de suplantación
function mostrarAlertaSuplantacion(seriesDuplicadas) {
  let mensaje = "⚠️ ALERTA DE SUPLANTACIÓN DETECTADA\n\n";
  mensaje += "Se detectó que múltiples estudiantes están usando el mismo dispositivo:\n\n";
  
  seriesDuplicadas.forEach(([serie, estudiantesLista], index) => {
    mensaje += `📱 Dispositivo ${index + 1} (Serie: ${serie.substring(0, 8)}...)\n`;
    estudiantesLista.forEach(nombre => {
      mensaje += `   • ${nombre}\n`;
    });
    mensaje += "\n";
  });
  
  mensaje += "Esto podría indicar que un estudiante está suplantando a otro.\n";
  mensaje += "Revisa manualmente antes de proceder.";
  
  return mensaje;
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ExportView({ usuario, setPantalla, onLogout }) {
  const appState = useRef(AppState.currentState);
  const token = usuario?.token;
  const [menuVisible, setMenuVisible] = useState(false);

  // ── Clases ────────────────────────────────────────────────────────────────
  const [clases, setClases] = useState([]);
  
  // ✅ Guardar solo el ID para evitar problemas de referencia
  const [claseSeleccionadaId, setClaseSeleccionadaId] = useState(null);
  
  // Obtener el objeto clase completo basado en el ID
  const claseSeleccionada = clases.find(c => c.id === claseSeleccionadaId) || null;
  
  const [dropdownVisible, setDropdownVisible] = useState(false);

  // ── Datos de asistencia ───────────────────────────────────────────────────
  const [sesiones, setSesiones] = useState([]);
  const [estadisticas, setEstadisticas] = useState([]);
  const [verTodas, setVerTodas] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [modoExportacion, setModoExportacion] = useState("completo"); // "completo" | "sesion"
  
  // ── Estados para suplantación ──────────────────────────────────────────────
  const [suplantacionDetectada, setSuplantacionDetectada] = useState(null);
  const [mostrarTooltip, setMostrarTooltip] = useState(false);

  // ── Navegación ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("export");

  // ── Limpiar UI states cuando la app se reanuda (AppState) ────────────────
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const handleAppStateChange = (nextAppState) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App ha reanudado - limpiar todos los estados UI
      setMenuVisible(false);
      setDropdownVisible(false);
    }
    appState.current = nextAppState;
  };

  // ✅ Cargar clases cuando el componente se monta
  useEffect(() => {
    if (token) {
      cargarClases();
    }
  }, [token]);

  // ✅ Cargar datos de asistencia cuando cambia la clase seleccionada
  useEffect(() => {
    if (claseSeleccionadaId && token) {
      refreshDatos();
    }
  }, [claseSeleccionadaId, token]);

  // ✅ LIMPIAR ESTADO CUANDO EL COMPONENTE SE DESMONTA (ANDROID FIX)
  // Esto previene que los menús/modales se queden visibles cuando regresas a la pantalla
  useEffect(() => {
    return () => {
      setMenuVisible(false);
      setDropdownVisible(false);
      setSuplantacionDetectada(null);
      setVerTodas(false);
      setFechaSeleccionada(null);
    };
  }, []);

  // ✅ Cargar clases desde el backend
  const cargarClases = async () => {
    try {
      const resultado = await obtenerClasesAPI(token);
      if (resultado.ok) {
        setClases(resultado.clases);
        // Seleccionar la primera clase por defecto
        if (resultado.clases.length > 0) {
          setClaseSeleccionadaId(resultado.clases[0].id);
        }
      } else {
        console.error('Error al cargar clases:', resultado.mensaje);
      }
    } catch (error) {
      console.error('Error cargando clases:', error);
    }
  };

  // ✅ FUNCIÓN PARA RECARGAR DATOS DEL BACKEND
  const refreshDatos = useCallback(async () => {
    console.log('📊 refreshDatos llamado para claseId:', claseSeleccionadaId);
    
    if (!claseSeleccionadaId || !token) {
      console.log('⚠️ No hay clase seleccionada o token');
      setSesiones([]);
      setEstadisticas([]);
      return;
    }

    setCargando(true);
    
    try {
      // Obtener sesiones y estadísticas del backend en paralelo
      const [sesionesResult, estadisticasResult] = await Promise.all([
        obtenerAsistenciasAPI(claseSeleccionadaId, token),
        obtenerEstadisticasAsistenciaAPI(claseSeleccionadaId, token)
      ]);

      if (sesionesResult.ok) {
        console.log('✅ Sesiones obtenidas:', sesionesResult.sesiones?.length || 0);
        setSesiones(sesionesResult.sesiones || []);
      } else {
        console.error('❌ Error en sesiones:', sesionesResult.mensaje);
        setSesiones([]);
      }

      if (estadisticasResult.ok) {
        console.log('✅ Estadísticas obtenidas:', estadisticasResult.estadisticas?.length || 0);
        setEstadisticas(estadisticasResult.estadisticas || []);
      } else {
        console.error('❌ Error en estadísticas:', estadisticasResult.mensaje);
        setEstadisticas([]);
      }
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      setSesiones([]);
      setEstadisticas([]);
    } finally {
      setCargando(false);
    }
  }, [claseSeleccionadaId, token]);

  // ── Seleccionar clase ─────────────────────────────────────────────────────
  const handleSeleccionarClase = (clase) => {
    console.log('👆 Clase seleccionada:', clase.id, clase.nombre);
    setClaseSeleccionadaId(clase.id); // ✅ Guardar solo el ID
    setDropdownVisible(false);
    setVerTodas(false);
    setSuplantacionDetectada(null); // Limpiar suplantación anterior
    // Los datos se actualizarán automáticamente por el useEffect
  };

  // ✅ DETECTAR SUPLANTACIÓN AL CAMBIAR DE SESIÓN
  const handleSeleccionarSesion = async (fecha) => {
    setFechaSeleccionada(fecha);
    setSuplantacionDetectada(null); // Limpiar estado anterior
    
    // Obtener asistencias de esta sesión para detectar suplantación
    try {
      const [estudiantesResult, asistenciasResult] = await Promise.all([
        obtenerEstudiantesAPI(claseSeleccionadaId, token),
        obtenerAsistenciasDetalladoAPI(claseSeleccionadaId, token)
      ]);

      if (estudiantesResult.ok && asistenciasResult.ok) {
        // Filtrar solo asistencias de esta sesión
        const asistenciasSessionEspecifica = (asistenciasResult.asistencias || []).filter(
          (a) => a.fecha === fecha
        );

        const asistenciasClase = asistenciasSessionEspecifica.map(a => ({
          estudianteId: a.estudiante_id,
          claseId: claseSeleccionadaId,
          fecha: a.fecha,
          hora: a.hora,
          tipo: a.tipo,
          mac_address: a.mac_address
        }));

        const estudiantesClase = (estudiantesResult.estudiantes || []).map(e => ({
          id: e.id,
          numero_identificacion: e.numero_identificacion,
          nombre: e.nombre,
          celular: e.celular || '',
          claseId: claseSeleccionadaId
        }));

        // Detectar suplantación en ESTA sesión
        const seriesDuplicadas = detectarSuplantacion(asistenciasClase, estudiantesClase);
        if (seriesDuplicadas) {
          console.log('⚠️ Suplantación detectada en sesión:', fecha);
          setSuplantacionDetectada(seriesDuplicadas);
        }
      }
    } catch (error) {
      console.error('Error detectando suplantación:', error);
    }
  };

  // ✅ EXPORTAR SESIÓN ESPECÍFICA
  const handleExportarSesionEspecifica = async () => {
    console.log('📅 Exportando sesión específica:', fechaSeleccionada);
    
    if (!claseSeleccionadaId) {
      Alert.alert("Error", "Selecciona una clase primero.");
      return;
    }

    if (!fechaSeleccionada) {
      Alert.alert("Error", "Selecciona una fecha para exportar.");
      return;
    }

    try {
      setCargando(true);
      setSuplantacionDetectada(null); // Limpiar alerta anterior
      
      // Obtener estudiantes de la clase y asistencias detalladas
      const [estudiantesResult, asistenciasResult] = await Promise.all([
        obtenerEstudiantesAPI(claseSeleccionadaId, token),
        obtenerAsistenciasDetalladoAPI(claseSeleccionadaId, token)
      ]);

      if (!estudiantesResult.ok || !asistenciasResult.ok) {
        Alert.alert("Error", "No se pudieron obtener los datos.");
        setCargando(false);
        return;
      }

      // Filtrar asistencias solo de la sesión seleccionada
      const asistenciasSessionEspecifica = (asistenciasResult.asistencias || []).filter(
        (a) => a.fecha === fechaSeleccionada
      );
      
      if (asistenciasSessionEspecifica.length === 0) {
        setCargando(false);
        Alert.alert("Sin datos", `No hay asistencias registradas para ${formatearFecha(fechaSeleccionada)}`);
        return;
      }

      // Transformar datos para compatibilidad con exportarAsistenciaExcel
      const estudiantesClase = (estudiantesResult.estudiantes || []).map(e => ({
        id: e.id,
        numero_identificacion: e.numero_identificacion,
        nombre: e.nombre,
        celular: e.celular || '',
        claseId: claseSeleccionadaId
      }));

      const asistenciasClase = asistenciasSessionEspecifica.map(a => ({
        estudianteId: a.estudiante_id,
        claseId: claseSeleccionadaId,
        fecha: a.fecha,
        hora: a.hora,
        tipo: a.tipo,
        mac_address: a.mac_address
      }));

      // ✅ DETECCIÓN DE SUPLANTACIÓN - guardar en estado pero continuar exportando
      const seriesDuplicadas = detectarSuplantacion(asistenciasClase, estudiantesClase);
      if (seriesDuplicadas) {
        setSuplantacionDetectada(seriesDuplicadas);
      }

      // Exportar la sesión
      const resultado = await exportarAsistenciaExcel(
        claseSeleccionadaId,
        `${claseSeleccionada?.nombre} - ${formatearFecha(fechaSeleccionada)}`,
        estudiantesClase,
        asistenciasClase
      );

      setCargando(false);
      
      if (resultado.ok) {
        Alert.alert(
          "✅ Exportado", 
          resultado.mensaje || `Asistencia de ${formatearFecha(fechaSeleccionada)} exportada`
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

  // ✅ EXPORTAR A EXCEL - COMPLETO
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
      setSuplantacionDetectada(null); // Limpiar alerta anterior
      
      // Obtener estudiantes de la clase y asistencias detalladas
      const [estudiantesResult, asistenciasResult] = await Promise.all([
        obtenerEstudiantesAPI(claseSeleccionadaId, token),
        obtenerAsistenciasDetalladoAPI(claseSeleccionadaId, token)
      ]);

      if (!estudiantesResult.ok || !asistenciasResult.ok) {
        Alert.alert("Error", "No se pudieron obtener los datos.");
        setCargando(false);
        return;
      }

      const asistenciasClase = (asistenciasResult.asistencias || []).map(a => ({
        estudianteId: a.estudiante_id,
        claseId: claseSeleccionadaId,
        fecha: a.fecha,
        hora: a.hora,
        tipo: a.tipo,
        mac_address: a.mac_address
      }));
      
      if (asistenciasClase.length === 0) {
        Alert.alert("Sin datos", "No hay datos de asistencia para exportar.");
        setCargando(false);
        return;
      }

      // Transformar datos de estudiantes
      const estudiantesClase = (estudiantesResult.estudiantes || []).map(e => ({
        id: e.id,
        numero_identificacion: e.numero_identificacion,
        nombre: e.nombre,
        celular: e.celular || '',
        claseId: claseSeleccionadaId
      }));
      
      // ✅ DETECCIÓN DE SUPLANTACIÓN - guardar en estado pero continuar exportando
      const seriesDuplicadas = detectarSuplantacion(asistenciasClase, estudiantesClase);
      if (seriesDuplicadas) {
        setSuplantacionDetectada(seriesDuplicadas);
      }
      
      // Exportar todos los datos
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
          resultado.mensaje || "Asistencia exportada correctamente"
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
      
      // Obtener estudiantes y asistencias
      const [estudiantesResult, asistenciasResult] = await Promise.all([
        obtenerEstudiantesAPI(claseSeleccionadaId, token),
        obtenerAsistenciasDetalladoAPI(claseSeleccionadaId, token)
      ]);

      if (!estudiantesResult.ok || !asistenciasResult.ok) {
        Alert.alert("Error", "No se pudieron obtener los datos.");
        setCargando(false);
        return;
      }

      // Transformar datos
      const estudiantesClase = (estudiantesResult.estudiantes || []).map(e => ({
        id: e.id,
        numero_identificacion: e.numero_identificacion,
        nombre: e.nombre,
        celular: e.celular || '',
        claseId: claseSeleccionadaId
      }));

      const asistenciasClase = (asistenciasResult.asistencias || []).map(a => ({
        estudianteId: a.estudiante_id,
        claseId: claseSeleccionadaId,
        fecha: a.fecha,
        hora: a.hora,
        tipo: a.tipo,
        mac_address: a.mac_address
      }));

      // Sesiones formateadas para exportación
      const sesionesFormato = sesiones.map(s => ({
        fecha: s.fecha,
        total: s.total
      }));
      
      const resultado = await exportarAsistenciaPorSesion(
        claseSeleccionada?.nombre || "Asistencia",
        sesionesFormato,
        estudiantesClase,
        asistenciasClase
      );

      setCargando(false);
      
      if (resultado.ok) {
        Alert.alert(
          "✅ Exportado", 
          resultado.mensaje || "Asistencia detallada exportada correctamente"
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
  // RENDER — ítem de sesión (CLICKEABLE)
  // ─────────────────────────────────────────────────────────────────────────
  const renderSesion = ({ item, index }) => {
    const esSeleccionada = fechaSeleccionada === item.fecha;
    
    // Verificar si hay suplantación detectada en la sesión seleccionada
    const haySuplantacion = esSeleccionada && suplantacionDetectada && 
      suplantacionDetectada.length > 0;
    
    return (
      <TouchableOpacity
        style={[
          styles.sesionRow,
          esSeleccionada && styles.sesionRowSelected,
        ]}
        onPress={() => handleSeleccionarSesion(item.fecha)}
        activeOpacity={0.7}
      >
        <View style={styles.sesionInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Text style={styles.sesionFecha}>{formatearFecha(item.fecha)}</Text>
            {haySuplantacion && (
              <TouchableOpacity 
                style={{ marginLeft: 8 }}
                onPress={() => setMostrarTooltip(!mostrarTooltip)}
              >
                <Image source={warning} style={{ width: 20, height: 20 }} />
              </TouchableOpacity>
            )}
          </View>
          {haySuplantacion && mostrarTooltip && (
            <Text style={{ 
              fontSize: 12, 
              color: COLORS.red, 
              marginTop: 4,
              fontWeight: '500'
            }}>
              Alerta: Múltiples estudiantes con mismo dispositivo
            </Text>
          )}
          <Text style={styles.sesionClase}>
            {claseSeleccionada?.nombre || "Clase"}
          </Text>
        </View>
        <View style={styles.sesionBadge}>
          <Text style={styles.sesionTotal}>{item.total}</Text>
          <Text style={styles.sesionLabel}>asistencias</Text>
        </View>
        {esSeleccionada && (
          <View style={styles.sesionCheckmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

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

      <Header 
        menuVisible={menuVisible} 
        setMenuVisible={setMenuVisible} 
        onLogout={onLogout}
        onSettings={() => setPantalla("perfil-profesor")}
      />

      {/* ── CONTENIDO ─────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Título */}
        <Text style={styles.panelTitle}>Exportar asistencia</Text>

        {/* DEBUG INFO */}
        <Text style={styles.debugText}>
          Clase ID: {claseSeleccionadaId || 'Cargando...'} | 
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
            <Text style={styles.resumenTitulo}>SELECCIONA UNA SESIÓN PARA EXPORTAR</Text>
            {cargando && <Text style={styles.cargandoText}>⟳</Text>}
          </View>

          {sesiones.length === 0 ? (
            <View style={styles.emptyState}>
              <Image source={chart} style={{ width: 64, height: 64, marginBottom: 12, tintColor: COLORS.textMuted }} />
              <Text style={styles.emptyText}>
                {claseSeleccionada
                  ? "No hay sesiones registradas para esta clase.\n\nRegistra asistencia desde ManualView o QR."
                  : "Selecciona una clase para ver las sesiones."}
              </Text>
            </View>
          ) : (
            <>
              <FlatList
                data={sesiones}
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
                  onPress={() => setVerTodas(true)}
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

      {/* ── BOTÓN EXPORTAR ──────────────────────────────────────────– */}
      <View style={styles.exportWrap}>
        <TouchableOpacity
          style={[
            styles.btnExportar,
            (!fechaSeleccionada || cargando) && styles.btnExportarDisabled
          ]}
          onPress={handleExportarSesionEspecifica}
          activeOpacity={0.85}
          disabled={!fechaSeleccionada || cargando}
          accessibilityLabel="Exportar sesión seleccionada"
        >
          <Text style={styles.btnExportarText}>
            {cargando ? "⟳ GENERANDO..." : !fechaSeleccionada ? "SELECCIONA UNA SESIÓN" : "EXPORTAR SESIÓN"}
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
    paddingHorizontal: 12,
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    marginBottom: 8,
  },
  sesionRowSelected: {
    backgroundColor: COLORS.greenLight,
    borderLeftColor: COLORS.green,
  },
  sesionSeparator: {
    height: 0,
    backgroundColor: "transparent",
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
    marginRight: 8,
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
  sesionCheckmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmarkText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: "700",
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
    backgroundColor: COLORS.background,
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

  // Selector de fecha
  modoStack: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  modoBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  modoBtnActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  modoBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text,
  },
  modoBtnTextActive: {
    color: COLORS.white,
  },
  fechaSelector: {
    marginTop: 8,
  },
  fechaLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  fechaOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
    borderRadius: 8,
    backgroundColor: COLORS.inputBg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.border,
  },
  fechaOptionActive: {
    backgroundColor: COLORS.greenLight,
    borderLeftColor: COLORS.green,
  },
  fechaOptionText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: "500",
  },
  fechaOptionTextActive: {
    color: COLORS.primary,
    fontWeight: "600",
  },
});
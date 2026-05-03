// EstudianteView.js
// Panel de gestión de estudiantes para el profesor
// Aquí el profesor puede:
//   - Seleccionar una clase
//   - Ver todos los estudiantes vinculados a esa clase
//   - Agregar nuevos estudiantes a la clase
//   - Eliminar estudiantes que ya no pertenecen a la clase

import React, { useState, useCallback, useEffect, useRef } from "react";
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
  Image,
  AppState
} from "react-native";

import trash from "../assets/icons/trash.png";
import user from "../assets/icons/user.png";

// Importamos las funciones API para manejar estudiantes
import {
  obtenerClasesAPI,
  obtenerEstudiantesAPI,
  agregarEstudianteAPI,
  eliminarEstudianteAPI,
} from "../services/api";

import { Header, COLORS } from "../theme";

// Colores para los avatares de iniciales (cada estudiante tiene un color diferente)
const AVATAR_COLORS = [
  { bg: "#DDE8F8", text: "#1A3A6B" },   // azul
  { bg: "#FDE8E8", text: "#9B1C1C" },   // rojo
  { bg: "#E8F0FD", text: "#1E40AF" },   // azul oscuro
  { bg: "#FEF3C7", text: "#92400E" },   // amarillo
  { bg: "#D1FAE5", text: "#065F46" },   // verde
  { bg: "#EDE9FE", text: "#5B21B6" },   // morado
];

// Función para obtener las iniciales del nombre de un estudiante
function getIniciales(nombre = "") {
  if (!nombre) return "--";
  return nombre.split(" ").map(n => n[0]).join("").toUpperCase();
}

// Función para obtener el color del avatar basado en el ID
function getAvatarColor(id = "") {
  const sum = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

// ✅ MODAL DE CONFIRMACIÓN PERSONALIZADA PARA ELIMINAR ESTUDIANTE
function ConfirmDeleteStudentModal({ visible, studentNombre, onConfirm, onCancel }) {
  const deleteModalStyles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    container: {
      backgroundColor: COLORS.white,
      borderRadius: 20,
      padding: 24,
      width: '100%',
      maxWidth: 320,
      alignItems: 'center',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 10,
    },
    iconContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: COLORS.text,
      marginBottom: 12,
    },
    message: {
      fontSize: 15,
      color: COLORS.textMuted,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 8,
    },
    studentNombre: {
      fontWeight: '700',
      color: COLORS.text,
    },
    warning: {
      fontSize: 13,
      color: COLORS.error,
      textAlign: 'center',
      marginBottom: 24,
    },
    buttonsRow: {
      flexDirection: 'row',
      width: '100%',
      gap: 12,
    },
    btnCancel: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: COLORS.inputBg,
      alignItems: 'center',
    },
    btnCancelText: {
      color: COLORS.textMuted,
      fontWeight: '600',
      fontSize: 15,
    },
    btnConfirm: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: COLORS.error,
      alignItems: 'center',
    },
    btnConfirmText: {
      color: COLORS.white,
      fontWeight: '700',
      fontSize: 15,
    },
  });

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={deleteModalStyles.overlay}>
        <View style={deleteModalStyles.container}>
          <View style={deleteModalStyles.iconContainer}>
            <Image source={trash} style={{ height: 28, width: 28 }} />
          </View>
          
          <Text style={deleteModalStyles.title}>Eliminar estudiante</Text>
          <Text style={deleteModalStyles.message}>
            ¿Seguro que deseas eliminar{"\n"}
            <Text style={deleteModalStyles.studentNombre}>"{studentNombre}"</Text>?
          </Text>
          <Text style={deleteModalStyles.warning}>
            Esta acción no se puede deshacer.
          </Text>

          <View style={deleteModalStyles.buttonsRow}>
            <TouchableOpacity style={deleteModalStyles.btnCancel} onPress={onCancel}>
              <Text style={deleteModalStyles.btnCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={deleteModalStyles.btnConfirm} onPress={onConfirm}>
              <Text style={deleteModalStyles.btnConfirmText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const ROUTES = {
  classes:  "ProfesorView",
  students: null,           // vista actual
  qrscan:   "QRView",
  manual:   "ManualView",
  export:   "ExportView",
};

// ─── Componente principal ─────────────────────────────────────────────────────
export default function EstudianteView({ usuario, setPantalla, onLogout }) {
      const appState = useRef(AppState.currentState);
      const [menuVisible, setMenuVisible] = useState(false);

    // ── Clases disponibles ────────────────────────────────────────────────────
    const [clases, setClases] = useState([]);

    // ── Clase seleccionada en el dropdown ────────────────────────────────────
    const [claseSeleccionada, setClaseSeleccionada] = useState(null);
    const [dropdownVisible, setDropdownVisible] = useState(false);

    // ── Formulario Nuevo Vínculo ──────────────────────────────────────────────
    const [nombre,   setNombre]   = useState("");
    const [idEst,    setIdEst]    = useState("");
    const [celular,  setCelular]  = useState("");

    // ── Lista de estudiantes ──────────────────────────────────────────────────
    const [estudiantes, setEstudiantes] = useState([]);

    // ── Estado de carga ───────────────────────────────────────────────────────
    const [cargando, setCargando] = useState(false);

    // ── Refrescar lista ───────────────────────────────────────────────────────
    const refreshEstudiantes = useCallback(async (claseId) => {
        if (!claseId) return;
        try {
            const resultado = await obtenerEstudiantesAPI(claseId, usuario.token);
            if (resultado && resultado.ok) {
                const estudiantes = resultado.estudiantes || [];
                setEstudiantes([...estudiantes]);
            } else if (resultado && Array.isArray(resultado)) {
                // Fallback si API retorna directamente array
                setEstudiantes([...resultado]);
            }
        } catch (error) {
            console.error('Error al refrescar estudiantes:', error);
        }
    }, [usuario.token]);

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

    // ── useEffect para cargar clases al montar ─────────────────────────────────
    useEffect(() => {
        const cargarClases = async () => {
            try {
                const resultado = await obtenerClasesAPI(usuario.token);
                if (resultado && resultado.ok) {
                    const clases = resultado.clases || [];
                    setClases([...clases]);
                    if (clases.length > 0) {
                        setClaseSeleccionada(clases[0]);
                        await refreshEstudiantes(clases[0].id);
                    }
                } else if (resultado && Array.isArray(resultado)) {
                    setClases([...resultado]);
                    if (resultado.length > 0) {
                        setClaseSeleccionada(resultado[0]);
                        await refreshEstudiantes(resultado[0].id);
                    }
                }
            } catch (error) {
                console.error('Error al cargar clases:', error);
            }
        };
        cargarClases();
    }, [usuario.token, refreshEstudiantes]);

    // ── useEffect para actualizar cuando cambia la clase ─────────────────────
    useEffect(() => {
        if (claseSeleccionada?.id) {
            refreshEstudiantes(claseSeleccionada.id);
        }
    }, [claseSeleccionada?.id, refreshEstudiantes]);

    // ── Seleccionar clase desde el dropdown ───────────────────────────────────
    const handleSeleccionarClase = async (clase) => {
        setClaseSeleccionada(clase);
        setDropdownVisible(false);
        await refreshEstudiantes(clase.id);
    };

    // ── Vincular estudiante ───────────────────────────────────────────────────
    const handleVincular = async () => {
        if (!claseSeleccionada) {
        Alert.alert("Error", "Primero selecciona una clase.");
        return;
        }
        if (!nombre.trim() || !idEst.trim() || !celular.trim()) {
        Alert.alert("Error", "Todos los campos son obligatorios.");
        return;
        }

        setCargando(true);
        try {
            const resultado = await agregarEstudianteAPI(
                nombre.trim(),
                idEst.trim(),
                celular.trim(),
                claseSeleccionada.id,
                usuario.token
            );

            if (resultado && resultado.ok) {
                Alert.alert("✅ Éxito", resultado.mensaje || "Estudiante agregado correctamente");
                setNombre("");
                setIdEst("");
                setCelular("");
                await refreshEstudiantes(claseSeleccionada.id);
            } else {
                Alert.alert("❌ Error", resultado?.mensaje || "No se pudo agregar el estudiante");
            }
        } catch (error) {
            Alert.alert("❌ Error", error.message || "Error al agregar el estudiante");
        } finally {
            setCargando(false);
        }
    };

    // ── Eliminar estudiante ───────────────────────────────────────────────────
    const handleEliminar = (id, nombreEst) => {
        setStudentAEliminar({ id, nombre: nombreEst });
        setConfirmModalVisible(true);
    };

    // ✅ EJECUTAR ELIMINACIÓN DESPUÉS DE CONFIRMAR
    const ejecutarEliminacion = async () => {
        if (!studentAEliminar || !claseSeleccionada) return;

        const { id, nombre } = studentAEliminar;
        
        setCargando(true);
        try {
            const resultado = await eliminarEstudianteAPI(
                id,
                claseSeleccionada.id,
                usuario.token
            );

            if (resultado && resultado.ok) {
                setConfirmModalVisible(false);
                setStudentAEliminar(null);
                await refreshEstudiantes(claseSeleccionada.id);
                
                if (Platform.OS !== 'web') {
                    Alert.alert("✅ Eliminado", `${nombre} fue eliminado correctamente.`);
                }
            } else {
                Alert.alert("❌ Error", resultado?.mensaje || "No se pudo eliminar el estudiante");
            }
        } catch (error) {
            Alert.alert("❌ Error", error.message || "Error al eliminar el estudiante");
        } finally {
            setCargando(false);
        }
    };

    // ── Cancelar eliminación ───────────────────────────────────────────────────
    const cancelarEliminacion = () => {
        setConfirmModalVisible(false);
        setStudentAEliminar(null);
    };

    // ── ESTADOS PARA MODAL DE CONFIRMACIÓN DE ELIMINACIÓN ──────────────────────
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);
    const [studentAEliminar, setStudentAEliminar] = useState(null);

    // ── Navegación inferior ───────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState("students");

    // ✅ LIMPIAR ESTADO CUANDO EL COMPONENTE SE DESMONTA (ANDROID FIX)
    useEffect(() => {
        return () => {
            setMenuVisible(false);
            setDropdownVisible(false);
            setConfirmModalVisible(false);
            setStudentAEliminar(null);
            setNombre("");
            setIdEst("");
            setCelular("");
        };
    }, []);

    const handleTabPress = (tab) => {
        setActiveTab(tab);
        const route = ROUTES[tab];
        if (route && navigation) navigation.navigate(route);
    };

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER — ítem de estudiante
    // ─────────────────────────────────────────────────────────────────────────
    const renderEstudiante = ({ item }) => {
        const iniciales   = getIniciales(item.nombre);
        const avatarColor = getAvatarColor(item.id);

        return (
        <View style={styles.estCard}>
            {/* Avatar con iniciales */}
            <View style={[styles.avatar, { backgroundColor: avatarColor.bg }]}>
            <Text style={[styles.avatarInicial, { color: avatarColor.text }]}>
                {iniciales}
            </Text>
            </View>

            {/* Info */}
            <View style={styles.estInfo}>
            <Text style={styles.estNombre}>{item.nombre}</Text>
            <Text style={styles.estDetalle}>
                ID: {item.numero_identificacion || item.id} • {item.celular}
            </Text>
            </View>

            {/* Eliminar */}
            <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleEliminar(item.id, item.nombre)}
            activeOpacity={0.7}
            accessibilityLabel={`Eliminar ${item.nombre}`}
            >
            <Image source={trash} style={{ width: 20, height: 20   }} />
            </TouchableOpacity>
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
            keyboardShouldPersistTaps="handled"
        >
            {/* Títulos */}
            <Text style={styles.panelTitle}>Gestión de{"\n"}Estudiantes</Text>

            {/* ── SELECTOR DE CLASE ──────────────────────────────────────── */}
            <View style={styles.card}>
            <Text style={styles.inputLabel}>SELECCIONAR CLASE</Text>

            <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setDropdownVisible(true)}
                activeOpacity={0.8}
                accessibilityLabel="Seleccionar clase"
            >
                <Text style={styles.dropdownText}>
                {claseSeleccionada ? claseSeleccionada.nombre : "Sin clases creadas"}
                </Text>
                <Text style={styles.dropdownArrow}>⌄</Text>
            </TouchableOpacity>
            </View>

            {/* ── FORMULARIO NUEVO VÍNCULO ───────────────────────────────── */}
            <View style={styles.card}>
            <Text style={styles.cardTitleBlue}>Nuevo Vínculo</Text>

            <TextInput
                style={styles.inputUnderline}
                placeholder="Nombre del Estudiante"
                placeholderTextColor={COLORS.textMuted}
                value={nombre}
                onChangeText={setNombre}
                returnKeyType="next"
            />
            <TextInput
                style={styles.inputUnderline}
                placeholder="ID del Estudiante"
                placeholderTextColor={COLORS.textMuted}
                value={idEst}
                onChangeText={setIdEst}
                returnKeyType="next"
                keyboardType="default"
            />
            <TextInput
                style={styles.inputUnderline}
                placeholder="Número de Teléfono"
                placeholderTextColor={COLORS.textMuted}
                value={celular}
                onChangeText={setCelular}
                returnKeyType="done"
                keyboardType="phone-pad"
                onSubmitEditing={handleVincular}
            />

            <TouchableOpacity
                style={styles.btnVincular}
                onPress={handleVincular}
                activeOpacity={0.85}
                accessibilityLabel="Vincular estudiante"
            >
                <Text style={styles.btnVincularText}>VINCULAR ESTUDIANTE</Text>
            </TouchableOpacity>
            </View>

            {/* ── LISTA ESTUDIANTES VINCULADOS ───────────────────────────── */}
            <View style={styles.listHeader}>
            <Text style={styles.listTitle}>
                Estudiantes Vinculados
            </Text>
            <View style={styles.badge}>
                <Text style={styles.badgeText}>{estudiantes.length} Total</Text>
            </View>
            </View>

            {estudiantes.length === 0 ? (
            <View style={styles.emptyState}>
                <Image source={user} style={{ height: 60, width: 60, tintColor: COLORS.textMuted }} />
                <Text style={styles.emptyText}>
                {claseSeleccionada
                    ? "No hay estudiantes vinculados a esta clase."
                    : "Selecciona una clase para ver sus estudiantes."}
                </Text>
            </View>
            ) : (
            <View style={styles.estList}>
                <FlatList
                data={estudiantes}
                keyExtractor={(item) => item.id}
                renderItem={renderEstudiante}
                scrollEnabled={false}
                ItemSeparatorComponent={() => (
                    <View style={styles.separator} />
                )}
                />
            </View>
            )}

            <View style={{ height: 24 }} />
        </ScrollView>

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
                <Text style={styles.modalEmpty}>
                    No hay clases creadas aún.
                </Text>
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

        {/* ✅ MODAL DE CONFIRMACIÓN DE ELIMINACIÓN DE ESTUDIANTE */}
        <ConfirmDeleteStudentModal
            visible={confirmModalVisible}
            studentNombre={studentAEliminar?.nombre || ''}
            onConfirm={ejecutarEliminacion}
            onCancel={cancelarEliminacion}
        />
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
        paddingBottom: 180,
    },

    // Header
    // Títulos
    panelTitle: {
        fontSize: 28,
        fontWeight: "800",
        color: COLORS.text,
        marginBottom: 20,
        lineHeight: 34,
    },

    // Cards
    card: {
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
    cardTitleBlue: {
        fontSize: 17,
        fontWeight: "700",
        color: COLORS.accent,
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 10,
        fontWeight: "700",
        color: COLORS.textMuted,
        letterSpacing: 1.2,
        marginBottom: 8,
    },

    // Dropdown
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
    dropdownText: {
        fontSize: 15,
        color: COLORS.text,
        flex: 1,
    },
    dropdownArrow: {
        fontSize: 18,
        color: COLORS.textMuted,
        marginLeft: 8,
    },

    // Inputs underline (estilo del diseño)
    inputUnderline: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingVertical: 12,
        fontSize: 15,
        color: COLORS.text,
        marginBottom: 4,
    },

    // Botón vincular
    btnVincular: {
        backgroundColor: COLORS.primary,
        borderRadius: 10,
        paddingVertical: 15,
        alignItems: "center",
        marginTop: 22,
    },
    btnVincularText: {
        color: COLORS.white,
        fontWeight: "700",
        fontSize: 13,
        letterSpacing: 1.2,
    },

    // Lista header
    listHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    listTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: COLORS.text,
    },
    badge: {
        backgroundColor: COLORS.iconBg,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: "700",
        color: COLORS.accent,
        letterSpacing: 0.6,
    },

    // Lista de estudiantes
    estList: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 4,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
        marginBottom: 12,
    },
    estCard: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
    },
    separator: {
        height: 1,
        backgroundColor: COLORS.navBorder,
    },

    // Avatar
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    avatarInicial: {
        fontSize: 15,
        fontWeight: "700",
    },

    // Info estudiante
    estInfo: { flex: 1 },
    estNombre: {
        fontSize: 14,
        fontWeight: "700",
        color: COLORS.text,
        marginBottom: 2,
    },
    estDetalle: {
        fontSize: 12,
        color: COLORS.textMuted,
        lineHeight: 16,
    },

    // Empty state
    emptyState: {
        alignItems: "center",
        paddingVertical: 36,
        backgroundColor: COLORS.card,
        borderRadius: 12,
        marginBottom: 12,
    },
    emptyIcon: { fontSize: 40, marginBottom: 12 },
    emptyText: {
        fontSize: 13,
        color: COLORS.textMuted,
        textAlign: "center",
        paddingHorizontal: 20,
    },

    // Modal dropdown
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 20,
        width: "100%",
        maxHeight: "60%",
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: COLORS.text,
        marginBottom: 14,
    },
    modalEmpty: {
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: "center",
        paddingVertical: 20,
    },
    modalOption: {
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginBottom: 4,
    },
    modalOptionActive: {
        backgroundColor: COLORS.iconBg,
    },
    modalOptionText: {
        fontSize: 15,
        color: COLORS.text,
        fontWeight: "600",
    },
    modalOptionTextActive: {
        color: COLORS.primary,
    },
    modalOptionHora: {
        fontSize: 11,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    });
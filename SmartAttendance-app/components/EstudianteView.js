    /**
     * EstudianteView.js
     * Gestión de Estudiantes — SmartAttendance
     *
     * Funcionalidades:
     *  - Seleccionar clase (dropdown)
     *  - Vincular nuevo estudiante (nombre, ID, teléfono)
     *  - Listar estudiantes vinculados a la clase seleccionada
     *  - Ver todos los estudiantes
     *
     * Conexión al backend:
     *  - obtenerClases            → lista de clases para el selector
     *  - agregarEstudiante        → vincular estudiante a clase
     *  - obtenerEstudiantesPorClase → lista de estudiantes de la clase
     *  - obtenerTodosEstudiantes  → para "Ver todos los estudiantes"
     *  - borrarEstudiante         → eliminar estudiante
     *  - editarEstudiante         → editar estudiante
     */

    import React, { useState, useCallback } from "react";
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
    } from "react-native";

    import {
    obtenerClases,
    agregarEstudiante,
    obtenerEstudiantesPorClase,
    obtenerTodosEstudiantes,
    borrarEstudiante,
    } from "../controllers/asistenciaController";

    // ─── Paleta de colores (igual que ProfesorView) ───────────────────────────────
    const COLORS = {
    primary:      "#1A3A6B",
    primaryLight: "#2454A0",
    accent:       "#3B82F6",
    background:   "#F0F4FA",
    card:         "#FFFFFF",
    inputBg:      "#F5F7FC",
    iconBg:       "#DDE8F8",
    text:         "#1A2B4A",
    textMuted:    "#6B7A99",
    border:       "#D8E2F0",
    white:        "#FFFFFF",
    navBorder:    "#E2E8F0",
    error:        "#EF4444",
    };

    // Colores para los avatares de iniciales (igual al diseño)
    const AVATAR_COLORS = [
    { bg: "#DDE8F8", text: "#1A3A6B" },   // azul claro
    { bg: "#FDE8E8", text: "#9B1C1C" },   // rojo claro
    { bg: "#E8F0FD", text: "#1E40AF" },   // azul suave
    { bg: "#FEF3C7", text: "#92400E" },   // amarillo
    { bg: "#D1FAE5", text: "#065F46" },   // verde
    { bg: "#EDE9FE", text: "#5B21B6" },   // morado
    ];

    /** Obtiene las iniciales de un nombre */
    function getIniciales(nombre = "") {
    const partes = nombre.trim().split(" ").filter(Boolean);
    if (partes.length === 0) return "?";
    if (partes.length === 1) return partes[0][0].toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
    }

    /** Elige un color de avatar determinista según el ID */
    function getAvatarColor(id = "") {
    const sum = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return AVATAR_COLORS[sum % AVATAR_COLORS.length];
    }

    // ─── Tabs de navegación (igual que ProfesorView) ──────────────────────────────
    const NAV_TABS = [
    { id: "classes",  label: "CLASSES",  icon: "❏" },
    { id: "students", label: "STUDENTS", icon: "👥" },
    { id: "qrscan",   label: "QR SCAN",  icon: "⊞"  },
    { id: "manual",   label: "MANUAL",   icon: "📋" },
    { id: "export",   label: "EXPORT",   icon: "↑"  },
    ];

    const ROUTES = {
    classes:  "ProfesorView",
    students: null,           // vista actual
    qrscan:   "QRView",
    manual:   "ManualView",
    export:   "ExportView",
    };

    // ─── Componente principal ─────────────────────────────────────────────────────
    export default function EstudianteView({ navigation }) {

    // ── Clases disponibles ────────────────────────────────────────────────────
    const [clases, setClases] = useState(() => obtenerClases());

    // ── Clase seleccionada en el dropdown ────────────────────────────────────
    const [claseSeleccionada, setClaseSeleccionada] = useState(
        () => obtenerClases()[0] || null
    );
    const [dropdownVisible, setDropdownVisible] = useState(false);

    // ── Formulario Nuevo Vínculo ──────────────────────────────────────────────
    const [nombre,   setNombre]   = useState("");
    const [idEst,    setIdEst]    = useState("");
    const [celular,  setCelular]  = useState("");

    // ── Lista de estudiantes ──────────────────────────────────────────────────
    const [verTodos, setVerTodos] = useState(false);
    const [estudiantes, setEstudiantes] = useState(() =>
        claseSeleccionada
        ? obtenerEstudiantesPorClase(claseSeleccionada.id)
        : []
    );

    // ── Refrescar lista ───────────────────────────────────────────────────────
    const refreshEstudiantes = useCallback((claseId) => {
        if (verTodos) {
        setEstudiantes([...obtenerTodosEstudiantes()]);
        } else {
        setEstudiantes(claseId
            ? [...obtenerEstudiantesPorClase(claseId)]
            : []
        );
        }
    }, [verTodos]);

    // ── Seleccionar clase desde el dropdown ───────────────────────────────────
    const handleSeleccionarClase = (clase) => {
        setClaseSeleccionada(clase);
        setDropdownVisible(false);
        setVerTodos(false);
        setEstudiantes([...obtenerEstudiantesPorClase(clase.id)]);
    };

    // ── Vincular estudiante ───────────────────────────────────────────────────
    const handleVincular = () => {
        if (!claseSeleccionada) {
        Alert.alert("Error", "Primero selecciona una clase.");
        return;
        }
        if (!nombre.trim() || !idEst.trim() || !celular.trim()) {
        Alert.alert("Error", "Todos los campos son obligatorios.");
        return;
        }

        const resultado = agregarEstudiante({
        id:      idEst.trim(),
        nombre:  nombre.trim(),
        celular: celular.trim(),
        claseId: claseSeleccionada.id,
        });

        if (resultado.ok) {
        Alert.alert("✅ Éxito", resultado.mensaje);
        setNombre("");
        setIdEst("");
        setCelular("");
        refreshEstudiantes(claseSeleccionada.id);
        } else {
        Alert.alert("Error", resultado.mensaje);
        }
    };

    // ── Eliminar estudiante ───────────────────────────────────────────────────
    const handleEliminar = (id, nombreEst) => {
        Alert.alert(
        "Eliminar estudiante",
        `¿Seguro que deseas eliminar a "${nombreEst}"?`,
        [
            { text: "Cancelar", style: "cancel" },
            {
            text: "Eliminar",
            style: "destructive",
            onPress: () => {
                const res = borrarEstudiante(id);
                if (res.ok) {
                refreshEstudiantes(claseSeleccionada?.id);
                } else {
                Alert.alert("Error", res.mensaje);
                }
            },
            },
        ]
        );
    };

    // ── Ver todos / filtrar por clase ─────────────────────────────────────────
    const handleVerTodos = () => {
        setVerTodos(true);
        setEstudiantes([...obtenerTodosEstudiantes()]);
    };

    // ── Navegación inferior ───────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState("students");

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
                ID: {item.id} • {item.celular}
            </Text>
            </View>

            {/* Eliminar */}
            <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleEliminar(item.id, item.nombre)}
            activeOpacity={0.7}
            accessibilityLabel={`Eliminar ${item.nombre}`}
            >
            <Text style={styles.actionIcon}>🗑️</Text>
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
            keyboardShouldPersistTaps="handled"
        >
            {/* Títulos */}
            <Text style={styles.labelAdmin}>ADMINISTRACIÓN</Text>
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
                <Text style={styles.btnVincularText}>VINCULAR ESTUDIANTE  🔗</Text>
            </TouchableOpacity>
            </View>

            {/* ── LISTA ESTUDIANTES VINCULADOS ───────────────────────────── */}
            <View style={styles.listHeader}>
            <Text style={styles.listTitle}>
                {verTodos ? "Todos los Estudiantes" : "Estudiantes Vinculados"}
            </Text>
            <View style={styles.badge}>
                <Text style={styles.badgeText}>{estudiantes.length} Total</Text>
            </View>
            </View>

            {estudiantes.length === 0 ? (
            <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>👥</Text>
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

            {/* Link "Ver todos los estudiantes" */}
            {!verTodos && (
            <TouchableOpacity
                style={styles.verTodosBtn}
                onPress={handleVerTodos}
                activeOpacity={0.7}
            >
                <Text style={styles.verTodosText}>Ver todos los estudiantes</Text>
            </TouchableOpacity>
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
    menuBtn: { padding: 4 },
    menuIcon: { fontSize: 20, color: COLORS.primary },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: COLORS.primary,
        letterSpacing: 0.3,
    },
    avatarWrap: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: COLORS.primary,
        alignItems: "center", justifyContent: "center",
    },
    avatarWrapText: { fontSize: 20 },

    // Títulos
    labelAdmin: {
        fontSize: 10,
        fontWeight: "700",
        color: COLORS.accent,
        letterSpacing: 1.5,
        marginBottom: 4,
    },
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

    // Botón eliminar
    actionBtn: {
        padding: 6,
        borderRadius: 8,
        backgroundColor: COLORS.inputBg,
    },
    actionIcon: { fontSize: 15 },

    // Ver todos
    verTodosBtn: {
        alignItems: "center",
        paddingVertical: 14,
    },
    verTodosText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.accent,
    },

    // Empty state
    emptyState: {
        alignItems: "center",
        paddingVertical: 36,
        backgroundColor: COLORS.card,
        borderRadius: 12,
        marginBottom: 12,
    },
    emptyIcon: { fontSize: 36, marginBottom: 10 },
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

    // Bottom nav
    navBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.navBorder,
        paddingTop: 8,
        paddingBottom: Platform.OS === "ios" ? 20 : 10,
        paddingHorizontal: 4,
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
    navIconActive: { color: COLORS.primary },
    navLabel: {
        fontSize: 9,
        fontWeight: "600",
        color: COLORS.textMuted,
        letterSpacing: 0.6,
    },
    navLabelActive: { color: COLORS.primary },
    });
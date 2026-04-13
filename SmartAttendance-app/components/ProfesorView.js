/**
 * ProfesorView.js
 * Panel del Profesor — SmartAttendance
 * 
 * ✅ Compatible con: iOS, Android, Web, Emulador, PC
 */

import React, { useState, useCallback, useMemo } from "react";
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

import calendario from "../assets/icons/calendario.png";
import clock from "../assets/icons/clock.png";

import {
  crearClase,
  editarClase,
  borrarClase,
  obtenerClases,
} from "../controllers/asistenciaController";

const ICONS = {
  qrscan:    "⊞",
  manual:    "📋",
  export:    "↑",
  edit:      "✏️",
  trash:     "🗑️",
  clock:     "🕐",
  code:      ">_",
  web:       "🌐",
  ai:        "🤖",
  default:   "📘",
  avatar:    "👤",
  arrow:     "→",
};

function getClaseIcon(nombre = "") {
  const n = nombre.toLowerCase();
  if (n.includes("web") || n.includes("html") || n.includes("css")) return ICONS.web;
  if (n.includes("ia") || n.includes("inteligencia") || n.includes("artificial")) return ICONS.ai;
  if (n.includes("dato") || n.includes("estructura") || n.includes("algoritm")) return ICONS.code;
  return ICONS.default;
}

const COLORS = {
  primary:     "#1A3A6B",
  primaryLight:"#2454A0",
  accent:      "#3B82F6",
  background:  "#F0F4FA",
  card:        "#FFFFFF",
  cardAlt:     "#EEF2FA",
  iconBg:      "#DDE8F8",
  text:        "#1A2B4A",
  textMuted:   "#6B7A99",
  border:      "#D8E2F0",
  error:       "#EF4444",
  success:     "#22C55E",
  white:       "#FFFFFF",
  navBorder:   "#E2E8F0",
  inputBg:     "#F5F7FC",
};

// ✅ COMPONENTE TIME PICKER CUSTOM - Funciona en Web, Android, iOS
function TimePickerModal({ visible, onSelect, onCancel, initialValue, title }) {
  const [selectedHour, setSelectedHour] = useState('08');
  const [selectedMinute, setSelectedMinute] = useState('00');
  
  // Refs para scroll automático a la selección
  const hourScrollRef = React.useRef(null);
  const minuteScrollRef = React.useRef(null);

  React.useEffect(() => {
    if (visible && initialValue) {
      const [h, m] = initialValue.split(':');
      setSelectedHour(h || '08');
      setSelectedMinute(m || '00');
    } else if (visible) {
      setSelectedHour('08');
      setSelectedMinute('00');
    }
  }, [visible, initialValue]);

  // Scroll automático a la selección cuando se abre
  React.useEffect(() => {
    if (visible) {
      const hourIndex = hours.indexOf(selectedHour);
      const minuteIndex = minutes.indexOf(selectedMinute);
      
      // Pequeño delay para asegurar que el layout esté listo
      setTimeout(() => {
        hourScrollRef.current?.scrollTo({ y: hourIndex * 44, animated: false });
        minuteScrollRef.current?.scrollTo({ y: minuteIndex * 44, animated: false });
      }, 100);
    }
  }, [visible]);

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

  const handleConfirm = () => {
    onSelect(`${selectedHour}:${selectedMinute}`);
  };

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={pickerStyles.overlay}>
        <View style={pickerStyles.container}>
          <Text style={pickerStyles.title}>{title || 'Seleccionar Hora'}</Text>
          
          <View style={pickerStyles.pickerRow}>
            {/* Horas */}
            <View style={pickerStyles.column}>
              <Text style={pickerStyles.columnLabel}>Hora</Text>
              <ScrollView 
                ref={hourScrollRef}
                style={pickerStyles.scrollColumn} 
                contentContainerStyle={pickerStyles.scrollContent}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {hours.map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[
                      pickerStyles.timeOption,
                      selectedHour === h && pickerStyles.timeOptionSelected
                    ]}
                    onPress={() => setSelectedHour(h)}
                  >
                    <Text style={[
                      pickerStyles.timeText,
                      selectedHour === h && pickerStyles.timeTextSelected
                    ]}>
                      {h}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text style={pickerStyles.separator}>:</Text>

            {/* Minutos */}
            <View style={pickerStyles.column}>
              <Text style={pickerStyles.columnLabel}>Min</Text>
              <ScrollView 
                ref={minuteScrollRef}
                style={pickerStyles.scrollColumn} 
                contentContainerStyle={pickerStyles.scrollContent}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {minutes.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      pickerStyles.timeOption,
                      selectedMinute === m && pickerStyles.timeOptionSelected
                    ]}
                    onPress={() => setSelectedMinute(m)}
                  >
                    <Text style={[
                      pickerStyles.timeText,
                      selectedMinute === m && pickerStyles.timeTextSelected
                    ]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={pickerStyles.buttonsRow}>
            <TouchableOpacity style={pickerStyles.btnCancel} onPress={onCancel}>
              <Text style={pickerStyles.btnCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={pickerStyles.btnConfirm} onPress={handleConfirm}>
              <Text style={pickerStyles.btnConfirmText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'stretch',
    marginBottom: 20,
    height: 220,
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  columnLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scrollColumn: {
    width: '100%',
    height: 180,
  },
  scrollContent: {
    paddingVertical: 10,
  },
  separator: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginHorizontal: 10,
    alignSelf: 'center',
    paddingTop: 20,
  },
  timeOption: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  timeOptionSelected: {
    backgroundColor: COLORS.accent,
  },
  timeText: {
    fontSize: 20,
    color: COLORS.text,
    fontWeight: '500',
  },
  timeTextSelected: {
    color: COLORS.white,
    fontWeight: '700',
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
  },
  btnCancelText: {
    color: COLORS.textMuted,
    fontWeight: '600',
    fontSize: 14,
  },
  btnConfirm: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  btnConfirmText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
});

// ✅ MODAL DE CONFIRMACIÓN PERSONALIZADA PARA ELIMINAR CLASE
function ConfirmDeleteModal({ visible, claseNombre, onConfirm, onCancel }) {
  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={confirmStyles.overlay}>
        <View style={confirmStyles.container}>
          <View style={confirmStyles.iconContainer}>
            <Text style={confirmStyles.icon}>🗑️</Text>
          </View>
          
          <Text style={confirmStyles.title}>Eliminar clase</Text>
          <Text style={confirmStyles.message}>
            ¿Seguro que deseas eliminar{"\n"}
            <Text style={confirmStyles.claseNombre}>"{claseNombre}"</Text>?
          </Text>
          <Text style={confirmStyles.warning}>
            Esta acción no se puede deshacer.
          </Text>

          <View style={confirmStyles.buttonsRow}>
            <TouchableOpacity style={confirmStyles.btnCancel} onPress={onCancel}>
              <Text style={confirmStyles.btnCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={confirmStyles.btnConfirm} onPress={onConfirm}>
              <Text style={confirmStyles.btnConfirmText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const confirmStyles = StyleSheet.create({
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
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 28,
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
  claseNombre: {
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

// ─── Componente principal ────────────────────────────────────────────────────
export default function ProfesorView({ navigation }) {
  // Estados unificados de formulario
  const [formData, setFormData] = useState({
    nombre: "",
    horaInicio: "",
    horaFin: "",
  });

  const [editandoId, setEditandoId] = useState(null);

  // Lista de clases
  const [clasesList, setClasesList] = useState(() => {
    const clasesIniciales = obtenerClases();
    console.log('📋 Clases iniciales cargadas:', clasesIniciales.length);
    return [...clasesIniciales];
  });

  // Estados para el picker custom
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState('inicio');
  const [pickerEditMode, setPickerEditMode] = useState(false);
  const [pickerTitle, setPickerTitle] = useState('Seleccionar Hora');

  // ✅ ESTADOS PARA MODAL DE CONFIRMACIÓN DE ELIMINACIÓN
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [claseAEliminar, setClaseAEliminar] = useState(null);

  // Refrescar lista
  const refreshClases = useCallback(() => {
    const clasesActualizadas = obtenerClases();
    console.log('🔄 Refrescando clases:', clasesActualizadas.length);
    setClasesList([...clasesActualizadas]);
  }, []);

  // Abrir picker (unificado)
  const abrirPicker = useCallback((modo, isEdit = false) => {
    setPickerMode(modo);
    setPickerEditMode(isEdit);
    setPickerTitle(modo === 'inicio' ? 'Hora de Inicio' : 'Hora de Fin');
    setPickerVisible(true);
  }, []);

  // Manejar selección de hora (simplificado)
  const handleTimeSelect = useCallback((hora) => {
    setFormData(prev => ({
      ...prev,
      [pickerMode === 'inicio' ? 'horaInicio' : 'horaFin']: hora
    }));
    setPickerVisible(false);
  }, [pickerMode]);

  // Crear clase
  const handleCrearClase = useCallback(() => {
    if (!formData.nombre.trim()) {
      Alert.alert("Error", "El nombre de la clase no puede estar vacío.");
      return;
    }
    if (!formData.horaInicio || !formData.horaFin) {
      Alert.alert("Error", "Debes seleccionar hora de inicio y fin.");
      return;
    }

    const resultado = crearClase({ 
      nombre: formData.nombre.trim(), 
      horaInicio: formData.horaInicio, 
      horaFin: formData.horaFin 
    });

    if (resultado.ok) {
      Alert.alert("✅ Éxito", resultado.mensaje);
      setFormData({ nombre: "", horaInicio: "", horaFin: "" });
      refreshClases();
    } else {
      Alert.alert("Error", resultado.mensaje);
    }
  }, [formData, refreshClases]);

  // Iniciar edición
  const handleIniciarEdicion = useCallback((clase) => {
    setEditandoId(clase.id);
    setFormData({
      nombre: clase.nombre,
      horaInicio: clase.horaInicio,
      horaFin: clase.horaFin,
    });
  }, []);

  // Guardar edición
  const handleGuardarEdicion = useCallback(() => {
    const resultado = editarClase({
      id: editandoId,
      nombre: formData.nombre.trim(),
      horaInicio: formData.horaInicio,
      horaFin: formData.horaFin,
    });

    if (resultado.ok) {
      Alert.alert("✅ Actualizado", resultado.mensaje);
      setEditandoId(null);
      refreshClases();
    } else {
      Alert.alert("Error", resultado.mensaje);
    }
  }, [editandoId, formData, refreshClases]);

  // Cancelar edición
  const handleCancelarEdicion = useCallback(() => {
    setEditandoId(null);
  }, []);

  // ✅ ELIMINAR CLASE - VERSIÓN OPTIMIZADA
  const handleEliminarClase = useCallback((id, nombreClase) => {
    setClaseAEliminar({ id, nombre: nombreClase });
    setConfirmModalVisible(true);
  }, []);

  // ✅ EJECUTAR ELIMINACIÓN DESPUÉS DE CONFIRMAR
  const ejecutarEliminacion = useCallback(() => {
    if (!claseAEliminar) return;

    const { id, nombre } = claseAEliminar;
    const resultado = borrarClase(id);

    if (resultado.ok) {
      setClasesList([...obtenerClases()]);
      setConfirmModalVisible(false);
      setClaseAEliminar(null);
      
      if (Platform.OS !== 'web') {
        Alert.alert("✅ Eliminado", `La clase "${nombre}" fue eliminada.`);
      }
    } else {
      Alert.alert("Error", resultado.mensaje || "No se pudo eliminar la clase");
    }
  }, [claseAEliminar]);

  // Cancelar eliminación
  const cancelarEliminacion = useCallback(() => {
    setConfirmModalVisible(false);
    setClaseAEliminar(null);
  }, []);

  // Render ítem de clase (MEMOIZADO)
  const renderClaseItem = useMemo(() => {
    return ({ item }) => {
      const isEditing = editandoId === item.id;

      return (
        <View style={styles.claseCard}>
        {isEditing ? (
          <View style={styles.editContainer}>
            <Text style={styles.editLabel}>Nombre</Text>
            <TextInput
              style={styles.editInput}
              value={formData.nombre}
              onChangeText={(text) => setFormData(prev => ({ ...prev, nombre: text }))}
              placeholder="Nombre de la clase"
              placeholderTextColor={COLORS.textMuted}
            />
            
            <Text style={styles.editLabel}>Hora de inicio</Text>
            <TouchableOpacity 
              style={styles.timeInputRow}
              onPress={() => abrirPicker('inicio', true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.timeText, !formData.horaInicio && styles.timeTextPlaceholder]}>
                {formData.horaInicio || "Seleccionar hora"}
              </Text>
              <Text style={styles.timeIcon}>🕐</Text>
            </TouchableOpacity>

            <Text style={styles.editLabel}>Hora de fin</Text>
            <TouchableOpacity 
              style={styles.timeInputRow}
              onPress={() => abrirPicker('fin', true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.timeText, !formData.horaFin && styles.timeTextPlaceholder]}>
                {formData.horaFin || "Seleccionar hora"}
              </Text>
              <Text style={styles.timeIcon}>🕐</Text>
            </TouchableOpacity>

            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.editBtn, styles.editBtnSave]}
                onPress={handleGuardarEdicion}
                activeOpacity={0.8}
              >
                <Text style={styles.editBtnSaveText}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editBtn, styles.editBtnCancel]}
                onPress={handleCancelarEdicion}
                activeOpacity={0.8}
              >
                <Text style={styles.editBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.claseRow}>
            <View style={styles.claseIconWrap}>
              <Text style={styles.claseIconText}>
                {getClaseIcon(item.nombre)}
              </Text>
            </View>

            <View style={styles.claseInfo}>
              <Text style={styles.claseNombre}>{item.nombre}</Text>
              <View style={styles.claseHorario}>
                <Text style={styles.claseClockIcon}>🕐</Text>
                <Text style={styles.claseHorarioText}>
                  {item.horaInicio} — {item.horaFin}
                </Text>
              </View>
            </View>

            <View style={styles.claseActions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleIniciarEdicion(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.actionIcon}>✏️</Text>
              </TouchableOpacity>
              
              {/* ✅ BOTÓN ELIMINAR CON DEBUG Y HIT AREA AMPLIADA */}
              <TouchableOpacity
                style={[styles.actionBtn, styles.deleteBtn]}
                onPress={() => handleEliminarClase(item.id, item.nombre)}
                activeOpacity={0.6}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={[styles.actionIcon, styles.deleteIcon]}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
      );
    };
  }, [handleEliminarClase, handleIniciarEdicion, abrirPicker, editandoId, formData]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={COLORS.white} barStyle="dark-content" />

      {/* Header fijo */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SmartAttendance</Text>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.panelTitle}>Panel del profesor</Text>
        <Text style={styles.panelSubtitle}>
          Gestione sus clases y horarios académicos con precisión.
        </Text>

        {/* Formulario Nueva Clase */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Nueva Clase</Text>

          <Text style={styles.inputLabel}>NOMBRE DE CLASE</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Introducción a la Algoritmia"
            placeholderTextColor={COLORS.textMuted}
            value={formData.nombre}
            onChangeText={(text) => setFormData(prev => ({ ...prev, nombre: text }))}
          />

          <Text style={styles.inputLabel}>HORA DE INICIO</Text>
          <TouchableOpacity 
            style={styles.timeInputRow}
            onPress={() => abrirPicker('inicio', false)}
            activeOpacity={0.7}
          >
            <Text style={[styles.timeText, !formData.horaInicio && styles.timeTextPlaceholder]}>
              {formData.horaInicio || "Seleccionar hora"}
            </Text>
            <Image source={clock} style={{ height: 20, width: 20 }} />
          </TouchableOpacity>

          <Text style={styles.inputLabel}>HORA DE FINALIZACIÓN</Text>
          <TouchableOpacity 
            style={styles.timeInputRow}
            onPress={() => abrirPicker('fin', false)}
            activeOpacity={0.7}
          >
            <Text style={[styles.timeText, !formData.horaFin && styles.timeTextPlaceholder]}>
              {formData.horaFin || "Seleccionar hora"}
            </Text>
            <Image source={calendario} style={{ height: 30, width: 30 }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnCrear}
            onPress={handleCrearClase}
            activeOpacity={0.85}
          >
            <Text style={styles.btnCrearText}>CREAR CLASE  →</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de Clases */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Clases Creadas</Text>
          <View style={styles.badgeActivas}>
            <Text style={styles.badgeText}>{clasesList.length} ACTIVAS</Text>
          </View>
        </View>

        {clasesList.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>
              Aún no has creado ninguna clase.
            </Text>
          </View>
        ) : (
          <FlatList
            data={clasesList}
            keyExtractor={(item) => item.id}
            renderItem={renderClaseItem}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            extraData={[clasesList.length, editandoId]}
          />
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Time Picker Modal */}
      <TimePickerModal
        visible={pickerVisible}
        onSelect={handleTimeSelect}
        onCancel={() => setPickerVisible(false)}
        initialValue={pickerMode === 'inicio' ? formData.horaInicio : formData.horaFin}
        title={pickerTitle}
      />

      {/* ✅ MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <ConfirmDeleteModal
        visible={confirmModalVisible}
        claseNombre={claseAEliminar?.nombre || ''}
        onConfirm={ejecutarEliminacion}
        onCancel={cancelarEliminacion}
      />
    </SafeAreaView>
  );
}

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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 20 },

  panelTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 4,
  },
  panelSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 20,
    lineHeight: 20,
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 18,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  timeInputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
  },
  timeText: {
    fontSize: 15,
    color: COLORS.text,
    flex: 1,
  },
  timeTextPlaceholder: {
    color: COLORS.textMuted,
  },

  btnCrear: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 22,
  },
  btnCrearText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 1.5,
  },

  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  badgeActivas: {
    backgroundColor: COLORS.iconBg,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.accent,
    letterSpacing: 0.8,
  },

  claseCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  claseRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  claseIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: COLORS.iconBg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  claseIconText: { fontSize: 20 },
  claseInfo: {
    flex: 1,
    marginRight: 8,
  },
  claseNombre: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 3,
  },
  claseHorario: {
    flexDirection: "row",
    alignItems: "center",
  },
  claseClockIcon: {
    fontSize: 12,
    marginRight: 3,
  },
  claseHorarioText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  claseActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.inputBg,
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    backgroundColor: '#FEE2E2', // Fondo rojo claro para destacar
  },
  actionIcon: { 
    fontSize: 18,
  },
  deleteIcon: {
    // Emoji de basura ya es rojo por defecto
  },

  editContainer: { paddingVertical: 4 },
  editLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginTop: 10,
    marginBottom: 4,
  },
  editInput: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 14,
  },
  editBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
  },
  editBtnSave: { backgroundColor: COLORS.primary },
  editBtnSaveText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 13,
  },
  editBtnCancel: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  editBtnCancelText: {
    color: COLORS.textMuted,
    fontWeight: "600",
    fontSize: 13,
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: "center",
  },

  navLabelActive: { color: COLORS.primary },
});
// HistorialViewStudent.js
// Muestra el historial de todas las asistencias registradas del estudiante
// Cada registro muestra el nombre de la clase, fecha y hora
// El historial está ordenado de lo más reciente a lo más antiguo

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image
} from "react-native";

import planning from "../assets/icons/planning.png";

// Importamos la función API para obtener el historial del servidor
import { obtenerHistorialEstudianteAPI } from "../services/api";

import { Header, COLORS } from "../theme";

// Función auxiliar para convertir fechas de formato YYYY-MM-DD a un formato más legible
// Por ejemplo: "2025-04-14" se convierte a "14 ABR, 2025"
function formatearFecha(fechaStr = "") {
  try {
    const [y, m, d] = fechaStr.split("-").map(Number);
    const meses = ["ENE","FEB","MAR","ABR","MAY","JUN",
                   "JUL","AGO","SEP","OCT","NOV","DIC"];
    return `${d} ${meses[m - 1]}, ${y}`;
  } catch {
    return fechaStr;
  }
}

export default function HistorialView({ usuario, menuVisible, setMenuVisible, onLogout, onSettings }) {
  // Guardamos el historial de asistencias
  const [historial, setHistorial]   = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Cargar historial del estudiante desde el servidor cuando se monta el componente
  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        setCargando(true);
        setError(null);
        // Obtener todas las asistencias registradas del estudiante desde el backend
        const resultado = await obtenerHistorialEstudianteAPI(usuario.token);
        
        if (resultado.ok) {
          // El backend retorna los datos en la propiedad 'historial'
          const datos = resultado.historial || [];
          setHistorial(Array.isArray(datos) ? datos : []);
        } else {
          setError(resultado.mensaje || 'Error al cargar el historial');
          setHistorial([]);
        }
      } catch (err) {
        console.error('Error cargando historial:', err);
        setError('Error al conectar con el servidor');
        setHistorial([]);
      } finally {
        setCargando(false);
      }
    };

    if (usuario?.token) {
      cargarHistorial();
    }
  }, [usuario?.token]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={COLORS.white} barStyle="dark-content" />

      <Header 
        menuVisible={menuVisible} 
        setMenuVisible={setMenuVisible} 
        onLogout={onLogout}
        onSettings={onSettings}
      />

      {/* ── CONTENIDO ───────────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.titulo}>Tus Asistencias</Text>
        <Text style={styles.subtitulo}>
          Revisa el registro detallado de tu asistencia semestral.
        </Text>

        {cargando ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Cargando asistencias...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <Text style={{ ...styles.emptyText, color: COLORS.red || '#DC2626' }}>
              {error}
            </Text>
          </View>
        ) : historial.length === 0 ? (
          <View style={styles.emptyState}>
            <Image source={planning} style={{ width: 100, height: 100, tintColor: COLORS.textMuted }} />
            <Text style={styles.emptyText}>
              Aún no tienes asistencias registradas.
            </Text>
          </View>
        ) : (
          <FlatList
            data={historial}
            keyExtractor={(item, index) => `${item.id || item.claseId}-${item.fecha}-${index}`}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.cardFecha}>
                  {formatearFecha(item.fecha)}
                </Text>
                <Text style={styles.cardClase}>{item.claseNombre || 'Clase sin nombre'}</Text>
                <Text style={styles.cardDetalle}>
                  {item.tipo === "manual" ? "Registro manual" : "Escaneo QR"} •{" "}
                  {item.hora}
                </Text>
              </View>
            )}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  scroll:   { flex: 1, backgroundColor: COLORS.background },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
  },

  // Menú estilos removidos - ahora centralizado en App.js

  // Contenido
  titulo: {
    fontSize: 28, fontWeight: "800",
    color: COLORS.primary, marginBottom: 6,
  },
  subtitulo: {
    fontSize: 14, color: COLORS.textMuted,
    lineHeight: 20, marginBottom: 20,
  },

  card: {
    backgroundColor: COLORS.card, borderRadius: 14,
    padding: 18,
    shadowColor: "#000", shadowOpacity: 0.04,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardFecha: {
    fontSize: 11, fontWeight: "700",
    color: COLORS.accent, letterSpacing: 0.8, marginBottom: 4,
  },
  cardClase: {
    fontSize: 18, fontWeight: "700",
    color: COLORS.text, marginBottom: 4,
  },
  cardDetalle: { fontSize: 13, color: COLORS.textMuted },

  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyText:  {
    fontSize: 14, color: COLORS.textMuted, textAlign: "center",
  },
});
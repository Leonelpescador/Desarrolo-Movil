import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';

// URLs de la API
const API_MANUALES = "https://gestiones.cenesa.com.ar:88/api/manual/?format=json";
const API_VIDEOS = "https://gestiones.cenesa.com.ar:88/api/seccionvideo/?format=json";
const API_PERFIL = "https://gestiones.cenesa.com.ar:88/api/perfil_usuario/?format=json";

export default function Manual() {
  const navigation = useNavigation();
  const [manuales, setManuales] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tipoUsuario, setTipoUsuario] = useState(null); // Guarda el tipo de usuario

  // 🔹 Obtener el tipo de usuario
  const fetchUserType = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error("No hay token almacenado");

      const response = await fetch(API_PERFIL, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      const data = await response.json();
      setTipoUsuario(data.tipo_usuario); // Asegúrate de que esto coincida con el campo correcto
    } catch (error) {
      console.error("Error obteniendo el tipo de usuario:", error);
    }
  };

  // 🔹 Obtener datos de manuales y videos
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error("No hay token almacenado");

      const [responseManuales, responseVideos] = await Promise.all([
        fetch(API_MANUALES, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(API_VIDEOS, { headers: { "Authorization": `Bearer ${token}` } })
      ]);

      const dataManuales = await responseManuales.json();
      const dataVideos = await responseVideos.json();

      setManuales(Array.isArray(dataManuales) ? dataManuales : []);
      setVideos(Array.isArray(dataVideos) ? dataVideos : []);
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los datos.");
      console.error("Error en fetchData:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserType();
    fetchData();
  }, []);

  // 🔹 Función para eliminar manual
  const eliminarManual = async (id) => {
    Alert.alert("Confirmación", "¿Estás seguro de eliminar este manual?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            await fetch(`${API_MANUALES}${id}/`, {
              method: 'DELETE',
              headers: { "Authorization": `Bearer ${token}` }
            });
            fetchData(); // Recargar datos después de eliminar
          } catch (error) {
            console.error("Error eliminando manual:", error);
          }
        }
      }
    ]);
  };

  // 🔹 Función para eliminar video
  const eliminarVideo = async (id) => {
    Alert.alert("Confirmación", "¿Estás seguro de eliminar este video?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            await fetch(`${API_VIDEOS}${id}/`, {
              method: 'DELETE',
              headers: { "Authorization": `Bearer ${token}` }
            });
            fetchData(); // Recargar datos después de eliminar
          } catch (error) {
            console.error("Error eliminando video:", error);
          }
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📚 Manuales</Text>

      {tipoUsuario === "admin" && (
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("SubirManual")}>
          <Text style={styles.addButtonText}>➕ Subir Manual</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#4A90E2" />
      ) : (
        <FlatList
          data={manuales}
          keyExtractor={(item) => `manual-${item.id}`}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <TouchableOpacity onPress={() => Linking.openURL(item.archivo_pdf)}>
                <Text style={styles.itemTitle}>📄 {item.titulo}</Text>
              </TouchableOpacity>
              {tipoUsuario === "admin" && (
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate("EditarManual", { id: item.id })}>
                    <Text>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteButton} onPress={() => eliminarManual(item.id)}>
                    <Text>🗑️</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No hay manuales disponibles.</Text>}
        />
      )}

      <Text style={styles.title}>🎬 Videos</Text>

      {tipoUsuario === "admin" && (
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("SubirVideo")}>
          <Text style={styles.addButtonText}>➕ Subir Video</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#4A90E2" />
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item) => `video-${item.id}`}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <TouchableOpacity onPress={() => Linking.openURL(item.enlace_youtube)}>
                <Text style={styles.itemTitle}>🎥 {item.titulo}</Text>
              </TouchableOpacity>
              {tipoUsuario === "admin" && (
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate("EditarVideo", { id: item.id })}>
                    <Text>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteButton} onPress={() => eliminarVideo(item.id)}>
                    <Text>🗑️</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No hay videos disponibles.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f9fa" },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginVertical: 10 },
  itemCard: { backgroundColor: "#fff", padding: 15, borderRadius: 10, marginBottom: 10 },
  itemTitle: { fontSize: 16, fontWeight: "bold", color: "#007bff" },
  actions: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  editButton: { padding: 5 },
  deleteButton: { padding: 5 },
  addButton: { backgroundColor: "#28a745", padding: 10, borderRadius: 5, alignItems: "center", marginBottom: 10 },
  addButtonText: { color: "#fff", fontWeight: "bold" },
  emptyText: { textAlign: "center", fontSize: 16, color: "#666", marginTop: 10 },
});


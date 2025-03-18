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
import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

// URLs de la API
const API_MANUALES = "https://gestiones.cenesa.com.ar:88/api/manual/?format=json";
const API_VIDEOS = "https://gestiones.cenesa.com.ar:88/api/seccionvideo/?format=json";

export default function Manual() {
  const navigation = useNavigation();
  const [manuales, setManuales] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

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

      // 🔹 Verificar si el token ha expirado
      if (dataManuales.code === "token_not_valid" || dataVideos.code === "token_not_valid") {
        console.warn("Token inválido. Redirigiendo a Login...");
        await AsyncStorage.removeItem("token");
        Alert.alert("Sesión expirada", "Debes iniciar sesión nuevamente.");
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }

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
    fetchData();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📚 Manuales</Text>

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
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No hay manuales disponibles.</Text>}
        />
      )}

      <Text style={styles.title}>🎬 Videos</Text>

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
  emptyText: { textAlign: "center", fontSize: 16, color: "#666", marginTop: 10 },
});
 
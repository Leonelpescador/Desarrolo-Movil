import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Linking,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';


const API_MANUALES = "https://gestiones.cenesa.com.ar:88/api/manual/";
const API_VIDEOS = "https://gestiones.cenesa.com.ar:88/api/seccionvideo/";

export default function Manual() {
  const navigation = useNavigation();
  const [manuales, setManuales] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Función para obtener los datos de manuales y videos
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error("No hay token almacenado");
      }

      // 🔹 Obtener manuales
      const responseManuales = await fetch(API_MANUALES, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (responseManuales.status === 401) {
        await AsyncStorage.removeItem('token');
        Alert.alert("Sesión expirada", "Inicia sesión nuevamente.");
        navigation.reset({ index: 0, routes: [{ name: 'LoginScreen' }] });
        return;
      }
      const dataManuales = await responseManuales.json();

      // 🔹 Obtener videos
      const responseVideos = await fetch(API_VIDEOS, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const dataVideos = await responseVideos.json();

      setManuales(Array.isArray(dataManuales) ? dataManuales : []);
      setVideos(Array.isArray(dataVideos) ? dataVideos : []);
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los manuales y videos.");
      console.error("Error en fetchData:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🔹 Renderizar un manual en PDF
  const renderManual = ({ item }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => Linking.openURL(item.archivo_pdf)}
    >
      <Text style={styles.itemTitle}>📄 {item.titulo}</Text>
      <Text style={styles.itemDate}>Subido: {new Date(item.fecha_subida).toLocaleDateString()}</Text>
    </TouchableOpacity>
  );

  // 🔹 Renderizar un video de YouTube
  const renderVideo = ({ item }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => Linking.openURL(item.enlace_youtube)}
    >
      <Text style={styles.itemTitle}>🎥 {item.titulo}</Text>
      <Text style={styles.itemDate}>Publicado: {new Date(item.fecha_creacion).toLocaleDateString()}</Text>
    </TouchableOpacity>
  );

  return (
    <Base userType="usuario">
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>📚 Manuales en PDF</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#4A90E2" />
        ) : (
          <FlatList
            data={manuales}
            keyExtractor={(item) => `manual-${item.id}`}
            renderItem={renderManual}
            ListEmptyComponent={<Text style={styles.emptyText}>No hay manuales disponibles</Text>}
          />
        )}

        <Text style={styles.sectionTitle}>🎬 Videos Tutoriales</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#4A90E2" />
        ) : (
          <FlatList
            data={videos}
            keyExtractor={(item) => `video-${item.id}`}
            renderItem={renderVideo}
            ListEmptyComponent={<Text style={styles.emptyText}>No hay videos disponibles</Text>}
          />
        )}
      </View>
    </Base>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#007bff',
    textAlign: 'center',
    marginBottom: 10,
  },
  itemCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
  },
  itemDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
});

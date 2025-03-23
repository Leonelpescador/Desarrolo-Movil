// screens/enfermeria/Manual.js

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Linking, // Importado para abrir enlaces
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

// IMPORTA TU CONFIG DE FIREBASE (ajusta la ruta a tu archivo firebase.js)
import { db } from '../../src/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function Manual() {
  const navigation = useNavigation();
  
  const [manuales, setManuales] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  /**
   * Cargar manuales y videos desde Firestore.
   * Ajusta el nombre de las colecciones a los que tengas en tu Firestore.
   */
  const fetchData = async () => {
    setLoading(true);
    try {
      const snapshotManuales = await getDocs(collection(db, 'manual')); 
      const snapshotVideos = await getDocs(collection(db, 'seccionvideo'));

      const dataManuales = snapshotManuales.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      const dataVideos = snapshotVideos.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setManuales(dataManuales);
      setVideos(dataVideos);
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los datos desde Firebase.");
      console.error("Error en fetchData:", error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>📚 Manuales</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#4A90E2" />
      ) : (
        <FlatList
          data={manuales}
          keyExtractor={(item) => `manual-${item.id}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.listItem}
              onPress={() => {
                // Si en Firestore guardaste la URL del PDF en "archivo_pdf"
                if (item.archivo_pdf) {
                  Linking.openURL(item.archivo_pdf);
                } else {
                  Alert.alert("Enlace no disponible", "Este manual no tiene un PDF asociado.");
                }
              }}
            >
              <Text style={styles.listItemText}>📄 {item.titulo}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyListText}>No hay manuales disponibles.</Text>
          }
        />
      )}

      <Text style={styles.sectionTitle}>🎬 Videos</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#4A90E2" />
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item) => `video-${item.id}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.listItem}
              onPress={() => {
                // Si en Firestore guardaste la URL del video en "enlace_youtube"
                if (item.enlace_youtube) {
                  Linking.openURL(item.enlace_youtube);
                } else {
                  Alert.alert("Enlace no disponible", "Este video no tiene un enlace asociado.");
                }
              }}
            >
              <Text style={styles.listItemText}>🎥 {item.titulo}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyListText}>No hay videos disponibles.</Text>
          }
        />
      )}
    </View>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
    color: "#333",
  },
  listItem: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  listItemText: {
    fontSize: 18,
    color: "#007bff",
  },
  emptyListText: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginTop: 20,
  },
});

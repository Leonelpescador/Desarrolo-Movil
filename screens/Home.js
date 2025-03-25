import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Base from '../components/NavBar';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../src/firebase';
import { useCompleteUserData } from '../src/hooks/useCompleteUserData';

export default function Home() {
  const navigation = useNavigation();
  const [novedades, setNovedades] = useState([]);
  const [loadingNovedades, setLoadingNovedades] = useState(true);

  const { user, perfil, loading: loadingUser } = useCompleteUserData();

  // 🔒 Redirigir a usuarios con tipo 'invitado'
  useEffect(() => {
    if (!loadingUser && perfil?.tipo_usuario === 'invitado') {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Restriccion' }],
      });
    }
  }, [loadingUser, perfil]);

  const fetchNovedades = async () => {
    setLoadingNovedades(true);
    try {
      const novedadesRef = collection(db, "novedades");
      const querySnapshot = await getDocs(novedadesRef);
      const novedadesList = [];
      querySnapshot.forEach((docSnap) => {
        novedadesList.push({ id: docSnap.id, ...docSnap.data() });
      });
      setNovedades(novedadesList);
    } catch (error) {
      console.error("Error al obtener novedades:", error);
      Alert.alert("Error", "No se pudieron cargar las novedades.");
    } finally {
      setLoadingNovedades(false);
    }
  };

  useEffect(() => {
    fetchNovedades();
  }, []);

  const renderNovedad = ({ item }) => (
    <View style={styles.novedadCard}>
      <Text style={styles.novedadTitle}>{item.titulo}</Text>
      <Text style={styles.novedadContent}>{item.contenido}</Text>
      <Text style={styles.novedadDate}>
        Publicado el:{" "}
        {new Date(
          item.fecha_publicacion?.toDate
            ? item.fecha_publicacion.toDate()
            : item.fecha_publicacion
        ).toLocaleDateString()}
      </Text>
    </View>
  );

  const ListHeader = () => (
    <View style={styles.content}>
      <View style={styles.profileContainer}>
        {perfil?.foto_perfil ? (
          <Image source={{ uri: perfil.foto_perfil }} style={styles.profileImage} />
        ) : (
          <Image source={require('../assets/defaultprofile.png')} style={styles.profileImage} />
        )}
        <Text style={styles.profileText}>
          Hola {perfil?.nombre} {perfil?.apellido}
        </Text>
      </View>

      <View style={styles.systemHeader}>
        
      </View>

      <Text style={styles.sectionTitle}>Últimas Novedades</Text>
    </View>
  );

  return (
    <Base>
      <View style={styles.container}>
        {(loadingNovedades || loadingUser) ? (
          <ActivityIndicator size="large" color="#4A90E2" style={styles.loadingIndicator} />
        ) : novedades.length > 0 ? (
          <FlatList
            data={novedades}
            renderItem={renderNovedad}
            keyExtractor={(item) => item.id.toString()}
            ListHeaderComponent={ListHeader}
            contentContainerStyle={styles.novedadesList}
          />
        ) : (
          <View style={styles.content}>
            <ListHeader />
            <Text style={styles.noNovedades}>
              No hay novedades disponibles en este momento.
            </Text>
          </View>
        )}
      </View>
    </Base>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingIndicator: {
    marginTop: 50,
  },
  content: {
    marginTop: 10,
    paddingHorizontal: 20,
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#007bff',
  },
  profileText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  systemHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  systemTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#007bff',
  },
  systemSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  systemButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#007bff',
    textAlign: 'center',
    marginBottom: 20,
  },
  novedadesList: {
    paddingBottom: 20,
  },
  noNovedades: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  novedadCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  novedadTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 10,
  },
  novedadContent: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  novedadDate: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
});

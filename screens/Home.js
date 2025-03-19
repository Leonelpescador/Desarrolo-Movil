// screens/Home.js
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import Base from '../components/NavBar';



const NOVEDADES_API_URL = "https://gestiones.cenesa.com.ar:88/api/novedad/?format=json";
const PERFIL_API_URL = "https://gestiones.cenesa.com.ar:88/api/perfilusuario/?format=json";

export async function gethome() {
  const response = await fetch(`${API_BASE_URL}/api/`, { headers: { "Authorization": `Bearer ${token}` } });
  const data = await response.json();
  if (data.code === "token_not_valid") { /* Redirigir a Login */ }
  return data;
}

export default function Home() {
  const navigation = useNavigation();
  const [novedades, setNovedades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fotoPerfil, setFotoPerfil] = useState(null);

  // Obtener la foto de perfil del usuario
  const fetchFotoPerfil = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(PERFIL_API_URL, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setFotoPerfil(data[0].foto_perfil); // Tomamos la primera foto disponible
      }
    } catch (error) {
      console.error("Error al obtener la foto de perfil:", error);
    }
  };

  // Obtener novedades y foto de perfil al cargar la pantalla
  useEffect(() => {
    fetchFotoPerfil();
    fetchNovedades();
  }, []);

  // Obtener novedades desde la API
  const fetchNovedades = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(NOVEDADES_API_URL, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setNovedades(data);
      } else {
        setNovedades([]);
      }
    } catch (error) {
      console.error("Error al obtener novedades:", error);
      Alert.alert("Error", "No se pudieron cargar las novedades.");
    } finally {
      setLoading(false);
    }
  };

  // Renderiza cada novedad como tarjeta
  const renderNovedad = ({ item }) => (
    <View style={styles.novedadCard}>
      <Text style={styles.novedadTitle}>{item.titulo}</Text>
      <Text style={styles.novedadContent}>{item.contenido}</Text>
      <Text style={styles.novedadDate}>
        Publicado el: {new Date(item.fecha_publicacion).toLocaleDateString()}
      </Text>
    </View>
  );

  // Cabecera con foto de perfil
  const ListHeader = () => (
    <View style={styles.content}>
      {/* Foto de perfil */}
      <View style={styles.profileContainer}>
        {fotoPerfil ? (
          <Image source={{ uri: fotoPerfil }} style={styles.profileImage} />
        ) : (
          <Image source={require('../assets/default_profile.png')} style={styles.profileImage} />
        )}
        <Text style={styles.profileText}>Hola😀</Text>
      </View>

      {/* Sección del Sistema de Enfermería */}
      <View style={styles.systemHeader}>
        <Text style={styles.systemTitle}>💉 Sistema de Enfermería</Text>
        <Text style={styles.systemSubtitle}>
          Gestione las solicitudes y el seguimiento de pacientes.
        </Text>
        <View style={styles.systemButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('CrearSolicitudEnfermeria')}
          >
            <Text style={styles.primaryButtonText}>➕ Crear Solicitud</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('ListarSolicitudesEnfermeria')}
          >
            <Text style={styles.primaryButtonText}>📋 Ver Solicitudes</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Título de Novedades */}
      <Text style={styles.sectionTitle}>📢 Últimas Novedades</Text>
    </View>
  );

  return (
    <Base>
      <View style={styles.container}>
        {loading ? (
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
              No hay novedades disponibles en este momento. 🌟
            </Text>
          </View>
        )}
      </View>
    </Base>
  );
}

// Estilos
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
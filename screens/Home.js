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

export async function getFormularios() {
  const response = await fetch(`${API_BASE_URL}/formularios/`, { headers: { "Authorization": `Bearer ${token}` } });
  const data = await response.json();
  if (data.code === "token_not_valid") { /* Redirigir a Login */ }
  return data;
}

export default function Home() {
  const navigation = useNavigation();
  const [novedades, setNovedades] = useState([]);
  const [loading, setLoading] = useState(true);
  const userType = 'enfermero'; // Ejemplo

  // Función para obtener las novedades desde el API
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
        console.warn("La respuesta de novedades no es un arreglo:", data);
        setNovedades([]);
      }
    } catch (error) {
      console.error("Error al obtener novedades:", error);
      Alert.alert("Error", "No se pudieron cargar las novedades.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNovedades();
  }, []);

  

  // Renderiza cada novedad como tarjeta
  const renderNovedad = ({ item }) => (
    <View style={styles.novedadCard}>
      <Text style={styles.novedadTitle}>{item.titulo}</Text>
      <Text style={styles.novedadContent}>{item.contenido}</Text>
      {item.enlaces && item.enlaces.length > 0 && (
        <View style={styles.novedadEnlaces}>
          {item.enlaces.map((enlace, index) => (
            <TouchableOpacity
              key={index}
              style={styles.novedadLink}
              onPress={() => navigation.navigate('WebView', { url: enlace.url })}
            >
              <Text style={styles.novedadLinkText}>Ir al Enlace</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <Text style={styles.novedadDate}>
        Publicado el: {new Date(item.fecha_publicacion).toLocaleDateString()}
      </Text>
    </View>
  );

  // Contenido estático para la cabecera, que se agregará al FlatList
  const ListHeader = () => (
    <View style={styles.content}>
      
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
    <Base userType={userType}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingIndicator: {
    marginTop: 50,
  },
  supportIcon: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1000,
  },
  supportImage: {
    width: 50,
    height: 50,
  },
  content: {
    marginTop: 80,
    paddingHorizontal: 20,
  },
  systemHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  systemTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007bff',
  },
  systemSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
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
  novedadLinkText: {
    color: '#fff',
    fontSize: 14,
  },
  novedadDate: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
});

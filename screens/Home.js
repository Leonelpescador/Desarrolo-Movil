// screens/Home.js
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import NavBar from '../components/NavBar';

export default function Home() {
  const navigation = useNavigation();
  const [userType, setUserType] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simula la obtención del tipo de usuario (por ejemplo, desde AsyncStorage)
    const fetchUserType = async () => {
      try {
        const storedType = await AsyncStorage.getItem('userType');
        // Si no existe, se asigna 'enfermero' por defecto para pruebas
        setUserType(storedType || 'enfermero');
      } catch (error) {
        console.error("Error al obtener el tipo de usuario:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserType();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  // Determinar si el usuario tiene permisos para acceder a la sección
  const isAllowed = userType === 'enfermero' || userType === 'admin';

  return (
    <View style={styles.container}>
      {/* Barra de navegación */}
      <NavBar />
      
      {isAllowed ? (
        <View style={styles.content}>
          <Text style={styles.header}>💉 Sistema de Enfermería</Text>
          <Text style={styles.subtitle}>
            Gestione las solicitudes y el seguimiento de pacientes.
          </Text>
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={() => navigation.navigate('CrearSolicitudEnfermeria')}
          >
            <Text style={styles.buttonText}>➕ Crear Solicitud</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonOutline]}
            onPress={() => navigation.navigate('ListarSolicitudesEnfermeria')}
          >
            <Text style={styles.buttonTextOutline}>📋 Ver Solicitudes</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.header}>Bienvenido</Text>
          <Text>No tienes permisos para acceder a la sección de enfermería.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    fontSize: 28,
    color: '#4A90E2',
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    width: '80%',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonPrimary: {
    backgroundColor: '#27AE60',
  },
  buttonOutline: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  buttonTextOutline: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
});

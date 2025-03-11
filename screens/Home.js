// screens/Home.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Base from '../components/NavBar';

export default function Home() {
  // Supongamos que el tipo de usuario se obtiene de AsyncStorage o de algún estado global.
  const userType = 'enfermero'; // Ejemplo

  return (
    <Base userType={userType}>
      <View style={styles.container}>
        <Text style={styles.header}>💉 Sistema de Enfermería</Text>
        <Text style={styles.subtitle}>
          Gestione las solicitudes y el seguimiento de pacientes.
        </Text>
        {/* Aquí colocar el resto de contenido o botones */}
      </View>
    </Base>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
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
});

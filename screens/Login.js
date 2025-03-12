import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// URL de la API
const API_BASE_URL = "http://gestiones.cenesa.com.ar:88/api";

export default function LoginScreen() {
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Función para manejar el inicio de sesión
  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Debes ingresar usuario y contraseña.");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error("Credenciales inválidas o error en la conexión.");
      }

      const data = await response.json();
      if (data && data.access) {
        await AsyncStorage.setItem('token', data.access);
        Alert.alert("Éxito", "Inicio de sesión correcto.");
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      } else {
        throw new Error("No se recibió token de autenticación.");
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  // Función para abrir WebView con un enlace específico
  const openWebView = (url) => {
    navigation.navigate('WebView', { url });
  };

  return (
    <ImageBackground
      source={require('../assets/fondo3.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <View style={styles.loginContainer}>
          <Image
            source={require('../assets/cenesa_logo.jpg')}
            style={styles.logo}
          />
          <Text style={styles.title}>Iniciar Sesión</Text>

          <TextInput
            style={styles.input}
            placeholder="Nombre de usuario"
            placeholderTextColor="#aaa"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor="#aaa"
            secureTextEntry={true}
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Iniciar Sesión</Text>
          </TouchableOpacity>

          {/* Enlaces de recuperación y registro */}
          <View style={styles.linkContainer}>
            <TouchableOpacity onPress={() => openWebView('http://gestiones.cenesa.com.ar:88/registrar/')}>
              <Text style={styles.linkText}>Regístrate aquí</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openWebView('http://gestiones.cenesa.com.ar:88/recuperar-contrasena/')}>
              <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openWebView('http://gestiones.cenesa.com.ar:88/recuperar-usuario/')}>
              <Text style={styles.linkText}>¿Olvidaste tu nombre de usuario?</Text>
            </TouchableOpacity>
          </View>

          {/* Destacado "Desarrollado por Pescador Leonel" */}
          <TouchableOpacity onPress={() => openWebView('https://www.instagram.com/leonelpescador/')}>
            <Text style={styles.developerText}>Desrrollado por Pescador Leonel</Text>
            <Text style={styles.developerLink}></Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

// Estilos del login
const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: width,
    height: height,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loginContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#4A90E2',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#4A90E2',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    color: '#333',
  },
  button: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#007bff',
    fontSize: 16,
    marginVertical: 5,
    textDecorationLine: 'underline',
  },
  developerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    textDecorationLine: 'underline',
  },
  developerLink: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
    textDecorationLine: 'underline',
  },
});

import React, { useState, useEffect } from 'react'; // Importar useEffect
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
    ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const API_BASE_URL = "https://gestiones.cenesa.com.ar:88/api";

export default function LoginScreen() {
    const navigation = useNavigation();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const checkServerConnectivity = async () => {
            try {
                const response = await fetch(API_BASE_URL, { method: 'HEAD' });
                if (!response.ok) {
                    Alert.alert("Error", "El servidor no está disponible. Inténtalo de nuevo más tarde.");
                }
            } catch (error) {
                Alert.alert("Error", "No se pudo conectar al servidor. Verifica tu conexión a Internet.");
            }
        };

        checkServerConnectivity();
    }, []);

    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert("Error", "Debes ingresar usuario y contraseña.");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/token/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (response.status === 400) {
                throw new Error("Solicitud incorrecta. Verifica tus datos.");
            } else if (response.status === 401) {
                throw new Error("Credenciales inválidas.");
            } else if (!response.ok) {
                throw new Error("Error en la conexión.");
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
        } finally {
            setLoading(false);
        }
    };

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
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Contraseña"
                            placeholderTextColor="#aaa"
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Text style={styles.showPasswordText}>
                                {showPassword ? 'Ocultar' : 'Mostrar'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.button} onPress={handleLogin}>
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Iniciar Sesión</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.linkContainer}>
                        <TouchableOpacity onPress={() => openWebView('https://gestiones.cenesa.com.ar:88/registrar/')}>
                            <Text style={styles.linkText}>Regístrate aquí</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => openWebView('https://gestiones.cenesa.com.ar:88/recuperar-contrasena/')}>
                            <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => openWebView('https://gestiones.cenesa.com.ar:88/recuperar-usuario/')}>
                            <Text style={styles.linkText}>¿Olvidaste tu nombre de usuario?</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={() => openWebView('https://www.instagram.com/leonelpescador/')}>
                        <Text style={styles.developerText}>Desarrollado por Pescador Leonel</Text>
                        <Text style={styles.developerLink}></Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ImageBackground>
    );
}

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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 20,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  showPasswordText: {
    padding: 10,
    color: '#007bff',
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
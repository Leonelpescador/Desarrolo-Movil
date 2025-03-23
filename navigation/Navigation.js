import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../src/firebase'; // Asegúrate de que esta ruta es correcta y exporta { auth }

// Importa tus pantallas
import Login from '../screens/Login';
import Home from '../screens/Home';
import CrearSolicitud from '../screens/enfermeria/CrearSolicitud';
import EditarSolicitud from '../screens/enfermeria/EditarSolicitud';
import EliminarSolicitud from '../screens/enfermeria/EliminarSolicitud';
import ListarSolicitudes from '../screens/enfermeria/ListarSolicitudes';
import Logout from '../screens/Logout';
import WebViewScreen from '../screens/WebViewScreen';
import Manual from '../screens/Manual/Manual';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

const Stack = createStackNavigator();

export default function Navigation() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Usamos onAuthStateChanged de Firebase para detectar si hay un usuario logueado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={isAuthenticated ? "Home" : "Login"}>
        <Stack.Screen 
          name="Login" 
          component={Login} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Home" 
          component={Home} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="CrearSolicitudEnfermeria" 
          component={CrearSolicitud} 
          options={{ title: "Crear Solicitud" }}
        />
        <Stack.Screen 
          name="EditarSolicitudEnfermeria" 
          component={EditarSolicitud} 
          options={{ title: "Editar Solicitud" }}
        />
        <Stack.Screen 
          name="EliminarSolicitudEnfermeria" 
          component={EliminarSolicitud} 
          options={{ title: "Eliminar Solicitud" }}
        />
        <Stack.Screen 
          name="ListarSolicitudesEnfermeria" 
          component={ListarSolicitudes} 
          options={{ title: "Solicitudes de Enfermería" }}
        />
        <Stack.Screen 
          name="Manual" 
          component={Manual} 
          options={{ title: "Manual" }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen} 
          options={{ title: "Registrar Usuario" }}
        />
        <Stack.Screen 
          name="ForgotPassword" 
          component={ForgotPasswordScreen} 
          options={{ title: "Recuperar Contraseña" }}
        />
        <Stack.Screen 
          name="Logout" 
          component={Logout} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="WebView" 
          component={WebViewScreen} 
          options={{ title: "Sitio Web" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

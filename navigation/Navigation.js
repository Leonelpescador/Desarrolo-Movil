// navigation/Navigation.js
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';


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

const Stack = createStackNavigator();

export default function Navigation() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        setIsAuthenticated(!!token);
      } catch (error) {
        console.error("Error al obtener el token:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
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
        {/* Todas las rutas se definen siempre */}
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

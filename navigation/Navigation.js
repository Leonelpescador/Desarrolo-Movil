// Navigation.js
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { auth } from '../src/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useCompleteUserData } from '../src/hooks/useCompleteUserData';

// Pantallas
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
import ListarUsuarios from '../screens/admin/ListarUsuarios';
import EditarUsuario from '../screens/admin/EditarUsuario';
import Restriccion from '../screens/Restricciones/Restriccion';

const Stack = createStackNavigator();

export default function Navigation() {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const { perfil, loading: loadingPerfil } = useCompleteUserData();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  if (checkingAuth || loadingPerfil) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  const isInvitado = perfil?.tipo_usuario === 'invitado';

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={!firebaseUser ? 'Login' : isInvitado ? 'Restriccion' : 'Home'}
      >
        <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={Home} options={{ headerShown: false }} />
        <Stack.Screen name="CrearSolicitudEnfermeria" component={CrearSolicitud} />
        <Stack.Screen name="EditarSolicitudEnfermeria" component={EditarSolicitud} />
        <Stack.Screen name="EliminarSolicitudEnfermeria" component={EliminarSolicitud} />
        <Stack.Screen name="ListarSolicitudesEnfermeria" component={ListarSolicitudes} />
        <Stack.Screen name="Manual" component={Manual} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="Logout" component={Logout} options={{ headerShown: false }} />
        <Stack.Screen name="ListarUsuarios" component={ListarUsuarios} />
        <Stack.Screen name="EditarUsuario" component={EditarUsuario} />
        <Stack.Screen name="Restriccion" component={Restriccion} options={{ headerShown: false }} />
        <Stack.Screen name="WebView" component={WebViewScreen} />
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

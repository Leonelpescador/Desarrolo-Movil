// screens/Logout.js
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function Logout() {
  const navigation = useNavigation();

  useEffect(() => {
    const logout = async () => {
      try {
        // Limpia los datos de autenticación
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('userType');
      } catch (error) {
        console.error("Error durante el logout:", error);
      } finally {
        // Reinicia la navegación para volver a la pantalla de Login
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    };
    logout();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4A90E2" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
});

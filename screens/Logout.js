// screens/Logout.js
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function Logout() {
  const navigation = useNavigation();

  useEffect(() => {
    const logoutUser = async () => {
      try {
        // Elimina el token almacenado
        await AsyncStorage.removeItem('token');
      } catch (error) {
        console.error("Error al borrar el token:", error);
      } finally {
        // Redirige a la pantalla de Login
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    };

    logoutUser();
  }, [navigation]);

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#4A90E2" />
    </View>
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

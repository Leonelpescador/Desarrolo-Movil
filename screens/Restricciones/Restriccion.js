import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Linking, Alert, ImageBackground, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { auth } from '../../src/firebase';
import { useCompleteUserData } from '../../src/hooks/useCompleteUserData';

export default function NuevoUsuario() {
  const navigation = useNavigation();
  const { user, perfil } = useCompleteUserData();

  const username = perfil?.username || user?.displayName || '[Usuario desconocido]';

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (error) {
      Alert.alert('Error', 'No se pudo cerrar sesión.');
    }
  };

  const handleEmail = () => {
    const emails = ['gerencia@cenesa.com.ar', 'estebanfigueroa@cenesa.com.ar', 'informatica1@cenesa.com.ar'];
    const subject = 'Solicitud de acceso al sistema';
    const body = `Hola, soy ${perfil?.nombre} ${perfil?.apellido} mi usuario es: ${username}. Solicito acceso a la App de Cenesa. Gracias.`;
    const mailtoUrl = `mailto:${emails.join(',')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    Linking.openURL(mailtoUrl).catch(() => {
      Alert.alert('Error', 'No se pudo abrir la aplicación de correo.');
    });
  };

  const handleWhatsApp = () => {
    Alert.alert(
      'Contactar por WhatsApp',
      'Seleccione con quién desea comunicarse:',
      [
        {
          text: '📞 Nicolás G.- Gerente',
          onPress: () => openWhatsApp('5493874875036')
        },
        {
          text: '📞 Esteban C.- Informática',
          onPress: () => openWhatsApp('5493874139627')
        },
        {
          text: '📞 Leonel P.- Informática',
          onPress: () => openWhatsApp('5493875795436')
        },
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  };

  const openWhatsApp = (phone) => {
    const message = `Hola, soy ${perfil?.nombre} ${perfil?.apellido} mi usuario es: ${username}. Solicito acceso a la App de Cenesa. Gracias.`;
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert('Error', 'No se pudo abrir WhatsApp.');
    });
  };

  return (
    <ImageBackground
      source={require('../../assets/fondo3.jpg')}
      style={styles.background}
    >
      <View style={styles.header}>
        <Image
          source={require('../../assets/logos-de-cenesa_sombra.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <Text style={styles.title}>⚠️ Acceso restringido</Text>
        <Text style={styles.message}>
          Aún no puedes ingresar al sistema. Primero deberás solicitar permiso al área correspondiente.
        </Text>

        <TouchableOpacity style={styles.button} onPress={handleEmail}>
          <Ionicons name="mail" size={20} color="#fff" />
          <Text style={styles.buttonText}>Enviar Correo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#25D366' }]}
          onPress={handleWhatsApp}
        >
          <Ionicons name="logo-whatsapp" size={20} color="#fff" />
          <Text style={styles.buttonText}>Enviar WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  logo: {
    width: 180,
    height: 50,
  },
  container: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    margin: 20,
    borderRadius: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#d9534f',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 25,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

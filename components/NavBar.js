// components/NavBar.js
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  ScrollView, 
  Image, 
  StyleSheet 
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Base = ({ children, userType }) => {
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);
  const [enfermeriaExpanded, setEnfermeriaExpanded] = useState(false);

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => {
    setMenuVisible(false);
    setEnfermeriaExpanded(false);
  };

  const toggleEnfermeria = () => setEnfermeriaExpanded(prev => !prev);

  const handleLogout = async () => {
    // Limpia el token y otros datos (si es necesario)
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('userType');
    } catch (error) {
      console.error('Error al limpiar AsyncStorage:', error);
    }
    closeMenu();
    navigation.navigate('Login'); // Redirige al login
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={openMenu} style={styles.hamburger}>
          <Icon name="bars" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/logos-de-cenesa_sombra.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Contenido dinámico */}
      <View style={styles.content}>
        {children}
      </View>

      {/* Menú lateral en Modal */}
      <Modal
        visible={menuVisible}
        animationType="slide"
        transparent
        onRequestClose={closeMenu}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.menuContainer}>
            <ScrollView>
              {/* Encabezado del menú */}
              <View style={styles.menuHeader}>
                <Image
                  source={require('../assets/logos-de-cenesa_sombra.png')}
                  style={styles.menuLogo}
                  resizeMode="contain"
                />
                <TouchableOpacity onPress={closeMenu} style={styles.closeButton}>
                  <Icon name="times" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Menú principal */}
              <View style={styles.menuContent}>
                {/* Ejemplo: opción de Enfermería con submenú */}
                {(userType === 'admin' || userType === 'Farmacia' || userType === 'enfermero' || userType === 'sup-enfermero') && (
                  <>
                    <TouchableOpacity style={styles.menuItem} onPress={toggleEnfermeria}>
                      <Icon name="user-nurse" size={16} color="#fff" style={styles.menuIcon} />
                      <Text style={styles.menuText}>Enfermería</Text>
                      <Icon 
                        name={enfermeriaExpanded ? "chevron-up" : "chevron-down"} 
                        size={14} color="#fff" style={styles.menuIcon} 
                      />
                    </TouchableOpacity>
                    {enfermeriaExpanded && (
                      <View style={styles.submenu}>
                        <TouchableOpacity
                          style={styles.submenuItem}
                          onPress={() => { closeMenu(); navigation.navigate('ListarSolicitudesEnfermeria'); }}
                        >
                          <Icon name="list" size={14} color="#fff" style={styles.submenuIcon} />
                          <Text style={styles.submenuText}>Solicitudes de Enfermería</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.submenuItem}
                          onPress={() => { closeMenu(); navigation.navigate('CrearSolicitudEnfermeria'); }}
                        >
                          <Icon name="plus-square" size={14} color="#fff" style={styles.submenuIcon} />
                          <Text style={styles.submenuText}>Crear Solicitud de Enfermería</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}

                {/* Opción para Cerrar Sesión */}
                <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                  <Icon name="sign-out-alt" size={16} color="#fff" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Cerrar Sesión</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Base;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 60,
    backgroundColor: '#212529',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    justifyContent: 'space-between',
  },
  hamburger: {
    padding: 10,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  logo: {
    height: 40,
    width: 150,
  },
  content: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  menuContainer: {
    width: '80%',
    backgroundColor: '#343a40',
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  menuLogo: {
    width: 120,
    height: 60,
  },
  closeButton: {
    padding: 10,
  },
  menuContent: {
    // Puedes agregar estilos adicionales para el contenedor del menú
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  menuIcon: {
    marginHorizontal: 8,
  },
  menuText: {
    color: '#fff',
    fontSize: 16,
  },
  submenu: {
    marginLeft: 32,
    marginTop: 5,
  },
  submenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  submenuIcon: {
    marginRight: 6,
  },
  submenuText: {
    color: '#fff',
    fontSize: 14,
  },
});

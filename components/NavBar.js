import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  StatusBar,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { auth } from '../src/firebase';

// Importar hook de perfil
import { useCompleteUserData } from '../src/hooks/useCompleteUserData';

export default function Base({ children }) {
  const navigation = useNavigation();
  const { perfil } = useCompleteUserData();

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [solicitudModalVisible, setSolicitudModalVisible] = useState(false);

  const handlePressLogout = () => setLogoutModalVisible(true);
  const handleCancelLogout = () => setLogoutModalVisible(false);

  const handleConfirmLogout = useCallback(async () => {
    try {
      await signOut(auth);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Logout' }],
      });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setLogoutModalVisible(false);
    }
  }, [navigation]);

  const navigateTo = useCallback((screen) => {
    navigation.navigate(screen);
  }, [navigation]);

  const tipoPermitido = ['admin', 'Farmacia', 'enfermero', 'sup-enfermero'];

  return (
    <View style={styles.container}>
      {Platform.OS === 'android' && <StatusBar backgroundColor="#37474F" />}

      <View style={styles.header}>
        <Image
          source={require('../assets/logos-de-cenesa_sombra.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity onPress={handlePressLogout} style={styles.logout}>
          <Icon name="sign-out-alt" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>{children}</View>

      <View style={styles.bottomMenu}>
        {tipoPermitido.includes(perfil?.tipo_usuario) && (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setSolicitudModalVisible(true)}
          >
            <Icon name="user-nurse" size={24} color="#fff" />
            <Text style={styles.menuItemText}>Solicitudes</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('Home')}>
          <Icon name="home" size={24} color="#fff" />
          <Text style={styles.menuItemText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => setManualModalVisible(true)}>
          <Icon name="bars" size={24} color="#fff" />
          <Text style={styles.menuItemText}>Menú</Text>
        </TouchableOpacity>
      </View>

      {/* Modal Logout */}
      <Modal visible={logoutModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirmar cierre de sesión</Text>
            <Text style={styles.modalMessage}>¿Estás seguro de que deseas salir?</Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={[styles.modalButton, styles.buttonCancel]} onPress={handleCancelLogout}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.buttonConfirm]} onPress={handleConfirmLogout}>
                <Text style={styles.modalButtonText}>Salir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Solicitudes */}
      <Modal visible={solicitudModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalMenuContainer}>
            <Text style={styles.modalMenuTitle}>Gestión de Solicitudes</Text>

            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => {
                setSolicitudModalVisible(false);
                navigateTo('CrearSolicitudEnfermeria');
              }}
            >
              <Icon name="plus-circle" size={20} color="#333" />
              <Text style={styles.menuOptionText}>Crear Solicitud</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => {
                setSolicitudModalVisible(false);
                navigateTo('ListarSolicitudesEnfermeria');
              }}
            >
              <Icon name="clipboard-list" size={20} color="#333" />
              <Text style={styles.menuOptionText}>Ver Solicitudes</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeMenuButton} onPress={() => setSolicitudModalVisible(false)}>
              <Text style={styles.closeMenuButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Manual */}
      <Modal visible={manualModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalMenuContainer}>
            <Text style={styles.modalMenuTitle}>Opciones de Manual</Text>

            <TouchableOpacity style={styles.menuOption} onPress={() => {
              setManualModalVisible(false);
              navigateTo('Manual');
            }}>
              <Icon name="book-open" size={20} color="#333" />
              <Text style={styles.menuOptionText}>Ver Manual</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuOption} onPress={() => {
              setManualModalVisible(false);
              navigateTo('ListarUsuarios');
            }}>
              <Icon name="users" size={20} color="#333" />
              <Text style={styles.menuOptionText}>perfil</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeMenuButton} onPress={() => setManualModalVisible(false)}>
              <Text style={styles.closeMenuButtonText}>Cerrar Menú</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}


/** Estilos */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#37474F',
  },
  header: {
    height: 70,
    backgroundColor: '#37474F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    elevation: 5,
  },
  logout: {
    padding: 10,
  },
  logo: {
    height: 45,
    width: 160,
  },
  content: {
    flex: 1,
  },
  bottomMenu: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#2C3E50',
    paddingVertical: 10,
  },
  menuItem: {
    alignItems: 'center',
  },
  menuItemText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  /* ────────── Modales ────────── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16, marginBottom: 20, textAlign: 'center', color: '#333',
  },
  modalButtonContainer: {
    flexDirection: 'row', justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1, padding: 12, borderRadius: 8, marginHorizontal: 5, alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff', fontSize: 16,
  },
  buttonCancel: {
    backgroundColor: '#6c757d',
  },
  buttonConfirm: {
    backgroundColor: '#d9534f',
  },
  /* Menú para Manual */
  modalMenuContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
  },
  modalMenuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  menuOptionText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  closeMenuButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  closeMenuButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

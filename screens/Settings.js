import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, FlatList } from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../src/config/firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';

export default function Settings() {
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  // Estados para el modal de usuarios
  const [usersModalVisible, setUsersModalVisible] = useState(false);
  const [users, setUsers] = useState([]);

  // Envía el correo para restablecer contraseña
  const handlePasswordReset = async () => {
    if (!resetEmail.trim()) {
      alert('Por favor ingresa un correo electrónico válido.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetModalVisible(false); // Cierra el modal de ingreso de correo
      setSuccessModalVisible(true); // Abre el modal de éxito
      setResetEmail('');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        alert('El correo ingresado no corresponde a un usuario registrado.');
      } else if (error.code === 'auth/invalid-email') {
        alert('Por favor ingresa un correo electrónico válido.');
      } else {
        console.log(error);
        alert('Error al enviar el correo. Intenta nuevamente.');
      }
    }
  };

  // Cargar usuarios registrados (asumiendo una colección "users" en Firestore)
  const loadUsers = () => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(userList);
    });
    return unsubscribe;
  };

  const handleShowUsers = () => {
    loadUsers();
    setUsersModalVisible(true);
  };

  // Función para abrir el modal de restablecimiento con un correo específico
  const handleOpenResetWithEmail = (email) => {
    setResetEmail(email);
    setResetModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configuraciones</Text>

      {/* Botón para restablecer contraseña (modal general) */}
      <TouchableOpacity style={styles.button} onPress={() => setResetModalVisible(true)}>
        <Text style={styles.buttonText}>Restablecer Contraseña</Text>
      </TouchableOpacity>

      {/* Botón para ver usuarios registrados */}
      <TouchableOpacity style={styles.button} onPress={handleShowUsers}>
        <Text style={styles.buttonText}>Ver Usuarios Registrados</Text>
      </TouchableOpacity>

      {/* Modal para ingresar o confirmar el correo para restablecer contraseña */}
      <Modal
        visible={resetModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setResetModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Restablecer Contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingresa tu correo electrónico"
              value={resetEmail}
              onChangeText={setResetEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButtonConfirm} onPress={handlePasswordReset}>
                <Text style={styles.modalButtonText}>Enviar Correo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonCancel} onPress={() => setResetModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de confirmación de envío */}
      <Modal
        visible={successModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>¡Correo Enviado!</Text>
            <Text style={styles.modalMessage}>
              Hemos enviado un correo para restablecer tu contraseña. Por favor revisa tu bandeja de entrada.
            </Text>
            <TouchableOpacity
              style={styles.modalButtonConfirm}
              onPress={() => setSuccessModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de usuarios registrados */}
      <Modal
        visible={usersModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setUsersModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainerLarge}>
            <Text style={styles.modalTitle}>Usuarios Registrados</Text>
            {users.length === 0 ? (
              <Text style={{marginBottom:10}}>No hay usuarios registrados.</Text>
            ) : (
              <FlatList
                data={users}
                keyExtractor={(item) => item.id}
                style={{width:'100%'}}
                renderItem={({ item }) => (
                  <View style={styles.userItem}>
                    <Text style={{fontWeight:'bold'}}>{item.firstName} {item.lastName}</Text>
                    <Text>{item.email}</Text>
                    {/* Botón para restablecer contraseña de este usuario */}
                    <TouchableOpacity 
                      style={[styles.buttonSmall, {marginTop:10}]} 
                      onPress={() => handleOpenResetWithEmail(item.email)}
                    >
                      <Text style={styles.buttonTextSmall}>Restablecer Contraseña</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
            <TouchableOpacity
              style={styles.modalButtonCancel}
              onPress={() => setUsersModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    alignSelf: 'center',
  },
  button: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Botón pequeño para cada usuario
  buttonSmall: {
    backgroundColor: '#3498db',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonTextSmall: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalContainerLarge: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    maxHeight:'70%'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign:'center'
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 10,
    width: '100%',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButtonConfirm: {
    backgroundColor: '#2ecc71',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  modalButtonCancel: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  userItem: {
    backgroundColor:'#f0f0f0',
    padding:10,
    borderRadius:8,
    marginBottom:10
  }
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, FlatList, Alert } from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../src/config/firebaseConfig';
import { collection, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';

export default function Settings() {
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  // Estados para el modal de usuarios
  const [usersModalVisible, setUsersModalVisible] = useState(false);
  const [users, setUsers] = useState([]);

  // Estados para el modal de borrado de datos
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Estados para el modal de edición de datos
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');

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

  // Cargar usuarios registrados
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

  // Función para abrir el modal de confirmación de borrado de datos del usuario
  const handleDeleteUserData = (userId) => {
    setSelectedUserId(userId);
    setDeleteModalVisible(true);
  };

  // Función para confirmar y borrar datos del usuario de Firestore
  const confirmDeleteUserData = async () => {
    if (!selectedUserId) return;
    try {
      await deleteDoc(doc(db, 'users', selectedUserId));
      Alert.alert('Datos borrados', 'Los datos del usuario han sido borrados con éxito.');
      setDeleteModalVisible(false);
      setSelectedUserId(null);
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudieron borrar los datos del usuario.');
    }
  };

  // Función para abrir el modal de edición con los datos del usuario
  const handleOpenEditUser = (user) => {
    setEditUserId(user.id);
    setEditFirstName(user.firstName);
    setEditLastName(user.lastName);
    setEditModalVisible(true);
  };

  // Función para confirmar la edición de datos del usuario
  const handleEditUserSubmit = async () => {
    if (!editFirstName.trim() || !editLastName.trim()) {
      Alert.alert('Error', 'Nombre y Apellido no pueden estar vacíos.');
      return;
    }

    try {
      await updateDoc(doc(db, 'users', editUserId), {
        firstName: editFirstName.trim(),
        lastName: editLastName.trim()
      });
      Alert.alert('Éxito', 'Datos del usuario actualizados correctamente.');
      setEditModalVisible(false);
      setEditUserId(null);
      setEditFirstName('');
      setEditLastName('');
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudieron actualizar los datos del usuario.');
    }
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

                    {/* Botón para eliminar datos del usuario en la DB */}
                    <TouchableOpacity 
                      style={[styles.buttonSmall, {marginTop:10, backgroundColor:'#e74c3c'}]} 
                      onPress={() => handleDeleteUserData(item.id)}
                    >
                      <Text style={styles.buttonTextSmall}>Borrar Datos</Text>
                    </TouchableOpacity>

                    {/* Botón para editar datos del usuario */}
                    <TouchableOpacity 
                      style={[styles.buttonSmall, {marginTop:10, backgroundColor:'#f1c40f'}]} 
                      onPress={() => handleOpenEditUser(item)}
                    >
                      <Text style={styles.buttonTextSmall}>Modificar Datos</Text>
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

      {/* Modal de confirmación para borrar datos */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Atención</Text>
            <Text style={styles.modalMessage}>
              Esta acción borrará los datos del usuario de la base de datos, pero NO eliminará su cuenta de autenticación.
              ¿Deseas continuar?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonConfirm} 
                onPress={confirmDeleteUserData}
              >
                <Text style={styles.modalButtonText}>Sí, borrar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalButtonCancel} 
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para editar datos del usuario */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Modificar Datos del Usuario</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre"
              value={editFirstName}
              onChangeText={setEditFirstName}
            />
            <TextInput
              style={styles.input}
              placeholder="Apellido"
              value={editLastName}
              onChangeText={setEditLastName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonConfirm} 
                onPress={handleEditUserSubmit}
              >
                <Text style={styles.modalButtonText}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalButtonCancel} 
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
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

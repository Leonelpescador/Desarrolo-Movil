import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  TouchableOpacity, Alert, ActivityIndicator
} from 'react-native';
import { doc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { Picker } from '@react-native-picker/picker';
import { db } from '../../src/firebase';
import { useCompleteUserData } from '../../src/hooks/useCompleteUserData';

export default function EditarUsuario({ route, navigation }) {
  const { userData } = route.params;

  const { perfil, loading: loadingPerfil } = useCompleteUserData();

  const [username, setUsername] = useState(userData.username);
  const [email, setEmail] = useState(userData.email);
  const [tipoUsuario, setTipoUsuario] = useState(userData.tipo_usuario);
  const [aceptoTerminos, setAceptoTerminos] = useState(userData.acepto_terminos);
  const [loading, setLoading] = useState(false);
  const [tipos, setTipos] = useState([]);

  const esAdmin = perfil?.tipo_usuario === 'admin';

  useEffect(() => {
    const fetchTiposUsuario = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'tipos_usuario'));
        const tiposData = snapshot.docs.map(doc => doc.data().nombre);
        setTipos(tiposData);
      } catch (error) {
        console.error("Error cargando tipos de usuario:", error);
      }
    };
    if (esAdmin) fetchTiposUsuario();
  }, [esAdmin]);

  const handleGuardar = async () => {
    setLoading(true);
    try {
      const ref = doc(db, 'perfiles_usuarios', userData.id);
      const updateData = {
        username,
        email,
      };

      if (esAdmin) {
        updateData.tipo_usuario = tipoUsuario;
      }

      await updateDoc(ref, updateData);
      Alert.alert('Éxito', 'Usuario actualizado correctamente');
      navigation.goBack();
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      Alert.alert('Error', 'No se pudo actualizar el usuario.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingPerfil) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Editar Usuario</Text>

      <Text style={styles.label}>Nombre de usuario</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
      />

      <Text style={styles.label}>Correo electrónico</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      {/* SOLO ADMIN VE ESTO */}
      {esAdmin && (
        <>
          <Text style={styles.label}>Tipo de Usuario</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={tipoUsuario}
              onValueChange={(itemValue) => setTipoUsuario(itemValue)}
            >
              <Picker.Item label="Seleccione un rol..." value="" />
              {tipos.map((tipo, index) => (
                <Picker.Item key={index} label={tipo} value={tipo} />
              ))}
            </Picker>
          </View>
        </>
      )}

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleGuardar}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Guardar Cambios</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#007bff', marginBottom: 20 },
  label: { fontSize: 16, color: '#555', marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginTop: 5,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: '#007bff',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

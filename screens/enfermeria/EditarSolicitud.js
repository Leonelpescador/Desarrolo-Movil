// screens/enfermeria/EditarSolicitud.js

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../src/firebase';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useCompleteUserData } from '../../src/hooks/useCompleteUserData';

export default function EditarSolicitud() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params;
  const { user, perfil } = useCompleteUserData();

  const [solicitud, setSolicitud] = useState(null);
  const [loading, setLoading] = useState(true);

  const [nombrePaciente, setNombrePaciente] = useState('');
  const [apellidoPaciente, setApellidoPaciente] = useState('');
  const [detalles, setDetalles] = useState('');
  const [estado, setEstado] = useState('');

  useEffect(() => {
    const fetchSolicitud = async () => {
      try {
        const docRef = doc(db, 'solicitudes_enfermeria', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setSolicitud(data);
          setNombrePaciente(data.nombre_paciente);
          setApellidoPaciente(data.apellido_paciente);
          setDetalles(data.detalles || '');
          setEstado(data.estado);
        } else {
          Alert.alert('Error', 'Solicitud no encontrada.');
          navigation.goBack();
        }
      } catch (error) {
        Alert.alert('Error', 'No se pudo cargar la solicitud.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchSolicitud();
  }, [id]);

  const puedeEditar = () => {
    if (!solicitud) return false;

    const tipo = perfil?.tipo_usuario;
    const creador = solicitud.enfermero;
    const entregado = solicitud.estado === 'entregado';
    const fecha = solicitud.fecha_creacion?.toDate?.() || new Date(solicitud.fecha_creacion);
    const minutosPasados = (Date.now() - fecha.getTime()) / 60000;

    if (tipo === 'admin' || tipo === 'Farmacia') return true;
    if ((tipo === 'enfermero' || tipo === 'sup-enfermero') && user?.displayName === creador) {
      return !entregado && minutosPasados <= 240;
    }
    return false;
  };

  const handleGuardar = async () => {
    if (!puedeEditar()) {
      Alert.alert('Acceso denegado', 'No puedes editar esta solicitud.');
      return;
    }

    try {
      const docRef = doc(db, 'solicitudes_enfermeria', id);
      await updateDoc(docRef, {
        nombre_paciente: nombrePaciente.trim(),
        apellido_paciente: apellidoPaciente.trim(),
        detalles: detalles.trim(),
        ultima_edicion: serverTimestamp(),
      });

      Alert.alert('Éxito', 'Solicitud actualizada correctamente.');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo actualizar la solicitud.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  if (!puedeEditar()) {
    return (
      <View style={styles.centered}>
        <Text style={{ fontSize: 16, textAlign: 'center' }}>
          No tienes permiso para editar esta solicitud.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Editar Solicitud</Text>

      <Text style={styles.label}>Nombre del Paciente</Text>
      <TextInput
        style={styles.input}
        value={nombrePaciente}
        onChangeText={setNombrePaciente}
      />

      <Text style={styles.label}>Apellido del Paciente</Text>
      <TextInput
        style={styles.input}
        value={apellidoPaciente}
        onChangeText={setApellidoPaciente}
      />

      <Text style={styles.label}>Suministros Usados</Text>
      <TextInput
        style={[styles.input, { height: 100 }]}
        value={detalles}
        onChangeText={setDetalles}
        multiline
      />

      <TouchableOpacity style={styles.button} onPress={handleGuardar}>
        <Text style={styles.buttonText}>Guardar Cambios</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

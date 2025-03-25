import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, StyleSheet, Image, Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../src/firebase';
import Base from '../../components/NavBar';
import { useCompleteUserData } from '../../src/hooks/useCompleteUserData';

export default function ListarUsuarios() {
  const navigation = useNavigation();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  const { perfil, user, loading: loadingUser } = useCompleteUserData();

  const fetchUsuarios = async () => {
    try {
      if (!perfil) return;

      if (perfil.tipo_usuario === 'admin') {
        // Admin: ver todos los usuarios
        const ref = collection(db, 'perfiles_usuarios');
        const snapshot = await getDocs(ref);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsuarios(data);
      } else {
        // No admin: ver solo su propio perfil
        const ref = doc(db, 'perfiles_usuarios', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setUsuarios([{ id: snap.id, ...snap.data() }]);
        } else {
          Alert.alert('Perfil no encontrado', 'No se encontró tu perfil.');
        }
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      Alert.alert('Error', 'No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadingUser) {
      fetchUsuarios();
    }
  }, [loadingUser]);

  const renderUsuario = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Image
          source={item.foto_perfil ? { uri: item.foto_perfil } : require('../../assets/fotodeperfil_fixed.png')}
          style={styles.avatar}
        />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.email}>{item.email}</Text>
          <Text style={styles.rol}>{item.tipo_usuario}</Text>
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('EditarUsuario', { userData: item })}
        >
          <Text style={styles.editButtonText}>Editar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Base>
      <View style={styles.container}>
        <Text style={styles.title}>Usuarios registrados</Text>
        {loading || loadingUser ? (
          <ActivityIndicator size="large" color="#007bff" />
        ) : (
          <FlatList
            data={usuarios}
            keyExtractor={(item) => item.id}
            renderItem={renderUsuario}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>
    </Base>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 16,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderColor: '#007bff',
    borderWidth: 2,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
  },
  email: {
    fontSize: 14,
    color: '#555',
  },
  rol: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  editButton: {
    backgroundColor: '#007bff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

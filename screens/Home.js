import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image, Modal, Pressable, ScrollView, SafeAreaView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth, db } from '../src/config/firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';

export default function Home({ navigation }) {
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [catalogs, setCatalogs] = useState([]);
  const [products, setProducts] = useState([]);

  // Cargar catálogos
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'catalogs'), (snapshot) => {
      const catalogList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCatalogs(catalogList);
    });
    return () => unsubscribe();
  }, []);

  // Cargar productos
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
      const productList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productList);
    });
    return () => unsubscribe();
  }, []);

  const handleLogOut = async () => {
    try {
      await signOut(auth);
      Alert.alert('Sesión cerrada', 'Has cerrado sesión correctamente.');
      navigation.replace('Login');
    } catch (error) {
      Alert.alert('Error', 'Hubo un problema al cerrar sesión.');
    }
  };

  // Función para estructurar los catálogos con sus productos
  const getCatalogsWithProducts = () => {
    return catalogs.map(catalog => {
      const catProducts = products.filter(prod => prod.catalogId === catalog.id);
      return { ...catalog, products: catProducts };
    });
  };

  const catalogsWithProducts = getCatalogsWithProducts();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Modal de confirmación de Logout */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={logoutModalVisible}
          onRequestClose={() => setLogoutModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalText}>¿Deseas cerrar sesión?</Text>
              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.modalButton, { backgroundColor: '#e74c3c' }]}
                  onPress={() => {
                    setLogoutModalVisible(false);
                    handleLogOut();
                  }}
                >
                  <Text style={styles.modalButtonText}>Salir</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, { backgroundColor: '#3498db' }]}
                  onPress={() => setLogoutModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancelar</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Encabezado */}
        <View style={styles.header}>
          <View style={styles.profileContainer}>
            <Image source={require('../assets/avatar.png')} style={styles.profileImage} />
            <Text style={styles.greeting}>Hola, bienvenida</Text>
          </View>
          <TouchableOpacity onPress={() => setLogoutModalVisible(true)} style={styles.logoutButton}>
            <FontAwesome name="sign-out" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Contenido principal con lista de catálogos y productos */}
        <View style={styles.content}>
          <Text style={styles.placeholderText}>¡Gestiona tu tienda de ropa!</Text>
          <ScrollView style={styles.catalogContainer}>
            {catalogsWithProducts.length === 0 ? (
              <Text style={styles.noDataText}>No hay catálogos disponibles</Text>
            ) : (
              catalogsWithProducts.map((catalog) => (
                <View key={catalog.id} style={styles.catalogItem}>
                  <Text style={styles.catalogTitle}>{catalog.name}</Text>
                  {catalog.products.length === 0 ? (
                    <Text style={styles.noDataText}>No hay productos en este catálogo</Text>
                  ) : (
                    catalog.products.map((product) => (
                      <Text key={product.id} style={styles.productText}>
                        - {product.name} (${product.price})
                      </Text>
                    ))
                  )}
                </View>
              ))
            )}
          </ScrollView>
        </View>

        {/* Barra de acciones en la parte inferior */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('CatalogList')}
          >
            <FontAwesome name="th-large" size={24} color="#fff" />
            <Text style={styles.actionText}>Catálogos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('CreateCatalog')}
          >
            <FontAwesome name="plus" size={24} color="#fff" />
            <Text style={styles.actionText}>Nuevo Catálogo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <FontAwesome name="cog" size={24} color="#fff" />
            <Text style={styles.actionText}>Configuración</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff'
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#a8e063',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  greeting: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoutButton: {
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 50,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  placeholderText: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 20,
    textAlign: 'center',
  },
  catalogContainer: {
    flex: 1,
  },
  catalogItem: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  catalogTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  productText: {
    fontSize: 16,
    marginLeft: 10,
  },
  noDataText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#888',
    marginLeft: 10,
    marginTop: 5,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: '#3498db',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
  },
  // Estilos para el modal de confirmación
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

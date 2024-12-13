import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  Alert, 
  Modal, 
  TextInput, 
  Dimensions, 
  Animated, 
  Easing 
} from 'react-native';
import { 
  collection, 
  onSnapshot, 
  doc, 
  deleteDoc, 
  addDoc, 
  updateDoc, 
  serverTimestamp, 
  getDoc 
} from 'firebase/firestore';
import { db } from '../src/config/firebaseConfig';
import { FontAwesome } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function CatalogList({ navigation }) {
  const [catalogs, setCatalogs] = useState([]);
  const [productCounts, setProductCounts] = useState({});
  const [productDetails, setProductDetails] = useState({});

  // Modales
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  // Modo de eliminación de productos
  const [isProductDeleteMode, setIsProductDeleteMode] = useState(false);

  // Selección de catálogo para eliminar o editar
  const [selectedCatalog, setSelectedCatalog] = useState(null);

  // Campos para crear y editar
  const [catalogName, setCatalogName] = useState('');

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current; // Para modales
  const slideAnim = useRef(new Animated.Value(50)).current; // Para modales
  const cardFadeAnim = useRef(new Animated.Value(0)).current; // Para tarjetas
  const cardSlideAnim = useRef(new Animated.Value(50)).current; // Para tarjetas

  useEffect(() => {
    // Escuchar cambios en la colección de catálogos
    const unsubscribeCatalogs = onSnapshot(collection(db, 'catalogs'), snapshot => {
      const catList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCatalogs(catList);
    });

    // Escuchar cambios en la colección de productos para contar y almacenar detalles por catálogo
    const unsubscribeProducts = onSnapshot(collection(db, 'products'), snapshot => {
      const counts = {};
      const details = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const catalogId = data.catalogId;
        if (catalogId) {
          // Contar productos por catálogo
          counts[catalogId] = (counts[catalogId] || 0) + 1;

          // Almacenar detalles de productos por catálogo
          if (!details[catalogId]) {
            details[catalogId] = [];
          }
          details[catalogId].push({ id: doc.id, name: data.name });
        }
      });
      setProductCounts(counts);
      setProductDetails(details);
    });

    // Limpiar listeners al desmontar el componente
    return () => {
      unsubscribeCatalogs();
      unsubscribeProducts();
    };
  }, []);

  useEffect(() => {
    if (isCreateModalVisible || isEditModalVisible || isDeleteModalVisible) {
      // Iniciar animación de apertura del modal
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
      ]).start();
    } else {
      // Iniciar animación de cierre del modal
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
        }),
      ]).start();
    }
  }, [isCreateModalVisible, isEditModalVisible, isDeleteModalVisible]);

  // Funciones para manejar la eliminación de catálogos
  const handleDeleteCatalog = async () => {
    if (productCounts[selectedCatalog.id] > 0) {
      // Si el catálogo tiene productos, activa el modo de eliminación de productos
      setIsProductDeleteMode(true);
    } else {
      // Si no tiene productos, procede a eliminar el catálogo
      try {
        await deleteDoc(doc(db, 'catalogs', selectedCatalog.id));
        Alert.alert('Éxito', 'Catálogo eliminado correctamente.');
        setIsDeleteModalVisible(false);
        setSelectedCatalog(null);
      } catch (error) {
        Alert.alert('Error', 'No se pudo eliminar el catálogo.');
        console.error("Error eliminando catálogo:", error);
      }
    }
  };

  const openDeleteModal = (catalog) => {
    setSelectedCatalog(catalog);
    setIsDeleteModalVisible(true);
  };

  // Funciones para manejar la creación de catálogos
  const openCreateModal = () => {
    setCatalogName('');
    setIsCreateModalVisible(true);
  };

  const handleCreateCatalog = async () => {
    if (!catalogName.trim()) {
      Alert.alert('Error', 'El nombre del catálogo no puede estar vacío.');
      return;
    }

    try {
      await addDoc(collection(db, 'catalogs'), {
        name: catalogName,
        createdAt: serverTimestamp()
      });
      Alert.alert('Éxito', 'Catálogo creado exitosamente.');
      setIsCreateModalVisible(false);
      setCatalogName('');
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo crear el catálogo.');
    }
  };

  // Funciones para manejar la edición de catálogos
  const openEditModal = (catalog) => {
    setSelectedCatalog(catalog);
    setCatalogName(catalog.name);
    setIsEditModalVisible(true);
  };

  const handleUpdateCatalog = async () => {
    if (!catalogName.trim()) {
      Alert.alert('Error', 'El nombre del catálogo no puede estar vacío.');
      return;
    }

    try {
      const ref = doc(db, 'catalogs', selectedCatalog.id);
      await updateDoc(ref, { name: catalogName });
      Alert.alert('Éxito', 'Catálogo actualizado.');
      setIsEditModalVisible(false);
      setSelectedCatalog(null);
      setCatalogName('');
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo actualizar el catálogo.');
    }
  };

  // Animación para las tarjetas
  useEffect(() => {
    // Animar las tarjetas al cargar
    Animated.parallel([
      Animated.timing(cardFadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(cardSlideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
    ]).start();
  }, []);

  // Función para eliminar un producto
  const handleDeleteProduct = async (catalogId, productId, productName) => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Estás seguro de eliminar el producto "${productName}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'products', productId));
              Alert.alert('Éxito', `Producto "${productName}" eliminado correctamente.`);
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el producto.');
              console.error(`Error eliminando producto ${productId}:`, error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Renderiza cada catálogo como una tarjeta con animaciones
  const renderItem = ({ item, index }) => (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: cardFadeAnim,
          transform: [{ translateY: cardSlideAnim }],
        },
      ]}
    >
      <TouchableOpacity 
        style={styles.cardContent} 
        onPress={() => navigation.navigate('CatalogDetail', { catalogId: item.id, catalogName: item.name })}
        accessibilityLabel={`Ver detalles del catálogo ${item.name}`}
      >
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardSubtext}>Toca para ver productos</Text>
        <Text style={styles.productCount}>Productos: {productCounts[item.id] || 0}</Text>
        {productDetails[item.id] && productDetails[item.id].length > 0 && (
          <View style={styles.productNamesContainer}>
            <Text style={styles.productNamesTitle}>Productos:</Text>
            {productDetails[item.id].map((product, idx) => (
              <Text key={product.id} style={styles.productName}>
                • {product.name}
              </Text>
            ))}
          </View>
        )}
      </TouchableOpacity>
      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.editButton} 
          onPress={() => openEditModal(item)}
          accessibilityLabel={`Editar catálogo ${item.name}`}
        >
          <FontAwesome name="edit" size={16} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={() => openDeleteModal(item)}
          accessibilityLabel={`Borrar catálogo ${item.name}`}
        >
          <FontAwesome name="trash" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Tus Catálogos</Text>
      <Text style={styles.headerSubtitle}>
        Administra y visualiza tus catálogos. Toca en uno para ver sus productos.
      </Text>
      <TouchableOpacity 
        style={styles.createButton} 
        onPress={openCreateModal}
        accessibilityLabel="Crear un nuevo catálogo"
      >
        <FontAwesome name="plus" size={16} color="#fff" style={{marginRight:5}} />
        <Text style={styles.createButtonText}>Crear Catálogo</Text>
      </TouchableOpacity>
      <FlatList
        data={catalogs}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={{paddingHorizontal:10, paddingBottom:20}}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No hay catálogos aún. Crea uno para comenzar.
          </Text>
        }
      />

      {/* Modal para eliminar catálogo */}
      <Modal visible={isDeleteModalVisible} transparent={true} animationType="none">
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
          <Animated.View style={[
            styles.deleteModalContainer, 
            { 
              transform: [{ translateY: slideAnim }] 
            }
          ]}>
            {/* Botón de cerrar (X) */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setIsDeleteModalVisible(false);
                setSelectedCatalog(null);
                setIsProductDeleteMode(false); // Reiniciar el modo de eliminación de productos
              }}
            >
              <Text style={styles.closeButtonText}>✖</Text>
            </TouchableOpacity>

            {/* Contenido del modal */}
            {isProductDeleteMode ? (
              <>
                <Text style={styles.modalTitle}>Eliminar Productos</Text>
                <Text style={styles.modalMessage}>
                  Este catálogo contiene productos. Elimina los productos individualmente antes de eliminar el catálogo.
                </Text>
                <FlatList
                  data={productDetails[selectedCatalog.id] || []}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <View style={styles.productItemContainer}>
                      <Text style={styles.productNameText}>• {item.name}</Text>
                      <TouchableOpacity 
                        style={styles.trashButton} 
                        onPress={() => handleDeleteProduct(selectedCatalog.id, item.id, item.name)}
                        accessibilityLabel={`Eliminar producto ${item.name}`}
                      >
                        <FontAwesome name="trash" size={20} color="#e74c3c" />
                      </TouchableOpacity>
                    </View>
                  )}
                  ListEmptyComponent={
                    <Text style={styles.noProductsText}>No hay productos para eliminar.</Text>
                  }
                />
                <TouchableOpacity
                  style={styles.closeButtonLarge}
                  onPress={() => {
                    setIsDeleteModalVisible(false);
                    setSelectedCatalog(null);
                    setIsProductDeleteMode(false);
                  }}
                >
                  <Text style={styles.buttonText}>Cerrar</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>Eliminar Catálogo</Text>
                <Text style={styles.modalMessage}>
                  ¿Estás seguro de eliminar "{selectedCatalog?.name}"? Esta acción no se puede deshacer.
                </Text>
                <TouchableOpacity
                  style={styles.deleteButtonLarge}
                  onPress={handleDeleteCatalog}
                  accessibilityLabel={`Eliminar catálogo ${selectedCatalog?.name}`}
                >
                  <Text style={styles.buttonText}>Eliminar</Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Modal para crear catálogo */}
      <Modal visible={isCreateModalVisible} transparent={true} animationType="none">
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
          <Animated.View style={[
            styles.createModalContainer, 
            { 
              transform: [{ translateY: slideAnim }] 
            }
          ]}>
            {/* Botón de cerrar (X) */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setIsCreateModalVisible(false);
                setCatalogName('');
              }}
            >
              <Text style={styles.closeButtonText}>✖</Text>
            </TouchableOpacity>

            {/* Contenido del modal */}
            <Text style={styles.modalTitle}>Crear Catálogo</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre del catálogo"
              value={catalogName}
              onChangeText={setCatalogName}
            />
            <TouchableOpacity style={styles.button} onPress={handleCreateCatalog}>
              <Text style={styles.buttonText}>Crear</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => {
                setIsCreateModalVisible(false);
                setCatalogName('');
              }}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Modal para editar catálogo */}
      <Modal visible={isEditModalVisible} transparent={true} animationType="none">
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
          <Animated.View style={[
            styles.editModalContainer, 
            { 
              transform: [{ translateY: slideAnim }] 
            }
          ]}>
            {/* Botón de cerrar (X) */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setIsEditModalVisible(false);
                setSelectedCatalog(null);
                setCatalogName('');
              }}
            >
              <Text style={styles.closeButtonText}>✖</Text>
            </TouchableOpacity>

            {/* Contenido del modal */}
            <Text style={styles.modalTitle}>Editar Catálogo</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre del catálogo"
              value={catalogName}
              onChangeText={setCatalogName}
            />
            <TouchableOpacity style={styles.button} onPress={handleUpdateCatalog}>
              <Text style={styles.buttonText}>Actualizar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => {
                setIsEditModalVisible(false);
                setSelectedCatalog(null);
                setCatalogName('');
              }}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 20,
  },
  headerTitle:{
    fontSize:22,
    fontWeight:'bold',
    textAlign:'center',
    marginBottom:5,
    color:'#2c3e50'
  },
  headerSubtitle:{
    fontSize:14,
    textAlign:'center',
    color:'#7f8c8d',
    marginBottom:20,
    marginHorizontal:20
  },
  createButton:{
    flexDirection:'row',
    backgroundColor:'#2ecc71',
    padding:15,
    marginHorizontal:20,
    marginBottom:20,
    borderRadius:8,
    alignItems:'center',
    justifyContent:'center'
  },
  createButtonText:{
    color:'#fff',
    fontWeight:'bold',
    fontSize:16
  },
  card: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    margin: 5,
    width: (width / 2) - 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  cardContent: {
    flex: 1,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#2c3e50',
  },
  cardSubtext: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  productCount: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  productNamesContainer: {
    marginTop: 8,
  },
  productNamesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c3e50',
  },
  productName: {
    fontSize: 12,
    color: '#34495e',
  },
  cardActions:{
    flexDirection:'row',
    justifyContent:'flex-end',
  },
  editButton:{
    backgroundColor:'#3498db',
    padding:10,
    borderRadius:8,
    marginRight:10
  },
  deleteButton:{
    backgroundColor:'#e74c3c',
    padding:10,
    borderRadius:8
  },
  emptyText:{
    textAlign:'center',
    marginTop:20,
    color:'#7f8c8d',
    fontStyle:'italic'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  createModalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  editModalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#2c3e50',
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
    color: '#2c3e50',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'black',
    borderRadius: 15,
    padding: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  deleteButtonLarge: {
    backgroundColor: '#e74c3c',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
  },
  productItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderColor: '#ecf0f1',
  },
  productNameText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  trashButton: {
    padding: 5,
  },
  noProductsText: {
    textAlign: 'center',
    color: '#7f8c8d',
    fontStyle: 'italic',
    marginVertical: 20,
    fontSize: 16,
  },
  closeButtonLarge: {
    backgroundColor: '#7f8c8d',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
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
  button: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: '#7f8c8d',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

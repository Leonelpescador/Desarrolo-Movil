import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, TextInput, Modal, Dimensions } from 'react-native';
import { collection, onSnapshot, doc, deleteDoc, query, where, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../src/config/firebaseConfig';

const { width } = Dimensions.get('window');

export default function CatalogDetail({ route }) {
  const { catalogId, catalogName } = route.params;
  const [products, setProducts] = useState([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productStock, setProductStock] = useState('');

  // Cargar productos del catálogo
  useEffect(() => {
    const q = query(collection(db, 'products'), where('catalogId', '==', catalogId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProducts(productList);
    });
    return unsubscribe;
  }, [catalogId]);

  // Función para abrir el modal de edición con datos del producto seleccionado
  const openEditModal = (product) => {
    setSelectedProduct(product);
    setProductName(product.name);
    setProductPrice(product.price.toString());
    setProductStock(product.stock.toString());
    setIsEditModalVisible(true);
  };

  // Función para abrir el modal de eliminación
  const openDeleteModal = (product) => {
    setSelectedProduct(product);
    setIsDeleteModalVisible(true);
  };

  // Función para abrir el modal de añadir producto y resetear campos
  const openAddModal = () => {
    resetFields();
    setIsAddModalVisible(true);
  };

  // Función para manejar el añadido de productos
  const handleAddProduct = async () => {
    if (!productName.trim() || !productPrice.trim() || !productStock.trim()) {
      Alert.alert('Error', 'Todos los campos son obligatorios.');
      return;
    }

    const priceValue = parseFloat(productPrice);
    const stockValue = parseInt(productStock, 10);

    if (isNaN(priceValue) || isNaN(stockValue)) {
      Alert.alert('Error', 'Precio y Cantidad en Stock deben ser valores numéricos.');
      return;
    }

    try {
      await addDoc(collection(db, 'products'), {
        name: productName,
        price: priceValue,
        stock: stockValue,
        catalogId,
        createdAt: new Date(),
      });
      Alert.alert('Éxito', 'Producto agregado correctamente.');
      setIsAddModalVisible(false);
      resetFields();
    } catch (error) {
      Alert.alert('Error', 'No se pudo agregar el producto.');
    }
  };

  // Función para manejar la edición de productos
  const handleUpdateProduct = async () => {
    if (!productName.trim() || !productPrice.trim() || !productStock.trim()) {
      Alert.alert('Error', 'Todos los campos son obligatorios.');
      return;
    }

    try {
      await updateDoc(doc(db, 'products', selectedProduct.id), {
        name: productName,
        price: parseFloat(productPrice),
        stock: parseInt(productStock, 10),
      });
      Alert.alert('Éxito', 'Producto actualizado correctamente.');
      setIsEditModalVisible(false);
      resetFields();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el producto.');
    }
  };

  // Función para manejar la eliminación de productos
  const handleDeleteProduct = async () => {
    try {
      await deleteDoc(doc(db, 'products', selectedProduct.id));
      Alert.alert('Éxito', 'Producto eliminado correctamente.');
      setIsDeleteModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar el producto.');
    }
  };

  // Reinicia los campos del formulario
  const resetFields = () => {
    setProductName('');
    setProductPrice('');
    setProductStock('');
    setSelectedProduct(null);
  };

  // Renderiza cada producto como una tarjeta
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.name}</Text>
      <Text style={styles.cardText}>Precio: ${item.price.toFixed(2)}</Text>
      <Text style={styles.cardText}>Stock: {item.stock}</Text>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(item)}>
          <Text style={styles.actionText}>📝</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => openDeleteModal(item)}>
          <Text style={styles.actionText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Productos de {catalogName}</Text>
      <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
        <Text style={styles.addButtonText}>Agregar Producto</Text>
      </TouchableOpacity>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={{ padding: 10, paddingBottom: 80 }}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No hay productos</Text>}
      />

      {/* Modal para añadir producto */}
      <Modal visible={isAddModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Agregar Producto</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre"
              value={productName}
              onChangeText={setProductName}
            />
            <TextInput
              style={styles.input}
              placeholder="Precio"
              value={productPrice}
              onChangeText={setProductPrice}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Stock"
              value={productStock}
              onChangeText={setProductStock}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.button} onPress={handleAddProduct}>
              <Text style={styles.buttonText}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setIsAddModalVisible(false)}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal para editar producto */}
      <Modal visible={isEditModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Editar Producto</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre"
              value={productName}
              onChangeText={setProductName}
            />
            <TextInput
              style={styles.input}
              placeholder="Precio"
              value={productPrice}
              onChangeText={setProductPrice}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Stock"
              value={productStock}
              onChangeText={setProductStock}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.button} onPress={handleUpdateProduct}>
              <Text style={styles.buttonText}>Actualizar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditModalVisible(false)}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal para eliminar producto */}
      <Modal visible={isDeleteModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContainer}>
            {/* Botón de cerrar (X) */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsDeleteModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>✖</Text>
            </TouchableOpacity>

            {/* Contenido del modal */}
            <Text style={styles.modalTitle}>Eliminar Producto</Text>
            <Text style={styles.modalMessage}>
              ¿Estás seguro de eliminar "{selectedProduct?.name}"?
            </Text>

            {/* Botón de eliminar centrado */}
            <TouchableOpacity
              style={styles.deleteButtonLarge}
              onPress={handleDeleteProduct}
            >
              <Text style={styles.buttonText}>Eliminar</Text>
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
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  addButton: {
    backgroundColor: '#2ecc71',
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#2c3e50',
  },
  cardText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#34495e',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  editButton: {
    backgroundColor: '#3498db',
    padding: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    padding: 8,
    borderRadius: 8,
  },
  actionText: {
    color: '#fff',
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
  deleteModalContainer: {
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
    backgroundColor: '#2ecc71',
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
  cancelButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
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
  },
});

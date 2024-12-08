// src/screens/CatalogDetail.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { collection, onSnapshot, doc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../src/config/firebaseConfig';

export default function CatalogDetail({ route, navigation }) {
  const { catalogId, catalogName } = route.params;
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'products'), where('catalogId', '==', catalogId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProducts(productList);
    });
    return unsubscribe;
  }, [catalogId]);

  const handleDeleteProduct = async (id) => {
    Alert.alert(
      "Eliminar Producto",
      "¿Estás seguro de eliminar este producto?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'products', id));
              Alert.alert("Éxito", "Producto eliminado correctamente.");
            } catch (error) {
              Alert.alert("Error", "No se pudo eliminar el producto.");
              console.error("Error eliminando producto:", error);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.itemText}>{item.name} - ${item.price}</Text>
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('EditProduct', { productId: item.id, catalogId })}
          accessible={true}
          accessibilityLabel="Editar producto"
        >
          <Text style={styles.actionText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteProduct(item.id)}
          accessible={true}
          accessibilityLabel="Borrar producto"
        >
          <Text style={styles.actionText}>Borrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Productos de {catalogName}</Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddProduct', { catalogId })}
      >
        <Text style={styles.addButtonText}>Agregar Producto</Text>
      </TouchableOpacity>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20, paddingBottom: 80 }}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No hay productos</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', margin: 20 },
  addButton: {
    backgroundColor: '#2ecc71',
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  item: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemText: { flex: 1, fontSize: 16, fontWeight: '600', marginRight: 10 },
  itemActions: { flexDirection: 'row' },
  editButton: { backgroundColor: '#3498db', padding: 8, borderRadius: 8, marginRight: 10 },
  deleteButton: { backgroundColor: '#e74c3c', padding: 8, borderRadius: 8 },
  actionText: { color: '#fff', fontWeight: 'bold' },
});

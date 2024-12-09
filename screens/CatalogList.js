import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { collection, onSnapshot, doc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../src/config/firebaseConfig';
import { FontAwesome } from '@expo/vector-icons';

export default function CatalogList({ navigation }) {
  const [catalogs, setCatalogs] = useState([]);
  const [productCounts, setProductCounts] = useState({}); // Estado para contar productos por catálogo
  const [productDetails, setProductDetails] = useState({}); // Estado para almacenar nombres de productos por catálogo

  useEffect(() => {
    // Escuchar cambios en la colección de catálogos
    const unsubscribeCatalogs = onSnapshot(collection(db, 'catalogs'), snapshot => {
      const catList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCatalogs(catList);
    });

    // Escuchar cambios en la colección de productos para contar y almacenar nombres por catálogo
    const unsubscribeProducts = onSnapshot(collection(db, 'products'), snapshot => {
      const counts = {};
      const details = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const catalogId = data.catalogId;
        if (catalogId) {
          // Contar productos por catálogo
          counts[catalogId] = (counts[catalogId] || 0) + 1;

          // Almacenar nombres de productos por catálogo
          if (!details[catalogId]) {
            details[catalogId] = [];
          }
          details[catalogId].push(data.name);
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

  const handleDeleteCatalog = async (id) => {
    Alert.alert(
      "Eliminar Catálogo",
      "¿Estás seguro de eliminar este catálogo? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async() => {
            try {
              await deleteDoc(doc(db, 'catalogs', id));
              Alert.alert('Catálogo Eliminado', 'El catálogo ha sido eliminado correctamente.');
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el catálogo.');
              console.error("Error eliminando catálogo:", error);
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <TouchableOpacity 
        style={styles.itemContent} 
        onPress={() => navigation.navigate('CatalogDetail', { catalogId: item.id, catalogName: item.name })}
        accessibilityLabel={`Ver detalles del catálogo ${item.name}`}
      >
        <Text style={styles.itemText}>{item.name}</Text>
        <Text style={styles.itemSubtext}>Toca para ver productos</Text>
        {/* Mostrar la cantidad de productos */}
        <Text style={styles.productCount}>Productos: {productCounts[item.id] || 0}</Text>
        {/* Mostrar nombres de productos */}
        {productDetails[item.id] && productDetails[item.id].length > 0 && (
          <View style={styles.productNamesContainer}>
            <Text style={styles.productNamesTitle}>Productos:</Text>
            {productDetails[item.id].map((productName, index) => (
              <Text key={index} style={styles.productName}>
                • {productName}
              </Text>
            ))}
          </View>
        )}
      </TouchableOpacity>
      <View style={styles.itemActions}>
        <TouchableOpacity 
          style={styles.editButton} 
          onPress={() => navigation.navigate('EditCatalog', { catalogId: item.id, catalogName: item.name })}
          accessibilityLabel={`Editar catálogo ${item.name}`}
        >
          <FontAwesome name="edit" size={16} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={() => handleDeleteCatalog(item.id)}
          accessibilityLabel={`Borrar catálogo ${item.name}`}
        >
          <FontAwesome name="trash" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Tus Catálogos</Text>
      <Text style={styles.headerSubtitle}>Administra y visualiza tus catálogos. Toca en uno para ver sus productos.</Text>
      <TouchableOpacity 
        style={styles.createButton} 
        onPress={() => navigation.navigate('CreateCatalog')}
        accessibilityLabel="Crear un nuevo catálogo"
      >
        <FontAwesome name="plus" size={16} color="#fff" style={{marginRight:5}} />
        <Text style={styles.createButtonText}>Crear Catálogo</Text>
      </TouchableOpacity>
      <FlatList
        data={catalogs}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{paddingHorizontal:20, paddingBottom:20}}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay catálogos aún. Crea uno para comenzar.</Text>}
      />
    </View>
  );
}

const styles=StyleSheet.create({
  container:{flex:1,backgroundColor:'#fff',paddingTop:20},
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
  createButtonText:{color:'#fff',fontWeight:'bold',fontSize:16},
  item:{
    backgroundColor:'#f9f9f9',
    padding:15,
    borderRadius:8,
    marginBottom:10,
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'space-between'
  },
  itemContent:{
    flex:1,
    marginRight:10
  },
  itemText:{
    fontSize:16,
    fontWeight:'600',
    color:'#2c3e50',
    marginBottom:4
  },
  itemSubtext:{
    fontSize:12,
    color:'#7f8c8d'
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
  itemActions:{flexDirection:'row'},
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
  }
});

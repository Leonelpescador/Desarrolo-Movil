import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../src/config/firebaseConfig';

export default function EditProduct({ route, navigation }) {
  const { productId } = route.params;
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productStock, setProductStock] = useState(''); // Agregamos el campo de stock

  useEffect(() => {
    const loadProduct = async () => {
      const productRef = doc(db, 'products', productId);
      const snap = await getDoc(productRef);
      if (snap.exists()) {
        const data = snap.data();
        setProductName(data.name);
        setProductPrice(data.price.toString());
        if (data.stock !== undefined) { // Cargamos el stock si existe en el documento
          setProductStock(data.stock.toString());
        }
      }
    };
    loadProduct();
  }, [productId]);

  const handleUpdateProduct = async () => {
    if (!productName.trim() || !productPrice.trim() || !productStock.trim()) {
      Alert.alert('Error', 'Todos los campos son obligatorios.');
      return;
    }

    try {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        name: productName,
        price: parseFloat(productPrice),
        stock: parseInt(productStock, 10) // Actualizamos el stock
      });
      Alert.alert('Éxito', 'Producto actualizado.');
      navigation.goBack();
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo actualizar el producto.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Editar Producto</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre del producto"
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
      {/* Campo para editar el stock */}
      <TextInput
        style={styles.input}
        placeholder="Cantidad en Stock"
        value={productStock}
        onChangeText={setProductStock}
        keyboardType="numeric"
      />
      <TouchableOpacity style={styles.button} onPress={handleUpdateProduct}>
        <Text style={styles.buttonText}>Actualizar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#fff', padding:20, justifyContent:'center', alignItems:'center' },
  title:{ fontSize:22, fontWeight:'bold', marginBottom:20 },
  input:{ borderWidth:1, borderColor:'#ddd', borderRadius:8, padding:10, fontSize:16, marginBottom:10, width:'100%' },
  button:{ backgroundColor:'#2ecc71', paddingVertical:12, borderRadius:8, alignItems:'center', width:'100%', marginTop:10 },
  buttonText:{ color:'#fff', fontSize:16, fontWeight:'bold' }
});

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../src/config/firebaseConfig';

export default function AddProduct({ route, navigation }) {
  const { catalogId } = route.params;

  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');

  const handleAddProduct = async () => {
    if (!productName.trim() || !productPrice.trim()) {
      Alert.alert('Error', 'Todos los campos son obligatorios.');
      return;
    }

    try {
      await addDoc(collection(db, 'products'), {
        name: productName,
        price: parseFloat(productPrice),
        catalogId,
        createdAt: serverTimestamp()
      });
      Alert.alert('Éxito', 'Producto agregado correctamente.');
      navigation.goBack();
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo agregar el producto.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Agregar Producto</Text>
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
      <TouchableOpacity style={styles.button} onPress={handleAddProduct}>
        <Text style={styles.buttonText}>Agregar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#fff', padding:20, justifyContent:'center', alignItems:'center' },
  title: { fontSize:22, fontWeight:'bold', marginBottom:20 },
  input: { borderWidth:1, borderColor:'#ddd', borderRadius:8, padding:10, fontSize:16, marginBottom:10, width:'100%' },
  button: { backgroundColor:'#2ecc71', paddingVertical:12, borderRadius:8, alignItems:'center', width:'100%', marginTop:10 },
  buttonText: { color:'#fff', fontSize:16, fontWeight:'bold' }
});


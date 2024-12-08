// src/screens/EditCatalog.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../src/config/firebaseConfig';





export default function EditCatalog({ route, navigation }) {
  const { catalogId } = route.params;
  const [catalogName, setCatalogName] = useState('');

  useEffect(() => {
    const loadCatalog = async() => {
      const ref = doc(db, 'catalogs', catalogId);
      const snap = await getDoc(ref);
      if(snap.exists()) {
        const data = snap.data();
        setCatalogName(data.name);
      }
    }
    loadCatalog();
  },[catalogId]);

  const handleUpdate = async() => {
    if(!catalogName.trim()){
      Alert.alert('Error','El nombre no puede estar vacío.');
      return;
    }

    try {
      const ref = doc(db, 'catalogs', catalogId);
      await updateDoc(ref,{ name: catalogName });
      Alert.alert('Éxito','Catálogo actualizado.');
      navigation.goBack();
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo actualizar el catálogo.');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Editar Catálogo</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre del catálogo"
        value={catalogName}
        onChangeText={setCatalogName}
      />
      <TouchableOpacity style={styles.button} onPress={handleUpdate}>
        <Text style={styles.buttonText}>Actualizar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles=StyleSheet.create({
  container:{flex:1,justifyContent:'center',alignItems:'center',padding:20,backgroundColor:'#fff'},
  title:{fontSize:22,fontWeight:'bold',marginBottom:20},
  input:{borderWidth:1,borderColor:'#ddd',borderRadius:8,padding:10,fontSize:16,marginBottom:10,width:'100%'},
  button:{backgroundColor:'#3498db',paddingVertical:12,borderRadius:8,alignItems:'center',width:'100%',marginTop:10},
  buttonText:{color:'#fff',fontSize:16,fontWeight:'bold'}
});

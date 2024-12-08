
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../src/config/firebaseConfig';





export default function CreateCatalog({ navigation }) {
  const [catalogName, setCatalogName] = useState('');

  const handleCreate = async() => {
    if(!catalogName.trim()) {
      Alert.alert('Error', 'El nombre del catálogo no puede estar vacío.');
      return;
    }

    try {
      await addDoc(collection(db,'catalogs'), {
        name: catalogName,
        createdAt: serverTimestamp()
      });
      Alert.alert('Éxito','Catálogo creado exitosamente.');
      navigation.goBack();
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo crear el catálogo.');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear Catálogo</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre del catálogo"
        value={catalogName}
        onChangeText={setCatalogName}
      />
      <TouchableOpacity style={styles.button} onPress={handleCreate}>
        <Text style={styles.buttonText}>Crear</Text>
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

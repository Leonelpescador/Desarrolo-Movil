import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { auth, db } from '../src/config/firebaseConfig'; // Importa db
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { doc, setDoc } from 'firebase/firestore'; // Importa setDoc y doc de firestore

const SignUpSchema = Yup.object().shape({
  firstName: Yup.string()
    .trim()
    .required('El nombre es obligatorio.'),
  lastName: Yup.string()
    .trim()
    .required('El apellido es obligatorio.'),
  email: Yup.string()
    .email('Ingrese un correo electrónico válido.')
    .required('El correo electrónico es obligatorio.'),
  password: Yup.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres.')
    .matches(/[a-z]/, 'Debe contener al menos una letra minúscula.')
    .matches(/[A-Z]/, 'Debe contener al menos una letra mayúscula.')
    .matches(/\d/, 'Debe contener al menos un número.')
    .required('La contraseña es obligatoria.'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Las contraseñas no coinciden.')
    .required('La confirmación de la contraseña es obligatoria.'),
});

export default function SignUp({ navigation }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (values) => {
    setLoading(true);
    const { firstName, lastName, email, password } = values;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Una vez creado el usuario en Auth, obtén su uid
      const uid = userCredential.user.uid;

      // Crear un documento en Firestore para guardar la info del usuario (sin contraseña)
      await setDoc(doc(db, 'users', uid), {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        createdAt: new Date()
      });

      Alert.alert("Registro exitoso", "Usuario registrado con éxito.");
      navigation.navigate('Login.js'); // Vuelve a Login sin resetear el stack
    } catch (error) {
      let errorMessage = "Hubo un problema al registrar el usuario.";
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "El correo electrónico ya está en uso.";
          break;
        case 'auth/invalid-email':
          errorMessage = "El formato del correo electrónico no es válido.";
          break;
        case 'auth/weak-password':
          errorMessage = "La contraseña es demasiado débil.";
          break;
        case 'auth/network-request-failed':
          errorMessage = "Error de conexión, por favor intenta más tarde.";
          break;
      }
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Encabezado con avatar */}
      <View style={styles.header}>
        <Image source={require('../assets/avatar.png')} style={styles.profileImage} />
      </View>

      {/* Contenido */}
      <View style={styles.content}>
        <Text style={styles.title}>Crea tu cuenta</Text>

        <Formik
          initialValues={{
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            confirmPassword: ''
          }}
          validationSchema={SignUpSchema}
          onSubmit={handleSignUp}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <>
              {/* Nombre */}
              <View style={styles.inputContainer}>
                <FontAwesome name="user" size={20} color="#ccc" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nombre"
                  onChangeText={handleChange('firstName')}
                  onBlur={handleBlur('firstName')}
                  value={values.firstName}
                />
              </View>
              {touched.firstName && errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}

              {/* Apellido */}
              <View style={styles.inputContainer}>
                <FontAwesome name="user" size={20} color="#ccc" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Apellido"
                  onChangeText={handleChange('lastName')}
                  onBlur={handleBlur('lastName')}
                  value={values.lastName}
                />
              </View>
              {touched.lastName && errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}

              {/* Correo */}
              <View style={styles.inputContainer}>
                <FontAwesome name="envelope" size={20} color="#ccc" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Correo electrónico"
                  onChangeText={handleChange('email')}
                  onBlur={handleBlur('email')}
                  value={values.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {touched.email && errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

              {/* Contraseña */}
              <View style={styles.inputContainer}>
                <FontAwesome name="lock" size={20} color="#ccc" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Contraseña"
                  onChangeText={handleChange('password')}
                  onBlur={handleBlur('password')}
                  value={values.password}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <FontAwesome name={showPassword ? "eye-slash" : "eye"} size={20} color="#ccc" />
                </TouchableOpacity>
              </View>
              {touched.password && errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

              {/* Lista de requisitos de la contraseña */}
              <View style={styles.requirementsContainer}>
                <Text style={styles.requirementTitle}>La contraseña debe incluir:</Text>
                <Text style={styles.requirementItem}>- Al menos 6 caracteres</Text>
                <Text style={styles.requirementItem}>- Al menos una letra mayúscula</Text>
                <Text style={styles.requirementItem}>- Al menos una letra minúscula</Text>
                <Text style={styles.requirementItem}>- Al menos un número</Text>
              </View>

              {/* Confirmar contraseña */}
              <View style={styles.inputContainer}>
                <FontAwesome name="lock" size={20} color="#ccc" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirmar contraseña"
                  onChangeText={handleChange('confirmPassword')}
                  onBlur={handleBlur('confirmPassword')}
                  value={values.confirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <FontAwesome name={showConfirmPassword ? "eye-slash" : "eye"} size={20} color="#ccc" />
                </TouchableOpacity>
              </View>
              {touched.confirmPassword && errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

              {/* Botón de registro */}
              <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Registrarse</Text>
                )}
              </TouchableOpacity>

              {/* Enlace de inicio de sesión */}
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.signUpText}>¿Ya tienes cuenta? Inicia sesión</Text>
              </TouchableOpacity>
            </>
          )}
        </Formik>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: 'linear-gradient(180deg, #66e07d, #58d68d)',
    height: '25%',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: -30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginVertical: 10,
    width: '90%',
    height: 50,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2ecc71',
    borderRadius: 10,
    paddingVertical: 12,
    width: '90%',
    alignItems: 'center',
    marginVertical: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signUpText: {
    marginTop: 20,
    color: '#007AFF',
    fontSize: 14,
  },
  errorText: {
    color: 'red',
    alignSelf: 'flex-start',
    width: '90%',
    marginBottom: 5,
    marginTop: -5,
  },
  requirementsContainer: {
    width: '90%',
    marginBottom: 10,
  },
  requirementTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#2c3e50'
  },
  requirementItem: {
    fontSize: 14,
    color: '#2c3e50',
    marginLeft: 10
  },
});

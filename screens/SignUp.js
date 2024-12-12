import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  Image, 
  ActivityIndicator, 
  Dimensions 
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { auth, db } from '../src/config/firebaseConfig'; 
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { doc, setDoc } from 'firebase/firestore'; 
import { Video } from 'expo-av'; // Importa Video de expo-av

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

// Funciones para verificar los requisitos de la contraseña
const checkLength = (password) => password.length >= 6;
const checkUpperCase = (password) => /[A-Z]/.test(password);
const checkLowerCase = (password) => /[a-z]/.test(password);
const checkNumber = (password) => /\d/.test(password);

export default function SignUp({ navigation }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const video = useRef(null); // Referencia al video

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
      navigation.navigate('Login'); // Vuelve a Login sin resetear el stack
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
      {/* Video de Fondo */}
      <Video
        ref={video}
        style={styles.backgroundVideo}
        source={require('../assets/Desarrollo movile.mp4')} // Ruta del video
        resizeMode="cover"
        isLooping
        shouldPlay
        isMuted
      />

      {/* Superposición oscura para mejorar la visibilidad */}
      <View style={styles.overlay} />

      {/* Contenido del SignUp */}
      <View style={styles.content}>
        {/* Encabezado con avatar */}
        <View style={styles.header}>
          <Image source={require('../assets/avatar.png')} style={styles.profileImage} />
        </View>

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
                  placeholderTextColor="#aaa"
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
                  placeholderTextColor="#aaa"
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
                  placeholderTextColor="#aaa"
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
                  placeholderTextColor="#aaa"
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
                <View style={styles.requirementItem}>
                  <FontAwesome 
                    name={checkLength(values.password) ? "check-circle" : "times-circle"} 
                    size={16} 
                    color={checkLength(values.password) ? "green" : "red"} 
                    style={styles.requirementIcon}
                  />
                  <Text style={styles.requirementText}>Al menos 6 caracteres</Text>
                </View>
                <View style={styles.requirementItem}>
                  <FontAwesome 
                    name={checkUpperCase(values.password) ? "check-circle" : "times-circle"} 
                    size={16} 
                    color={checkUpperCase(values.password) ? "green" : "red"} 
                    style={styles.requirementIcon}
                  />
                  <Text style={styles.requirementText}>Al menos una letra mayúscula</Text>
                </View>
                <View style={styles.requirementItem}>
                  <FontAwesome 
                    name={checkLowerCase(values.password) ? "check-circle" : "times-circle"} 
                    size={16} 
                    color={checkLowerCase(values.password) ? "green" : "red"} 
                    style={styles.requirementIcon}
                  />
                  <Text style={styles.requirementText}>Al menos una letra minúscula</Text>
                </View>
                <View style={styles.requirementItem}>
                  <FontAwesome 
                    name={checkNumber(values.password) ? "check-circle" : "times-circle"} 
                    size={16} 
                    color={checkNumber(values.password) ? "green" : "red"} 
                    style={styles.requirementIcon}
                  />
                  <Text style={styles.requirementText}>Al menos un número</Text>
                </View>
              </View>

              {/* Confirmar contraseña */}
              <View style={styles.inputContainer}>
                <FontAwesome name="lock" size={20} color="#ccc" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirmar contraseña"
                  placeholderTextColor="#aaa"
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

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    backgroundColor: 'rgba(0,0,0,0.4)', // Superposición oscura semi-transparente
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    // Opcional: Puedes ajustar o eliminar el header si no lo necesitas
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff', // Texto en color blanco para contraste
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)', // Fondo semi-transparente
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
    color: '#2c3e50',
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
    color: '#3498db',
    fontWeight: 'bold',
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
    color: '#fff',
    fontSize: 16,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  requirementIcon: {
    marginRight: 5,
  },
  requirementText: {
    color: '#fff',
    fontSize: 14,
  },
});

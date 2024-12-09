import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  Image, 
  Modal, 
  Pressable, 
  SafeAreaView, 
  FlatList 
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { 
  addDoc, 
  collection, 
  onSnapshot, 
  doc, 
  serverTimestamp, 
  runTransaction, 
  getDoc, 
  setDoc 
} from 'firebase/firestore';
import { auth, db } from '../src/config/firebaseConfig';

// Función para rellenar números con ceros a la izquierda
const padNumber = (num, size) => {
  let s = num.toString();
  while (s.length < size) s = "0" + s;
  return s;
};

// Función para incrementar el prefijo alfabético
const incrementPrefix = (prefix) => {
  if (prefix === '') return 'A';
  let arr = prefix.split('');
  let carry = true;
  for (let i = arr.length - 1; i >= 0 && carry; i--) {
    if (arr[i] === 'Z') {
      arr[i] = 'A';
    } else {
      arr[i] = String.fromCharCode(arr[i].charCodeAt(0) + 1);
      carry = false;
    }
  }
  if (carry) {
    arr.unshift('A');
  }
  return arr.join('');
};

// Función para inicializar el contador si no existe
const initializePurchaseCounter = async () => {
  const purchaseNumberDocRef = doc(db, 'counters', 'purchaseNumber');
  const purchaseNumberDoc = await getDoc(purchaseNumberDocRef);
  
  if (!purchaseNumberDoc.exists()) {
    await setDoc(purchaseNumberDocRef, {
      prefix: "",
      lastNumber: 0
    });
    console.log("Documento 'purchaseNumber' creado exitosamente.");
  } else {
    console.log("Documento 'purchaseNumber' ya existe.");
  }
};

export default function Home({ navigation }) {
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [catalogs, setCatalogs] = useState([]);
  const [products, setProducts] = useState([]);

  // Estados para el Carrito
  const [cart, setCart] = useState([]);
  const [cartModalVisible, setCartModalVisible] = useState(false);
  const [purchaseNumber, setPurchaseNumber] = useState('');

  // Estados para el Nombre y Apellido del Usuario
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Cargar catálogos
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'catalogs'), (snapshot) => {
      const catalogList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCatalogs(catalogList);
    });
    return () => unsubscribe();
  }, []);

  // Cargar productos
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
      const productList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productList);
    });
    return () => unsubscribe();
  }, []);

  // Inicializar el contador y generar el número de compra
  useEffect(() => {
    initializePurchaseCounter()
      .then(() => {
        // No es necesario establecer purchaseNumber aquí
      })
      .catch((error) => {
        console.log("Error al inicializar el contador:", error);
      });
  }, []);

  // Obtener el Nombre y Apellido del Usuario
  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFirstName(userData.firstName || '');
          setLastName(userData.lastName || '');
        } else {
          console.log('No se encontró el documento del usuario.');
        }
      }
    };

    fetchUserData();
  }, []);

  const handleLogOut = async () => {
    try {
      await signOut(auth);
      Alert.alert('Sesión cerrada', 'Has cerrado sesión correctamente.');
      navigation.replace('Login');
    } catch (error) {
      Alert.alert('Error', 'Hubo un problema al cerrar sesión.');
    }
  };

  // Función para estructurar los catálogos con sus productos
  const getCatalogsWithProducts = () => {
    return catalogs.map(catalog => {
      const catProducts = products.filter(prod => prod.catalogId === catalog.id);
      return { ...catalog, products: catProducts };
    });
  };

  const catalogsWithProducts = getCatalogsWithProducts();

  // Función para agregar productos al carrito
  const addToCart = (product) => {
    if (product.stock === 0) {
      Alert.alert('Stock Agotado', `El producto "${product.name}" ya no tiene stock disponible.`);
      return;
    }

    setCart((prevCart) => {
      const existingProduct = prevCart.find((item) => item.id === product.id);
      if (existingProduct) {
        if (existingProduct.quantity < product.stock) {
          return prevCart.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        } else {
          Alert.alert('Stock Limitado', 'No puedes agregar más unidades de este producto.');
          return prevCart;
        }
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  // Función para remover productos del carrito
  const removeFromCart = (productId) => {
    setCart((prevCart) => {
      const existingProduct = prevCart.find((item) => item.id === productId);
      if (existingProduct.quantity > 1) {
        return prevCart.map((item) =>
          item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        );
      } else {
        return prevCart.filter((item) => item.id !== productId);
      }
    });
  };

  // Calcular el total de la compra
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  // Renderizar cada producto en la lista de catálogos
  const renderProductItem = ({ item }) => (
    <View style={styles.productItem}>
      <View>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productDetails}>Precio: ${item.price.toFixed(2)}</Text>
        <Text style={styles.productDetails}>Stock: {item.stock}</Text>
      </View>
      <TouchableOpacity
        style={styles.addToCartButton}
        onPress={() => addToCart(item)}
        accessibilityLabel={`Agregar ${item.name} al carrito`}
      >
        <FontAwesome name="shopping-cart" size={20} color="#fff" />
        <Text style={styles.addToCartText}>Agregar</Text>
      </TouchableOpacity>
    </View>
  );

  // Renderizar cada ítem en el carrito
  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Text style={styles.cartItemName}>{item.name}</Text>
      <Text style={styles.cartItemPrice}>${item.price.toFixed(2)}</Text>
      <View style={styles.cartItemQuantity}>
        <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.quantityButton}>
          <Text style={styles.quantityButtonText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.quantityText}>{item.quantity}</Text>
        <TouchableOpacity
          onPress={() => addToCart(item)}
          style={styles.quantityButton}
          disabled={item.quantity >= item.stock}
        >
          <Text style={styles.quantityButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Función para registrar el pago con transacción
  const registerPayment = async () => {
    if (cart.length === 0) {
      Alert.alert('Carrito Vacío', 'No hay productos en el carrito para registrar.');
      return;
    }

    try {
      const purchaseNumberDocRef = doc(db, 'counters', 'purchaseNumber');

      const purchaseData = await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(purchaseNumberDocRef);

        if (!counterDoc.exists()) {
          throw "El documento de contador no existe!";
        }

        let { prefix, lastNumber } = counterDoc.data();

        // Incrementar el número de compra
        let newLastNumber = lastNumber + 1;
        let newPrefix = prefix;

        if (newLastNumber > 9999999) { // Asegúrate de que el límite coincida con el padding
          newPrefix = incrementPrefix(prefix);
          newLastNumber = 1;
        }

        // Generar el número de compra con prefijo y número
        const purchaseNumber = `${newPrefix}${padNumber(newLastNumber, 7)}`; // Cambiado a 7

        // Verificar y actualizar stock de productos
        for (let item of cart) {
          const productRef = doc(db, 'products', item.id);
          const productDoc = await transaction.get(productRef);

          if (!productDoc.exists()) {
            throw `El producto "${item.name}" no existe!`;
          }

          const currentStock = productDoc.data().stock;

          if (currentStock < item.quantity) {
            throw `Stock insuficiente para "${item.name}". Disponible: ${currentStock}`;
          }

          // Actualizar el stock
          transaction.update(productRef, {
            stock: currentStock - item.quantity,
          });
        }

        // Actualizar el contador
        transaction.update(purchaseNumberDocRef, {
          prefix: newPrefix,
          lastNumber: newLastNumber,
        });

        // Preparar datos de compra
        const purchaseRecord = {
          purchaseNumber,
          items: cart.map((item) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
          total: calculateTotal(),
          date: serverTimestamp(),
        };

        // Añadir la compra a la colección
        const purchaseRef = collection(db, 'purchases');
        await addDoc(purchaseRef, purchaseRecord);

        return purchaseNumber;
      });

      Alert.alert('Pago Registrado', `N° de Compra ${purchaseData} registrada exitosamente.`);
      setCart([]);
      setPurchaseNumber(purchaseData); // Actualización correcta
      setCartModalVisible(false);
    } catch (error) {
      console.log(error);
      Alert.alert('Error', error.toString());
    }
  };

  // Renderizar cada catálogo y sus productos
  const renderCatalogItem = ({ item }) => (
    <View style={styles.catalogItem}>
      <Text style={styles.catalogTitle}>{item.name}</Text>
      {item.products.length === 0 ? (
        <Text style={styles.noDataText}>No hay productos en este catálogo</Text>
      ) : (
        <FlatList
          data={item.products}
          keyExtractor={(product) => product.id}
          renderItem={renderProductItem}
          scrollEnabled={false} // Deshabilita el scroll interno para evitar conflictos
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Modal de confirmación de Logout */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={logoutModalVisible}
          onRequestClose={() => setLogoutModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalText}>¿Deseas cerrar sesión?</Text>
              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.modalButton, { backgroundColor: '#e74c3c' }]}
                  onPress={() => {
                    setLogoutModalVisible(false);
                    handleLogOut();
                  }}
                >
                  <Text style={styles.modalButtonText}>Salir</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, { backgroundColor: '#3498db' }]}
                  onPress={() => setLogoutModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancelar</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal del Carrito */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={cartModalVisible}
          onRequestClose={() => setCartModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainerCart}>
              <Text style={styles.modalTitle}>Carrito de Compras</Text>
              <FlatList
                data={cart}
                keyExtractor={(item) => item.id}
                renderItem={renderCartItem}
                contentContainerStyle={{ paddingBottom: 20 }}
                ListEmptyComponent={<Text style={styles.emptyCartText}>Tu carrito está vacío.</Text>}
              />
              <Text style={styles.totalText}>Total: ${calculateTotal().toFixed(2)}</Text>
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.registerButton} onPress={registerPayment}>
                  <Text style={styles.buttonText}>Registrar Pago</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setCartModalVisible(false)}>
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Encabezado */}
        <View style={styles.header}>
          <View style={styles.profileContainer}>
            <Image source={require('../assets/avatar.png')} style={styles.profileImage} />
            <Text style={styles.greeting}>
              Hola, {firstName} {lastName}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setLogoutModalVisible(true)} style={styles.logoutButton}>
            <FontAwesome name="sign-out" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Contenido principal con lista de catálogos y productos usando FlatList */}
        <View style={styles.content}>
          <Text style={styles.placeholderText}>Productos</Text>
          <FlatList
            data={catalogsWithProducts}
            keyExtractor={(item) => item.id}
            renderItem={renderCatalogItem}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
            ListEmptyComponent={<Text style={styles.noDataText}>No hay catálogos disponibles</Text>}
          />
        </View>

        {/* Barra de acciones en la parte inferior */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setCartModalVisible(true)}
            accessibilityLabel="Abrir carrito de compras"
          >
            <FontAwesome name="shopping-cart" size={24} color="#fff" />
            {cart.length > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cart.length}</Text>
              </View>
            )}
            <Text style={styles.actionText}>Carrito</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('CatalogList')}
          >
            <FontAwesome name="th-large" size={24} color="#fff" />
            <Text style={styles.actionText}>Catálogo</Text>
          </TouchableOpacity>
          {/* Definir si agregar o no 
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('CreateCatalog')}
          >
            <FontAwesome name="plus" size={24} color="#fff" />
            <Text style={styles.actionText}>Nuevo Catálogo</Text>
          </TouchableOpacity>
          */}

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <FontAwesome name="cog" size={28} color="#fff" />
            <Text style={styles.actionText}>Ajuste</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f6fa', // Color de fondo suave
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  header: {
    backgroundColor: '#4b7bec', // Azul más moderno
    paddingVertical: 20,
    paddingHorizontal: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 5, // Sombra para Android
    shadowColor: '#000', // Sombra para iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#fff',
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  logoutButton: {
    backgroundColor: '#ff7675', // Rojo suave
    padding: 12,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  content: {
    flex: 1,
    padding: 25,
  },
  placeholderText: {
    fontSize: 18,
    color: '#636e72',
    marginBottom: 25,
    textAlign: 'center',
    fontWeight: '500',
  },
  catalogContainer: {
    flex: 1,
  },
  catalogItem: {
    backgroundColor: '#dfe6e9', // Gris claro
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  catalogTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3436',
    marginBottom: 8,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#b2bec3',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
  },
  productDetails: {
    fontSize: 14,
    color: '#636e72',
    marginTop: 2,
  },
  addToCartButton: {
    flexDirection: 'row',
    backgroundColor: '#00b894', // Verde brillante
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  addToCartText: {
    color: '#fff',
    marginLeft: 6,
    fontWeight: '600',
    fontSize: 14,
  },
  noDataText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#b2bec3',
    textAlign: 'center',
    marginTop: 10,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderColor: '#dfe6e9',
    backgroundColor: '#fff',
    paddingHorizontal: 25,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: '#0984e3', // Azul vibrante
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
  },
  actionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
  },
  // Estilos para el modal de confirmación de Logout
  modalContainer: {
    flex: 1,
    justifyContent: 'center', // Centra verticalmente
    alignItems: 'center', // Centra horizontalmente
    backgroundColor: 'rgba(0,0,0,0.5)', // Fondo semitransparente
    paddingHorizontal: 20, // Espaciado horizontal para evitar que toque los bordes
  },
  modalContent: {
    backgroundColor: '#fff', // Fondo del modal
    padding: 25, // Espaciado interno
    borderRadius: 20, // Esquinas más redondeadas
    width: '85%', // Ancho relativo al contenedor
    maxWidth: 400, // Ancho máximo (opcional para dispositivos grandes)
    alignItems: 'center', // Centrar contenido dentro del modal
    shadowColor: '#000', // Sombra para una mejor visualización
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 7, // Sombra para Android
  },
  modalText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3436',
    marginBottom: 25,
    textAlign: 'center', // Centra el texto en caso de que sea multilinea
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Distribuir uniformemente los botones
    width: '100%',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    marginHorizontal: 5,
    minWidth: '40%', // Asegurar que los botones tengan un tamaño uniforme
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
  // Estilos para el Carrito
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainerCart: { // Renombrado para evitar conflicto con modalContainer de logout
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 7,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2d3436',
    marginBottom: 15,
    textAlign: 'center',
  },
  purchaseNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#636e72',
    marginBottom: 15,
    textAlign: 'center',
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#dfe6e9',
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 2,
    color: '#2d3436',
  },
  cartItemPrice: {
    fontSize: 16,
    flex: 1,
    textAlign: 'center',
    color: '#0984e3',
  },
  cartItemQuantity: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  quantityButton: {
    backgroundColor: '#00b894',
    padding: 6,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2d3436',
  },
  totalText: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'right',
    marginVertical: 15,
    color: '#2d3436',
  },
  registerButton: {
    backgroundColor: '#00cec9', // Azul turquesa brillante
    padding: 14,
    borderRadius: 25,
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cancelButton: {
    backgroundColor: '#d63031', // Rojo intenso
    padding: 14,
    borderRadius: 25,
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyCartText: {
    textAlign: 'center',
    color: '#b2bec3',
    fontStyle: 'italic',
    marginVertical: 20,
    fontSize: 16,
  },
  // Badge para el carrito
  cartBadge: {
    position: 'absolute',
    right: 10,
    top: -5,
    backgroundColor: '#d63031', // Rojo intenso para destacar
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});

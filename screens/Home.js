// src/screens/Home.js
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
        setPurchaseNumber(generatePurchaseNumber());
      })
      .catch((error) => {
        console.log("Error al inicializar el contador:", error);
      });
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

  // Generar un número único de compra basado en el contador de Firestore
  const generatePurchaseNumber = () => {
    // Este valor se obtiene dinámicamente durante la transacción
    return '';
  };

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

        if (newLastNumber > 9999999) {
          newPrefix = incrementPrefix(prefix);
          newLastNumber = 1;
        }

        // Generar el número de compra con prefijo y número
        const purchaseNumber = `${newPrefix}${padNumber(newLastNumber, newPrefix === '' ? 2 : 2)}`;

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

      Alert.alert('Pago Registrado', `Compra #${purchaseData} registrada exitosamente.`);
      setCart([]);
      setPurchaseNumber(generatePurchaseNumber());
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
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Carrito de Compras</Text>
              <Text style={styles.purchaseNumber}>N° de Compra: {purchaseNumber || '---'}</Text>
              <FlatList
                data={cart}
                keyExtractor={(item) => item.id}
                renderItem={renderCartItem}
                contentContainerStyle={{ paddingBottom: 20 }}
                ListEmptyComponent={<Text style={styles.emptyCartText}>Tu carrito está vacío.</Text>}
              />
              <Text style={styles.totalText}>Total: ${calculateTotal().toFixed(2)}</Text>
              <View style={styles.modalButtons}>
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
            <Text style={styles.greeting}>Hola, bienvenida</Text>
          </View>
          <TouchableOpacity onPress={() => setLogoutModalVisible(true)} style={styles.logoutButton}>
            <FontAwesome name="sign-out" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Contenido principal con lista de catálogos y productos usando FlatList */}
        <View style={styles.content}>
          <Text style={styles.placeholderText}>¡Gestiona tu tienda de ropa!</Text>
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
            <Text style={styles.actionText}>Catálogos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('CreateCatalog')}
          >
            <FontAwesome name="plus" size={24} color="#fff" />
            <Text style={styles.actionText}>Nuevo Catálogo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <FontAwesome name="cog" size={24} color="#fff" />
            <Text style={styles.actionText}>Configuración</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff'
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#a8e063',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  greeting: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoutButton: {
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 50,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  placeholderText: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 20,
    textAlign: 'center',
  },
  catalogContainer: {
    flex: 1,
  },
  catalogItem: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  catalogTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  productDetails: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  addToCartButton: {
    flexDirection: 'row',
    backgroundColor: '#3498db',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  addToCartText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: '600',
  },
  noDataText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#888',
    marginLeft: 10,
    marginTop: 5,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: '#3498db',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
  },
  // Estilos para el modal de confirmación de Logout
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Estilos para el Carrito
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  purchaseNumber: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 2,
  },
  cartItemPrice: {
    fontSize: 16,
    flex: 1,
    textAlign: 'center',
  },
  cartItemQuantity: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  quantityButton: {
    backgroundColor: '#3498db',
    padding: 5,
    borderRadius: 5,
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quantityText: {
    marginHorizontal: 10,
    fontSize: 16,
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
    marginVertical: 10,
  },
  registerButton: {
    backgroundColor: '#2ecc71', // Verde
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginRight: 5,
  },
  cancelButton: {
    backgroundColor: '#e74c3c', // Rojo
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginLeft: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyCartText: {
    textAlign: 'center',
    color: '#888',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  // Badge para el carrito
  cartBadge: {
    position: 'absolute',
    right: 10,
    top: -5,
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

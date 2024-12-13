import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  FlatList, 
  Alert,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../src/config/firebaseConfig';
import { 
  collection, 
  onSnapshot, 
  doc, 
  deleteDoc, 
  updateDoc, 
  query, 
  where,
  getDocs,
} from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FontAwesome } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';

export default function Settings() {
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  // Estados para el modal de usuarios
  const [usersModalVisible, setUsersModalVisible] = useState(false);
  const [users, setUsers] = useState([]);

  // Estados para el modal de borrado de datos
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Estados para el modal de edición de datos
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');

  // Estados para el modal de consultas de compras
  const [purchasesModalVisible, setPurchasesModalVisible] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPurchases, setFilteredPurchases] = useState([]);
  const [isLoadingPurchases, setIsLoadingPurchases] = useState(false);

  // Estados para el modal de detalles de la compra
  const [purchaseDetailsModalVisible, setPurchaseDetailsModalVisible] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  // Estados para el Modal de Consulta de Progreso
  const [progressModalVisible, setProgressModalVisible] = useState(false);
  const [progressStartDate, setProgressStartDate] = useState(null);
  const [progressEndDate, setProgressEndDate] = useState(null);
  const [showProgressStartDatePicker, setShowProgressStartDatePicker] = useState(false);
  const [showProgressEndDatePicker, setShowProgressEndDatePicker] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Envía el correo para restablecer contraseña
  const handlePasswordReset = async () => {
    if (!resetEmail.trim()) {
      alert('Por favor ingresa un correo electrónico válido.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetModalVisible(false); // Cierra el modal de ingreso de correo
      setSuccessModalVisible(true); // Abre el modal de éxito
      setResetEmail('');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        alert('El correo ingresado no corresponde a un usuario registrado.');
      } else if (error.code === 'auth/invalid-email') {
        alert('Por favor ingresa un correo electrónico válido.');
      } else {
        console.log(error);
        alert('Error al enviar el correo. Intenta nuevamente.');
      }
    }
  };

  // Cargar usuarios registrados
  const loadUsers = () => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(userList);
    });
    return unsubscribe;
  };

  const handleShowUsers = () => {
    loadUsers();
    setUsersModalVisible(true);
  };

  // Función para abrir el modal de restablecimiento con un correo específico
  const handleOpenResetWithEmail = (email) => {
    setResetEmail(email);
    setResetModalVisible(true);
  };

  // Función para abrir el modal de confirmación de borrado de datos del usuario
  const handleDeleteUserData = (userId) => {
    setSelectedUserId(userId);
    setDeleteModalVisible(true);
  };

  // Función para confirmar y borrar datos del usuario de Firestore
  const confirmDeleteUserData = async () => {
    if (!selectedUserId) return;
    try {
      await deleteDoc(doc(db, 'users', selectedUserId));
      Alert.alert('Datos borrados', 'Los datos del usuario han sido borrados con éxito.');
      setDeleteModalVisible(false);
      setSelectedUserId(null);
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudieron borrar los datos del usuario.');
    }
  };

  // Función para abrir el modal de edición con los datos del usuario
  const handleOpenEditUser = (user) => {
    setEditUserId(user.id);
    setEditFirstName(user.firstName);
    setEditLastName(user.lastName);
    setEditModalVisible(true);
  };

  // Función para confirmar la edición de datos del usuario
  const handleEditUserSubmit = async () => {
    if (!editFirstName.trim() || !editLastName.trim()) {
      Alert.alert('Error', 'Nombre y Apellido no pueden estar vacíos.');
      return;
    }

    try {
      await updateDoc(doc(db, 'users', editUserId), {
        firstName: editFirstName.trim(),
        lastName: editLastName.trim()
      });
      Alert.alert('Éxito', 'Datos del usuario actualizados correctamente.');
      setEditModalVisible(false);
      setEditUserId(null);
      setEditFirstName('');
      setEditLastName('');
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudieron actualizar los datos del usuario.');
    }
  };

  // Función para buscar compras
  const handleSearchPurchases = () => {
    setIsLoadingPurchases(true);

    // Construir la consulta con filtros de fecha
    let q = collection(db, 'purchases');

    if (startDate && endDate) {
      q = query(
        q,
        where('date', '>=', startDate),
        where('date', '<=', endDate)
      );
    }

    // Escuchar en tiempo real
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let purchasesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Filtrar por término de búsqueda si se ingresa
      if (searchTerm.trim()) {
        purchasesList = purchasesList.filter(purchase =>
          purchase.purchaseNumber.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setFilteredPurchases(purchasesList);
      setIsLoadingPurchases(false);
    }, (error) => {
      console.log(error);
      Alert.alert('Error', 'No se pudieron cargar las compras.');
      setIsLoadingPurchases(false);
    });

    // No nos suscribimos para mantener la escucha mientras el modal esté abierto
  };

  // Función para ver detalles de una compra
  const handleViewPurchaseDetails = (purchase) => {
    setSelectedPurchase(purchase);
    setPurchaseDetailsModalVisible(true);
  };

  // Cargar todas las compras al abrir el modal de compras
  useEffect(() => {
    if (purchasesModalVisible) {
      handleSearchPurchases();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchasesModalVisible]);

  // Función para generar la gráfica de progreso
  const generateChart = async () => {
    if (!progressStartDate || !progressEndDate) {
      Alert.alert('Fechas Incompletas', 'Por favor selecciona ambas fechas.');
      return;
    }

    if (progressStartDate > progressEndDate) {
      Alert.alert('Fechas Inválidas', 'La fecha de inicio no puede ser posterior a la fecha de fin.');
      return;
    }

    setIsLoading(true);
    setChartData(null);

    try {
      // Crear una consulta para las compras dentro del rango de fechas
      const q = query(
        collection(db, 'purchases'),
        where('date', '>=', progressStartDate),
        where('date', '<=', progressEndDate)
      );

      // Obtener las compras
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        Alert.alert('Sin Datos', 'No se encontraron compras en el rango de fechas seleccionado.');
        setIsLoading(false);
        return;
      }

      // Procesar los datos para la gráfica
      const incomeByDate = {};

      snapshot.forEach(doc => {
        const purchase = doc.data();
        const purchaseDate = purchase.date.toDate().toLocaleDateString();

        if (incomeByDate[purchaseDate]) {
          incomeByDate[purchaseDate] += purchase.total;
        } else {
          incomeByDate[purchaseDate] = purchase.total;
        }
      });

      // Ordenar las fechas
      const sortedDates = Object.keys(incomeByDate).sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA - dateB;
      });

      // Preparar los datos para la gráfica
      const labels = sortedDates;
      const data = sortedDates.map(date => incomeByDate[date]);

      setChartData({
        labels: labels,
        datasets: [
          {
            data: data,
          },
        ],
      });

      setIsLoading(false);
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Hubo un problema al generar la gráfica.');
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configuraciones</Text>

      {/* Botón para restablecer contraseña (modal general) */}
      <TouchableOpacity style={styles.button} onPress={() => setResetModalVisible(true)}>
        <Text style={styles.buttonText}>Restablecer Contraseña</Text>
      </TouchableOpacity>

      {/* Botón para ver usuarios registrados */}
      <TouchableOpacity style={styles.button} onPress={handleShowUsers}>
        <Text style={styles.buttonText}>Ver Usuarios Registrados</Text>
      </TouchableOpacity>

      {/* Botón para consultar compras realizadas */}
      <TouchableOpacity style={styles.button} onPress={() => setPurchasesModalVisible(true)}>
        <Text style={styles.buttonText}>Consultar Compras Realizadas</Text>
      </TouchableOpacity>

      {/* Botón para consultar progreso */}
      <TouchableOpacity style={styles.button} onPress={() => setProgressModalVisible(true)}>
        <Text style={styles.buttonText}>Consultar Progreso</Text>
      </TouchableOpacity>

      {/* Modal para ingresar o confirmar el correo para restablecer contraseña */}
      <Modal
        visible={resetModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setResetModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Restablecer Contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingresa tu correo electrónico"
              value={resetEmail}
              onChangeText={setResetEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButtonConfirm} onPress={handlePasswordReset}>
                <Text style={styles.modalButtonText}>Enviar Correo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonCancel} onPress={() => setResetModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de confirmación de envío */}
      <Modal
        visible={successModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>¡Correo Enviado!</Text>
            <Text style={styles.modalMessage}>
              Hemos enviado un correo para restablecer tu contraseña. Por favor revisa tu bandeja de entrada.
            </Text>
            <TouchableOpacity
              style={styles.modalButtonConfirm}
              onPress={() => setSuccessModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de usuarios registrados */}
      <Modal
        visible={usersModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setUsersModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainerLarge}>
            <Text style={styles.modalTitle}>Usuarios Registrados</Text>
            {users.length === 0 ? (
              <Text style={{marginBottom:10}}>No hay usuarios registrados.</Text>
            ) : (
              <FlatList
                data={users}
                keyExtractor={(item) => item.id}
                style={{width:'100%'}}
                renderItem={({ item }) => (
                  <View style={styles.userItem}>
                    <Text style={{fontWeight:'bold'}}>{item.firstName} {item.lastName}</Text>
                    <Text>{item.email}</Text>
                    {/* Botón para restablecer contraseña de este usuario */}
                    <TouchableOpacity 
                      style={[styles.buttonSmall, {marginTop:10}]} 
                      onPress={() => handleOpenResetWithEmail(item.email)}
                    >
                      <Text style={styles.buttonTextSmall}>Restablecer Contraseña</Text>
                    </TouchableOpacity>

                    {/* Botón para eliminar datos del usuario en la DB */}
                    <TouchableOpacity 
                      style={[styles.buttonSmall, {marginTop:10, backgroundColor:'#e74c3c'}]} 
                      onPress={() => handleDeleteUserData(item.id)}
                    >
                      <Text style={styles.buttonTextSmall}>Borrar Datos</Text>
                    </TouchableOpacity>

                    {/* Botón para editar datos del usuario */}
                    <TouchableOpacity 
                      style={[styles.buttonSmall, {marginTop:10, backgroundColor:'#f1c40f'}]} 
                      onPress={() => handleOpenEditUser(item)}
                    >
                      <Text style={styles.buttonTextSmall}>Modificar Datos</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
            <TouchableOpacity
              style={styles.modalButtonCancel}
              onPress={() => setUsersModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de confirmación para borrar datos */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Atención</Text>
            <Text style={styles.modalMessage}>
              Esta acción borrará los datos del usuario de la base de datos, pero NO eliminará su cuenta de autenticación.
              ¿Deseas continuar?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonConfirm} 
                onPress={confirmDeleteUserData}
              >
                <Text style={styles.modalButtonText}>Sí, borrar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalButtonCancel} 
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para editar datos del usuario */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Modificar Datos del Usuario</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre"
              value={editFirstName}
              onChangeText={setEditFirstName}
            />
            <TextInput
              style={styles.input}
              placeholder="Apellido"
              value={editLastName}
              onChangeText={setEditLastName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonConfirm} 
                onPress={handleEditUserSubmit}
              >
                <Text style={styles.modalButtonText}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalButtonCancel} 
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Detalles de la Compra */}
      <Modal
        visible={purchaseDetailsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPurchaseDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.purchaseDetailsModalContainer}>
            <FlatList
              ListHeaderComponent={
                <>
                  <Text style={styles.modalTitle}>Detalles de la Compra</Text>
                  {selectedPurchase && (
                    <>
                      <Text style={styles.detailHeader}>Número de Compra: {selectedPurchase.purchaseNumber}</Text>
                      <Text style={styles.detailHeader}>Total: ${selectedPurchase.total.toFixed(2)}</Text>
                    </>
                  )}
                </>
              }
              data={selectedPurchase?.items || []}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <View style={styles.detailItem}>
                  <Text style={styles.detailProduct}>{item.name}</Text>
                  <Text style={styles.detailPrice}>Precio: ${item.price.toFixed(2)}</Text>
                  <Text style={styles.detailQuantity}>Cantidad: {item.quantity}</Text>
                </View>
              )}
              ListEmptyComponent={
                !selectedPurchase ? (
                  <Text style={styles.noDataText}>No hay detalles disponibles para esta compra.</Text>
                ) : null
              }
              ListFooterComponent={
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setPurchaseDetailsModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>Cerrar</Text>
                </TouchableOpacity>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Modal de Consultas de Compras */}
      <Modal
        visible={purchasesModalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setPurchasesModalVisible(false)}
      >
        <View style={styles.purchasesModalContainer}>
          <Text style={styles.modalTitle}>Consultar Compras Realizadas</Text>
          
          {/* Filtros de Fecha */}
          <View style={styles.dateFilterContainer}>
            <TouchableOpacity onPress={() => setShowStartDatePicker(true)} style={styles.datePickerButton}>
              <Text style={styles.datePickerText}>
                {startDate ? startDate.toLocaleDateString() : 'Fecha de Inicio'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowEndDatePicker(true)} style={styles.datePickerButton}>
              <Text style={styles.datePickerText}>
                {endDate ? endDate.toLocaleDateString() : 'Fecha de Fin'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Selectores de Fecha */}
          {showStartDatePicker && (
            <DateTimePicker
              value={startDate || new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowStartDatePicker(false);
                if (selectedDate) {
                  setStartDate(selectedDate);
                }
              }}
            />
          )}
          {showEndDatePicker && (
            <DateTimePicker
              value={endDate || new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowEndDatePicker(false);
                if (selectedDate) {
                  setEndDate(selectedDate);
                }
              }}
            />
          )}

          {/* Campo de Búsqueda */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por número de compra..."
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearchPurchases}>
              <FontAwesome name="search" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Listado de Compras */}
          {isLoadingPurchases ? (
            <ActivityIndicator size="large" color="#0984e3" style={{ marginVertical: 20 }} />
          ) : (
            <FlatList
              data={filteredPurchases}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.purchaseItem}>
                  <View style={styles.purchaseInfo}>
                    <Text style={styles.purchaseNumber}>Compra N°{item.purchaseNumber}</Text>
                    <Text style={styles.purchaseDate}>
                      Fecha: {item.date?.toDate().toLocaleDateString()}
                    </Text>
                    <Text style={styles.purchaseTotal}>Total: ${item.total.toFixed(2)}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.eyeIconContainer} 
                    onPress={() => handleViewPurchaseDetails(item)}
                  >
                    <FontAwesome name="eye" size={24} color="#0984e3" />
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.noDataText}>No se encontraron compras.</Text>}
            />
          )}

          {/* Botón para Cerrar el Modal */}
          <TouchableOpacity style={styles.closeButton} onPress={() => setPurchasesModalVisible(false)}>
            <Text style={styles.closeButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Modal de Consulta de Progreso */}
      <Modal
        visible={progressModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setProgressModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.fullScreenModalContainer}>
            <ScrollView contentContainerStyle={styles.fullScreenContent}>
              <Text style={styles.modalTitle}>Consulta de Progreso</Text>
              
              {/* Selección de Fecha de Inicio y Fin al Lado */}
              <View style={styles.dateFilterContainerProgress}>
                <TouchableOpacity onPress={() => setShowProgressStartDatePicker(true)} style={styles.datePickerButton}>
                  <Text style={styles.datePickerText}>
                    {progressStartDate ? progressStartDate.toLocaleDateString() : 'Fecha de Inicio'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => setShowProgressEndDatePicker(true)} style={styles.datePickerButton}>
                  <Text style={styles.datePickerText}>
                    {progressEndDate ? progressEndDate.toLocaleDateString() : 'Fecha de Fin'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Selectores de Fecha */}
              {showProgressStartDatePicker && (
                <DateTimePicker
                  value={progressStartDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowProgressStartDatePicker(false);
                    if (selectedDate) {
                      setProgressStartDate(selectedDate);
                    }
                  }}
                />
              )}
              {showProgressEndDatePicker && (
                <DateTimePicker
                  value={progressEndDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowProgressEndDatePicker(false);
                    if (selectedDate) {
                      setProgressEndDate(selectedDate);
                    }
                  }}
                />
              )}

              {/* Botón para Generar Gráfica */}
              <TouchableOpacity style={styles.generateChartButton} onPress={generateChart}>
                <Text style={styles.generateChartButtonText}>Generar Gráfica</Text>
              </TouchableOpacity>
              
              {/* Mostrar la Gráfica */}
              {chartData && (
                <LineChart
                  data={chartData}
                  width={Dimensions.get('window').width * 0.95} // Ancho de la gráfica
                  height={300}
                  yAxisLabel="$"
                  yAxisSuffix=""
                  yAxisInterval={1} // Opcional, intervalo de los ejes Y
                  chartConfig={{
                    backgroundColor: '#f5f6fa',
                    backgroundGradientFrom: '#f5f6fa',
                    backgroundGradientTo: '#f5f6fa',
                    decimalPlaces: 2, // Número de decimales
                    color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(45, 52, 54, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                    propsForDots: {
                      r: '6',
                      strokeWidth: '2',
                      stroke: '#2980b9',
                    },
                  }}
                  bezier
                  style={{
                    marginVertical: 20,
                    borderRadius: 16,
                  }}
                />
              )}
              
              {/* Indicador de Carga */}
              {isLoading && <ActivityIndicator size="large" color="#3498db" style={{ marginTop: 20 }} />}
              
              {/* Botón para Cerrar el Modal */}
              <TouchableOpacity style={styles.closeButton} onPress={() => setProgressModalVisible(false)}>
                <Text style={styles.closeButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    alignSelf: 'center',
  },
  button: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Botón pequeño para cada usuario
  buttonSmall: {
    backgroundColor: '#3498db',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonTextSmall: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalContainerLarge: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    maxHeight:'70%'
  },
  fullScreenModalContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 0,
    padding: 20,
  },
  fullScreenContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch', // Cambiado de 'center' a 'stretch'
  },
  progressModalContainer: {
    // Anteriormente: width: '90%', maxHeight: '90%',
    // Modificado para ocupar toda la pantalla
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 0,
    padding: 20,
    // alignItems: 'center', // Ajustado en ScrollView
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign:'center'
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 10,
    width: '100%',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButtonConfirm: {
    backgroundColor: '#2ecc71',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  modalButtonCancel: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  userItem: {
    backgroundColor:'#f0f0f0',
    padding:10,
    borderRadius:8,
    marginBottom:10
  },

  // **Nuevos estilos para el Modal de Consultas de Compras**
  purchasesModalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f6fa',
  },
  dateFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    width: '100%', // Añadido para asegurar que ocupe todo el ancho
  },
  dateFilterContainerProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    width: '100%', // Asegura que ocupe todo el ancho
  },
  datePickerButton: {
    flex: 1,
    backgroundColor: '#0984e3',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  datePickerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#b2bec3',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: '#0984e3',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  purchaseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#dfe6e9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  purchaseInfo: {
    flex: 1,
  },
  eyeIconContainer: {
    padding: 5,
  },
  purchaseNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3436',
  },
  purchaseDate: {
    fontSize: 14,
    color: '#636e72',
    marginTop: 5,
  },
  purchaseTotal: {
    fontSize: 16,
    color: '#00cec9',
    marginTop: 5,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#0984e3',
    marginVertical: 20,
  },
  // **Estilos para el Modal de Detalles de la Compra**
  purchaseDetailsModalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  detailHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  detailItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  detailProduct: {
    fontSize: 16,
    fontWeight: '600',
  },
  detailPrice: {
    fontSize: 16,
    color: '#27ae60',
  },
  detailQuantity: {
    fontSize: 16,
    color: '#636e72',
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#636e72',
    marginVertical: 20,
  },
  // **Estilos para el Modal de Consulta de Progreso**
  generateChartButton: {
    backgroundColor: '#2ecc71',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 15,
    width: '100%',
    alignItems: 'center',
  },
  generateChartButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

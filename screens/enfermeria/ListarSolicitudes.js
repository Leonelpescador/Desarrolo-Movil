// screens/enfermeria/ListarSolicitudes.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Modal,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const SOLICITUDES_API_URL = "http://186.123.103.68:88/api/solicitudenfermeria/?format=json";
const PAGE_SIZE = 20;

export default function ListarSolicitudes() {
  const navigation = useNavigation();

  // Estados de filtros
  const [apellidoPaciente, setApellidoPaciente] = useState("");
  const [nombrePaciente, setNombrePaciente] = useState("");
  const [usuarioFiltro, setUsuarioFiltro] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");

  // Estados para la data completa y filtrada
  const [allSolicitudes, setAllSolicitudes] = useState([]); // Inicia como arreglo vacío
  const [filteredSolicitudes, setFilteredSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedSolicitudes, setPaginatedSolicitudes] = useState([]);

  // Modal de eliminación
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [solicitudToDelete, setSolicitudToDelete] = useState(null);

  // Tipo de usuario obtenido (según Django, por ejemplo 'tipo_usuario')
  const [userRole, setUserRole] = useState("");

  // Función para obtener todas las solicitudes desde la API
  const fetchAllSolicitudes = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(SOLICITUDES_API_URL, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      // Aseguramos que la data sea un arreglo
      if (Array.isArray(data)) {
        setAllSolicitudes(data);
      } else {
        console.warn("La respuesta no es un arreglo:", data);
        setAllSolicitudes([]);
      }
    } catch (error) {
      console.error("Error al obtener solicitudes:", error);
      Alert.alert("Error", "No se pudieron cargar las solicitudes.");
    } finally {
      setLoading(false);
    }
  };

  // Cargar data y rol del usuario al montar el componente
  useEffect(() => {
    fetchAllSolicitudes();
    AsyncStorage.getItem('userRole').then(role => {
      if (role) setUserRole(role);
    });
  }, []);

  // Filtrado y ordenamiento en el cliente
  useEffect(() => {
    const filtradas = allSolicitudes.filter((solicitud) => {
      // Filtro por apellido (sin distinción de mayúsculas)
      if (apellidoPaciente && !solicitud.apellido_paciente.toLowerCase().includes(apellidoPaciente.toLowerCase())) {
        return false;
      }
      // Filtro por nombre
      if (nombrePaciente && !solicitud.nombre_paciente.toLowerCase().includes(nombrePaciente.toLowerCase())) {
        return false;
      }
      // Filtro por usuario (si existe)
      if (usuarioFiltro && solicitud.usuario && !solicitud.usuario.username.toLowerCase().includes(usuarioFiltro.toLowerCase())) {
        return false;
      }
      // Filtro por fecha inicio
      if (fechaInicio) {
        const inicio = new Date(fechaInicio);
        const fechaSolicitud = new Date(solicitud.fecha_creacion);
        if (fechaSolicitud < inicio) return false;
      }
      // Filtro por fecha fin
      if (fechaFin) {
        const fin = new Date(fechaFin);
        const fechaSolicitud = new Date(solicitud.fecha_creacion);
        if (fechaSolicitud > fin) return false;
      }
      // Filtro por estado
      if (estadoFiltro && solicitud.estado !== estadoFiltro) return false;
      return true;
    });

    // Ordenar de forma descendente por fecha_creacion
    filtradas.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
    setFilteredSolicitudes(filtradas);
    setCurrentPage(1);
  }, [allSolicitudes, apellidoPaciente, nombrePaciente, usuarioFiltro, fechaInicio, fechaFin, estadoFiltro]);

  // Actualizar la página actual
  useEffect(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    setPaginatedSolicitudes(filteredSolicitudes.slice(startIndex, endIndex));
  }, [filteredSolicitudes, currentPage]);

  const clearFilters = () => {
    setApellidoPaciente("");
    setNombrePaciente("");
    setUsuarioFiltro("");
    setFechaInicio("");
    setFechaFin("");
    setEstadoFiltro("");
  };

  // Función para confirmar entrega
  const confirmEntrega = async (id) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`http://186.123.103.68:88/api/solicitudenfermeria/${id}/confirmar_entrega/?format=json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert("Éxito", data.message);
        fetchAllSolicitudes();
      } else {
        Alert.alert("Error", data.message);
      }
    } catch (error) {
      console.error("Error confirmando entrega:", error);
      Alert.alert("Error", "Ocurrió un error al confirmar la entrega.");
    }
  };

  // Función para eliminar solicitud
  const deleteSolicitud = async () => {
    if (!solicitudToDelete) return;
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`http://186.123.103.68:88/api/solicitudenfermeria/${solicitudToDelete.id}/?format=json`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        Alert.alert("Éxito", "Solicitud eliminada correctamente.");
        setDeleteModalVisible(false);
        fetchAllSolicitudes();
      } else {
        const errorData = await response.json();
        Alert.alert("Error", JSON.stringify(errorData));
      }
    } catch (error) {
      console.error("Error eliminando solicitud:", error);
      Alert.alert("Error", "Ocurrió un error al eliminar la solicitud.");
    }
  };

  // Renderizado de cada solicitud
  const renderSolicitud = ({ item }) => (
    <View style={[styles.card, item.estado === 'pendiente' ? styles.cardPendiente : styles.cardEntregado]}>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{item.apellido_paciente} {item.nombre_paciente}</Text>
        <Text style={styles.cardText}>Sector: {item.sector ? item.sector.nombre : "N/A"}</Text>
        <Text style={styles.cardText}>Cama: {item.cama ? item.cama.numero : "N/A"}</Text>
        <Text style={styles.cardText}>Enfermero: {item.usuario ? item.usuario.username : "N/A"}</Text>
        <Text style={styles.cardText}>Estado: {item.estado}</Text>
        {item.numero_caja && (
          <Text style={styles.cardText}>Caja Roja: {item.numero_caja.numero}</Text>
        )}
        <Text style={styles.cardText}>Elementos: {item.detalles}</Text>
        <Text style={styles.cardText}>Sacó medicamento: {item.saco_medicamento_de_caja ? "Sí" : "No"}</Text>
        {item.saco_medicamento_de_caja && (
          <>
            <Text style={styles.cardText}>Origen: {item.origen_medicamento}</Text>
            <Text style={styles.cardText}>Elemento/s: {item.saco || "No especificado"}</Text>
          </>
        )}
        <Text style={styles.cardText}>Fecha: {new Date(item.fecha_creacion).toLocaleString()}</Text>
      </View>
      <View style={styles.cardFooter}>
        {item.estado === 'pendiente' && (userRole === 'admin' || userRole === 'Farmacia') && (
          <TouchableOpacity style={styles.buttonConfirm} onPress={() => confirmEntrega(item.id)}>
            <Text style={styles.buttonText}>Confirmar Entrega</Text>
          </TouchableOpacity>
        )}
        {(userRole === 'admin' || userRole === 'Farmacia' || userRole === 'sup-enfermero' || userRole === 'enfermero') && (
          <TouchableOpacity style={styles.buttonEdit} onPress={() => navigation.navigate('EditarSolicitudEnfermeria', { id: item.id })}>
            <Text style={styles.buttonText}>Editar</Text>
          </TouchableOpacity>
        )}
        {(userRole === 'admin' || userRole === 'Farmacia' || (item.usuario && item.usuario.id === 1)) && (
          <TouchableOpacity style={styles.buttonDelete} onPress={() => { setSolicitudToDelete(item); setDeleteModalVisible(true); }}>
            <Text style={styles.buttonText}>Eliminar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Paginación
  const goToNextPage = () => {
    if (currentPage * PAGE_SIZE < filteredSolicitudes.length) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <Text style={styles.header}>Solicitudes de Enfermería</Text>

      {/* Botones de navegación */}
      <View style={styles.buttonGroup}>
        <TouchableOpacity style={styles.buttonPrimary} onPress={() => navigation.navigate('CrearSolicitudEnfermeria')}>
          <Text style={styles.buttonText}>Crear Solicitud</Text>
        </TouchableOpacity>
        {(userRole === 'admin' || userRole === 'Farmacia') && (
          <>
            <TouchableOpacity style={styles.buttonPrimary} onPress={() => navigation.navigate('ListarCajas')}>
              <Text style={styles.buttonText}>Listar Cajas</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonPrimary} onPress={() => navigation.navigate('CrearCaja')}>
              <Text style={styles.buttonText}>Crear Caja</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonPrimary} onPress={() => navigation.navigate('ListarMedicamentosEnfermeria')}>
              <Text style={styles.buttonText}>Listar Medicamentos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonSecondary} onPress={() => navigation.navigate('ListarDescartablesEnfermeria')}>
              <Text style={styles.buttonText}>Listar Descartables</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Filtros */}
      <View style={styles.filterContainer}>
        <TextInput
          style={styles.filterInput}
          placeholder="Apellido del Paciente"
          value={apellidoPaciente}
          onChangeText={setApellidoPaciente}
        />
        <TextInput
          style={styles.filterInput}
          placeholder="Nombre del Paciente"
          value={nombrePaciente}
          onChangeText={setNombrePaciente}
        />
        {(userRole === 'admin' || userRole === 'Farmacia' || userRole === 'sup-enfermero') && (
          <TextInput
            style={styles.filterInput}
            placeholder="Enfermero"
            value={usuarioFiltro}
            onChangeText={setUsuarioFiltro}
          />
        )}
        <TextInput
          style={styles.filterInput}
          placeholder="Fecha Inicio (YYYY-MM-DD)"
          value={fechaInicio}
          onChangeText={setFechaInicio}
        />
        <TextInput
          style={styles.filterInput}
          placeholder="Fecha Fin (YYYY-MM-DD)"
          value={fechaFin}
          onChangeText={setFechaFin}
        />
        <View style={styles.filterPickerContainer}>
          <Picker
            selectedValue={estadoFiltro}
            style={styles.filterPicker}
            onValueChange={(itemValue) => setEstadoFiltro(itemValue)}
          >
            <Picker.Item label="Estado: Pendiente" value="pendiente" />
            <Picker.Item label="Estado: Entregado" value="entregado" />
            <Picker.Item label="Todos" value="" />
          </Picker>
        </View>
        <View style={styles.filterButtonContainer}>
          <TouchableOpacity style={styles.filterButton} onPress={fetchAllSolicitudes}>
            <Text style={styles.filterButtonText}>Buscar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton} onPress={clearFilters}>
            <Text style={styles.filterButtonText}>Limpiar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista de solicitudes */}
      {loading ? (
        <ActivityIndicator size="large" color="#4A90E2" />
      ) : (
        <FlatList
          data={paginatedSolicitudes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderSolicitud}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Controles de paginación */}
      <View style={styles.paginationContainer}>
        <TouchableOpacity style={styles.paginationButton} onPress={goToPreviousPage}>
          <Text style={styles.paginationButtonText}>Anterior</Text>
        </TouchableOpacity>
        <Text style={styles.paginationText}>Página {currentPage}</Text>
        <TouchableOpacity style={styles.paginationButton} onPress={goToNextPage}>
          <Text style={styles.paginationButtonText}>Siguiente</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de confirmación para eliminar solicitud */}
      <Modal
        visible={deleteModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContainer}>
            <Text style={styles.modalTitle}>Eliminar Solicitud</Text>
            <Text style={styles.modalMessage}>
              ¿Estás seguro de eliminar la solicitud de {solicitudToDelete ? `${solicitudToDelete.apellido_paciente} ${solicitudToDelete.nombre_paciente}` : ""}?
            </Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setDeleteModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonDelete]} onPress={deleteSolicitud}>
                <Text style={styles.modalButtonText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  buttonPrimary: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 8,
    margin: 5,
  },
  buttonSecondary: {
    backgroundColor: '#6c757d',
    padding: 10,
    borderRadius: 8,
    margin: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  filterPickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
  },
  filterPicker: {
    height: 50,
    width: '100%',
  },
  filterButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    margin: 5,
  },
  filterButtonText: {
    color: '#fff',
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  cardPendiente: {
    borderColor: '#ffc107',
  },
  cardEntregado: {
    borderColor: '#28a745',
  },
  cardBody: {
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cardText: {
    fontSize: 14,
    marginBottom: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  buttonConfirm: {
    backgroundColor: '#28a745',
    padding: 8,
    borderRadius: 8,
    margin: 5,
  },
  buttonEdit: {
    backgroundColor: '#ffc107',
    padding: 8,
    borderRadius: 8,
    margin: 5,
  },
  buttonDelete: {
    backgroundColor: '#dc3545',
    padding: 8,
    borderRadius: 8,
    margin: 5,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  paginationButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 8,
  },
  paginationButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  paginationText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  deleteModalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
  },
  modalButtonDelete: {
    backgroundColor: '#dc3545',
  },
  modalButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
});

// este;

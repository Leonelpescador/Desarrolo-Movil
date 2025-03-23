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

// Importa la instancia de Firestore
import { db } from '../../src/firebase'; // Ajusta la ruta según tu estructura de carpetas
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';

import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

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
  const [allSolicitudes, setAllSolicitudes] = useState([]);
  const [filteredSolicitudes, setFilteredSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedSolicitudes, setPaginatedSolicitudes] = useState([]);

  // Modal de eliminación
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [solicitudToDelete, setSolicitudToDelete] = useState(null);

  // Tipo de usuario (rol) que tengas almacenado localmente
  const [userRole, setUserRole] = useState("");

  /**
   * Función para obtener todas las solicitudes desde Firebase
   */
  const fetchAllSolicitudes = async () => {
    setLoading(true);
    try {
      // Si tienes que filtrar desde Firestore, aquí podrías armar un query. Por ejemplo:
      // const q = query(collection(db, 'solicitudenfermeria'), where('estado', '==', 'pendiente'));
      // Pero en este ejemplo traemos todo y luego filtramos en el cliente, tal como lo haces ahora:
      const colRef = collection(db, 'solicitudenfermeria');

      // Obtenemos los documentos
      const snapshot = await getDocs(colRef);

      // Convertimos la data a un arreglo de objetos
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

      setAllSolicitudes(data);
    } catch (error) {
      console.error("Error al obtener solicitudes desde Firebase:", error);
      Alert.alert("Error", "No se pudieron cargar las solicitudes desde Firebase.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cargar data de Firebase y rol del usuario al montar
   */
  useEffect(() => {
    fetchAllSolicitudes();
    AsyncStorage.getItem('userRole').then(role => {
      if (role) setUserRole(role);
    });
  }, []);

  /**
   * Filtro y ordenamiento en el cliente
   */
  useEffect(() => {
    const filtradas = allSolicitudes.filter((solicitud) => {
      // Filtro por apellido
      if (
        apellidoPaciente &&
        !solicitud.apellido_paciente?.toLowerCase().includes(apellidoPaciente.toLowerCase())
      ) {
        return false;
      }
      // Filtro por nombre
      if (
        nombrePaciente &&
        !solicitud.nombre_paciente?.toLowerCase().includes(nombrePaciente.toLowerCase())
      ) {
        return false;
      }
      // Filtro por usuario
      if (
        usuarioFiltro &&
        solicitud.usuario?.username &&
        !solicitud.usuario.username.toLowerCase().includes(usuarioFiltro.toLowerCase())
      ) {
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

    // Orden descendente por fecha_creacion
    filtradas.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));

    setFilteredSolicitudes(filtradas);
    setCurrentPage(1);
  }, [
    allSolicitudes,
    apellidoPaciente,
    nombrePaciente,
    usuarioFiltro,
    fechaInicio,
    fechaFin,
    estadoFiltro
  ]);

  /**
   * Paginación (actualizar la página actual)
   */
  useEffect(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    setPaginatedSolicitudes(filteredSolicitudes.slice(startIndex, endIndex));
  }, [filteredSolicitudes, currentPage]);

  /**
   * Limpiar filtros
   */
  const clearFilters = () => {
    setApellidoPaciente("");
    setNombrePaciente("");
    setUsuarioFiltro("");
    setFechaInicio("");
    setFechaFin("");
    setEstadoFiltro("");
  };

  /**
   * Confirmar entrega (ejemplo de actualización en Firestore)
   */
  const confirmEntrega = async (id) => {
    try {
      // Ubicamos el documento que queremos actualizar:
      const docRef = doc(db, 'solicitudenfermeria', id);
      // Aquí asumimos que, al confirmar, cambiamos el campo "estado" a "entregado"
      // o algo similar:
      await updateDoc(docRef, {
        estado: 'entregado',
        // Otros campos que quieras actualizar
      });
      Alert.alert("Éxito", "Se ha confirmado la entrega correctamente.");
      // Recargamos la lista
      fetchAllSolicitudes();
    } catch (error) {
      console.error("Error confirmando entrega en Firebase:", error);
      Alert.alert("Error", "Ocurrió un error al confirmar la entrega.");
    }
  };

  /**
   * Eliminar solicitud (DELETE en Firestore)
   */
  const deleteSolicitud = async () => {
    if (!solicitudToDelete) return;
    try {
      const docRef = doc(db, 'solicitudenfermeria', solicitudToDelete.id);
      await deleteDoc(docRef);
      Alert.alert("Éxito", "Solicitud eliminada correctamente.");
      setDeleteModalVisible(false);
      fetchAllSolicitudes();
    } catch (error) {
      console.error("Error eliminando solicitud en Firebase:", error);
      Alert.alert("Error", "Ocurrió un error al eliminar la solicitud.");
    }
  };

  /**
   * Renderizado de cada solicitud
   */
  const renderSolicitud = ({ item }) => (
    <View
      style={[
        styles.card,
        item.estado === 'pendiente' ? styles.cardPendiente : styles.cardEntregado
      ]}
    >
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>
          {item.apellido_paciente} {item.nombre_paciente}
        </Text>
        <Text style={styles.cardText}>
          Sector: {item.sector ? item.sector.nombre : "N/A"}
        </Text>
        <Text style={styles.cardText}>
          Cama: {item.cama ? item.cama.numero : "N/A"}
        </Text>
        <Text style={styles.cardText}>
          Enfermero: {item.usuario ? item.usuario.username : "N/A"}
        </Text>
        <Text style={styles.cardText}>
          Estado: {item.estado}
        </Text>
        {item.numero_caja && (
          <Text style={styles.cardText}>
            Caja Roja: {item.numero_caja.numero}
          </Text>
        )}
        <Text style={styles.cardText}>
          Elementos: {item.detalles}
        </Text>
        <Text style={styles.cardText}>
          Sacó medicamento: {item.saco_medicamento_de_caja ? "Sí" : "No"}
        </Text>
        {item.saco_medicamento_de_caja && (
          <>
            <Text style={styles.cardText}>
              Origen: {item.origen_medicamento}
            </Text>
            <Text style={styles.cardText}>
              Elemento/s: {item.saco || "No especificado"}
            </Text>
          </>
        )}
        <Text style={styles.cardText}>
          Fecha: {new Date(item.fecha_creacion).toLocaleString()}
        </Text>
      </View>

      {/* Ejemplo de botones de acción (si aplica) */}
      <View style={styles.cardFooter}>
        {item.estado === 'pendiente' && (
          <TouchableOpacity
            style={styles.buttonConfirm}
            onPress={() => confirmEntrega(item.id)}
          >
            <Text style={styles.buttonText}>Confirmar Entrega</Text>
          </TouchableOpacity>
        )}

        {/* Si eres admin o rol con permiso para eliminar */}
        {(userRole === 'admin' || userRole === 'sup-enfermero') && (
          <TouchableOpacity
            style={styles.buttonDelete}
            onPress={() => {
              setSolicitudToDelete(item);
              setDeleteModalVisible(true);
            }}
          >
            <Text style={styles.buttonText}>Eliminar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  /**
   * Paginación
   */
  const goToNextPage = () => {
    if (currentPage * PAGE_SIZE < filteredSolicitudes.length) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <Text style={styles.header}>Solicitudes de Enfermería</Text>

      {/* Botones de navegación */}
      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={styles.buttonPrimary}
          onPress={() => navigation.navigate('CrearSolicitudEnfermeria')}
        >
          <Text style={styles.buttonText}>Crear Solicitud</Text>
        </TouchableOpacity>
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
        <ActivityIndicator size="large" />
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

      {/* Modal de eliminación */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContainer}>
            <Text style={styles.modalTitle}>Confirmar eliminación</Text>
            <Text style={styles.modalMessage}>
              ¿Estás seguro de que deseas eliminar esta solicitud?
            </Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDelete]}
                onPress={deleteSolicitud}
              >
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

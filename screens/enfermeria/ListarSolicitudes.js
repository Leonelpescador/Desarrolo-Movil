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
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../src/firebase';
import { useCompleteUserData } from '../../src/hooks/useCompleteUserData';

const PAGE_SIZE = 20;

export default function ListarSolicitudes() {
  const navigation = useNavigation();
  const { user, perfil, loading: loadingUser } = useCompleteUserData();

  // Estados para filtros
  const [apellidoPaciente, setApellidoPaciente] = useState("");
  const [nombrePaciente, setNombrePaciente] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Estados para data
  const [allSolicitudes, setAllSolicitudes] = useState([]);
  const [filteredSolicitudes, setFilteredSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedSolicitudes, setPaginatedSolicitudes] = useState([]);

  // Función para cargar solicitudes desde Firebase
  const fetchAllSolicitudes = async () => {
    setLoading(true);
    try {
      const colRef = collection(db, 'solicitudes_enfermeria');
      const snapshot = await getDocs(colRef);
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setAllSolicitudes(data);
    } catch (error) {
      console.error("Error al obtener solicitudes desde Firebase:", error);
      Alert.alert("Error", "No se pudieron cargar las solicitudes desde Firebase.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSolicitudes();
  }, []);

  // Filtrado y orden
  useEffect(() => {
    const filtradas = allSolicitudes.filter((solicitud) => {
      if (
        apellidoPaciente &&
        !solicitud.apellido_paciente
          ?.toLowerCase()
          .includes(apellidoPaciente.toLowerCase())
      ) return false;
      if (
        nombrePaciente &&
        !solicitud.nombre_paciente
          ?.toLowerCase()
          .includes(nombrePaciente.toLowerCase())
      ) return false;
      if (fechaInicio) {
        const inicio = new Date(fechaInicio);
        const fechaSolicitud = new Date(solicitud.fecha_creacion);
        if (fechaSolicitud < inicio) return false;
      }
      if (fechaFin) {
        const fin = new Date(fechaFin);
        const fechaSolicitud = new Date(solicitud.fecha_creacion);
        if (fechaSolicitud > fin) return false;
      }
      if (estadoFiltro && solicitud.estado !== estadoFiltro) return false;
      return true;
    });
    filtradas.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
    setFilteredSolicitudes(filtradas);
    setCurrentPage(1);
  }, [allSolicitudes, apellidoPaciente, nombrePaciente, fechaInicio, fechaFin, estadoFiltro]);

  // Paginación
  useEffect(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    setPaginatedSolicitudes(filteredSolicitudes.slice(startIndex, endIndex));
  }, [filteredSolicitudes, currentPage]);

  const clearFilters = () => {
    setApellidoPaciente("");
    setNombrePaciente("");
    setFechaInicio("");
    setFechaFin("");
    setEstadoFiltro("");
  };

  // Funciones de restricciones para editar y eliminar solicitudes
  const handleEdit = (solicitud) => {
    const now = new Date();
    const creationDate = new Date(solicitud.fecha_creacion);
    const diffMinutes = (now - creationDate) / (1000 * 60);
    const currentUserName = perfil?.username;
    const userType = perfil?.tipo_usuario;

    if ((userType === 'enfermero' || userType === 'sup-enfermero')) {
      if (solicitud.usuario !== currentUserName) {
        Alert.alert("Acceso denegado", "No puedes editar solicitudes que no hayas creado.");
        return;
      }
      if (diffMinutes > 240) {
        Alert.alert("Tiempo excedido", "No puedes editar una solicitud creada hace más de 4 horas.");
        return;
      }
      if (solicitud.estado === "entregado") {
        Alert.alert("Acción no permitida", "No puedes editar una solicitud que ya ha sido entregada.");
        return;
      }
    }
    // Para admin o Farmacia se permite sin restricciones
    navigation.navigate("EditarSolicitudEnfermeria", { id: solicitud.id });
  };

  const handleDelete = async (solicitud) => {
    const now = new Date();
    const creationDate = new Date(solicitud.fecha_creacion);
    const diffMinutes = (now - creationDate) / (1000 * 60);
    const currentUserName = perfil?.username;
    const userType = perfil?.tipo_usuario;

    if ((userType === 'enfermero' || userType === 'sup-enfermero')) {
      if (solicitud.usuario !== currentUserName) {
        Alert.alert("Acceso denegado", "No puedes eliminar solicitudes que no hayas creado.");
        return;
      }
      if (diffMinutes > 90) {
        Alert.alert("Tiempo excedido", "No puedes eliminar una solicitud creada hace más de 90 minutos.");
        return;
      }
      if (solicitud.estado === "entregado") {
        Alert.alert("Acción no permitida", "No puedes eliminar una solicitud que ya ha sido entregada.");
        return;
      }
    }
    // Para admin y Farmacia se permiten sin restricciones
    try {
      await deleteDoc(doc(db, "solicitudes_enfermeria", solicitud.id));
      Alert.alert("Éxito", "Solicitud eliminada correctamente.");
      fetchAllSolicitudes();
    } catch (error) {
      console.error("Error al eliminar solicitud:", error);
      Alert.alert("Error", "No se pudo eliminar la solicitud.");
    }
  };

  // Render de cada solicitud
  const renderSolicitud = ({ item }) => (
    <View style={[
      styles.card,
      item.estado === 'pendiente' ? styles.cardPendiente : styles.cardEntregado
    ]}>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>
          {item.apellido_paciente} {item.nombre_paciente}
        </Text>
        <Text style={styles.cardText}>
          Sector: {item.sector || "N/A"}
        </Text>
        <Text style={styles.cardText}>
          Cama: {item.cama || "N/A"}
        </Text>
        <Text style={styles.cardText}>
          Enfermero: {item.usuario || "N/A"}
        </Text>
        <Text style={styles.cardText}>
          Estado: {item.estado}
        </Text>
        {item.numero_caja && (
          <Text style={styles.cardText}>
            Caja Roja: {item.numero_caja}
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
              Origen: {item.origen_medicamento ?? "No especificado"}
            </Text>
            <Text style={styles.cardText}>
              Elemento/s: {item.saco ?? "No especificado"}
            </Text>
          </>
        )}
        <Text style={styles.cardText}>
          Fecha: {new Date(item.fecha_creacion).toLocaleString()}
        </Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(item)}>
          <Text style={styles.editButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item)}>
          <Text style={styles.deleteButtonText}>Eliminar</Text>
        </TouchableOpacity>
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

      {/* Botón de lupa para mostrar/ocultar filtros */}
      <TouchableOpacity style={styles.filterToggleButton} onPress={() => setShowFilters(!showFilters)}>
        <Text style={styles.filterToggleText}>🔍</Text>
      </TouchableOpacity>

      {showFilters && (
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
          <View style={styles.filterPickerContainer}>
            <Picker
              selectedValue={estadoFiltro}
              style={styles.filterPicker}
              onValueChange={(value) => setEstadoFiltro(value)}
            >
              <Picker.Item label="Estado: Pendiente" value="pendiente" />
              <Picker.Item label="Estado: Entregado" value="entregado" />
              <Picker.Item label="Todos" value="" />
            </Picker>
          </View>
          <TextInput
            style={styles.filterInput}
            placeholder="Fecha inicio (YYYY-MM-DD)"
            value={fechaInicio}
            onChangeText={setFechaInicio}
          />
          <TextInput
            style={styles.filterInput}
            placeholder="Fecha fin (YYYY-MM-DD)"
            value={fechaFin}
            onChangeText={setFechaFin}
          />
          <View style={styles.filterButtonContainer}>
            <TouchableOpacity style={styles.filterButton} onPress={fetchAllSolicitudes}>
              <Text style={styles.filterButtonText}>Buscar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterButton} onPress={clearFilters}>
              <Text style={styles.filterButtonText}>Limpiar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={paginatedSolicitudes}
          keyExtractor={(item) => item.id}
          renderItem={renderSolicitud}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <View style={styles.paginationContainer}>
        <TouchableOpacity style={styles.paginationButton} onPress={goToPreviousPage}>
          <Text style={styles.paginationButtonText}>Anterior</Text>
        </TouchableOpacity>
        <Text style={styles.paginationText}>Página {currentPage}</Text>
        <TouchableOpacity style={styles.paginationButton} onPress={goToNextPage}>
          <Text style={styles.paginationButtonText}>Siguiente</Text>
        </TouchableOpacity>
      </View>
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
    marginBottom: 10,
    textAlign: 'center',
  },
  filterToggleButton: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  filterToggleText: {
    fontSize: 24,
  },
  filterContainer: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#eef',
    borderRadius: 8,
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
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  editButton: {
    backgroundColor: '#007bff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
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
});

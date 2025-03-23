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

// Importa la instancia de Firestore
import { db } from '../../src/firebase'; // Ajusta la ruta a tu archivo firebase.js
import { collection, getDocs } from 'firebase/firestore';

import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';

const PAGE_SIZE = 20;

export default function ListarSolicitudes() {
  const navigation = useNavigation();

  // Filtros
  const [apellidoPaciente, setApellidoPaciente] = useState("");
  const [nombrePaciente, setNombrePaciente] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");

  // Estados para la data y su filtrado
  const [allSolicitudes, setAllSolicitudes] = useState([]);
  const [filteredSolicitudes, setFilteredSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedSolicitudes, setPaginatedSolicitudes] = useState([]);

  /**
   * 1) Cargar todas las solicitudes desde Firebase (colección "solicitudes_enfermeria")
   */
  const fetchAllSolicitudes = async () => {
    setLoading(true);
    try {
      const colRef = collection(db, 'solicitudes_enfermeria'); 
      const snapshot = await getDocs(colRef);

      // Convertimos la data a un arreglo de objetos
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

  /**
   * 2) Montaje del componente: obtenemos las solicitudes
   */
  useEffect(() => {
    fetchAllSolicitudes();
  }, []);

  /**
   * 3) Filtrado y orden en el cliente
   */
  useEffect(() => {
    const filtradas = allSolicitudes.filter((solicitud) => {
      // Filtro por apellido
      if (
        apellidoPaciente &&
        !solicitud.apellido_paciente
          ?.toLowerCase()
          .includes(apellidoPaciente.toLowerCase())
      ) {
        return false;
      }
      // Filtro por nombre
      if (
        nombrePaciente &&
        !solicitud.nombre_paciente
          ?.toLowerCase()
          .includes(nombrePaciente.toLowerCase())
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
  }, [allSolicitudes, apellidoPaciente, nombrePaciente, fechaInicio, fechaFin, estadoFiltro]);

  /**
   * 4) Paginación: actualizamos la página
   */
  useEffect(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    setPaginatedSolicitudes(filteredSolicitudes.slice(startIndex, endIndex));
  }, [filteredSolicitudes, currentPage]);

  /**
   * 5) Limpiar filtros
   */
  const clearFilters = () => {
    setApellidoPaciente("");
    setNombrePaciente("");
    setFechaInicio("");
    setFechaFin("");
    setEstadoFiltro("");
  };

  /**
   * Renderizar cada tarjeta de solicitud
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
    </View>
  );

  /**
   * 6) Funciones de cambio de página
   */
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

      {/* Botón para crear solicitud (opcional) */}
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

        {/* Fechas: formateo YYYY-MM-DD */}
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

      {/* Lista de solicitudes */}
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
    </View>
  );
}

// Estilos
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
    justifyContent: 'center',
    marginBottom: 20,
  },
  buttonPrimary: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 5,
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

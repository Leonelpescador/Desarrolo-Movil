// screens/enfermeria/CrearSolicitud.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const SOLICITUD_API_URL = "https://gestiones.cenesa.com.ar:88/api/solicitudenfermeria/?format=json";
const CAJA_API_URL = "https://gestiones.cenesa.com.ar:88/api/caja/?format=json";
const SECTOR_API_URL = "https://gestiones.cenesa.com.ar:88/api/sector/?format=json";
const CAMA_API_URL = "https://gestiones.cenesa.com.ar:88/api/cama/?format=json";
const MEDICAMENTO_API_URL = "https://gestiones.cenesa.com.ar:88/api/medicamenfermeria/?format=json";
const DESCARTABLE_API_URL = "https://gestiones.cenesa.com.ar:88/api/descartableenfermeria/?format=json";

export default function CrearSolicitud() {
  const navigation = useNavigation();

  // Estados para datos de la API
  const [cajas, setCajas] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [allCamas, setAllCamas] = useState([]);
  const [filteredCamas, setFilteredCamas] = useState([]);
  const [medicamentos, setMedicamentos] = useState([]);
  const [descartables, setDescartables] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Estados del formulario
  const [selectedSector, setSelectedSector] = useState("");
  const [selectedCama, setSelectedCama] = useState("");
  const [nombrePaciente, setNombrePaciente] = useState("");
  const [apellidoPaciente, setApellidoPaciente] = useState("");
  const [numeroCaja, setNumeroCaja] = useState("");
  const [detalles, setDetalles] = useState("");
  const [sacoMedicamento, setSacoMedicamento] = useState(false);
  const [origenMedicamento, setOrigenMedicamento] = useState("");
  const [saco, setSaco] = useState("");

  // Estados para los modales
  const [medModalVisible, setMedModalVisible] = useState(false);
  const [descModalVisible, setDescModalVisible] = useState(false);

  // Suministros seleccionados (almacenados como objeto: { [id]: { name, count } })
  const [selectedMedicamentos, setSelectedMedicamentos] = useState({});
  const [selectedDescartables, setSelectedDescartables] = useState({});

  // Función auxiliar para obtener datos desde la API
  const fetchAndSetData = async (url, setter) => {
    try {
      const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
      const data = await response.json();
      if (Array.isArray(data)) {
        setter(data);
      } else {
        console.warn(`La respuesta de ${url} no es un arreglo.`);
        setter([]);
      }
    } catch (error) {
      console.error(`Error al obtener datos desde ${url}:`, error);
      Alert.alert("Error", `No se pudo cargar la información desde el servidor para ${url}.`);
      setter([]);
    }
  };

  // Cargar datos de la API al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([
        fetchAndSetData(CAJA_API_URL, setCajas),
        fetchAndSetData(SECTOR_API_URL, setSectors),
        fetchAndSetData(CAMA_API_URL, setAllCamas),
        fetchAndSetData(MEDICAMENTO_API_URL, setMedicamentos),
        fetchAndSetData(DESCARTABLE_API_URL, setDescartables),
      ]);
      setLoadingData(false);
    };
    fetchData();
  }, []);

  // Filtrar las camas según el sector seleccionado
  useEffect(() => {
    if (selectedSector) {
      const camasFiltradas = allCamas.filter(cama => String(cama.sector) === String(selectedSector));
      setFilteredCamas(camasFiltradas);
      setSelectedCama("");
    } else {
      setFilteredCamas([]);
      setSelectedCama("");
    }
  }, [selectedSector, allCamas]);

  // Actualizar el campo "detalles" basado en lo seleccionado
  const updateDetalles = () => {
    let text = "";
    Object.values(selectedMedicamentos).forEach(item => {
      text += `${item.name} x ${item.count}, `;
    });
    Object.values(selectedDescartables).forEach(item => {
      text += `${item.name} x ${item.count}, `;
    });
    if (text.length > 0) {
      text = text.slice(0, -2); // Quita la coma y espacio final
    }
    setDetalles(text);
  };

  const addMedicamento = (med) => {
    setSelectedMedicamentos(prev => {
      const count = prev[med.id] ? prev[med.id].count + 1 : 1;
      return { ...prev, [med.id]: { name: med.nombre, count } };
    });
    updateDetalles();
  };

  const addDescartable = (desc) => {
    setSelectedDescartables(prev => {
      const count = prev[desc.id] ? prev[desc.id].count + 1 : 1;
      return { ...prev, [desc.id]: { name: desc.nombre, count } };
    });
    updateDetalles();
  };

  // Función para enviar la solicitud a la API (POST)
  const handleSubmit = async () => {
    if (!nombrePaciente || !apellidoPaciente) {
      Alert.alert("Error", "Complete los campos obligatorios.");
      return;
    }
    const payload = {
      sector: selectedSector,
      cama: selectedCama,
      nombre_paciente: nombrePaciente,
      apellido_paciente: apellidoPaciente,
      numero_caja: numeroCaja,
      detalles: detalles,
      saco_medicamento_de_caja: sacoMedicamento,
      origen_medicamento: origenMedicamento,
      saco: saco,
      estado: "pendiente"
    };

    console.log("Enviando payload:", payload);

    try {
      const token = await AsyncStorage.getItem('token');
      console.log("Token obtenido:", token);
      const response = await fetch(SOLICITUD_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      console.log("Respuesta del servidor:", response);
      if (response.ok) {
        Alert.alert("Éxito", "Solicitud creada correctamente.");
        // Reinicia los campos si lo deseas
        setSelectedSector("");
        setSelectedCama("");
        setNombrePaciente("");
        setApellidoPaciente("");
        setNumeroCaja("");
        setDetalles("");
        setSacoMedicamento(false);
        setOrigenMedicamento("");
        setSaco("");
        setSelectedMedicamentos({});
        setSelectedDescartables({});
        // Navegar a la pantalla de listado
        navigation.navigate("ListarSolicitudesEnfermeria");
      } else {
        const errorData = await response.json();
        console.error("Error en respuesta:", errorData);
        Alert.alert("Error", JSON.stringify(errorData));
      }
    } catch (error) {
      console.error("Error al enviar la solicitud:", error);
      Alert.alert("Error", "No se pudo crear la solicitud.");
    }
  };

  if (loadingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Crear Solicitud de Enfermería</Text>

      {/* Picker para Sector */}
      <Text style={styles.label}>Sector</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedSector}
          style={styles.picker}
          onValueChange={(itemValue) => setSelectedSector(itemValue)}
        >
          <Picker.Item label="Seleccione un sector" value="" />
          {sectors.map(sector => (
            <Picker.Item key={sector.id} label={sector.nombre} value={sector.id} />
          ))}
        </Picker>
      </View>

      {/* Picker para Cama (según sector seleccionado) */}
      <Text style={styles.label}>Cama</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedCama}
          style={styles.picker}
          onValueChange={(itemValue) => setSelectedCama(itemValue)}
          enabled={filteredCamas.length > 0}
        >
          <Picker.Item label="Seleccione una cama" value="" />
          {filteredCamas.map(cama => (
            <Picker.Item key={cama.id} label={String(cama.numero)} value={cama.id} />
          ))}
        </Picker>
      </View>

      {/* Nombre del Paciente */}
      <Text style={styles.label}>Nombre del Paciente</Text>
      <TextInput
        style={styles.input}
        placeholder="Ingrese el nombre"
        value={nombrePaciente}
        onChangeText={setNombrePaciente}
      />

      {/* Apellido del Paciente */}
      <Text style={styles.label}>Apellido del Paciente</Text>
      <TextInput
        style={styles.input}
        placeholder="Ingrese el apellido"
        value={apellidoPaciente}
        onChangeText={setApellidoPaciente}
      />

      {/* Picker para Número de Caja Roja */}
      <Text style={styles.label}>N° de Caja Roja</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={numeroCaja}
          style={styles.picker}
          onValueChange={(itemValue) => setNumeroCaja(itemValue)}
        >
          <Picker.Item label="Seleccione una caja" value="" />
          {cajas.map(caja => (
            <Picker.Item
              key={caja.id}
              label={caja.nombre || caja.numero || String(caja.id)}
              value={caja.id}
            />
          ))}
        </Picker>
      </View>

      {/* Campo de Detalles */}
      <Text style={styles.label}>Suministros Usados</Text>
      <TextInput
        style={styles.input}
        placeholder="Detalle de suministros"
        value={detalles}
        onChangeText={setDetalles}
      />

      {/* Radio: ¿Sacó medicamento de otro lugar? */}
      <Text style={styles.label}>¿Sacó medicamento de otro lugar?</Text>
      <View style={styles.radioContainer}>
        <TouchableOpacity style={styles.radioButton} onPress={() => setSacoMedicamento(true)}>
          <Text style={sacoMedicamento ? styles.radioSelected : styles.radioUnselected}>Sí</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.radioButton} onPress={() => setSacoMedicamento(false)}>
          <Text style={!sacoMedicamento ? styles.radioSelected : styles.radioUnselected}>No</Text>
        </TouchableOpacity>
      </View>

      {sacoMedicamento && (
        <>
          <Text style={styles.label}>Origen del Medicamento</Text>
          <TextInput
            style={styles.input}
            placeholder="Ingrese el origen"
            value={origenMedicamento}
            onChangeText={setOrigenMedicamento}
          />
          <Text style={styles.label}>Detalle del elemento que sacó</Text>
          <TextInput
            style={styles.input}
            placeholder="Detalle"
            value={saco}
            onChangeText={setSaco}
          />
        </>
      )}

      {/* Botones para abrir modales */}
      <TouchableOpacity style={styles.button} onPress={() => setMedModalVisible(true)}>
        <Text style={styles.buttonText}>Añadir Medicamentos</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => setDescModalVisible(true)}>
        <Text style={styles.buttonText}>Añadir Descartables</Text>
      </TouchableOpacity>

      {/* Botón para enviar la solicitud */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Crear Solicitud</Text>
      </TouchableOpacity>

      {/* Modal para seleccionar Medicamentos */}
      <Modal
        visible={medModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setMedModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Seleccionar Medicamentos</Text>
            <FlatList
              data={medicamentos}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => addMedicamento(item)}>
                  <Text>{item.nombre}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.closeModalButton} onPress={() => setMedModalVisible(false)}>
              <Text style={styles.closeModalButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal para seleccionar Descartables */}
      <Modal
        visible={descModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDescModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Seleccionar Descartables</Text>
            <FlatList
              data={descartables}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => addDescartable(item)}>
                  <Text>{item.nombre}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.closeModalButton} onPress={() => setDescModalVisible(false)}>
              <Text style={styles.closeModalButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  radioContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  radioButton: {
    marginRight: 15,
  },
  radioSelected: {
    color: 'green',
    fontWeight: 'bold',
  },
  radioUnselected: {
    color: 'gray',
  },
  button: {
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  closeModalButton: {
    backgroundColor: '#dc3545',
    padding: 10,
    borderRadius: 8,
    marginTop: 15,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: '#fff',
  },
});

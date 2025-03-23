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
import { useNavigation } from '@react-navigation/native';
import { 
  collection, 
  getDocs, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../src/firebase';

export default function CrearSolicitud() {
  const navigation = useNavigation();

  // Estados para datos de Firestore
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

  // Diccionarios donde guardamos lo seleccionado, con contadores:
  // { [idMedicamento]: { name: 'Paracetamol', count: 3 }, ... }
  const [selectedMedicamentos, setSelectedMedicamentos] = useState({});
  const [selectedDescartables, setSelectedDescartables] = useState({});

  // Función auxiliar para obtener una colección de Firestore
  const fetchCollection = async (collectionName, setter) => {
    try {
      const colRef = collection(db, collectionName);
      const querySnapshot = await getDocs(colRef);
      const items = [];
      querySnapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() });
      });
      setter(items);
    } catch (error) {
      console.error(`Error al obtener ${collectionName}:`, error);
      Alert.alert("Error", `No se pudo cargar la información de ${collectionName}.`);
      setter([]);
    }
  };

  // Cargar datos de Firestore al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([
        fetchCollection("cajas", setCajas),
        fetchCollection("sectores", setSectors),
        fetchCollection("camas", setAllCamas),
        fetchCollection("medicamentos_enfermeria", setMedicamentos),
        fetchCollection("descartables_enfermeria", setDescartables),
      ]);
      setLoadingData(false);
    };
    fetchData();
  }, []);

  // Filtrar las camas según el nombre del sector seleccionado
  // Suponemos que en Firestore la "cama" tiene un campo "sector" = nombre del sector.
  // En el Picker de sector, guardamos 'sector.nombre' en selectedSector.
  useEffect(() => {
    if (selectedSector) {
      const filtradas = allCamas.filter(cama => String(cama.sector) === String(selectedSector));
      setFilteredCamas(filtradas);
      setSelectedCama("");
    } else {
      setFilteredCamas([]);
      setSelectedCama("");
    }
  }, [selectedSector, allCamas]);

  /**
   * Construye la cadena "detalles" a partir de selectedMedicamentos y selectedDescartables
   */
  const buildDetalles = (selMeds, selDesc) => {
    let text = "";
    Object.values(selMeds).forEach(item => {
      text += `${item.name} x ${item.count}, `;
    });
    Object.values(selDesc).forEach(item => {
      text += `${item.name} x ${item.count}, `;
    });
    if (text.endsWith(", ")) {
      text = text.slice(0, -2);
    }
    return text;
  };

  /**
   * Cada vez que cambie selectedMedicamentos o selectedDescartables
   * reconstruimos "detalles"
   */
  useEffect(() => {
    const newDetalles = buildDetalles(selectedMedicamentos, selectedDescartables);
    setDetalles(newDetalles);
  }, [selectedMedicamentos, selectedDescartables]);

  /**
   * Añadir/Incrementar Medicamento
   */
  const addMedicamento = (med) => {
    setSelectedMedicamentos(prev => {
      const prevItem = prev[med.id];
      const count = prevItem ? prevItem.count + 1 : 1;
      return {
        ...prev,
        [med.id]: { name: med.nombre, count }
      };
    });
  };

  /**
   * Añadir/Incrementar Descartable
   */
  const addDescartable = (desc) => {
    setSelectedDescartables(prev => {
      const prevItem = prev[desc.id];
      const count = prevItem ? prevItem.count + 1 : 1;
      return {
        ...prev,
        [desc.id]: { name: desc.nombre, count }
      };
    });
  };

  // Función para enviar la solicitud a Firestore
  const handleSubmit = async () => {
    if (!nombrePaciente.trim() || !apellidoPaciente.trim()) {
      Alert.alert("Error", "Complete los campos de nombre y apellido.");
      return;
    }

    // Construimos el objeto a guardar
    const payload = {
      sector: selectedSector,             // string del sector
      cama: selectedCama,                // ID de la cama o lo que desees guardar
      nombre_paciente: nombrePaciente.trim(),
      apellido_paciente: apellidoPaciente.trim(),
      numero_caja: numeroCaja,
      detalles: detalles,                // texto de medicamentos/descartables
      saco_medicamento_de_caja: sacoMedicamento,
      origen_medicamento: origenMedicamento || null,
      saco: saco || null,
      estado: "pendiente",
      fecha_creacion: serverTimestamp(),  // Para guardar la fecha/hora en Firestore
    };

    try {
      const solicitudesRef = collection(db, "solicitudes_enfermeria");
      await addDoc(solicitudesRef, payload);
      Alert.alert("Éxito", "Solicitud creada correctamente.");
      
      // Reiniciar campos
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
      
      // Navegar a la pantalla de listado (ajusta el nombre según tu stack)
      navigation.navigate("ListarSolicitudesEnfermeria");
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
          onValueChange={(value) => setSelectedSector(value)}
        >
          <Picker.Item label="Seleccione un sector" value="" />
          {sectors.map(sector => (
            // Aquí guardamos sector.nombre como 'value'
            <Picker.Item key={sector.id} label={sector.nombre} value={sector.nombre} />
          ))}
        </Picker>
      </View>

      {/* Picker para Cama */}
      <Text style={styles.label}>Cama</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedCama}
          style={styles.picker}
          onValueChange={(value) => setSelectedCama(value)}
          enabled={filteredCamas.length > 0}
        >
          <Picker.Item label="Seleccione una cama" value="" />
          {filteredCamas.map(cama => (
            <Picker.Item
              key={cama.id}
              label={String(cama.numero)} 
              value={String(cama.numero)}  // o guarda cama.id si quieres
            />
          ))}
        </Picker>
      </View>

      {/* Nombre del Paciente */}
      <Text style={styles.label}>Nombre del Paciente</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Lucio"
        value={nombrePaciente}
        onChangeText={setNombrePaciente}
      />

      {/* Apellido del Paciente */}
      <Text style={styles.label}>Apellido del Paciente</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Flores"
        value={apellidoPaciente}
        onChangeText={setApellidoPaciente}
      />

      {/* Picker para Número de Caja Roja */}
      <Text style={styles.label}>N° de Caja Roja</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={numeroCaja}
          style={styles.picker}
          onValueChange={(val) => setNumeroCaja(val)}
        >
          <Picker.Item label="Seleccione una caja" value="" />
          {cajas.map(caja => (
            <Picker.Item
              key={caja.id}
              // Asumimos que en tu doc de caja tienes "numero"
              label={`Caja N°${caja.numero}`}
              value={String(caja.numero)}
            />
          ))}
        </Picker>
      </View>

      {/* Campo de Detalles (se genera automáticamente) */}
      <Text style={styles.label}>Suministros Usados</Text>
      <TextInput
        style={[styles.input, { backgroundColor: '#f0f0f0' }]}
        placeholder="Detalle de suministros"
        value={detalles}
        onChangeText={setDetalles}
        editable={false} // para que no se edite manualmente, ya que se arma en base a selecciones
      />

      {/* Radio para Sacó medicamento */}
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
            placeholder="Ej: Farmacia, depósito, etc."
            value={origenMedicamento}
            onChangeText={setOrigenMedicamento}
          />

          <Text style={styles.label}>Detalle del elemento que sacó</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Ampolla, pastillas, etc."
            value={saco}
            onChangeText={setSaco}
          />
        </>
      )}

      {/* Botones para abrir modales de Medicamentos y Descartables */}
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

      {/* Modal de Medicamentos */}
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
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                // Cantidad actual de este med en 'selectedMedicamentos'
                const count = selectedMedicamentos[item.id]?.count || 0;
                return (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => addMedicamento(item)}
                  >
                    <Text>
                      {item.nombre} {count > 0 && <Text style={{ color: 'green' }}> (x {count})</Text>}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity style={styles.closeModalButton} onPress={() => setMedModalVisible(false)}>
              <Text style={styles.closeModalButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Descartables */}
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
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const count = selectedDescartables[item.id]?.count || 0;
                return (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => addDescartable(item)}
                  >
                    <Text>
                      {item.nombre} {count > 0 && <Text style={{ color: 'green' }}> (x {count})</Text>}
                    </Text>
                  </TouchableOpacity>
                );
              }}
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

/** Estilos */
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  container: {
    padding: 20, backgroundColor: '#fff',
  },
  header: {
    fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center',
  },
  label: {
    fontSize: 16, marginBottom: 5,
  },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    padding: 10, marginBottom: 15,
  },
  pickerContainer: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    marginBottom: 15, overflow: 'hidden',
  },
  picker: {
    height: 50, width: '100%',
  },
  radioContainer: {
    flexDirection: 'row', marginBottom: 15,
  },
  radioButton: {
    marginRight: 15,
  },
  radioSelected: {
    color: 'green', fontWeight: 'bold',
  },
  radioUnselected: {
    color: 'gray',
  },
  button: {
    backgroundColor: '#6c757d',
    padding: 12, borderRadius: 8,
    alignItems: 'center', marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#007bff',
    padding: 15, borderRadius: 8,
    alignItems: 'center', marginBottom: 20,
  },
  submitButtonText: {
    color: '#fff', fontSize: 16, fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 10,
  },
  modalContainer: {
    width: '90%', maxHeight: '80%', backgroundColor: '#fff',
    borderRadius: 8, padding: 20, alignSelf: 'center',
  },
  modalTitle: {
    fontSize: 18, fontWeight: 'bold', marginBottom: 10,
  },
  modalItem: {
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#ddd',
  },
  closeModalButton: {
    backgroundColor: '#dc3545',
    padding: 10, borderRadius: 8,
    marginTop: 15, alignItems: 'center',
  },
  closeModalButtonText: {
    color: '#fff',
  },
});

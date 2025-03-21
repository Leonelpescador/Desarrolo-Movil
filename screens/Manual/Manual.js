import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const API_MANUALES = "https://gestiones.cenesa.com.ar:88/api/manual/?format=json";
const API_VIDEOS = "https://gestiones.cenesa.com.ar:88/api/seccionvideo/?format=json";

export default function Manual() {
    const navigation = useNavigation();
    const [manuales, setManuales] = useState([]);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) throw new Error("No hay token almacenado");

            const [responseManuales, responseVideos] = await Promise.all([
                fetch(API_MANUALES, { headers: { "Authorization": `Bearer ${token}` } }),
                fetch(API_VIDEOS, { headers: { "Authorization": `Bearer ${token}` } })
            ]);

            const dataManuales = await responseManuales.json();
            const dataVideos = await responseVideos.json();

            if (dataManuales.code === "token_not_valid" || dataVideos.code === "token_not_valid") {
                console.warn("Token inválido. Redirigiendo a Login...");
                await AsyncStorage.removeItem("token");
                Alert.alert("Sesión expirada", "Debes iniciar sesión nuevamente.");
                navigation.reset({ index: 0, routes: [{ name: "Login" }] });
                return;
            }

            setManuales(Array.isArray(dataManuales) ? dataManuales : []);
            setVideos(Array.isArray(dataVideos) ? dataVideos : []);
        } catch (error) {
            Alert.alert("Error", "No se pudieron cargar los datos.");
            console.error("Error en fetchData:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>📚 Manuales</Text>
            {loading ? (
                <ActivityIndicator size="large" color="#4A90E2" />
            ) : (
                <FlatList
                    data={manuales}
                    keyExtractor={(item) => `manual-${item.id}`}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.listItem} onPress={() => Linking.openURL(item.archivo_pdf)}>
                            <Text style={styles.listItemText}>📄 {item.titulo}</Text>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={<Text style={styles.emptyListText}>No hay manuales disponibles.</Text>}
                />
            )}

            <Text style={styles.sectionTitle}>🎬 Videos</Text>
            {loading ? (
                <ActivityIndicator size="large" color="#4A90E2" />
            ) : (
                <FlatList
                    data={videos}
                    keyExtractor={(item) => `video-${item.id}`}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.listItem} onPress={() => Linking.openURL(item.enlace_youtube)}>
                            <Text style={styles.listItemText}>🎥 {item.titulo}</Text>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={<Text style={styles.emptyListText}>No hay videos disponibles.</Text>}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#f8f9fa",
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        marginVertical: 20,
        color: "#333",
    },
    listItem: {
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    listItemText: {
        fontSize: 18,
        color: "#007bff",
    },
    emptyListText: {
        textAlign: "center",
        fontSize: 16,
        color: "#666",
        marginTop: 20,
    },
});
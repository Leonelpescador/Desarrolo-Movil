import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = "https://gestiones.cenesa.com.ar:88/api";

// Función para manejar errores de red
const handleNetworkError = (error) => {
    console.error("Error de red:", error);
    return { error: "network_error", message: "Error de red. Verifica tu conexión a internet." };
};

// Función para manejar errores de respuesta de la API
const handleApiResponseError = (response) => {
    console.error("Error de API:", response.status, response.statusText);
    if (response.status >= 500) {
        return { error: "server_error", message: "Error del servidor. Inténtalo de nuevo más tarde." };
    }
    return { error: "api_error", message: `Error de API: ${response.status} ${response.statusText}` };
};

// Función para manejar errores de datos JSON
const handleJsonError = (error) => {
    console.error("Error al parsear JSON:", error);
    return { error: "json_error", message: "Error al procesar la respuesta del servidor." };
}

// Función para hacer peticiones autenticadas
export async function fetchWithAuth(endpoint, options = {}) {
    try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
            console.warn("No hay token almacenado. Redirigiendo a Login...");
            return { error: "no_token", message: "No hay token almacenado." };
        }

        const headers = {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            ...options.headers,
        };

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            if (response.status >= 500) {
                return handleApiResponseError(response);
            }
            if (response.status === 401) {
                console.warn("Token inválido o expirado. Eliminando sesión...");
                await AsyncStorage.removeItem("token");
                return { error: "invalid_token", message: "Token inválido o expirado." };
            }
            return handleApiResponseError(response);
        }

        const data = await response.json();

        if (data.code && data.code === "token_not_valid") {
            console.warn("Token inválido o expirado. Eliminando sesión...");
            await AsyncStorage.removeItem("token");
            return { error: "invalid_token", message: "Token inválido o expirado." };
        }

        return data;
    } catch (error) {
        if (error instanceof TypeError && error.message === "Network request failed") {
            return handleNetworkError(error);
        } else if (error instanceof SyntaxError) {
            return handleJsonError(error);
        }

        console.error("Error en fetchWithAuth:", error);
        return { error: "fetch_error", message: "Error en la solicitud." };
    }
}

// Funciones para obtener datos autenticados
export async function getManuales() {
    return fetchWithAuth("/manual/");
}

export async function getenfermeria() {
    return fetchWithAuth("/solicitudenfermeria/?format=json");
}

export async function getFormularios() {
    return fetchWithAuth("/perfilusuario/?format=json");
}

export async function getVideos() {
    return fetchWithAuth("/seccionvideo/");
}
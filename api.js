import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = "https://gestiones.cenesa.com.ar:88/api";

// 🔹 Función para hacer peticiones autenticadas
export async function fetchWithAuth(endpoint, options = {}) {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      console.warn("No hay token almacenado. Redirigiendo a Login...");
      return { error: "no_token" };
    }

    const headers = {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers, 
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    // 🔹 Si el token es inválido, eliminamos el token y devolvemos un error
    if (response.status === 401 || (data.code && data.code === "token_not_valid")) {
      console.warn("Token inválido o expirado. Eliminando sesión...");
      await AsyncStorage.removeItem("token"); 
      return { error: "invalid_token" }; // Devuelve un error indicando token inválido
    }

    if (!response.ok) {
      throw new Error(data.detail || "Error en la solicitud");
    }

    return data;
  } catch (error) {
    console.error("Error en fetchWithAuth:", error);
    return { error: "fetch_error" };
  }
}

// 🔹 Funciones para obtener datos autenticados
export async function getManuales() {
  return fetchWithAuth("/manual/");
}

export async function getVideos() {
  return fetchWithAuth("/seccionvideo/");
}

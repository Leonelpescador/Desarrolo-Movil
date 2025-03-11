// api.js
const API_BASE_URL = "http://192.168.68.55:88/api"; // Reemplaza con tu IP o dominio

export async function getFormularios() {
    try {
      const response = await fetch(`${API_BASE_URL}/formularios/`);
      if (!response.ok) {
        throw new Error("Error al obtener los formularios");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error en getFormularios:", error);
      throw error;
    }
  }

  export async function login(username, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/token/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) {
        throw new Error("Error de autenticación");
      }
      const data = await response.json(); // Debería contener el token de acceso y de refresco
      return data;
    } catch (error) {
      console.error("Error en login:", error);
      throw error;
    }
  }
  
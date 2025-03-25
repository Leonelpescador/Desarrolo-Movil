// src/hooks/TipoDeUsers.js
import { useState, useEffect } from 'react';
import { auth, db } from '../firebase'; // Ajusta la ruta según tu estructura
import { doc, getDoc } from 'firebase/firestore';

export function useTipoDeUser() {
  const [userRole, setUserRole] = useState(null);
  const [loadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    async function fetchUserRole() {
      try {
        // 1) Revisamos el usuario actual de Firebase Auth
        const currentUser = auth.currentUser;
        console.log("useTipoDeUser → currentUser:", currentUser);

        if (!currentUser) {
          console.log("No hay usuario logueado (auth.currentUser es null).");
          setUserRole(null);
          setLoadingRole(false);
          return;
        }
        
        // 2) Accedemos al documento en Firestore con ID = uid del usuario
        const perfilRef = doc(db, 'perfiles_usuarios', currentUser.uid);
        const perfilSnap = await getDoc(perfilRef);
        
        // 3) Vemos si existe y leemos 'tipo_usuario'
        if (perfilSnap.exists()) {
          const data = perfilSnap.data();
          console.log("useTipoDeUser → data del perfil:", data);
          console.log("useTipoDeUser → tipo_usuario:", data?.tipo_usuario);
          setUserRole(data.tipo_usuario || null);
        } else {
          console.log("No existe el documento de perfil para uid =", currentUser.uid);
          setUserRole(null);
        }
      } catch (error) {
        console.error("Error al obtener el tipo de usuario:", error);
        setUserRole(null);
      } finally {
        setLoadingRole(false);
      }
    }

    fetchUserRole();
  }, []);

  // Función auxiliar para verificar si el usuario tiene alguno de los roles permitidos
  const hasRole = (rolesPermitidos = []) => {
    if (!userRole) return false;
    return rolesPermitidos.includes(userRole);
  };

  return { userRole, loadingRole, hasRole };
}

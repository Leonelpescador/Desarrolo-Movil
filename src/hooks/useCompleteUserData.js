// src/hooks/useCompleteUserData.js
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export function useCompleteUserData() {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const perfilRef = doc(db, "perfiles_usuarios", currentUser.uid);
          const perfilSnap = await getDoc(perfilRef);
          if (perfilSnap.exists()) {
            setPerfil(perfilSnap.data());
          } else {
            setPerfil(null);
          }
        } catch (error) {
          console.error("Error al obtener el perfil:", error);
          setPerfil(null);
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { user, perfil, loading };
}

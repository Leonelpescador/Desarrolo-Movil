import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChanged } from 'firebase/auth';  
import { auth } from '../src/config/firebaseConfig';  

// Pantallas de Autenticación
import Login from '../screens/Login';
import SignUp from '../screens/SignUp';

// Pantallas principales
import Home from '../screens/Home';
import CatalogList from '../screens/CatalogList';
import CatalogDetail from '../screens/CatalogDetail';
import CreateCatalog from '../screens/CreateCatalog';
import EditCatalog from '../screens/EditCatalog';
import AddProduct from '../screens/AddProduct';
import EditProduct from '../screens/EditProduct';
import Settings from '../screens/Settings';

const Stack = createStackNavigator();

export default function Navigation() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Escucha cambios de autenticación (login/logout)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setIsAuthenticated(!!user); 
    });
    return () => unsubscribe();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={isAuthenticated ? "Home" : "Login"}>
        
        {!isAuthenticated ? (
          // Rutas para usuarios no autenticados
          <>
            <Stack.Screen 
              name="Login" 
              component={Login} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="SignUp" 
              component={SignUp} 
              options={{ title: "Registrarse" }} 
            />
          </>
        ) : (
          // Rutas para usuarios autenticados
          <>
            <Stack.Screen 
              name="Home" 
              component={Home} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="CatalogList" 
              component={CatalogList} 
              options={{ title: "Lista de Catálogos" }} 
            />
            <Stack.Screen 
              name="CatalogDetail" 
              component={CatalogDetail} 
              options={{ title: "Detalle del Catálogo" }} 
            />
            <Stack.Screen 
              name="CreateCatalog" 
              component={CreateCatalog} 
              options={{ title: "Crear Catálogo" }} 
            />
            <Stack.Screen 
              name="EditCatalog" 
              component={EditCatalog} 
              options={{ title: "Editar Catálogo" }} 
            />
            <Stack.Screen 
              name="AddProduct" 
              component={AddProduct} 
              options={{ title: "Agregar Producto" }} 
            />
            <Stack.Screen 
              name="EditProduct" 
              component={EditProduct} 
              options={{ title: "Editar Producto" }} 
            />
            <Stack.Screen 
              name="Settings" 
              component={Settings} 
              options={{ title: "Configuraciones" }} 
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

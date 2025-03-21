import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
    Platform, // Importamos Platform
    StatusBar, // Importamos StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Base = ({ children }) => {
    const navigation = useNavigation();

    const handleLogout = useCallback(async () => {
        try {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('userType');
            navigation.navigate('Login');
        } catch (error) {
            console.error('Error al limpiar AsyncStorage:', error);
        }
    }, [navigation]);

    const navigateTo = useCallback((screen) => {
        navigation.navigate(screen);
    }, [navigation]);

    return (
        <View style={styles.container}>
            {Platform.OS === 'android' && <StatusBar backgroundColor="#37474F" />}
            <View style={styles.header}>
                <Image
                    source={require('../assets/logos-de-cenesa_sombra.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <TouchableOpacity onPress={handleLogout} style={styles.logout}>
                    <Icon name="sign-out-alt" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>{children}</View>

            <View style={styles.bottomMenu}>
                <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('ListarSolicitudesEnfermeria')}>
                    <Icon name="list" size={24} color="#fff" />
                    <Text style={styles.menuItemText}>Solicitudes</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('CrearSolicitudEnfermeria')}>
                    <Icon name="plus-square" size={24} color="#fff" />
                    <Text style={styles.menuItemText}>Crear</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('Manual')}>
                    <Icon name="book" size={24} color="#fff" />
                    <Text style={styles.menuItemText}>Manual</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default Base;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#37474F',
    },
    header: {
        height: 70,
        backgroundColor: '#37474F',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        elevation: 5,
    },
    logout: {
        padding: 10,
    },
    logo: {
        height: 45,
        width: 160,
    },
    content: {
        flex: 1,
    },
    bottomMenu: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#2C3E50',
        paddingVertical: 10,
    },
    menuItem: {
        alignItems: 'center',
    },
    menuItemText: {
        color: '#fff',
        fontSize: 12,
        marginTop: 4,
    },
});
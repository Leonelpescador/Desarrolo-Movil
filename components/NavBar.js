import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    ScrollView,
    Image,
    StyleSheet,
    Animated,
    Easing,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Base = ({ children, userType }) => {
    const navigation = useNavigation();
    const [menuVisible, setMenuVisible] = useState(false);
    const [enfermeriaExpanded, setEnfermeriaExpanded] = useState(false);

    const openMenu = () => setMenuVisible(true);
    const closeMenu = () => {
        setMenuVisible(false);
        setEnfermeriaExpanded(false);
    };

    const toggleEnfermeria = () => setEnfermeriaExpanded(prev => !prev);

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('userType');
        } catch (error) {
            console.error('Error al limpiar AsyncStorage:', error);
        }
        closeMenu();
        navigation.navigate('Login');
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={openMenu} style={styles.hamburger}>
                    <Icon name="bars" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../assets/logos-de-cenesa_sombra.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>
            </View>

            <View style={styles.content}>{children}</View>

            <Modal
                visible={menuVisible}
                animationType="slide"
                transparent
                onRequestClose={closeMenu}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.menuContainer}>
                        <ScrollView>
                            <View style={styles.menuHeader}>
                                <Image
                                    source={require('../assets/logos-de-cenesa_sombra.png')}
                                    style={styles.menuLogo}
                                    resizeMode="contain"
                                />
                                <TouchableOpacity onPress={closeMenu} style={styles.closeButton}>
                                    <Icon name="times" size={24} color="#fff" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.menuContent}>
                                {(userType === 'admin' || userType === 'Farmacia' || userType === 'enfermero' || userType === 'sup-enfermero') && (
                                    <>
                                        <TouchableOpacity style={styles.menuItem} onPress={toggleEnfermeria}>
                                            <Icon name="user-nurse" size={16} color="#fff" style={styles.menuIcon} />
                                            <Text style={styles.menuText}>Enfermería</Text>
                                            <Icon
                                                name={enfermeriaExpanded ? 'chevron-up' : 'chevron-down'}
                                                size={14}
                                                color="#fff"
                                                style={styles.menuIcon}
                                            />
                                        </TouchableOpacity>
                                        {enfermeriaExpanded && (
                                            <View style={styles.submenu}>
                                                <TouchableOpacity
                                                    style={styles.submenuItem}
                                                    onPress={() => {
                                                        closeMenu();
                                                        navigation.navigate('ListarSolicitudesEnfermeria');
                                                    }}
                                                >
                                                    <Icon name="list" size={14} color="#fff" style={styles.submenuIcon} />
                                                    <Text style={styles.submenuText}>Solicitudes de Enfermería</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={styles.submenuItem}
                                                    onPress={() => {
                                                        closeMenu();
                                                        navigation.navigate('CrearSolicitudEnfermeria');
                                                    }}
                                                >
                                                    <Icon name="plus-square" size={14} color="#fff" style={styles.submenuIcon} />
                                                    <Text style={styles.submenuText}>Crear Solicitud de Enfermería</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </>
                                )}

                                <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                                    <Icon name="sign-out-alt" size={16} color="#fff" style={styles.menuIcon} />
                                    <Text style={styles.menuText}>Cerrar Sesión</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default Base;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        height: 60,
        backgroundColor: '#37474f', // Fondo más oscuro
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        justifyContent: 'space-between',
        elevation: 3, // Sombra sutil
    },
    hamburger: {
        padding: 10,
    },
    logoContainer: {
        flex: 1,
        alignItems: 'center',
    },
    logo: {
        height: 40,
        width: 150,
    },
    content: {
        flex: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    menuContainer: {
        width: '80%',
        backgroundColor: '#455a64', // Fondo del menú más oscuro
        paddingVertical: 20,
        paddingHorizontal: 10,
        elevation: 5, // Sombra del menú
        borderTopRightRadius:10,
        borderBottomRightRadius:10,
    },
    menuHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    menuLogo: {
        width: 120,
        height: 60,
    },
    closeButton: {
        padding: 10,
    },
    menuContent: {},
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    menuIcon: {
        marginHorizontal: 8,
    },
    menuText: {
        color: '#fff',
        fontSize: 16,
    },
    submenu: {
        marginLeft: 32,
        marginTop: 5,
    },
    submenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 8,
    },
    submenuIcon: {
        marginRight: 6,
    },
    submenuText: {
        color: '#fff',
        fontSize: 14,
    },
});
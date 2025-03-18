import React, { useState, useEffect } from 'react';
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
    const [animation] = useState(new Animated.Value(-300));

    useEffect(() => {
        Animated.timing(animation, {
            toValue: menuVisible ? 0 : -300,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
        }).start();
    }, [menuVisible]);

    const toggleMenu = () => setMenuVisible(!menuVisible);
    const toggleEnfermeria = () => setEnfermeriaExpanded(prev => !prev);

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('userType');
        } catch (error) {
            console.error('Error al limpiar AsyncStorage:', error);
        }
        setMenuVisible(false);
        navigation.navigate('Login');
    };

    return (
        <View style={styles.container}>
            {/* HEADER/NAVBAR */}
            <View style={styles.header}>
                <TouchableOpacity onPress={toggleMenu} style={styles.hamburger}>
                    <Icon name="bars" size={22} color="#fff" />
                </TouchableOpacity>
                <Image
                    source={require('../assets/logos-de-cenesa_sombra.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <TouchableOpacity onPress={handleLogout} style={styles.logout}>
                    <Icon name="sign-out-alt" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* CONTENIDO */}
            <View style={styles.content}>{children}</View>

            {/* MENU LATERAL */}
            <Modal visible={menuVisible} transparent animationType="none">
                <View style={styles.modalOverlay}>
                    <Animated.View style={[styles.menuContainer, { left: animation }]}>
                        <ScrollView>
                            <View style={styles.menuHeader}>
                                <Image
                                    source={require('../assets/logos-de-cenesa_sombra.png')}
                                    style={styles.menuLogo}
                                    resizeMode="contain"
                                />
                                <TouchableOpacity onPress={toggleMenu} style={styles.closeButton}>
                                    <Icon name="times" size={24} color="#fff" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.menuContent}>
                                {(userType === 'admin' || userType === 'Farmacia' || userType === 'enfermero' || userType === 'sup-enfermero') && (
                                    <>
                                        <TouchableOpacity style={styles.menuItem} onPress={toggleEnfermeria}>
                                            <Icon name="user-nurse" size={18} color="#fff" style={styles.menuIcon} />
                                            <Text style={styles.menuText}>Enfermería</Text>
                                            <Icon
                                                name={enfermeriaExpanded ? 'chevron-up' : 'chevron-down'}
                                                size={16}
                                                color="#fff"
                                                style={styles.menuIcon}
                                            />
                                        </TouchableOpacity>
                                        {enfermeriaExpanded && (
                                            <View style={styles.submenu}>
                                                <TouchableOpacity
                                                    style={styles.submenuItem}
                                                    onPress={() => {
                                                        setMenuVisible(false);
                                                        navigation.navigate('ListarSolicitudesEnfermeria');
                                                    }}
                                                >
                                                    <Icon name="list" size={16} color="#fff" style={styles.submenuIcon} />
                                                    <Text style={styles.submenuText}>Solicitudes de Enfermería</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={styles.submenuItem}
                                                    onPress={() => {
                                                        setMenuVisible(false);
                                                        navigation.navigate('CrearSolicitudEnfermeria');
                                                    }}
                                                >
                                                    <Icon name="plus-square" size={16} color="#fff" style={styles.submenuIcon} />
                                                    <Text style={styles.submenuText}>Crear Solicitud de Enfermería</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </>
                                )}
                                { /*Manuales*/ }
                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={() => {
                                        setMenuVisible(false);
                                        navigation.navigate('Manual');
                                    }}
                                >
                                    <Icon name="book" size={18} color="#fff" style={styles.menuIcon} />
                                    <Text style={styles.menuText}>Manuales</Text>
                                </TouchableOpacity>   
                            </View>
                        </ScrollView>
                    </Animated.View>
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
        height: 70,
        backgroundColor: '#37474F', 
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        elevation: 5,
    },
    hamburger: {
        padding: 10,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    menuContainer: {
        width: '75%',
        backgroundColor: '#2C3E50',
        paddingVertical: 20,
        paddingHorizontal: 15,
        position: 'absolute',
        height: '100%',
        borderTopRightRadius: 15,
        borderBottomRightRadius: 15,
        elevation: 10,
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
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderRadius: 10,
        marginVertical: 5,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    menuIcon: {
        marginHorizontal: 8,
    },
    menuText: {
        color: '#fff',
        fontSize: 18,
        flex: 1,
    },
    submenu: {
        marginLeft: 32,
        marginTop: 5,
    },
    submenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.15)',
        marginVertical: 3,
    },
    submenuIcon: {
        marginRight: 6,
    },
    submenuText: {
        color: '#fff',
        fontSize: 16,
    },
});

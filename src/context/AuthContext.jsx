import { useState, useEffect } from 'react';
import { AuthContext } from './useAuth';
import { authService } from '../services/authService';
import api from '../services/api';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('accessToken');
            if (token) {
                await fetchProfile();
            } else {
                setLoading(false);
            }
        };
        initAuth();
    }, []);

    const fetchProfile = async () => {
        try {
            // Llamamos a la vista "me" de tu views.py
            const response = await api.get('/me/');
            setUser(response.data.data);
            setIsAuthenticated(true);
        } catch (error) {
            console.error("Error fetching user profile:", error);
            authService.logout(); // Si el token expiró, limpiamos
        } finally {
            setLoading(false);
        }
    };

    const login = async (username, password) => {
        try {
            await authService.login(username, password);
            await fetchProfile(); // Traemos los datos de Django
            return { success: true };
        } catch (error) {
            console.error("Error de login:", error);
            const errorMessage = error.response?.data?.detail || 'Credenciales inválidas. Verifica tu usuario y contraseña.';
            return { success: false, error: errorMessage };
        }
    };

    const register = async (userData) => {
        try {
            await authService.register(userData);
            // Inmediatamente después de registrarse, lo logueamos
            await authService.login(userData.username, userData.password);
            await fetchProfile();
            return { success: true };
        } catch (error) {
            console.error("Error de registro:", error);
            return { success: false, error: error.response?.data || 'Falló el registro' };
        }
    };

    const logout = async () => {
        authService.logout();
        setUser(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
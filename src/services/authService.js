import api from './api';

export const authService = {
    login: async (username, password) => {
        const response = await api.post('/login/', { username, password });
        if (response.data.access) {
            localStorage.setItem('accessToken', response.data.access);
            localStorage.setItem('refreshToken', response.data.refresh);
            //localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    register: async (userData) => {
        // userData debe tener { username, email, first_name, last_name, password }
        const response = await api.post('/register/', userData);
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    }
};
import React from 'react';
import { useAuth } from '../context/useAuth';

export default function HoyPage() {
    const { logout } = useAuth(); 

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
            <h1 className="text-4xl font-bold text-blue-600 mb-4">¡Bienvenido a la página de Hoy!</h1>
            <p className="text-xl text-gray-700 mb-8">Si estás viendo esto, el login funcionó.</p>
            
            <button 
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
            >
                Cerrar Sesión
            </button>
        </div>
    );
}
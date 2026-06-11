import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

export const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
    }

    if (!isAuthenticated) {
        // Redirige a login, pero guarda a dónde intentaba ir el usuario
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};
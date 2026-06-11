import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts y Componentes
import MainLayout from './components/layout/MainLayout';
import { ProtectedRoute } from './components/routing/ProtectedRoute';

// Páginas de Autenticación
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CreatePage from './pages/CreatePage'
import HoyPage from './pages/HoyPage';

import { AuthProvider } from './context/AuthContext'; 

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />

          {/* Rutas Protegidas (Comparten el MainLayout y requieren sesión) */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            {/* Redirige la raíz "/" a "/hoy" */}
            <Route path="/" element={<Navigate to="/hoy" replace />} />
            
            <Route path="/hoy" element={<HoyPage />} />
            <Route path="/crear" element={<CreatePage />} />
            
          </Route>

          {/* Por si ingresan una ruta mal puesta en el navegador */}
          <Route path="*" element={<Navigate to="/hoy" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
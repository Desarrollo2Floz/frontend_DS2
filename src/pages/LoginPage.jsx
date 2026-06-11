import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import koalaLogo from '../assets/bb51bc4eb2882c49a664ff7c04a240151df066fc.png';
import { useAuth } from '../context/useAuth';

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
    const [globalError, setGlobalError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        setFieldErrors({ email: '', password: '' });
        setGlobalError('');

        let hasErrors = false;
        const newFieldErrors = { email: '', password: '' };

        if (!email.trim()) {
            newFieldErrors.email = 'Debes de ingresar tu correo electrónico';
            hasErrors = true;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newFieldErrors.email = 'Debes de ingresar un correo electrónico válido';
            hasErrors = true;
        }

        if (!password) {
            newFieldErrors.password = 'Debes de ingresar tu contraseña';
            hasErrors = true;
        }

        if (hasErrors) {
            setFieldErrors(newFieldErrors);
            return;
        }

        setIsLoading(true);

        // Pasamos el email, que el contexto interpretará como el "username" para Django
        const result = await login(email, password);

        if (result.success) {
            navigate('/hoy');
        } else {
            // Mostramos el error dinámico que viene de Django o uno genérico si falla la red
            setGlobalError(result.error || 'Usuario o contraseña incorrectos. Inténtalo de nuevo.');
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex bg-gray-50">
            {/* Left side - Login Form */}
            <div className="w-full md:w-[55%] flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-2xl">
                    <h1 className="text-5xl md:text-7xl font-extrabold mb-8 md:mb-16 text-black text-center">
                        Iniciar Sesión
                    </h1>

                    <form className="space-y-6 md:space-y-10" onSubmit={handleSubmit}>
                        {/* Email Input */}
                        <div className="space-y-4">
                            <label className="block text-lg md:text-2xl font-semibold text-gray-800">
                                Correo electrónico
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (globalError) setGlobalError('');
                                }}
                                placeholder="Ingresa tu correo electrónico"
                                className={`w-full px-4 py-3 md:px-6 md:py-5 text-base md:text-xl rounded-xl md:rounded-2xl bg-gray-100 border-2 focus:bg-white focus:ring-0 outline-none transition-all placeholder:text-gray-400 ${fieldErrors.email || globalError ? 'border-red-500 focus:border-red-500' : 'border-transparent focus:border-blue-500'
                                    }`}
                            />
                            {fieldErrors.email && (
                                <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>
                            )}
                        </div>

                        {/* Password Input */}
                        <div className="space-y-4">
                            <label className="block text-lg md:text-2xl font-semibold text-gray-800">
                                Contraseña
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (globalError) setGlobalError('');
                                    }}
                                    placeholder="Ingresa tu contraseña"
                                    className={`w-full px-4 py-3 md:px-6 md:py-5 text-base md:text-xl rounded-xl md:rounded-2xl bg-gray-100 border-2 focus:bg-white focus:ring-0 outline-none transition-all placeholder:text-gray-400 pr-12 md:pr-16 ${fieldErrors.password || globalError ? 'border-red-500 focus:border-red-500' : 'border-transparent focus:border-blue-500'
                                        }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                >
                                    {showPassword ? (
                                        <Eye className="w-6 h-6 md:w-8 md:h-8" />
                                    ) : (
                                        <EyeOff className="w-6 h-6 md:w-8 md:h-8" />
                                    )}
                                </button>
                            </div>
                            {fieldErrors.password && (
                                <p className="text-red-500 text-sm mt-1">{fieldErrors.password}</p>
                            )}
                            {globalError && !fieldErrors.password && (
                                <p className="text-red-500 text-sm font-semibold mt-1">{globalError}</p>
                            )}
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0 pt-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-6 h-6 rounded border-gray-300 text-blue-500 focus:ring-blue-500 bg-gray-100"
                                />
                                <span className="text-base md:text-xl font-medium text-gray-600">Recordarme</span>
                            </label>

                            <Link to="#" className="text-base md:text-xl font-medium text-blue-500 hover:text-blue-600">
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full text-white text-lg md:text-2xl font-medium py-3 md:py-6 rounded-xl md:rounded-2xl transition-colors mt-8 md:mt-12 shadow-sm ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-[#3b82f6] hover:bg-blue-600'
                                }`}
                        >
                            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                        </button>

                        {/* Sign Up Link */}
                        <div className="text-center pt-8 flex flex-col sm:flex-row justify-center gap-1 sm:gap-2">
                            <span className="text-gray-500 text-base md:text-xl">¿No tienes una cuenta?</span>
                            <Link to="/registro" className="text-blue-500 text-base md:text-xl font-medium hover:text-blue-600">
                                Regístrate aquí
                            </Link>
                        </div>
                    </form>
                </div>
            </div>

            {/* Right side - Illustration */}
            <div className="hidden lg:flex w-[45%] bg-[#2d7df6] rounded-bl-[250px] items-center justify-center p-12 relative overflow-hidden">
                <div className="flex flex-col items-center justify-center relative z-10 w-full max-w-[900px] text-center">
                    {/* Logo / Illustration */}
                    <div className="mb-0 w-full flex justify-center relative -mt-10">
                        <img
                            src={koalaLogo}
                            alt="Floz Koala"
                            className="w-full max-w-[800px] object-contain drop-shadow-2xl"
                        />
                    </div>

                    <p className="text-white/70 text-5xl font-light px-8 whitespace-pre-line -mt-16">
                        Planifica tus actividades con
                        calma y eficiencia
                    </p>
                </div>
            </div>
        </div>
    );
}
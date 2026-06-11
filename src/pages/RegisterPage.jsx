import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import koalaLogo from '../assets/bb51bc4eb2882c49a664ff7c04a240151df066fc.png';
import { useAuth } from '../context/useAuth';

export default function RegisterPage() {
    const [showPassword, setShowPassword] = useState(false);

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [acceptTerms, setAcceptTerms] = useState(false);

    const [fieldErrors, setFieldErrors] = useState({});
    const [globalError, setGlobalError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        setFieldErrors({});
        setGlobalError('');

        let hasErrors = false;
        const newFieldErrors = {};

        if (!firstName.trim()) {
            newFieldErrors.firstName = 'El nombre es obligatorio.';
            hasErrors = true;
        } else if (firstName.trim().length > 50) {
            newFieldErrors.firstName = 'El nombre es demasiado largo (máx 50 caracteres).';
            hasErrors = true;
        } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s-]+$/.test(firstName)) {
            newFieldErrors.firstName = 'El nombre solo puede contener letras.';
            hasErrors = true;
        }

        if (!lastName.trim()) {
            newFieldErrors.lastName = 'El apellido es obligatorio.';
            hasErrors = true;
        } else if (lastName.trim().length > 50) {
            newFieldErrors.lastName = 'El apellido es demasiado largo (máx 50 caracteres).';
            hasErrors = true;
        } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s-]+$/.test(lastName)) {
            newFieldErrors.lastName = 'El apellido solo puede contener letras.';
            hasErrors = true;
        }

        if (!email.trim()) {
            newFieldErrors.email = 'El correo electrónico es obligatorio.';
            hasErrors = true;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newFieldErrors.email = 'Debes de ingresar un correo electrónico válido';
            hasErrors = true;
        }

        if (!password) {
            newFieldErrors.password = 'La contraseña es obligatoria.';
            hasErrors = true;
        } else if (password.length < 8) {
            newFieldErrors.password = 'La contraseña debe tener al menos 8 caracteres';
            hasErrors = true;
        }

        if (!acceptTerms) {
            newFieldErrors.acceptTerms = 'Debes aceptar los términos y condiciones';
            hasErrors = true;
        }

        if (hasErrors) {
            setFieldErrors(newFieldErrors);
            return;
        }

        setIsLoading(true);

        // Mapear los datos al formato exacto que espera Django
        const payload = {
            username: email, // Usamos el email como username
            email: email,
            first_name: firstName, // Django usa snake_case
            last_name: lastName,   // Django usa snake_case
            password: password
        };

        const result = await register(payload);

        if (result.success) {
            navigate('/');
        } else {
            let errorMsg = 'Ocurrió un error al intentar registrarte.';
            if (typeof result.error === 'object' && result.error !== null) {
                const firstKey = Object.keys(result.error)[0];
                // Tomamos el primer error de la primera llave que falló
                errorMsg = Array.isArray(result.error[firstKey]) 
                            ? result.error[firstKey][0] 
                            : result.error[firstKey];
            } else if (typeof result.error === 'string') {
                errorMsg = result.error;
            }
            
            setGlobalError(errorMsg);
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex bg-gray-50">
            {/* Left side - Register Form */}
            <div className="w-full lg:w-[55%] flex items-center justify-center p-4 sm:p-8 bg-white overflow-y-auto">
                <div className="w-full max-w-2xl my-auto">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-6 md:mb-8 text-black text-center">
                        Crear Cuenta
                    </h1>

                    {globalError && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center text-base">
                            {globalError}
                        </div>
                    )}

                    <form className="space-y-4" onSubmit={handleSubmit}>

                        {/* FirstName Input */}
                        <div className="space-y-2">
                            <label className="block text-base md:text-lg font-semibold text-gray-800">
                                Nombre
                            </label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="Ingresa tu nombre"
                                className={`w-full px-3 py-2 md:px-4 md:py-3 text-sm md:text-base rounded-xl bg-gray-100 border-2 focus:bg-white focus:ring-0 outline-none transition-all placeholder:text-gray-400 ${fieldErrors.firstName ? 'border-red-500 focus:border-red-500' : 'border-transparent focus:border-blue-500'
                                    }`}
                            />
                            {fieldErrors.firstName && (
                                <p className="text-red-500 text-sm mt-1">{fieldErrors.firstName}</p>
                            )}
                        </div>

                        {/* LastName Input */}
                        <div className="space-y-2">
                            <label className="block text-base md:text-lg font-semibold text-gray-800">
                                Apellido
                            </label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Ingresa tu apellido"
                                className={`w-full px-3 py-2 md:px-4 md:py-3 text-sm md:text-base rounded-xl bg-gray-100 border-2 focus:bg-white focus:ring-0 outline-none transition-all placeholder:text-gray-400 ${fieldErrors.lastName ? 'border-red-500 focus:border-red-500' : 'border-transparent focus:border-blue-500'
                                    }`}
                            />
                            {fieldErrors.lastName && (
                                <p className="text-red-500 text-sm mt-1">{fieldErrors.lastName}</p>
                            )}
                        </div>

                        {/* Email Input */}
                        <div className="space-y-2">
                            <label className="block text-base md:text-lg font-semibold text-gray-800">
                                Correo electrónico
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Ej: tu@email.com"
                                className={`w-full px-3 py-2 md:px-4 md:py-3 text-sm md:text-base rounded-xl bg-gray-100 border-2 focus:bg-white focus:ring-0 outline-none transition-all placeholder:text-gray-400 ${fieldErrors.email ? 'border-red-500 focus:border-red-500' : 'border-transparent focus:border-blue-500'
                                    }`}
                            />
                            {fieldErrors.email && (
                                <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>
                            )}
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2">
                            <label className="block text-base md:text-lg font-semibold text-gray-800">
                                Contraseña
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Mínimo 8 caracteres"
                                    className={`w-full px-3 py-2 md:px-4 md:py-3 text-sm md:text-base rounded-xl bg-gray-100 border-2 focus:bg-white focus:ring-0 outline-none transition-all placeholder:text-gray-400 pr-12 ${fieldErrors.password ? 'border-red-500 focus:border-red-500' : 'border-transparent focus:border-blue-500'
                                        }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                >
                                    {showPassword ? (
                                        <Eye className="w-6 h-6" />
                                    ) : (
                                        <EyeOff className="w-6 h-6" />
                                    )}
                                </button>
                            </div>
                            {fieldErrors.password && (
                                <p className="text-red-500 text-sm mt-1">{fieldErrors.password}</p>
                            )}
                        </div>

                        {/* Accept Terms Checkbox */}
                        <div className="pt-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={acceptTerms}
                                    onChange={(e) => setAcceptTerms(e.target.checked)}
                                    className={`w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500 bg-gray-100 ${fieldErrors.acceptTerms ? 'border-red-500' : ''}`}
                                />
                                <span className="text-sm md:text-base font-medium text-gray-600">Acepto términos y condiciones</span>
                            </label>
                            {fieldErrors.acceptTerms && (
                                <p className="text-red-500 text-sm mt-1">{fieldErrors.acceptTerms}</p>
                            )}
                        </div>

                        {/* Register Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full text-white text-lg md:text-xl font-medium py-3 md:py-4 rounded-xl transition-colors mt-4 md:mt-6 shadow-sm ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-[#3b82f6] hover:bg-blue-600'
                                }`}
                        >
                            {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
                        </button>

                        {/* Login Link */}
                        <div className="text-center pt-4 flex flex-col sm:flex-row justify-center gap-1 sm:gap-2">
                            <span className="text-gray-500 text-sm md:text-base">¿Ya tienes una cuenta?</span>
                            <Link to="/login" className="text-blue-500 text-sm md:text-base font-medium hover:text-blue-600">
                                Inicia sesión aquí
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
                        Comienza a planificar tus actividades con
                        calma y eficiencia
                    </p>
                </div>
            </div>
        </div>
    );
}
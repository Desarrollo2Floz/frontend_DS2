import { NavLink } from "react-router-dom";
import { Plus, Calendar, ListTodo, BarChart2, LogIn, LogOut, Loader2, User, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../../context/useAuth";
import { useState } from "react";
import logo from '../../assets/bb51bc4eb2882c49a664ff7c04a240151df066fc.png';
import CapacitySettings from "./CapacitySettings";

const navItems = [
    { to: '/crear', label: 'Crear Actividad', icon: Plus },
    { to: '/actividades', label: 'Actividades', icon: ListTodo },
    { to: '/progreso', label: 'Progreso', icon: BarChart2 },
]

function Sidebar({ isExpanded, setIsExpanded }) {
    const { isAuthenticated, logout, user, loading: authLoading } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const displayName = (() => {
        const fullName = `${user?.name ?? ''} ${user?.last_name ?? ''}`.trim();
        if (fullName) return fullName;
        return 'Estudiante';
    })();

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await logout();
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <aside className={`h-screen bg-[#232836] text-slate-300 flex flex-col fixed left-0 top-0 transition-all duration-300 ease-in-out z-50 ${isExpanded ? 'w-64 px-4 py-8' : 'w-20 px-2 py-8'}`}>
            {/* Botón para expandir/contraer el sidebar */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="absolute top-24 -right-4 w-8 h-8 bg-[#232836] border border-slate-700 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-700 hover:text-white transition-all z-50 shadow-md"
                title={isExpanded ? "Contraer menú" : "Expandir menú"}
            >
                {isExpanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>

            {/* Logo */}
            <div className={`flex items-center mb-10 transition-all ${isExpanded ? 'gap-3 px-2' : 'justify-center'}`}>
                <img src={logo} alt="Floz Logo" className={`object-contain transition-all duration-300 ${isExpanded ? 'w-12 h-12' : 'w-10 h-10'}`} />
                {isExpanded && <h1 className="text-2xl font-bold text-white tracking-wide whitespace-nowrap">Planificador</h1>}
            </div>

            {/* Links de navegación */}
            <nav className="flex flex-col gap-2 flex-1 mt-4">
                <NavLink
                    to="/hoy"
                    className={({ isActive }) =>
                        `flex items-center rounded-xl text-[15px] font-medium transition-all ${isExpanded ? 'gap-4 px-4 py-3' : 'justify-center p-3'} ${isActive ? 'bg-[#0B64F4] text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-800/40'}`
                    }
                    title={!isExpanded ? 'Hoy' : ''}
                >
                    {({ isActive }) => (
                        <>
                            <Calendar size={20} className={isActive ? 'text-white' : 'text-slate-400 flex-shrink-0'} />
                            {isExpanded && <span className="whitespace-nowrap">Hoy</span>}
                        </>
                    )}
                </NavLink>

                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `flex items-center rounded-xl text-[15px] font-medium transition-all ${isExpanded ? 'gap-4 px-4 py-3' : 'justify-center p-3'} ${isActive ? 'bg-[#0B64F4] text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-800/40'}`
                            }
                            title={!isExpanded ? item.label : ''}
                        >
                            {({ isActive }) => (
                                <>
                                    <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400 flex-shrink-0'} />
                                    {isExpanded && <span className="whitespace-nowrap">{item.label}</span>}
                                </>
                            )}
                        </NavLink>
                    )
                })}
            </nav>

            {/* Acciones de cuenta al fondo */}
            {isAuthenticated ? (
                <div className={`mt-auto border-t border-slate-700/50 pt-6 flex flex-col ${isExpanded ? 'px-2' : 'px-2 items-center gap-4 pb-6'}`}>
                    <div className={`flex items-center ${isExpanded ? 'justify-between' : 'justify-center w-full'} mb-2`}>
                        {isExpanded ? (
                            <>
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-10 h-10 rounded-full bg-[#0B64F4] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                                        <User size={20} />
                                    </div>
                                    <span className="text-[15px] font-medium text-slate-300 truncate">{authLoading ? '...' : displayName}</span>
                                </div>
                                {isLoggingOut ? (
                                    <Loader2 size={20} className="animate-spin text-slate-400 flex-shrink-0" />
                                ) : (
                                    <button
                                        onClick={handleLogout}
                                        disabled={isLoggingOut}
                                        className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800/50 flex-shrink-0"
                                        title="Cerrar sesión"
                                    >
                                        <LogOut size={20} />
                                    </button>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="w-10 h-10 rounded-full bg-[#0B64F4] flex items-center justify-center text-white shadow-sm flex-shrink-0 mb-2" title={authLoading ? 'Perfil' : `Perfil de ${displayName}`}>
                                    <User size={20} />
                                </div>
                            </>
                        )}
                    </div>

                    {!isExpanded && (
                        <>
                            {isLoggingOut ? (
                                <Loader2 size={20} className="animate-spin text-slate-400 mb-2" />
                            ) : (
                                <button
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                    className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800/50 mb-2"
                                    title="Cerrar sesión"
                                >
                                    <LogOut size={20} />
                                </button>
                            )}
                        </>
                    )}

                    {/* Componente de Configuración de Capacidad */}
                    <CapacitySettings isExpanded={isExpanded} />
                </div>
            ) : (
                <div className="mt-auto border-t border-slate-700/50 pt-6 px-2 flex justify-center">
                    <NavLink
                        to="/login"
                        className={`flex items-center gap-3 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors ${isExpanded ? 'px-3 py-2 w-full' : 'p-3 justify-center'}`}
                        title={!isExpanded ? "Iniciar sesión" : ""}
                    >
                        <LogIn size={20} className="flex-shrink-0" />
                        {isExpanded && <span className="whitespace-nowrap">Iniciar sesión</span>}
                    </NavLink>
                </div>
            )}
        </aside>
    )
}

export default Sidebar;
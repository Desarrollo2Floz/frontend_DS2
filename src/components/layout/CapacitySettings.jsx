import { useState, useEffect } from 'react';
import { Settings, Save, Loader2, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { userService } from '../../services/userService';
import { computeDailyCapacityConflicts, setStoredDailyCapacityConflict } from '../../utils/dailyCapacityConflict';
import { getActivities } from '../../services/activityService';

function CapacitySettings({ isExpanded }) {
    const [savedCapacity, setSavedCapacity] = useState("6");
    const [inputCapacity, setInputCapacity] = useState("6");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    useEffect(() => {
        loadCapacity();
    }, []);

    const loadCapacity = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await userService.getDailyCapacity();
            const val = res.data?.daily_limit_hours ?? res.daily_limit_hours ?? 6;
            setSavedCapacity(val.toString());
            setInputCapacity(val.toString());
        } catch (err) {
            console.error("Error cargando capacidad:", err);
            setError("No se pudo cargar el límite.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setError(null);
        setSuccessMsg(null);

        const hours = parseFloat(inputCapacity.replace(',', '.'));
        if (isNaN(hours) || hours < 1 || hours > 16) {
            setError("El límite debe estar entre 1 y 16 horas.");
            return;
        }

        setIsSaving(true);
        try {
            const activities = await getActivities();
            const computed = computeDailyCapacityConflicts(activities, hours);
            if (computed.conflicts && computed.conflicts.length > 0) {
                setStoredDailyCapacityConflict({
                    limitHours: hours,
                    conflicts: computed.conflicts,
                    conflictDates: computed.conflictDates,
                    activityIds: computed.activityIds,
                });
                setError('Hay subtareas que superan el límite, reprograma o cambia su capacidad.');
                return;
            }

            await userService.updateDailyCapacity(hours);
            setSavedCapacity(hours.toString());
            setSuccessMsg("Límite guardado con éxito.");

            setStoredDailyCapacityConflict(null);
            setTimeout(() => {
                setSuccessMsg(null);
                setIsSettingsOpen(false);
            }, 2000);
        } catch (err) {
            console.error("Error guardando capacidad:", err);

            setStoredDailyCapacityConflict(null);

            const respData = err.response?.data;
            const errors = respData?.errors;
            if (errors?.daily_limit_hours) {
                const msg = Array.isArray(errors.daily_limit_hours) ? errors.daily_limit_hours[0] : errors.daily_limit_hours;
                setError(msg);
            } else if (errors?.overload_conflict) {
                const conflict = errors.overload_conflict[0];

                const conflicts = conflict?.conflicts || [];
                const conflictDates = conflicts.map(c => c.date).filter(Boolean);

                setStoredDailyCapacityConflict({
                    limitHours: hours,
                    conflicts,
                    conflictDates,
                });

                setError(`No puedes reducir: tienes días con más de (${hours}) horas planificadas.`);
            } else {
                setError("Error al guardar. Intenta de nuevo.");
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (isExpanded) {
        const formatNum = (num) => Number(num).toString().replace('.', ',');

        return (
            <div className="w-full text-slate-200 mt-auto mb-3 px-2 flex justify-center">
                <div className="bg-[#1E2532] rounded-2xl px-3 py-2.5 shadow-md border border-[#2A3441] w-[180px] flex flex-col transition-all">

                    {/* Header compacto */}
                    <div
                        className="flex items-center justify-between cursor-pointer w-full select-none"
                        onClick={() => {
                            const next = !isSettingsOpen;
                            if (next) setInputCapacity(savedCapacity);
                            setIsSettingsOpen(next);
                        }}
                    >
                        <div className="flex items-center gap-1.5">
                            <Settings size={14} strokeWidth={1.5} className="text-[#8B98A9]" />
                            <span className="font-semibold text-[11px] leading-tight text-[#CBD5E1]">Capacidad<br />Diaria</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <p className="text-white font-bold text-[16px] leading-none flex items-end gap-0.5">
                                {isLoading ? '...' : formatNum(savedCapacity)}<span className="text-[11px] mb-[1px] text-[#94A3B8]">h</span>
                            </p>
                            <div className="text-[#8B98A9]">
                                {isSettingsOpen ? <ChevronUp size={14} strokeWidth={2} /> : <ChevronDown size={14} strokeWidth={2} />}
                            </div>
                        </div>
                    </div>

                    {/* Expandible */}
                    {isSettingsOpen && (
                        <div className="mt-2.5 pt-2.5 border-t border-[#2A3441] flex flex-col gap-2.5">

                            {/* Input */}
                            <div className="flex flex-col gap-1">
                                <label htmlFor="daily-limit" className="text-[#CBD5E1] text-[11px] font-semibold px-0.5">Límite Diario</label>
                                <div className="flex items-center gap-1.5">
                                    <input
                                        id="daily-limit"
                                        type="text"
                                        value={inputCapacity}
                                        onChange={(e) => setInputCapacity(e.target.value)}
                                        className="bg-[#111822] border border-[#2A3441] rounded-lg px-2 py-1.5 w-full text-[13px] font-bold text-white focus:outline-none focus:border-blue-500 transition-colors text-center"
                                    />
                                    <span className="text-[#8B98A9] font-semibold text-[11px] whitespace-nowrap">h/día</span>
                                </div>
                            </div>

                            {/* Feedbacks */}
                            {error && (
                                <div className="flex items-start gap-1 text-red-400 text-[10px] font-medium leading-tight">
                                    <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            )}
                            {successMsg && (
                                <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-medium leading-tight">
                                    <CheckCircle2 size={12} />
                                    <span>{successMsg}</span>
                                </div>
                            )}

                            {/* Guardar */}
                            <button
                                onClick={handleSave}
                                disabled={isSaving || isLoading}
                                className="flex justify-center items-center gap-1.5 w-full bg-[#0B64F4] hover:bg-blue-600 active:bg-blue-700 text-white text-[12px] font-bold py-1.5 rounded-lg transition-all shadow-sm disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                Guardar
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }
    return (
        <button
            type="button"
            disabled aria-disabled="true"
            className="text-[#8B98A9] hover:text-white transition-colors p-2 rounded-xl hover:bg-[#1E2532] flex flex-col justify-center mt-auto mb-4 mx-auto disabled:opacity-50 cursor-not-allowed"
            title="Configurar Capacidad Diaria">
            <Settings size={22} strokeWidth={1.5} />
        </button>
    );
}

export default CapacitySettings;

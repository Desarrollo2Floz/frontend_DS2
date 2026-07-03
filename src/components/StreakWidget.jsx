import { Flame, Loader2 } from 'lucide-react';
import { useStreak } from '../hooks/useStreak';

export const StreakWidget = () => {
    const { streak, loading } = useStreak();

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-md p-6 flex items-center justify-center w-56 h-24">
                <Loader2 size={20} className="animate-spin text-slate-400" />
            </div>
        );
    }

    const days = streak?.streak_current || 0;
    const isEmpty = days === 0;

    return (
        <div className="bg-white rounded-2xl shadow-md p-6 flex items-center justify-center w-45 h-22">
            <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                    <div className={`${isEmpty ? 'text-slate-400' : 'text-orange-500'}`}>
                        <Flame size={24} fill={isEmpty ? 'none' : 'currentColor'} />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Racha</span>
                </div>
                <span className={`text-base font-bold text-center ${isEmpty ? 'text-slate-700' : 'text-orange-600'}`}>
                    {isEmpty ? '¡Completa una subtarea!' : `${days} ${days === 1 ? 'día' : 'días'}`}
                </span>
            </div>
        </div>
    );
};
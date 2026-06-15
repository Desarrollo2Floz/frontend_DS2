import { Flame } from 'lucide-react';

const StreakWidget = ({ streak = 0 }) => {
    return (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-xl border border-amber-200">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Flame size={16} className="text-amber-600" />
            </div>
            <div>
                <p className="text-xs text-amber-700 font-medium">Racha actual</p>
                <p className="text-xl font-bold text-amber-800">{streak} días</p>
            </div>
        </div>
    );
};

export default StreakWidget;
import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const MicroCheck = ({ show, type = 'success' }) => {
    if (!show) return null;
    const color = type === 'success' ? 'text-emerald-500' : 'text-slate-500';
    return (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg animate-in fade-in zoom-in duration-200">
            <CheckCircle2 size={24} className={color} />
        </div>
    );
};

export default MicroCheck;

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const ActionButton = ({ onClick, done, label }) => (
    <button onClick={onClick} className={`w-full py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-800 text-white hover:bg-slate-900'}`}>
        {done ? <CheckCircle2 size={16} /> : null}{done ? 'Completed' : label}
    </button>
);

export default ActionButton;

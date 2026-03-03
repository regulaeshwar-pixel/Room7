import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const ActionButton = ({ onClick, disabled, label, className = "", variant = 'primary' }) => {
    const baseClasses = "w-full py-4 rounded-xl font-black text-[13px] tracking-[0.2em] uppercase transition-all duration-300 flex items-center justify-center gap-2 shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]";
    const variants = {
        primary: "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-md",
        danger: "bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700",
        secondary: "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100"
    };

    return (
        <button onClick={onClick} disabled={disabled} className={`${baseClasses} ${variants[variant]} ${className}`}>
            {label}
        </button>
    );
};
export default ActionButton;

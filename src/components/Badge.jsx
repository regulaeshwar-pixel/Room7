import React from 'react';

const Badge = ({ children, variant, className = "" }) => {
    const baseStyle = "text-[10px] font-black tracking-[0.15em] uppercase px-2.5 py-1 rounded-full whitespace-nowrap";
    const variants = {
        primary: "bg-indigo-50 text-indigo-600 border border-indigo-100/50",
        success: "bg-emerald-50 text-emerald-600 border border-emerald-100/50",
        warning: "bg-amber-50 text-amber-600 border border-amber-100/50",
        danger: "bg-rose-50 text-rose-600 border border-rose-100/50",
        ghost: "bg-slate-50 text-slate-500 border border-slate-100",
    };

    return (
        <span className={`${baseStyle} ${variants[variant] || variants.primary} ${className}`}>
            {children}
        </span>
    );
};

export default Badge;

import React from 'react';

const Badge = ({ children, variant = 'neutral' }) => {
    const styles = {
        neutral: 'bg-slate-100 text-slate-600',
        success: 'bg-emerald-100 text-emerald-700',
        warning: 'bg-amber-100 text-amber-700',
        danger: 'bg-rose-100 text-rose-700',
        blue: 'bg-blue-100 text-blue-700',
    };
    return <span className={`px-2 py-1 rounded-md text-xs font-medium ${styles[variant]}`}>{children}</span>;
};

export default Badge;

import React from 'react';
import { CheckCircle2, Undo2 } from 'lucide-react';

const MicroCheck = ({ show, type = 'success' }) => {
    if (!show) return null;

    const Icon = type === 'success' ? CheckCircle2 : Undo2;
    const baseClass = type === 'success' ? 'micro-check' : 'micro-check undo';

    return <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><Icon className={baseClass} /></div>;
};

export default MicroCheck;

import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

const StatusIndicator = ({ status, text = false }) => {
    if (status === 'done') return text ? <span className="text-xs font-bold text-emerald-600">Done</span> : <CheckCircle2 size={20} className="text-emerald-500" />;
    return text ? <span className="text-xs text-slate-400">Pending</span> : <Circle size={20} className="text-slate-200" />;
};

export default StatusIndicator;

import React from 'react';
import { RefreshCw, WifiOff, Check } from 'lucide-react';

const SyncBadge = ({
    isOnline,
    hasPendingWrites,
    offlineQueueCount,
}) => {
    let text = "Synced";
    let color = "bg-emerald-500";
    let icon = <Check size={12} className="text-white" />;

    if (!isOnline) {
        text = offlineQueueCount
            ? `Offline · ${offlineQueueCount} waiting`
            : "Offline";
        color = "bg-slate-500";
        icon = <WifiOff size={12} className="text-white" />;
    } else if (hasPendingWrites) {
        text = "Syncing…";
        color = "bg-amber-500";
        icon = <RefreshCw size={12} className="text-white animate-spin" />;
    }

    return (
        <div className={`px-3 py-1.5 rounded-full text-white text-[10px] font-bold ${color} flex items-center gap-1.5 shadow-sm transition-all duration-300`}>
            {icon}
            <span>{text}</span>
        </div>
    );
}

export default SyncBadge;

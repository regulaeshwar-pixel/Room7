import React from 'react';
import { X, Clock } from 'lucide-react';

export default function ChangeLog({ changeLog = [], onClose }) {
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl">
                <header className="flex justify-between items-center p-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <Clock size={20} className="text-slate-500" />
                        <h2 className="font-bold text-theme">Activity Log</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-4">
                    {changeLog.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                            <p>No recent activity recorded.</p>
                        </div>
                    ) : (
                        <ul className="relative border-l-2 border-slate-100 ml-3 space-y-6 py-2">
                            {[...changeLog].reverse().map((log, i) => (
                                <li key={i} className="pl-4 relative">
                                    <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-slate-200 border-2 border-white ring-1 ring-slate-50"></div>
                                    <p className="text-sm font-medium text-theme">{log.text}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">
                                            {new Date(log.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className="text-[10px] text-slate-400">•</span>
                                        <span className="text-[10px] text-indigo-500 font-bold bg-indigo-50 px-1.5 rounded">{log.by}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}

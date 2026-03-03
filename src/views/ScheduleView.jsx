import React, { useState } from 'react';
import {
    Calendar,
    X,
    Edit2,
    ToggleLeft,
    ToggleRight,
    CheckCircle2,
    Droplets,
    Clock,
    Navigation
} from 'lucide-react';
import { haptic } from '../utils/haptics';

const Card = ({ children, className = "", onClick }) => (
    <div onClick={onClick} className={`rounded-[32px] shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-slate-100/50 overflow-hidden ${className}`}>
        {children}
    </div>
);

const MemberAvatar = ({ name, code, className = "", size = "md", isActive = false }) => {
    const sizeClass = size === 'xs' ? 'w-6 h-6 text-[8px]' : size === 'sm' ? 'w-8 h-8 text-[10px]' : 'w-10 h-10 text-xs';
    return (
        <div className={`${sizeClass} rounded-[12px] flex items-center justify-center font-black transition-all duration-500 shadow-sm ${isActive
            ? 'bg-indigo-600 text-white ring-2 ring-indigo-100'
            : 'bg-indigo-50 text-indigo-400'
            } ${className}`} title={name}>
            {code}
        </div>
    );
};

const ScheduleView = ({ schedule, members, updateSchedule, isGuest, includeCook, setIncludeCook }) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday1', 'Sunday2', 'Sunday3'];
    const roles = [
        { id: 'morningDish', label: 'Morning Dishes', icon: <Droplets size={16} /> },
        { id: 'nightDish', label: 'Night Dishes', icon: <Droplets size={16} /> },
        { id: 'cleaning', label: 'Cleaning', icon: <Navigation size={16} /> },
        { id: 'market', label: 'Market', icon: <Calendar size={16} /> }
    ];

    const [selectedDay, setSelectedDay] = useState('Monday');
    const [editingRole, setEditingRole] = useState(null);

    const EditModal = () => {
        if (!editingRole) return null;
        const currentAssigned = schedule[selectedDay]?.[editingRole.role] || [];

        const toggleMember = (mid) => {
            haptic.light();
            const next = currentAssigned.includes(mid)
                ? currentAssigned.filter(id => id !== mid)
                : [...currentAssigned, mid];
            updateSchedule(selectedDay, editingRole.role, next);
        };

        return (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
                <div className="bg-white w-full max-w-sm rounded-[38px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-slate-100">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl"><Edit2 size={20} strokeWidth={3} /></div>
                            Assign Tasks
                        </h3>
                        <button onClick={() => setEditingRole(null)} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-300">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-2 no-scrollbar">
                        {members.map(m => {
                            const isAssigned = currentAssigned.includes(m.id);
                            return (
                                <button
                                    key={m.id}
                                    onClick={() => toggleMember(m.id)}
                                    className={`w-full flex items-center justify-between p-4 rounded-[22px] border transition-all duration-300 active:scale-[0.98] ${isAssigned
                                        ? 'bg-indigo-50/50 border-indigo-100 text-indigo-700 shadow-sm'
                                        : 'bg-white border-slate-50 text-slate-500 hover:border-indigo-100'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <MemberAvatar name={m.name} code={m.avatar} isActive={isAssigned} size="sm" />
                                        <span className="text-[13px] font-black tracking-tight">{m.name}</span>
                                    </div>
                                    {isAssigned && <CheckCircle2 size={18} strokeWidth={3} className="text-indigo-500" />}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => setEditingRole(null)}
                        className="w-full bg-slate-900 text-white py-5 rounded-[22px] font-black text-[11px] uppercase tracking-[0.3em] mt-8 shadow-[0_10px_25px_rgba(15,23,42,0.15)] hover:shadow-[0_15px_35px_rgba(15,23,42,0.25)] transition-all active:scale-95"
                    >
                        Save Assignments
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="pb-32 min-h-full">
            <header className="bg-white/95 backdrop-blur-2xl p-6 sticky top-0 z-50 rounded-b-[42px] border-b border-slate-50 shadow-[0_10px_40px_rgba(0,0,0,0.02)] pt-[max(env(safe-area-inset-top),1.5rem)]">
                <div className="flex justify-between items-center mb-5">
                    <div>
                        <h1 className="text-[26px] font-black text-slate-900 tracking-[0.4em] uppercase drop-shadow-sm flex items-center leading-none">ROOM<span className="italic ml-1 text-3xl font-black text-indigo-600/90">-7</span></h1>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-3 flex items-center gap-2">
                            <Calendar size={12} strokeWidth={2.5} className="text-indigo-400/60" /> Duty Schedule
                        </p>
                    </div>
                    <div className="bg-indigo-50/80 px-4 py-2 rounded-full flex items-center gap-2 border border-indigo-100/50">
                        <Clock size={12} className="text-indigo-500" />
                        <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Global Sync</span>
                    </div>
                </div>

                <div className="flex overflow-x-auto gap-2.5 pb-1 no-scrollbar">
                    {days.map(day => (
                        <button
                            key={day}
                            onClick={() => { haptic.light(); setSelectedDay(day); }}
                            className={`px-5 py-3 rounded-[18px] text-[11px] font-black uppercase tracking-[0.15em] whitespace-nowrap transition-all duration-300 active:scale-95 ${selectedDay === day
                                ? 'bg-indigo-600 text-white shadow-[0_8px_20px_rgba(79,70,229,0.3)]'
                                : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                }`}
                        >
                            {day}
                        </button>
                    ))}
                </div>
            </header>

            <div className="p-6 space-y-8 max-w-md mx-auto">
                <Card className="p-6 bg-slate-900 text-white border-none shadow-[0_20px_50px_rgba(0,0,0,0.15)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -translate-y-16 translate-x-16 blur-3xl group-hover:bg-indigo-500/20 transition-all duration-1000"></div>
                    <div className="flex justify-between items-center relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 backdrop-blur-md rounded-[18px] text-indigo-300">
                                <Droplets size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300/80 mb-0.5">Water</h3>
                                <p className="text-xs font-bold text-white/50">Include Cook?</p>
                            </div>
                        </div>
                        <button
                            disabled={isGuest}
                            onClick={() => { haptic.medium(); setIncludeCook(!includeCook); }}
                            className={`p-1 rounded-full transition-all duration-500 flex items-center gap-3 ${includeCook ? 'bg-indigo-500 text-white' : 'bg-white/10 text-white/40'
                                }`}
                        >
                            {includeCook ? <ToggleRight size={32} strokeWidth={1.5} /> : <ToggleLeft size={32} strokeWidth={1.5} />}
                        </button>
                    </div>
                </Card>

                <div className="grid gap-5">
                    {roles.map(role => (
                        <Card key={role.id} className="p-6 group/card hover:bg-slate-50/30 transition-all duration-500">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-slate-50 text-slate-400 rounded-xl group-hover/card:bg-white group-hover/card:text-indigo-500 transition-all duration-500 shadow-sm">
                                        {role.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">{role.label}</h3>
                                    </div>
                                </div>
                                {!isGuest && (
                                    <button
                                        onClick={() => { haptic.medium(); setEditingRole({ role: role.id, label: role.label }); }}
                                        className="p-2 bg-slate-50 text-slate-300 hover:text-indigo-500 hover:bg-white rounded-xl transition-all duration-300 shadow-sm opacity-0 group-hover/card:opacity-100"
                                    >
                                        <Edit2 size={16} strokeWidth={2.5} />
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-3 min-h-[48px]">
                                {schedule[selectedDay]?.[role.id]?.length > 0 ? (
                                    schedule[selectedDay][role.id].map(id => {
                                        const member = members.find(m => m.id === id);
                                        return (
                                            <div key={id} className="flex items-center gap-3 bg-white border border-slate-100/50 pl-1.5 pr-4 py-1.5 rounded-[18px] shadow-sm animate-in slide-in-from-bottom-2 duration-500">
                                                <MemberAvatar name={member?.name} code={member?.avatar} size="sm" />
                                                <span className="text-[13px] font-black tracking-tight text-slate-700">{member?.name}</span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="flex items-center gap-3 text-slate-300 italic py-2">
                                        <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                        <span className="text-[11px] font-black uppercase tracking-widest">Awaiting Assignment</span>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
            <EditModal />
        </div>
    );
};

export default ScheduleView;

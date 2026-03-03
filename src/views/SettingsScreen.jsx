import React, { useState } from 'react';
import {
    LogOut,
    ShieldCheck,
    Shield,
    ChevronRight,
    Lock,
    X,
    Calendar,
    Cpu
} from 'lucide-react';

const Card = ({ children, className = "", onClick }) => (
    <div onClick={onClick} className={`rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100/50 overflow-hidden ${className}`}>
        {children}
    </div>
);

const MemberAvatar = ({ name, code, className = "", size = "md", isActive = false }) => {
    const sizeClass = size === 'xs' ? 'w-5 h-5 text-[7px]' : size === 'sm' ? 'w-8 h-8 text-[9px]' : 'w-12 h-12 text-base';
    return (
        <div className={`${sizeClass} rounded-[16px] flex items-center justify-center font-black transition-all duration-500 shadow-sm ${isActive
            ? 'bg-indigo-600 text-white ring-2 ring-indigo-50'
            : 'bg-indigo-50 text-indigo-400'
            } ${className}`} title={name}>
            {code}
        </div>
    );
};

const SettingsScreen = ({
    currentUser,
    logout,
    isGuest,
    members,
    initiateUserSwitch,
    vegHandlerId,
    isFrozen,
    toggleFreeze,
    simulatedDate,
    setSimulatedDate,
    sundayVariant,
    setSundayVariant,
    changePin
}) => {
    const [isChangePinOpen, setIsChangePinOpen] = useState(false);
    const [pinFormData, setPinFormData] = useState({ current: '', new: '', confirm: '' });

    const handleChangePin = async (e) => {
        e.preventDefault();
        const success = await changePin(pinFormData.current, pinFormData.new, pinFormData.confirm);
        if (success) {
            setIsChangePinOpen(false);
            setPinFormData({ current: '', new: '', confirm: '' });
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <header className="bg-white/95 backdrop-blur-2xl p-3 sticky top-0 z-50 rounded-b-[20px] border-b border-slate-50 shadow-[0_4px_20px_rgba(0,0,0,0.02)] pt-[max(env(safe-area-inset-top),0.75rem)]">
                <h1 className="text-[16px] font-black text-slate-900 tracking-[0.4em] uppercase drop-shadow-sm flex items-center leading-none">ROOM<span className="italic ml-1 text-lg font-black text-indigo-600/90">-7</span></h1>
                <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.3em] mt-1.5">
                    Member Settings
                </p>
            </header>

            <div className="p-3 space-y-4 max-w-md mx-auto">
                {/* Identity Hero */}
                <Card className="p-4 bg-slate-900 text-white border-none shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -translate-y-16 translate-x-16 blur-3xl group-hover:bg-indigo-500/20 transition-all duration-1000"></div>
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <MemberAvatar name={currentUser.name} code={currentUser.avatar} isActive={true} size="sm" className="mb-2.5 scale-110" />
                        <h2 className="text-base font-black tracking-tight mb-0.5 text-white">{currentUser.name}</h2>
                        <p className="text-[7px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-3">{currentUser.role}</p>

                        {!isGuest && (
                            <button onClick={logout} className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full text-[7px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-1.5 shadow-lg active:scale-95">
                                <LogOut size={9} strokeWidth={3} /> Logout
                            </button>
                        )}
                    </div>
                </Card>

                {/* Authorized Personnel */}
                <div className="space-y-2.5">
                    <div className="flex justify-between items-center px-1">
                        <h3 className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">Members</h3>
                        <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">{members.length} Total</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                        {members.map(m => {
                            const isMe = currentUser.id === m.id;
                            const isThisHandler = vegHandlerId === m.id;

                            return (
                                <button
                                    key={m.id}
                                    onClick={() => initiateUserSwitch(m)}
                                    className={`flex items-center justify-between p-3 bg-white rounded-[20px] transition-all duration-300 group/item ${isMe ? 'shadow-md ring-2 ring-indigo-50' : 'hover:bg-slate-50 border-slate-50 border shadow-sm'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <MemberAvatar name={m.name} code={m.avatar} size="sm" isActive={isMe} />
                                        <div className="text-left">
                                            <p className={`text-[12px] font-black tracking-tight ${isMe ? 'text-indigo-600' : 'text-slate-800'}`}>{m.name}</p>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{m.role}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {isThisHandler && <ShieldCheck size={14} className="text-emerald-500" strokeWidth={2.5} />}
                                        <ChevronRight size={12} className={`transition-transform ${isMe ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-100'} text-slate-300`} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Security */}
                {!isGuest && (
                    <div className="space-y-2.5">
                        <h3 className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 px-1">Security</h3>
                        <Card className="p-4 border-l-4 border-slate-900 shadow-lg">
                            <div className="space-y-2.5">
                                <button onClick={() => setIsChangePinOpen(true)} className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-[12px] font-black text-[8px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 border border-slate-100 active:scale-95">
                                    <Lock size={12} strokeWidth={2.5} className="text-slate-400" /> Change Pin
                                </button>

                                {currentUser.id === vegHandlerId && (
                                    <button
                                        onClick={toggleFreeze}
                                        className={`w-full py-2.5 rounded-[12px] font-black text-[8px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 ${isFrozen
                                            ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                            : "bg-slate-900 text-white hover:bg-slate-800"
                                            }`}
                                    >
                                        {isFrozen ? <ShieldCheck size={12} strokeWidth={2.5} /> : <Shield size={12} strokeWidth={2.5} />}
                                        {isFrozen ? "Unfreeze App" : "Freeze App"}
                                    </button>
                                )}
                            </div>
                        </Card>
                    </div>
                )}

                {/* Laboratory Tools */}
                <div className="space-y-3">
                    <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 px-2">Laboratory Tools</h3>
                    <Card className="p-5 space-y-4">
                        <div className="grid grid-cols-2 gap-2.5">
                            <button onClick={() => { const d = new Date(simulatedDate); d.setDate(d.getDate() - 1); setSimulatedDate(d); }} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-[16px] text-[8px] font-black uppercase tracking-widest text-slate-500 transition-all border border-slate-100 flex items-center justify-center gap-2"><Calendar size={10} /> Previous</button>
                            <button onClick={() => { const d = new Date(simulatedDate); d.setDate(d.getDate() + 1); setSimulatedDate(d); }} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-[16px] text-[8px] font-black uppercase tracking-widest text-slate-500 transition-all border border-slate-100 flex items-center justify-center gap-2">Successive <Calendar size={10} /></button>
                        </div>
                        <button onClick={() => setSimulatedDate(new Date())} className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-[16px] font-black text-[9px] uppercase tracking-[0.3em] transition-all border border-indigo-100">Synchronize To Clock</button>
                        <button onClick={() => setSundayVariant(prev => prev === 3 ? 1 : prev + 1)} className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-[16px] font-black text-[9px] uppercase tracking-[0.3em] transition-all border border-slate-100 flex items-center justify-center gap-3">
                            <Cpu size={12} className="text-slate-400" /> Sunday Variant (S-{sundayVariant})
                        </button>
                    </Card>
                </div>

                {/* PIN Modal */}
                {isChangePinOpen && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
                        <div className="bg-white w-full max-w-sm rounded-[28px] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-slate-100">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-3 italic">
                                    <div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl"><Lock size={18} strokeWidth={3} /></div>
                                    Recalibrate
                                </h3>
                                <button onClick={() => setIsChangePinOpen(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-300">
                                    <X size={18} />
                                </button>
                            </div>
                            <form onSubmit={handleChangePin} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 ml-1">Legacy PIN</label>
                                    <input type="password" required value={pinFormData.current} onChange={e => setPinFormData({ ...pinFormData, current: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-[20px] font-black text-xl tracking-[0.5em] text-center focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none" maxLength={4} placeholder="0000" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 ml-1">New PIN</label>
                                    <input type="password" required value={pinFormData.new} onChange={e => setPinFormData({ ...pinFormData, new: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-[20px] font-black text-xl tracking-[0.5em] text-center focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none" maxLength={4} placeholder="----" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 ml-1">Confirm PIN</label>
                                    <input type="password" required value={pinFormData.confirm} onChange={e => setPinFormData({ ...pinFormData, confirm: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-[20px] font-black text-xl tracking-[0.5em] text-center focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none" maxLength={4} placeholder="----" />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setIsChangePinOpen(false)} className="flex-1 py-3 bg-slate-50 text-slate-500 rounded-[16px] font-black text-[9px] uppercase tracking-[0.2em] border border-slate-100 transition-all active:scale-95">Abort</button>
                                    <button type="submit" className="flex-2 py-3 bg-slate-900 text-white rounded-[16px] font-black text-[9px] uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95">Verify</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsScreen;

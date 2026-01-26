import React, { useState } from 'react';

import {
    LogOut,
    Lock,
    Leaf,
    Shield,
    Eye,
    EyeOff
} from 'lucide-react';
import Card from '../components/Card';
import MemberAvatar from '../components/MemberAvatar';

const SettingsScreen = ({
    currentUser,
    members,
    vegHandlerId,
    isGuest,
    logout,
    initiateUserSwitch,
    initiateHandlerToggle,
    simulatedDate,
    setSimulatedDate,
    setSundayVariant,
    sundayVariant,
    notifyDispatch,
    notificationState,
    triggerDemoNotifications,
    setMembers,
    triggerAlert,
    setCurrentUser,
    theme,
    setTheme,
    exemptMembers = [],
    isFrozen = false,
    toggleFreeze,
    settingsProps,
    ...props
}) => {
    const [isChangePinOpen, setIsChangePinOpen] = useState(false);
    const [pinFormData, setPinFormData] = useState({ current: '', new: '', confirm: '' });

    const handleChangePin = (e) => {
        e.preventDefault();
        if (pinFormData.current !== currentUser.pin) {
            triggerAlert("Current PIN is incorrect", "danger");
            return;
        }
        if (pinFormData.new.length !== 4) {
            triggerAlert("New PIN must be 4 digits", "warning");
            return;
        }
        if (pinFormData.new !== pinFormData.confirm) {
            triggerAlert("New PINs do not match", "danger");
            return;
        }
        const newPin = pinFormData.new;
        setMembers(prev => prev.map(m => m.id === currentUser.id ? { ...m, pin: newPin } : m));
        setCurrentUser(prev => ({ ...prev, pin: newPin }));
        setIsChangePinOpen(false);
        setPinFormData({ current: '', new: '', confirm: '' });
        triggerAlert("PIN updated successfully", "success");
    };

    return (
        <div className="p-4 space-y-6 pb-24">
            <h1 className="text-xl font-bold text-theme">Profile & Settings</h1>

            <Card className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-theme">User Profiles</h3>
                    {!isGuest && (
                        <button onClick={logout} className="text-xs flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full text-slate-600 hover:bg-rose-100 hover:text-rose-600 transition-colors">
                            <LogOut size={12} /> Logout
                        </button>
                    )}
                </div>

                {/* Theme Switcher (Phase T4) */}
                <div className="mb-4">
                    <label className="block text-xs font-bold text-muted mb-2 uppercase tracking-wide">Theme</label>
                    <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                        {["light", "focus", "night"].map((t) => (
                            <button
                                key={t}
                                onClick={() => setTheme(t)}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${theme === t
                                    ? "bg-white text-indigo-600 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                                    }`}
                            >
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                    {members.map(m => {
                        const isThisHandler = vegHandlerId === m.id;
                        const showLeaf = (!vegHandlerId) || isThisHandler;
                        return (
                            <div key={m.id} className={`flex items-center justify-between p-2 rounded-lg transition-colors ${currentUser.id === m.id ? 'bg-slate-50 border border-slate-200' : ''}`}>
                                <button onClick={() => initiateUserSwitch(m)} className="flex items-center gap-3 text-left flex-1">
                                    <MemberAvatar name={m.name} code={m.avatar} />
                                    <div><p className={`text-sm font-medium ${currentUser.id === m.id ? 'text-indigo-700' : 'text-theme'}`}>{m.name} {currentUser.id === m.id && '(You)'} {exemptMembers.includes(m.id) && <span className="text-[10px] text-amber-600 font-bold ml-1 px-1 bg-amber-50 rounded">Exempt</span>}</p><p className="text-xs text-muted">{m.role}</p></div>
                                </button>
                                {showLeaf && !isGuest && (
                                    <button onClick={() => initiateHandlerToggle(m.id)} className={`p-2 rounded-full transition-all ${isThisHandler ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300 hover:text-emerald-500'}`}>
                                        {isThisHandler ? <Lock size={18} /> : <Leaf size={18} />}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </Card>

            {!isGuest && (
                <Card className="p-4 space-y-4 border-l-4 border-l-slate-800">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2"><Shield size={18} /> Security</h3>
                    <button onClick={() => setIsChangePinOpen(true)} className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors">Change My PIN</button>
                    {currentUser.id === vegHandlerId && (
                        <button
                            onClick={toggleFreeze}
                            className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${isFrozen
                                    ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                    : "bg-slate-800 text-white hover:bg-slate-900"
                                }`}
                        >
                            {isFrozen ? "🔓 Unfreeze App" : "🧊 Freeze App"}
                        </button>
                    )}
                </Card>
            )}

            <Card className="p-4 space-y-4">
                <h3 className="font-bold text-slate-700">Dev Tools</h3>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={() => { const d = new Date(simulatedDate); d.setDate(d.getDate() - 1); setSimulatedDate(d); }} className="px-3 py-1 bg-slate-100 rounded text-sm">Prev Day</button>
                    <button onClick={() => setSimulatedDate(new Date())} className="px-3 py-1 bg-slate-100 rounded text-sm">Today</button>
                    <button onClick={() => { const d = new Date(simulatedDate); d.setDate(d.getDate() + 1); setSimulatedDate(d); }} className="px-3 py-1 bg-slate-100 rounded text-sm">Next Day</button>
                    <button onClick={() => setSundayVariant(prev => prev === 3 ? 1 : prev + 1)} className="px-3 py-1 bg-slate-100 rounded text-sm">Toggle Sunday ({sundayVariant})</button>
                    <button onClick={() => notifyDispatch({ type: 'TOGGLE_DEV_MODE' })} className={`px-3 py-1 rounded text-sm flex items-center gap-1 ${notificationState.devMode ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>
                        {notificationState.devMode ? <Eye size={14} /> : <EyeOff size={14} />} Inspection Mode
                    </button>
                    <button onClick={triggerDemoNotifications} className="px-3 py-1 bg-slate-100 rounded text-sm">Test Alerts</button>
                    <button
                        onClick={() => {
                            // Seed logic handled by prop
                            if (window.confirm("Initialize Cloud Database with Defaults? This will overwrite metadata.")) {
                                if (props.seedDatabase) props.seedDatabase();
                                else alert("Seed function not connected");
                            }
                        }}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded text-sm font-bold"
                    >
                        Initialize Database
                    </button>
                </div>
            </Card>

            {isChangePinOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-2xl p-6">
                        <h3 className="font-bold text-lg mb-4 text-theme">Change PIN</h3>
                        <form onSubmit={handleChangePin} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Current PIN</label>
                                <input type="password" required value={pinFormData.current} onChange={e => setPinFormData({ ...pinFormData, current: e.target.value })} className="w-full p-3 border rounded-xl text-center tracking-widest text-lg" maxLength={4} placeholder="••••" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">New PIN</label>
                                <input type="password" required value={pinFormData.new} onChange={e => setPinFormData({ ...pinFormData, new: e.target.value })} className="w-full p-3 border rounded-xl text-center tracking-widest text-lg" maxLength={4} placeholder="••••" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Confirm New PIN</label>
                                <input type="password" required value={pinFormData.confirm} onChange={e => setPinFormData({ ...pinFormData, confirm: e.target.value })} className="w-full p-3 border rounded-xl text-center tracking-widest text-lg" maxLength={4} placeholder="••••" />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setIsChangePinOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold">Update</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsScreen;

import React, { useState } from 'react';
import { Lock, ChevronLeft, Delete } from 'lucide-react';
import MemberAvatar from '../components/MemberAvatar';
import { haptic } from '../utils/haptics';

const MAX_PIN = 4;

function PinDots({ length }) {
    return (
        <div className="flex gap-3 justify-center my-6">
            {Array.from({ length: 4 }).map((_, i) => (
                <div
                    key={i}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${i < length ? "bg-indigo-600 scale-125" : "bg-slate-200"
                        }`}
                />
            ))}
        </div>
    );
}

function PinKeypad({ onDigit, onBackspace }) {
    const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];

    return (
        <div className="grid grid-cols-3 gap-4 max-w-[280px] mx-auto">
            {digits.map((d, i) => {
                if (d === "") return <div key={i} />;

                if (d === "back") {
                    return (
                        <button
                            key={i}
                            className="h-16 rounded-2xl bg-slate-50 active:bg-slate-200 active:scale-95 text-slate-500 flex items-center justify-center transition-all"
                            onClick={() => { haptic.medium(); onBackspace(); }}
                        >
                            <Delete size={24} />
                        </button>
                    );
                }

                return (
                    <button
                        key={i}
                        className="h-16 rounded-2xl bg-slate-50 active:bg-indigo-50 active:scale-95 text-2xl font-bold text-slate-700 transition-all shadow-sm border border-slate-100"
                        onClick={() => { haptic.light(); onDigit(d); }}
                    >
                        {d}
                    </button>
                );
            })}
        </div>
    );
}

const MemberLogin = ({ members, onLogin }) => {
    const [selectedMember, setSelectedMember] = useState(null);
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    if (selectedMember) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center p-6 animate-login">
                <div className="w-full max-w-sm flex-1 flex flex-col">
                    <button
                        onClick={() => { setSelectedMember(null); setPin(''); setError(''); }}
                        className="flex items-center gap-1 text-slate-400 text-sm font-bold mb-8 hover:text-slate-600 transition-colors self-start"
                    >
                        <ChevronLeft size={16} /> Back
                    </button>

                    <div className="flex flex-col items-center mb-4 flex-1 justify-center min-h-[200px]">
                        <MemberAvatar name={selectedMember.name} code={selectedMember.avatar} size="lg" className="mb-4 text-2xl w-20 h-20 shadow-lg" />
                        <h2 className="text-xl font-bold text-theme">Hello, {selectedMember.name}</h2>
                        {error ? (
                            <p className="text-rose-500 font-bold mt-2 animate-shake">{error}</p>
                        ) : (
                            <p className="text-slate-400 text-sm mt-1">Enter your PIN</p>
                        )}

                        <PinDots length={pin.length} />
                    </div>

                    <div className="pb-8">
                        <PinKeypad
                            onDigit={(d) => {
                                if (pin.length < MAX_PIN) {
                                    const next = pin + d;
                                    setPin(next);
                                    setError('');

                                    if (next.length === MAX_PIN) {
                                        // Small delay for UX
                                        setTimeout(() => {
                                            if (next === selectedMember.pin) {
                                                onLogin(selectedMember);
                                            } else {
                                                haptic.error();
                                                setError("Wrong PIN");
                                                setPin("");
                                            }
                                        }, 100);
                                    }
                                }
                            }}
                            onBackspace={() => setPin(pin.slice(0, -1))}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 pb-20">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <div className="inline-flex p-3 bg-white rounded-2xl shadow-sm mb-4">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">F</div>
                    </div>
                    <h1 className="text-2xl font-black text-theme tracking-tight">FlowHouse</h1>
                    <p className="text-slate-500 font-medium">Who is using the app?</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {members.map(member => (
                        <button
                            key={member.id}
                            onClick={() => { haptic.light(); setSelectedMember(member); }}
                            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center gap-3 hover:border-indigo-200 hover:shadow-md transition-all group active:scale-95"
                        >
                            <div className="group-hover:scale-110 transition-transform duration-300">
                                <MemberAvatar name={member.name} code={member.avatar} size="md" />
                            </div>
                            <span className="font-bold text-slate-700">{member.name}</span>
                        </button>
                    ))}
                </div>

                {members.length === 0 && (
                    <div className="text-center p-8 bg-white rounded-2xl border border-dashed border-slate-300">
                        <p className="text-slate-400 text-sm mb-2">No members found.</p>
                        <p className="text-xs text-slate-300">Database might be initializing...</p>
                    </div>
                )}

                <div className="text-center">
                    <p className="text-[10px] text-slate-300 uppercase tracking-widest font-bold flex items-center justify-center gap-2">
                        <Lock size={10} /> Secure Local Session
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MemberLogin;

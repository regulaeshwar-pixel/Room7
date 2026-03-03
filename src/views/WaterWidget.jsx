import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { loadUser } from '../utils/session';
import { haptic } from '../utils/haptics';
import { Droplets, CheckCircle2, RefreshCw, Users } from 'lucide-react';

const ROOM_ID = 'flowhouse-main';

// ─── Helpers ────────────────────────────────────────────────────────────────

const getInitials = (name = '') => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

const Avatar = ({ name = '', code, size = 'md', active = false }) => {
    const s = size === 'lg' ? 'w-16 h-16 text-base' : size === 'md' ? 'w-12 h-12 text-sm' : 'w-8 h-8 text-xs';
    return (
        <div className={`${s} rounded-2xl flex items-center justify-center font-black shadow-sm transition-all duration-500 ${active ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' : 'bg-indigo-50 text-indigo-500'}`}>
            {code || getInitials(name)}
        </div>
    );
};

// ─── Main Widget ─────────────────────────────────────────────────────────────

export default function WaterWidget() {
    const [waterPairs, setWaterPairs] = useState([]);
    const [members, setMembers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [marking, setMarking] = useState(false);
    const [justDone, setJustDone] = useState(false);

    useEffect(() => {
        const user = loadUser();
        setCurrentUser(user);
    }, []);

    useEffect(() => {
        // Listen to room members
        const roomRef = doc(db, 'rooms', ROOM_ID);
        const unsubRoom = onSnapshot(roomRef, snap => {
            if (snap.exists()) {
                const data = snap.data();
                if (data.members) setMembers(data.members);
            }
        });

        // Listen to waterPairs
        const pairsRef = collection(db, 'rooms', ROOM_ID, 'waterPairs');
        const unsubPairs = onSnapshot(pairsRef, snap => {
            const list = [];
            snap.forEach(d => list.push({ id: d.id, ...d.data() }));
            setWaterPairs(list);
            setLoading(false);
        });

        return () => { unsubRoom(); unsubPairs(); };
    }, []);

    const pendingPairs = waterPairs.filter(p => p.status === 'pending' && !p.archived);
    const myPair = pendingPairs.find(p => currentUser && p.members.includes(currentUser.id));
    const nextPair = pendingPairs[0];
    const activePair = myPair || nextPair;
    const isMyTurn = !!myPair;

    const doneToday = waterPairs.filter(p => {
        if (p.status !== 'done' || p.archived) return false;
        const at = new Date(p.completedAt);
        const now = new Date();
        return at.toDateString() === now.toDateString();
    }).length;

    const handleMarkDone = async () => {
        if (!activePair || marking) return;
        setMarking(true);
        haptic.success();

        try {
            await updateDoc(doc(db, `rooms/${ROOM_ID}/waterPairs/${activePair.id}`), {
                status: 'done',
                completedAt: new Date().toISOString(),
                completedBy: currentUser?.name || 'Unknown'
            });
            setJustDone(true);
            setTimeout(() => setJustDone(false), 3000);
        } catch (err) {
            console.error('Error marking done:', err);
        } finally {
            setMarking(false);
        }
    };

    const pairNames = activePair
        ? activePair.members.map(mid => members.find(m => m.id === mid)?.name || 'Member')
        : [];

    // ─── Loading ───────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-indigo-300 text-sm font-black uppercase tracking-widest">Loading</p>
                </div>
            </div>
        );
    }

    // ─── All Done / No pairs ───────────────────────────────────────────────
    const allClear = pendingPairs.length === 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">

            {/* Background ambient glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/15 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />

            {/* Header pill */}
            <div className="relative z-10 flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center backdrop-blur-sm">
                    <Droplets size={20} className="text-cyan-400" strokeWidth={2} />
                </div>
                <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.5em] text-indigo-400/60">Room 7</p>
                    <p className="text-[11px] font-black uppercase tracking-[0.35em] text-white/80">Water Duty</p>
                </div>
            </div>

            {/* Main Card */}
            <div className="relative z-10 w-full max-w-sm">

                {justDone ? (
                    /* ── Success State ── */
                    <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[38px] p-8 text-center shadow-[0_20px_80px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(52,211,153,0.3)]">
                            <CheckCircle2 size={36} className="text-emerald-400" strokeWidth={2} />
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight mb-2">Done! 💧</h2>
                        <p className="text-white/40 text-sm font-medium">Water duty marked complete</p>
                    </div>
                ) : allClear ? (
                    /* ── All Clear State ── */
                    <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[38px] p-8 text-center shadow-[0_20px_80px_rgba(0,0,0,0.3)]">
                        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 size={36} className="text-emerald-400/60" strokeWidth={1.5} />
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight mb-2">All Clear</h2>
                        <p className="text-white/40 text-sm font-medium">No pending water duties</p>
                        {doneToday > 0 && (
                            <div className="mt-6 inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-400/20 px-4 py-2 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-emerald-300 text-xs font-black uppercase tracking-wider">{doneToday} completed today</span>
                            </div>
                        )}
                    </div>
                ) : (
                    /* ── Active Duty State ── */
                    <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[38px] p-8 shadow-[0_20px_80px_rgba(0,0,0,0.3)]">

                        {/* Status pill */}
                        <div className="flex justify-between items-center mb-8">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${isMyTurn ? 'bg-amber-500/15 border-amber-400/30 text-amber-300' : 'bg-slate-500/15 border-slate-400/20 text-slate-400'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isMyTurn ? 'bg-amber-400 animate-pulse' : 'bg-slate-400'}`} />
                                {isMyTurn ? "Your Turn" : "Pending"}
                            </div>
                            <div className="flex items-center gap-1.5 text-white/30 text-[10px] font-bold uppercase tracking-widest">
                                <Users size={11} />
                                {pendingPairs.length} pair{pendingPairs.length !== 1 ? 's' : ''}
                            </div>
                        </div>

                        {/* Member avatars */}
                        <div className="flex justify-center items-center gap-5 mb-8">
                            {pairNames.map((name, i) => (
                                <React.Fragment key={name}>
                                    <div className="flex flex-col items-center gap-3">
                                        <Avatar name={name} code={members.find(m => m.name === name)?.avatar} size="lg" active={currentUser?.name === name} />
                                        <span className="text-white/80 font-black text-[13px] tracking-tight">{name}</span>
                                    </div>
                                    {i < pairNames.length - 1 && (
                                        <span className="text-white/20 text-xl font-black mb-6">&</span>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-white/5 mb-6" />

                        {/* Mark done button */}
                        <button
                            onClick={handleMarkDone}
                            disabled={marking}
                            className={`w-full py-5 rounded-[24px] font-black text-[13px] uppercase tracking-[0.3em] transition-all duration-300 flex items-center justify-center gap-3 active:scale-[0.97] ${isMyTurn
                                ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-[0_10px_30px_rgba(99,102,241,0.4)] hover:shadow-[0_15px_40px_rgba(99,102,241,0.5)] hover:translate-y-[-2px]'
                                : 'bg-white/10 text-white/60 border border-white/10 hover:bg-white/15'
                                }`}
                        >
                            {marking ? (
                                <RefreshCw size={16} className="animate-spin" />
                            ) : (
                                <>
                                    <Droplets size={18} strokeWidth={2.5} />
                                    Mark Done
                                </>
                            )}
                        </button>

                        {/* My turn indicator */}
                        {!isMyTurn && currentUser && (
                            <p className="text-center text-white/30 text-[10px] font-bold uppercase tracking-widest mt-4">
                                Not your turn today
                            </p>
                        )}
                        {!currentUser && (
                            <p className="text-center text-white/30 text-[10px] font-bold uppercase tracking-widest mt-4">
                                Login to mark done
                            </p>
                        )}
                    </div>
                )}

                {/* Recent completions */}
                {doneToday > 0 && !allClear && (
                    <div className="mt-4 flex justify-center">
                        <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 px-4 py-2 rounded-full">
                            <CheckCircle2 size={12} className="text-emerald-400" />
                            <span className="text-white/40 text-[10px] font-black uppercase tracking-wider">{doneToday} done today</span>
                        </div>
                    </div>
                )}

                {/* Open app link */}
                <div className="mt-6 text-center">
                    <a
                        href="/"
                        className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em] hover:text-white/40 transition-colors"
                    >
                        Open FlowHouse →
                    </a>
                </div>
            </div>
        </div>
    );
}

import React, { useState } from 'react';
import PullToRefresh from 'react-simple-pull-to-refresh';
import { Droplets, Undo2, CheckCircle2, Utensils, Sun, Moon, Clock, ShoppingCart, Leaf, Trash2 } from 'lucide-react';

import MemberAvatar from '../components/MemberAvatar';
import MicroCheck from '../components/MicroCheck';
import DutyAvatar from '../components/DutyAvatar';



import SyncBadge from '../components/SyncBadge';
import ActionSheet from '../components/ActionSheet';
import Card from '../components/Card';
import Badge from '../components/Badge';
import ActionButton from '../components/ActionButton';
import { useLongPress } from '../hooks/useLongPress';

const TaskButton = ({ onClick, children, className, type = 'success' }) => {
    const [showCheck, setShowCheck] = useState(false);

    const handleClick = (e) => {
        if (onClick) onClick(e);
        setShowCheck(true);
        setTimeout(() => setShowCheck(false), 400);
    };

    return (
        <div className="relative inline-block">
            <button onClick={handleClick} className={className}>
                {children}
            </button>
            <MicroCheck show={showCheck} type={type} />
        </div>
    );
};


const TIME_WINDOWS = {
    cookingMorning: { start: 7, end: 13 },
    cookingNight: { start: 20, end: 23 },
    dishMorning: { start: 7, end: 12 },
    dishNight: { start: 17, end: 22 },
};

const PoolMember = ({ mid, members, waterSelection, onToggle, onLongPress, isExempt, completionCount = 0, index = 0 }) => {
    const handlers = useLongPress(() => onLongPress(mid), () => onToggle(mid));
    const member = members.find(m => m.id === mid);
    const isSelected = waterSelection.includes(mid);

    return (
        <button
            {...handlers}
            style={{ animationDelay: `${index * 50}ms` }}
            className={`flex flex-col items-center justify-center gap-1 px-1 py-2 rounded-2xl border transition-all duration-500 animate-in fade-in zoom-in-95 fill-mode-both group relative ${isSelected
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-[0_10px_30px_rgba(79,70,229,0.25)] scale-105 z-20'
                : 'bg-white/40 backdrop-blur-md border-white/80 text-slate-500 hover:bg-white/80 hover:text-slate-800 hover:shadow-[0_8px_25px_rgba(0,0,0,0.04)] hover:-translate-y-1'
                } ${isExempt ? 'opacity-30 grayscale blur-[0.5px]' : ''}`}
        >
            {/* Glossy overlay for unselected */}
            {!isSelected && <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>}

            <div className="relative z-10">
                <MemberAvatar
                    size="sm"
                    className={`w-8 h-8 text-[10px] font-black transition-transform duration-500 group-hover:scale-110 ${isSelected
                        ? '!bg-white !text-indigo-600 !ring-0'
                        : '!bg-indigo-50/50 !text-indigo-400'
                        }`}
                    member={member}
                />
                {isExempt && <div className="absolute -bottom-0.5 -right-0.5 bg-rose-500 rounded-full w-2 h-2 border border-white shadow-sm" />}
            </div>

            <span className="text-[10px] font-black tracking-tight leading-tight relative z-10 text-center px-1 truncate w-full">{member?.name}</span>

            {completionCount > 0 && (
                <div className={`text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm relative z-10 ${isSelected ? 'bg-white text-indigo-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                    {completionCount}
                </div>
            )}

            {/* Active Glow Effect */}
            {isSelected && <div className="absolute inset-0 bg-indigo-400/20 blur-xl animate-pulse -z-10 rounded-2xl"></div>}
        </button>
    );
};

const DashboardView = ({
    currentUser,
    members,
    vegHandlerId,
    simulatedDate,
    currentHour,
    dailySchedule,
    getTaskStatus,
    waterPairs,
    waterSelection,
    waterPool,
    isWaterLow,
    toggleWaterLow,
    toggleWaterSelection,
    createManualPair,
    markPairDone,
    undoPair,
    resetWaterCycle,
    toggleTask,
    isGuest,
    triggerAlert,
    isOnline,
    isSyncing,
    hasPendingWrites,
    swapRequest,
    requestSwap,
    acceptSwap,
    declineSwap,
    setShowSummary,
    roomMetadata,
    setShowChangeLog,
    offlineQueueCount,
    recentlyUpdatedFields = [],
    exemptMembers = [],
    toggleExemption,
    cookTracker,
    markCookTask,
    resetCookTracker,
    tasks
}) => {
    const [actionSheetOpen, setActionSheetOpen] = useState(false);
    const [selectedMemberId, setSelectedMemberId] = useState(null);

    const handleLongPress = (memberId) => {
        if (!isGuest && memberId !== currentUser.id) {
            setSelectedMemberId(memberId);
            setActionSheetOpen(true);
        }
    };



    const cookId = members.find(m => m.role === 'Cook')?.id;
    const isCook = currentUser.id === cookId;

    const cookMorningStatus = getTaskStatus('cook-morning');
    const cookNightStatus = getTaskStatus('cook-night');

    // --- WATER DUTY LOGIC ---
    // 1. Current Cycle (Active Loop)
    const waterPending = waterPairs.filter(p => p.status === 'pending' && !p.archived);
    const waterDoneCycle = waterPairs.filter(p => p.status === 'done' && !p.archived);

    // 2. Monthly History (Now Infinite History until Reset)
    const waterDoneList = waterPairs
        .filter(p => p.status === 'done' && !p.archived) // Show all unarchived done pairs
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)); // Newest first

    // Cycle Progress

    const currentProgress = (waterDoneCycle.length + waterPending.length) > 0
        ? waterDoneCycle.length / (waterDoneCycle.length + waterPending.length + (waterPool.length > 1 ? Math.floor(waterPool.length / 2) : 0))
        : 0;

    // Identify next members for Glow Effect (Everyone in the first pending pair)
    const nextMemberIds = waterPending.length > 0 ? waterPending[0].members : [];

    const handleMarkWaterDone = (pairId) => {
        markPairDone(pairId);
    };

    // --- COOK DUTY LOGIC ---
    const getCookStats = () => {
        if (!cookTracker?.startDate || !tasks) return { cookedCount: 0, missedCount: 0, missedArr: [] };
        let cookedCount = 0;
        let missedCount = 0;
        const missedArr = [];
        const start = new Date(cookTracker.startDate);
        const end = new Date(simulatedDate);
        start.setHours(0, 0, 0, 0);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toDateString();
            const isToday = dateStr === simulatedDate.toDateString();

            // Morning Check (7 AM - 5 PM)
            const mStatus = tasks[`${dateStr}-cook-morning`]?.status;
            if (mStatus === 'cooked' || mStatus === 'done') {
                cookedCount++;
            } else {
                if (!isToday || currentHour >= 17) {
                    missedCount++;
                    if (mStatus !== 'cooked' && mStatus !== 'done') {
                        missedArr.push({ id: 'cook-morning', dateStr, label: `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} Morning` });
                    }
                }
            }

            // Night Check (7 PM - 11:45 PM -> we use up to midnight)
            const nStatus = tasks[`${dateStr}-cook-night`]?.status;
            if (nStatus === 'cooked' || nStatus === 'done') {
                cookedCount++;
            } else {
                if (!isToday || currentHour >= 24) {
                    missedCount++;
                    if (nStatus !== 'cooked' && nStatus !== 'done') {
                        missedArr.push({ id: 'cook-night', dateStr, label: `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} Night` });
                    }
                }
            }
        }
        return { cookedCount, missedCount, missedArr: missedArr.reverse() };
    };

    const { cookedCount, missedCount, missedArr } = getCookStats();

    const renderCookTasks = () => {
        if (!cookId) return null;

        const displayMorningStatus = cookMorningStatus === 'done' || cookMorningStatus === 'cooked' ? 'completed'
            : currentHour >= 17 ? 'missed' : 'pending';

        const displayNightStatus = cookNightStatus === 'done' || cookNightStatus === 'cooked' ? 'completed'
            : currentHour >= 24 ? 'missed' : 'pending';

        return (
            <Card className="mb-3">
                <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-[18px] font-black tracking-tight text-slate-900 mb-0 leading-none flex items-center gap-3">
                            <div className="w-9 h-9 rounded-[14px] flex items-center justify-center shadow-[inset_0_1px_5px_rgba(255,255,255,0.8),0_2px_8px_rgba(0,0,0,0.03)] border border-white/80 bg-white/40 backdrop-blur-2xl text-indigo-500 transition-all duration-700">
                                <Utensils size={18} className="drop-shadow-sm" strokeWidth={2.5} />
                            </div>
                            Cooking
                        </h2>
                        <Badge variant="warning" className="uppercase tracking-[0.3em] text-[9px] font-black px-2 py-0.5 bg-indigo-500/5 text-indigo-600 border border-indigo-500/10 rounded-full shadow-sm backdrop-blur-sm">Primary</Badge>
                    </div>

                    <div className="space-y-2.5">
                        {/* Morning Cooking */}
                        <div className={`p-3 rounded-[18px] flex flex-col gap-2 transition-all ${displayMorningStatus === 'completed' ? 'bg-emerald-50/20 border border-emerald-100/50' : 'bg-white/40 backdrop-blur-md border border-slate-50 shadow-[0_2px_10px_rgba(0,0,0,0.01)] hover:shadow-[0_4px_15px_rgba(0,0,0,0.03)]'}`}>
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-400">Morning Tasks</span>
                                {displayMorningStatus === 'completed' ? <Badge variant="success" className="bg-emerald-500/10 text-emerald-600 border-none px-2 py-0.5 text-[8px] font-black">ACTIVE</Badge> :
                                    displayMorningStatus === 'missed' ? <Badge variant="danger" className="bg-rose-50 text-rose-600 border-none px-2 py-0.5 text-[8px] font-black">MISSED</Badge> :
                                        <Badge variant="warning" className="bg-slate-50 text-slate-400 border-none uppercase tracking-[0.2em] text-[8px] font-black px-2 py-0.5">PENDING</Badge>}
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                                <span className="text-xs font-black text-slate-800 tracking-tight">Main Hand Prepared</span>
                                {displayMorningStatus !== 'completed' ? (
                                    <TaskButton onClick={() => markCookTask('cook-morning', 'cooked')} className="px-4 py-1.5 bg-indigo-600 text-white text-[9px] font-black tracking-widest uppercase rounded-lg hover:bg-indigo-700 hover:scale-[1.02] shadow-[0_4px_12px_rgba(99,102,241,0.2)] transition-all flex items-center gap-1.5">Done</TaskButton>
                                ) : (
                                    <TaskButton type="undo" onClick={() => markCookTask('cook-morning', 'pending')} className="px-2.5 py-1 bg-white/80 border border-slate-100 text-slate-400 text-[8px] font-black uppercase tracking-widest rounded-lg hover:bg-white hover:text-slate-600 transition-colors">Revert</TaskButton>
                                )}
                            </div>
                        </div>

                        {/* Night Cooking */}
                        <div className={`p-3 rounded-[18px] flex flex-col gap-2 transition-all ${displayNightStatus === 'completed' ? 'bg-emerald-50/20 border border-emerald-100/50' : 'bg-white/40 backdrop-blur-md border border-slate-50 shadow-[0_2px_10px_rgba(0,0,0,0.01)] hover:shadow-[0_4px_15px_rgba(0,0,0,0.03)]'}`}>
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-400">Night Tasks</span>
                                {displayNightStatus === 'completed' ? <Badge variant="success" className="bg-emerald-500/10 text-emerald-600 border-none px-2 py-0.5 text-[8px] font-black">ACTIVE</Badge> :
                                    displayNightStatus === 'missed' ? <Badge variant="danger" className="bg-rose-50 text-rose-600 border-none px-2 py-0.5 text-[8px] font-black">MISSED</Badge> :
                                        <Badge variant="warning" className="bg-slate-50 text-slate-400 border-none uppercase tracking-[0.2em] text-[8px] font-black px-2 py-0.5">PENDING</Badge>}
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                                <span className="text-xs font-black text-slate-800 tracking-tight">Dinner Cycle Executed</span>
                                {displayNightStatus !== 'completed' ? (
                                    <TaskButton onClick={() => markCookTask('cook-night', 'cooked')} className="px-4 py-1.5 bg-indigo-600 text-white text-[9px] font-black tracking-widest uppercase rounded-lg hover:bg-indigo-700 hover:scale-[1.02] shadow-[0_4px_12px_rgba(99,102,241,0.2)] transition-all flex items-center gap-1.5">Done</TaskButton>
                                ) : (
                                    <TaskButton type="undo" onClick={() => markCookTask('cook-night', 'pending')} className="px-2.5 py-1 bg-white/80 border border-slate-100 text-slate-400 text-[8px] font-black uppercase tracking-widest rounded-lg hover:bg-white hover:text-slate-600 transition-colors">Revert</TaskButton>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        );
    };

    const renderCookStats = () => {
        if (!cookId) return null;
        const daysSince = cookTracker?.startDate ? Math.max(1, Math.ceil((new Date(simulatedDate) - new Date(cookTracker.startDate)) / (1000 * 60 * 60 * 24))) : 1;

        return (
            <Card className="mt-3 mb-3">
                <div className="p-4">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-50/50 pb-3">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            <Utensils size={12} /> Cook Tracker
                        </h2>
                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest text-right">Last {daysSince} Days</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="bg-emerald-50/50 rounded-[16px] p-3 flex flex-col justify-center items-center border border-emerald-100/30">
                            <p className="text-[9px] text-emerald-600/80 font-black uppercase tracking-[0.2em] mb-1">Cooked</p>
                            <p className="text-3xl font-black text-emerald-600 tracking-tighter">{cookedCount}</p>
                        </div>
                        <div className="bg-rose-50/50 rounded-[16px] p-3 flex flex-col justify-center items-center border border-rose-100/30">
                            <p className="text-[9px] text-rose-600/80 font-black uppercase tracking-[0.2em] mb-1">Missed</p>
                            <p className="text-3xl font-black text-rose-600 tracking-tighter">{missedCount}</p>
                        </div>
                    </div>

                    {/* Handler Tools */}
                    {currentUser.id === vegHandlerId && !isGuest && (
                        <div className="mt-5 pt-4 border-t border-slate-50">
                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-3">Admin Actions</p>
                            {missedArr.length > 0 ? (
                                <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1 no-scrollbar">
                                    {missedArr.map((missedTask, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-white border border-slate-100 p-2 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-sm transition-all">
                                            <span className="text-[10px] font-bold text-slate-600 pl-1">{missedTask.label}</span>
                                            <TaskButton
                                                onClick={() => markCookTask(missedTask.id, 'cooked', missedTask.dateStr)}
                                                className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[9px] uppercase font-black tracking-wider rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1"
                                            >
                                                <CheckCircle2 size={10} /> Override
                                            </TaskButton>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[10px] font-medium text-slate-300 italic">No missed tasks to override.</p>
                            )}

                            <div className="mt-4 flex justify-center">
                                <button onClick={resetCookTracker} className="text-[9px] uppercase tracking-widest font-black text-slate-400 hover:text-rose-500 px-3 py-1.5 border border-slate-100 hover:border-rose-100 bg-white hover:bg-rose-50 rounded-lg transition-all flex items-center gap-1">
                                    <Trash2 size={11} /> Reset Tracker Log
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        );
    };



    const handleRefresh = async () => {
        // Reduce artificial delay for faster UX; Firestore handles sync automatically
        await new Promise(resolve => setTimeout(resolve, 400));
        return true;
    };

    return (
        <PullToRefresh onRefresh={handleRefresh} className="h-full overflow-y-auto no-scrollbar" pullingContent={
            <div className="flex flex-col items-center justify-center h-16 text-slate-400">
                <span className="text-sm font-bold animate-bounce">Pull down to refresh</span>
            </div>
        } refreshingContent={
            <div className="flex flex-col items-center justify-center h-16 text-indigo-500">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <div className="flex flex-col gap-4 pb-24 pt-3 min-h-full">
                <ActionSheet
                    open={actionSheetOpen}
                    onClose={() => setActionSheetOpen(false)}
                    actions={[
                        {
                            label: exemptMembers.includes(selectedMemberId) ? "Clear Exemption" : "Mark Exempt (Today)",
                            onClick: () => toggleExemption(selectedMemberId)
                        },
                        { label: "Cancel", onClick: () => { } },
                    ]}
                />
                <header className="flex justify-between items-center bg-white/95 backdrop-blur-2xl p-3 sticky top-0 z-50 rounded-b-[20px] border-b border-slate-50 shadow-[0_4px_20px_rgba(0,0,0,0.02)] pt-[max(env(safe-area-inset-top),0.75rem)]">
                    <div>
                        <h1 className="text-[16px] font-black text-slate-900 tracking-[0.4em] uppercase drop-shadow-sm flex items-center leading-none">ROOM<span className="italic ml-1 text-lg font-black text-indigo-600/90">-7</span></h1>
                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.3em] mt-1.5 flex items-center gap-2">
                            <Clock size={10} strokeWidth={2.5} className="text-indigo-400/60" />
                            {simulatedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} · {simulatedDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <SyncBadge isOnline={isOnline} isSyncing={isSyncing} hasPendingWrites={hasPendingWrites} offlineQueueCount={offlineQueueCount} />
                        <div className="relative cursor-pointer transition-transform hover:scale-105" onClick={() => document.querySelector('[aria-label="Profile"]')?.click()}>
                            <MemberAvatar name={currentUser.name} code={currentUser.avatar} size="sm" className="ring-2 ring-slate-100 shadow-sm w-8 h-8" />
                            {vegHandlerId === currentUser.id && <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-50 text-emerald-500 rounded-full shadow-sm p-0.5 border border-emerald-100"><Leaf size={8} /></div>}
                        </div>
                    </div>
                </header>

                <div className="px-3 space-y-3">
                    {isCook && renderCookTasks()}

                    <div className="relative mb-3 rounded-[24px] overflow-hidden group transition-all duration-1000 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100/50">

                        {/* ELITE MESH GRADIENT LAYER */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-[0.4]">
                            <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] rounded-full bg-cyan-100/40 blur-[100px] animate-mesh-1 mix-blend-multiply"></div>
                            <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-indigo-100/40 blur-[100px] animate-mesh-2 mix-blend-multiply"></div>
                            <div className="absolute top-[20%] right-[10%] w-[60%] h-[60%] rounded-full bg-blue-50/50 blur-[100px] animate-mesh-3 mix-blend-multiply"></div>
                            {isWaterLow && (
                                <div className="absolute inset-0 bg-rose-50/30 animate-pulse mix-blend-overlay z-10 transition-opacity duration-1000"></div>
                            )}
                        </div>

                        <div className="relative z-10 p-3">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-[12px] flex items-center justify-center shadow-[inset_0_1px_5px_rgba(255,255,255,0.8),0_2px_8px_rgba(0,0,0,0.03)] border border-white/80 bg-white/40 backdrop-blur-2xl ${isWaterLow ? 'text-rose-500' : 'text-cyan-500'} transition-all duration-700`}>
                                        <Droplets size={16} className={`${isWaterLow ? 'animate-pulse' : ''} drop-shadow-sm`} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h2 className="text-[16px] font-black tracking-tight text-slate-900 mb-0 leading-none">Water</h2>
                                    </div>
                                </div>
                                {currentUser.id === vegHandlerId && (
                                    <Badge variant="success" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/10 uppercase tracking-[0.25em] text-[9px] font-black px-3 py-1 shadow-sm backdrop-blur-sm">Handler</Badge>
                                )}
                            </div>

                            {/* "Report Low Water" button removed as requested */}

                            {waterPending.length > 0 && (
                                <div className="space-y-3 mb-4 relative z-10 px-0.5">
                                    <p className="text-[9px] uppercase font-black tracking-[0.4em] text-slate-400/80 mb-2 flex items-center gap-2">
                                        <span className="w-5 h-[1px] bg-slate-200"></span>
                                        Active Tasks
                                    </p>
                                    {waterPending.map(pair => (
                                        <div key={pair.id} className="bg-white/40 backdrop-blur-2xl border border-white shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-3 rounded-[18px] flex flex-col sm:flex-row items-center justify-between gap-3 transition-all duration-500 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:bg-white/60 group/card border-b-4 border-b-slate-50/50">
                                            <div className="flex items-center w-full justify-between sm:justify-start">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex -space-x-3">
                                                        {pair.members.map(mid => (
                                                            <DutyAvatar
                                                                key={mid}
                                                                member={members.find(m => m.id === mid)}
                                                                progress={currentProgress}
                                                                isNext={nextMemberIds.includes(mid) && pair.id === waterPending[0].id}
                                                                className="ring-4 ring-white/50 w-10 h-10 shadow-md transition-transform duration-500 group-hover/card:scale-105"
                                                            />
                                                        ))}
                                                    </div>
                                                    <div className="flex flex-col hidden sm:flex">
                                                        <span className="text-slate-900 font-black text-sm tracking-tight leading-tight">{pair.members.map(mid => members.find(m => m.id === mid)?.name).join(' & ')}</span>
                                                        <span className="text-[9px] uppercase font-black tracking-[0.3em] text-cyan-500 mt-1 flex items-center gap-1.5 opacity-80 decoration-cyan-500/30 underline underline-offset-4">
                                                            <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse"></span>
                                                            Waiting
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 sm:hidden">
                                                    {!isGuest && (pair.members.includes(currentUser.id) || currentUser.id === vegHandlerId) && (
                                                        <TaskButton type="undo" onClick={() => undoPair(pair.id)} className="w-10 h-10 flex items-center justify-center bg-white/80 text-slate-400 rounded-[16px] hover:bg-white hover:text-slate-700 border border-slate-100 transition-all shadow-sm active:scale-95"><Undo2 size={16} /></TaskButton>
                                                    )}
                                                    {!isGuest && (pair.members.includes(currentUser.id) || currentUser.id === vegHandlerId) && (
                                                        <TaskButton onClick={() => handleMarkWaterDone(pair.id)} className="px-4 h-10 bg-slate-900 text-white text-[9px] uppercase tracking-[0.25em] font-black rounded-[16px] transition-all shadow-[0_4px_15px_rgba(15,23,42,0.15)] hover:shadow-[0_8px_20px_rgba(15,23,42,0.25)] hover:translate-y-[-2px] active:translate-y-[1px]">Done</TaskButton>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="hidden sm:flex gap-2">
                                                {!isGuest && (pair.members.includes(currentUser.id) || currentUser.id === vegHandlerId) && (
                                                    <TaskButton type="undo" onClick={() => undoPair(pair.id)} className="w-10 h-10 flex items-center justify-center bg-white/80 text-slate-400 rounded-[16px] hover:bg-white hover:text-slate-700 border border-slate-100 transition-all shadow-sm active:scale-95"><Undo2 size={18} /></TaskButton>
                                                )}
                                                {!isGuest && (pair.members.includes(currentUser.id) || currentUser.id === vegHandlerId) && (
                                                    <TaskButton onClick={() => handleMarkWaterDone(pair.id)} className="px-6 h-10 bg-slate-900 text-white text-[10px] tracking-[0.3em] uppercase font-black rounded-[16px] shadow-[0_4px_15px_rgba(15,23,42,0.15)] hover:shadow-[0_8px_20px_rgba(15,23,42,0.25)] hover:translate-y-[-2px] transition-all duration-300 active:translate-y-[1px]">Done</TaskButton>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {/* ... (Keep other elements styled similarly for luxury feel) ... */}
                            {/* ... (Keep other elements styled similarly for luxury feel) ... */}
                            {waterPool.length > 0 && (
                                <div className="mb-4 relative z-10">
                                    <p className="text-[9px] uppercase font-black tracking-[0.4em] text-slate-400/80 mb-2 flex items-center gap-2">
                                        <span className="w-5 h-[1px] bg-slate-200"></span>
                                        Members ({waterPool.length})
                                    </p>
                                    <div className="grid grid-cols-3 gap-1.5 mb-3">
                                        {waterPool.map((mid, idx) => (
                                            <PoolMember
                                                key={mid}
                                                mid={mid}
                                                members={members}
                                                waterSelection={waterSelection}
                                                onToggle={isGuest ? () => { } : toggleWaterSelection}
                                                onLongPress={handleLongPress}
                                                isExempt={exemptMembers.includes(mid)}
                                                completionCount={waterDoneList.filter(p => p.members.includes(mid)).length}
                                                index={idx}
                                            />
                                        ))}
                                    </div>
                                    {waterSelection.length === 2 && (
                                        <ActionButton onClick={createManualPair} label="Assign Team" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_8px_20px_rgba(79,70,229,0.15)] border-none text-[10px] tracking-[0.3em] uppercase font-black rounded-xl w-full py-3 mt-1 transition-all duration-500 hover:translate-y-[-2px]" />
                                    )}
                                </div>
                            )}
                            {waterPending.length === 0 && waterPool.length === 0 && waterDoneList.length === 0 && (
                                <div className="text-center py-8 relative z-10">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">All caught up</p>
                                </div>
                            )}
                            {waterPool.length === 0 && waterPending.length > 0 && (
                                <div className="text-center py-4 relative z-10">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500">Waitlist Empty</p>
                                </div>
                            )}
                            {waterDoneList.length > 0 && (
                                <div className="mt-8 pt-6 border-t border-slate-100/80 relative z-10">
                                    <div className="flex justify-between items-center mb-4 px-1">
                                        <p className="text-[10px] uppercase font-black tracking-[0.4em] text-slate-400/80 flex items-center gap-2">
                                            <span className="w-6 h-[1px] bg-slate-200"></span>
                                            History
                                        </p>
                                        <Badge variant="ghost" className="text-[9px] bg-slate-100/50 text-slate-500 border-none uppercase font-black tracking-[0.15em] px-2 py-0.5">{waterDoneList.length} Entries</Badge>
                                    </div>
                                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 no-scrollbar px-1">
                                        {waterDoneList.map((pair, idx) => (
                                            <div key={pair.id} className="flex justify-between items-center bg-white/30 border border-slate-50 p-3 rounded-[18px] transition-all duration-300 hover:shadow-[0_4px_15px_rgba(0,0,0,0.02)] hover:bg-white/60 group/history backdrop-blur-sm">
                                                <div className="flex gap-3 items-center">
                                                    <span className="text-slate-200 font-black tracking-[-0.1em] text-sm w-5 text-right font-mono italic">{waterDoneList.length - idx}</span>
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-slate-800 text-[13px] tracking-tight">{pair.members.map(mid => members.find(m => m.id === mid)?.name).join(' & ')}</span>
                                                        <span className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 mt-1 flex items-center gap-2 opacity-70">
                                                            {pair.completedBy && <span className="text-cyan-600">{pair.completedBy}</span>}
                                                            {pair.completedBy && <span className="w-[3px] h-[3px] rounded-full bg-slate-300"></span>}
                                                            {new Date(pair.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {new Date(pair.completedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                                {currentUser.id === vegHandlerId && !isGuest && (
                                                    <TaskButton type="undo" onClick={() => undoPair(pair.id)} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all active:scale-90"><Trash2 size={14} strokeWidth={2.5} /></TaskButton>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {/* MANUAL RESET BUTTON (Visible only to Handler) */}
                            {currentUser.id === vegHandlerId && !isGuest && (
                                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-center relative z-10">
                                    <button onClick={resetWaterCycle} className="text-[9px] uppercase font-black tracking-[0.2em] text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-2 px-4 py-2 border border-slate-100 bg-slate-50 hover:bg-rose-50 hover:border-rose-100 rounded-xl">
                                        <Trash2 size={10} /> Clear History
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>



                    <Card className="mb-2">
                        <div className="p-3">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-[12px] flex items-center justify-center shadow-[inset_0_1px_5px_rgba(255,255,255,0.8),0_2px_8px_rgba(0,0,0,0.03)] border border-white/80 bg-white/40 backdrop-blur-2xl text-amber-500 transition-all duration-700">
                                        <Droplets size={16} className="drop-shadow-sm" strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h2 className="text-[16px] font-black tracking-tight text-slate-900 mb-0 leading-none">Dishes</h2>
                                    </div>
                                </div>
                            </div>

                            <div className={`flex items-center justify-between p-3 rounded-[18px] mb-2 transition-all ${currentHour >= TIME_WINDOWS.dishMorning.start && currentHour < TIME_WINDOWS.dishMorning.end ? 'bg-amber-50/40 border border-amber-100 shadow-[0_4px_20px_rgba(245,158,11,0.03)]' : 'bg-white/40 backdrop-blur-md border border-slate-50 shadow-[0_2px_10px_rgba(0,0,0,0.01)]'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={currentHour >= TIME_WINDOWS.dishMorning.start && currentHour < TIME_WINDOWS.dishMorning.end ? "w-9 h-9 bg-white rounded-xl flex items-center justify-center text-amber-500 shadow-sm border border-amber-50" : "w-9 h-9 bg-slate-50/50 rounded-xl flex items-center justify-center text-slate-300 border border-slate-100"}><Sun size={16} /></div>
                                    <div>
                                        <p className={`text-[10px] font-black uppercase tracking-[0.35em] ${currentHour >= TIME_WINDOWS.dishMorning.start && currentHour < TIME_WINDOWS.dishMorning.end ? "text-amber-800" : "text-slate-400"}`}>Morning</p>
                                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                            {dailySchedule.morningDish?.map(id => {
                                                const m = members.find(mem => mem.id === id);
                                                const isExempt = exemptMembers.includes(id);
                                                return (
                                                    <div key={id} className={`flex items-center gap-1.5 bg-white/60 border border-white/80 rounded-full pr-2 py-0.5 shadow-sm ${isExempt ? 'opacity-30 grayscale blur-[0.5px]' : ''}`}>
                                                        <div className="relative">
                                                            <MemberAvatar size="sm" className="w-5 h-5 text-[8px]" member={m} />
                                                            {isExempt && <div className="absolute -bottom-0.5 -right-0.5 bg-amber-500 rounded-full w-1.5 h-1.5 border border-white" />}
                                                        </div>
                                                        <span className="text-[10px] font-black text-slate-600 tracking-tight">{m?.name}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={`flex items-center justify-between p-3 rounded-[18px] transition-all ${currentHour >= TIME_WINDOWS.dishNight.start && currentHour < TIME_WINDOWS.dishNight.end ? 'bg-indigo-50/40 border border-indigo-100 shadow-[0_4px_20px_rgba(99,102,241,0.03)]' : 'bg-white/40 backdrop-blur-md border border-slate-50 shadow-[0_2px_10px_rgba(0,0,0,0.01)]'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={currentHour >= TIME_WINDOWS.dishNight.start && currentHour < TIME_WINDOWS.dishNight.end ? "w-9 h-9 bg-white rounded-xl flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-50" : "w-9 h-9 bg-slate-50/50 rounded-xl flex items-center justify-center text-slate-300 border border-slate-100"}><Moon size={16} /></div>
                                    <div>
                                        <p className={`text-[10px] font-black uppercase tracking-[0.35em] ${currentHour >= TIME_WINDOWS.dishNight.start && currentHour < TIME_WINDOWS.dishNight.end ? "text-indigo-800" : "text-slate-400"}`}>Night</p>
                                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                            {dailySchedule.nightDish?.map(id => {
                                                const m = members.find(mem => mem.id === id);
                                                const isExempt = exemptMembers.includes(id);
                                                return (
                                                    <div key={id} className={`flex items-center gap-1.5 bg-white/60 border border-white/80 rounded-full pr-2 py-0.5 shadow-sm ${isExempt ? 'opacity-30 grayscale blur-[0.5px]' : ''}`}>
                                                        <div className="relative">
                                                            <MemberAvatar size="sm" className="w-5 h-5 text-[8px]" member={m} />
                                                            {isExempt && <div className="absolute -bottom-0.5 -right-0.5 bg-amber-500 rounded-full w-1.5 h-1.5 border border-white" />}
                                                        </div>
                                                        <span className="text-[10px] font-black text-slate-600 tracking-tight">{m?.name}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="grid grid-cols-2 gap-3">
                        <Card className={`relative overflow-hidden transition-all group ${recentlyUpdatedFields.includes('schedule') ? 'scale-[1.02] shadow-[0_15px_40px_rgba(16,185,129,0.1)] ring-1 ring-emerald-100' : 'hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.03)]'}`}>
                            <div className="p-4">
                                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-emerald-500/80 mb-3 flex items-center gap-2">
                                    <span className="w-4 h-[1px] bg-emerald-100"></span>
                                    Cleaning
                                </p>
                                <div className="flex -space-x-3 overflow-hidden mb-4 pl-1">
                                    {dailySchedule.cleaning?.map(id => {
                                        const m = members.find(mem => mem.id === id);
                                        const isExempt = exemptMembers.includes(id);
                                        return (
                                            <div key={id} className="relative shadow-md rounded-full ring-2 ring-white transition-all group-hover:scale-110">
                                                <MemberAvatar name={m?.name} code={m?.avatar} className={`w-9 h-9 ${isExempt ? 'opacity-30 grayscale blur-[1px]' : ''}`} />
                                                {isExempt && <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full w-3 h-3 border-[2px] border-white shadow-sm" />}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="text-[10px] text-slate-500 font-black tracking-tight leading-relaxed max-w-[90%]">
                                    {dailySchedule.cleaning?.map((id, i) => {
                                        const m = members.find(mem => mem.id === id);
                                        return <span key={id} className={exemptMembers.includes(id) ? "opacity-30 line-through mr-1" : "mr-1"}>{m?.name}{i < dailySchedule.cleaning.length - 1 ? ',' : ''}</span>;
                                    })}
                                </div>
                            </div>
                        </Card>

                        <Card className={`relative overflow-hidden transition-all group ${recentlyUpdatedFields.includes('schedule') ? 'scale-[1.02] shadow-[0_15px_40px_rgba(59,130,246,0.1)] ring-1 ring-blue-100' : 'hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.03)]'}`}>
                            <div className="p-4">
                                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-500/80 mb-3 flex items-center gap-2">
                                    <span className="w-4 h-[1px] bg-blue-100"></span>
                                    Market
                                </p>
                                {dailySchedule.market && dailySchedule.market.length > 0 ? (
                                    <>
                                        <div className="flex -space-x-3 overflow-hidden mb-4 pl-1">
                                            {dailySchedule.market?.map(id => {
                                                const m = members.find(mem => mem.id === id);
                                                const isExempt = exemptMembers.includes(id);
                                                return (
                                                    <div key={id} className="relative shadow-md rounded-full ring-2 ring-white transition-all group-hover:scale-110">
                                                        <MemberAvatar name={m?.name} code={m?.avatar} className={`w-9 h-9 ${isExempt ? 'opacity-30 grayscale blur-[1px]' : ''}`} />
                                                        {isExempt && <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full w-3 h-3 border-[2px] border-white shadow-sm" />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-black tracking-tight leading-relaxed max-w-[90%]">
                                            {dailySchedule.market?.map((id, i) => {
                                                const m = members.find(mem => mem.id === id);
                                                return <span key={id} className={exemptMembers.includes(id) ? "opacity-30 line-through mr-1" : "mr-1"}>{m?.name}{i < dailySchedule.market.length - 1 ? ',' : ''}</span>;
                                            })}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-start gap-3 h-full min-h-[80px]">
                                        <div className="w-9 h-9 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 border border-slate-100/50"><ShoppingCart size={18} /></div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mt-1">Dormant</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>

                    {renderCookStats()}

                    {roomMetadata?.updatedAt && (
                        <div className="flex justify-center pb-4">
                            <button onClick={setShowChangeLog} className="text-[10px] text-slate-400 font-medium">
                                Last updated by {roomMetadata.updatedBy} · {new Date(roomMetadata.updatedAt.seconds * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </PullToRefresh>
    );
};

export default DashboardView;

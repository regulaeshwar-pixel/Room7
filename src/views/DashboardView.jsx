import React, { useState } from 'react';
import { Droplets, AlertTriangle, Undo2, CheckCircle2, Utensils, Sun, Moon, Clock, ShoppingCart, Leaf, Trash2, TrendingUp } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import MemberAvatar from '../components/MemberAvatar';
import MicroCheck from '../components/MicroCheck';
import DutyAvatar from '../components/DutyAvatar';
import HouseNote from '../components/HouseNote';

import SyncBadge from '../components/SyncBadge';
import ActionSheet from '../components/ActionSheet';
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

const Card = ({ children, className = "", onClick }) => (
    <div onClick={onClick} className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden ${className}`}>
        {children}
    </div>
);

const Badge = ({ children, variant = 'neutral' }) => {
    const styles = {
        neutral: 'bg-slate-100 text-slate-600',
        success: 'bg-emerald-100 text-emerald-700',
        warning: 'bg-amber-100 text-amber-700',
        danger: 'bg-rose-100 text-rose-700',
        blue: 'bg-blue-100 text-blue-700',
    };
    return <span className={`px-2 py-1 rounded-md text-xs font-medium ${styles[variant]}`}>{children}</span>;
};

const ActionButton = ({ onClick, done, label }) => {
    const [showCheck, setShowCheck] = useState(false);

    const handleClick = (e) => {
        if (onClick) onClick(e);
        setShowCheck(true);
        setTimeout(() => setShowCheck(false), 400);
    };

    return (
        <div className="relative w-full">
            <button onClick={handleClick} className={`w-full py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-800 text-white hover:bg-slate-900'}`}>
                {done ? <CheckCircle2 size={16} /> : null}{done ? 'Completed' : label}
            </button>
            <MicroCheck show={showCheck} />
        </div>
    );
};

const StatusIndicator = ({ status, text = false }) => {
    if (status === 'loading') return <div className="w-4 h-4 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />;
    if (status === 'done') return text ? <span className="text-xs font-bold text-emerald-600">Done</span> : <CheckCircle2 size={20} className="text-emerald-500" />;
    return text ? <span className="text-xs text-slate-400">Pending</span> : <Clock size={20} className="text-slate-200" />;
};

const TIME_WINDOWS = {
    cookingMorning: { start: 7, end: 13 },
    cookingNight: { start: 20, end: 23 },
    dishMorning: { start: 7, end: 12 },
    dishNight: { start: 17, end: 22 },
};

const PoolMember = ({ mid, members, waterSelection, onToggle, onLongPress, isExempt }) => {
    const handlers = useLongPress(() => onLongPress(mid), () => onToggle(mid));
    const member = members.find(m => m.id === mid);
    return (
        <button
            {...handlers}
            className={`flex items-center gap-1 pr-2 py-1 pl-1 rounded-full border transition-all pressable ${waterSelection.includes(mid) ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-200' : 'bg-white border-slate-200 text-slate-600'} ${isExempt ? 'opacity-50 grayscale' : ''}`}
        >
            <div className="relative">
                <MemberAvatar size="sm" className="w-6 h-6 text-[10px]" member={member} />
                {isExempt && <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full w-2 h-2 border border-white" />}
            </div>
            <span className="text-xs font-bold">{member?.name}</span>
            {isExempt && <span className="text-[10px] text-amber-600 font-bold ml-1">Exempt</span>}
        </button>
    );
};

const DashboardView = ({
    currentUser,
    members,
    vegHandlerId,
    notificationState,
    notifyDispatch,
    dismissAlert,
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
    NotificationBanner,
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
    houseNote,
    updateHouseNote,
    exemptMembers = [],
    toggleExemption
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
    const isHandler = currentUser.id === vegHandlerId;

    const cookMorningStatus = getTaskStatus('cook-morning');
    const cookNightStatus = getTaskStatus('cook-night');
    const isMorningCookTime = currentHour >= TIME_WINDOWS.cookingMorning.start && currentHour < TIME_WINDOWS.cookingMorning.end;
    const isNightCookTime = currentHour >= TIME_WINDOWS.cookingNight.start && currentHour < TIME_WINDOWS.cookingNight.end;

    // --- WATER DUTY LOGIC ---
    // 1. Current Cycle (Active Loop)
    const waterPending = waterPairs.filter(p => p.status === 'pending' && !p.archived);
    const waterDoneCycle = waterPairs.filter(p => p.status === 'done' && !p.archived);
    const myActivePair = waterPending.find(p => p.members.includes(currentUser.id));

    // 2. Monthly History (Now Infinite History until Reset)
    const waterDoneList = waterPairs
        .filter(p => p.status === 'done' && !p.archived) // Show all unarchived done pairs
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)); // Newest first

    // Cycle Progress
    const totalCyclePairs = waterDoneCycle.length + waterPending.length + (waterPool.length > 0 ? 1 : 0);
    const currentProgress = (waterDoneCycle.length + waterPending.length) > 0
        ? waterDoneCycle.length / (waterDoneCycle.length + waterPending.length + (waterPool.length > 1 ? Math.floor(waterPool.length / 2) : 0))
        : 0;

    // Identify next members for Glow Effect (Everyone in the first pending pair)
    const nextMemberIds = waterPending.length > 0 ? waterPending[0].members : [];

    return (
        <div className="flex flex-col gap-6 pb-28 pt-4">
            {NotificationBanner && <NotificationBanner notificationState={notificationState} notifyDispatch={notifyDispatch} dismissAlert={dismissAlert} />}
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
            <header className="flex justify-between items-center bg-white p-4 sticky top-0 z-10 shadow-sm rounded-b-2xl">
                <div>
                    <h1 className="text-xl font-bold text-theme">FlowHouse</h1>
                    <p className="text-sm text-slate-500">{simulatedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} • {simulatedDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowSummary && setShowSummary(true)} className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors" title="View Monthly Summary">
                        <TrendingUp size={20} />
                    </button>
                    <SyncBadge isOnline={isOnline} isSyncing={isSyncing} hasPendingWrites={hasPendingWrites} offlineQueueCount={offlineQueueCount} />

                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-bold text-slate-700">{currentUser.name}</p>
                        {isGuest && <span className="text-[10px] bg-slate-100 text-slate-500 px-1 rounded">Read Only</span>}
                        {vegHandlerId === currentUser.id && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1 rounded">Veg Handler</span>}
                    </div>
                    <div className="relative">
                        <MemberAvatar name={currentUser.name} code={currentUser.avatar} />
                        <span className="absolute inset-0 rounded-full animate-pulse-soft pointer-events-none" />
                        {vegHandlerId === currentUser.id && <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border border-white"><Leaf size={8} /></div>}
                    </div>
                </div>
            </header>

            <div className="px-4 space-y-4">
                <HouseNote
                    note={houseNote}
                    canEdit={!isGuest}
                    onSave={updateHouseNote}
                />
                <Card className={`border-l-4 ${myActivePair ? 'border-l-rose-500 bg-rose-50' : 'border-l-blue-500'}`}>
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="font-bold flex items-center gap-2 text-slate-700">
                                <Droplets size={18} className="text-blue-500" />
                                Water Duty
                            </h2>
                            {currentUser.id === vegHandlerId && <Badge variant="success">Handler Mode</Badge>}
                        </div>
                        {!isGuest && (
                            <button onClick={toggleWaterLow} className={`w-full mb-4 h-9 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${isWaterLow ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'}`}>
                                <AlertTriangle size={16} className={isWaterLow ? "text-white animate-pulse" : "text-rose-500"} />
                                {isWaterLow ? "Water alert active" : "Report low water"}
                            </button>
                        )}
                        {waterPending.length > 0 && (
                            <div className="space-y-2 mb-4">
                                <p className="text-sm font-semibold text-slate-600 mb-1">Current Duty</p>
                                {waterPending.map(pair => (
                                    <div key={pair.id} className="bg-white border border-slate-200 p-3 rounded-xl flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="flex -space-x-2">
                                                {pair.members.map(mid => (
                                                    <DutyAvatar
                                                        key={mid}
                                                        member={members.find(m => m.id === mid)}
                                                        progress={currentProgress}
                                                        isNext={nextMemberIds.includes(mid) && pair.id === waterPending[0].id}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-xs font-medium text-slate-500">In progress</span>
                                        </div>
                                        <div className="flex gap-2">
                                            {!isGuest && (pair.members.includes(currentUser.id) || currentUser.id === vegHandlerId) && (
                                                <TaskButton onClick={() => markPairDone(pair.id)} className="px-3 h-9 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 active:scale-[0.98] transition-all">Mark Complete</TaskButton>
                                            )}
                                            {!isGuest && (pair.members.includes(currentUser.id) || currentUser.id === vegHandlerId) && (
                                                <TaskButton type="undo" onClick={() => undoPair(pair.id)} className="w-9 h-9 flex items-center justify-center bg-transparent border border-slate-200 text-slate-400 rounded-lg hover:border-rose-300 hover:text-rose-500 hover:bg-rose-50 active:scale-[0.98] transition-all"><Undo2 size={16} /></TaskButton>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {waterPool.length > 0 && (
                            <div className="mb-4">
                                <p className="text-sm font-semibold text-slate-600 mb-2">Available members ({waterPool.length})</p>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {waterPool.map(mid => (
                                        <PoolMember
                                            key={mid}
                                            mid={mid}
                                            members={members}
                                            waterSelection={waterSelection}
                                            onToggle={isGuest ? () => triggerAlert("ReadOnly: Login required.", "info") : toggleWaterSelection}
                                            onLongPress={handleLongPress}
                                            isExempt={exemptMembers.includes(mid)}
                                        />
                                    ))}
                                </div>
                                {waterSelection.length === 2 && (
                                    <ActionButton onClick={createManualPair} label="Assign Pair" />
                                )}
                            </div>
                        )}
                        {waterPending.length === 0 && waterPool.length === 0 && waterDoneList.length === 0 && (
                            <div className="text-center py-6">
                                <p className="text-sm text-slate-400">No water duty assigned yet</p>
                            </div>
                        )}
                        {waterPool.length === 0 && waterPending.length > 0 && (
                            <div className="text-center py-3">
                                <p className="text-xs text-slate-400">All members are currently assigned</p>
                            </div>
                        )}
                        {waterDoneList.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-200/50">
                                <p className="text-sm font-semibold text-slate-500 mb-2">Completed</p>
                                <div className="space-y-1">
                                    {waterDoneList.slice(0, 3).reverse().map((pair, idx) => (
                                        <div key={pair.id} className="flex justify-between items-center text-xs">
                                            <div className="flex gap-2 items-center">
                                                <span className="text-slate-400 font-mono">{idx + 1}.</span>
                                                <span className="font-medium text-slate-600">{pair.members.map(mid => members.find(m => m.id === mid)?.name).join(' & ')}</span>
                                            </div>
                                            {currentUser.id === vegHandlerId && !isGuest && (
                                                <TaskButton type="undo" onClick={() => undoPair(pair.id)} className="text-rose-400 hover:text-rose-600"><Trash2 size={12} /></TaskButton>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* MANUAL RESET BUTTON (Visible only to Handler) */}
                        {currentUser.id === vegHandlerId && !isGuest && (
                            <div className="mt-4 pt-2 border-t border-slate-100 flex justify-center">
                                <button onClick={resetWaterCycle} className="text-xs text-slate-400 hover:text-rose-500 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-all active:scale-[0.98] flex items-center gap-1.5">
                                    <Trash2 size={12} /> Clear history
                                </button>
                            </div>
                        )}
                    </div>
                </Card>

                <Card className="border-l-4 border-l-indigo-500 p-4">
                    <h2 className="text-sm font-semibold text-slate-600 flex items-center gap-2 mb-3"><Utensils size={16} className="text-indigo-500" /> Cooking</h2>
                    <div className={`flex items-center justify-between p-3 rounded-xl mb-2 ${isMorningCookTime ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'bg-slate-50'}`}>
                        <div className="flex gap-3">
                            <Sun size={18} className={isMorningCookTime ? "text-indigo-600" : "text-slate-400"} />
                            <div className="text-sm">
                                <p className="font-medium">Morning</p>
                                <p className="text-[10px] text-slate-500">7:00 AM - 1:00 PM</p>
                            </div>
                        </div>
                        {(isCook || isHandler) && !isGuest ? (
                            <TaskButton onClick={() => toggleTask('cook-morning')} className={`w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-[0.98] ${cookMorningStatus === 'done' ? 'bg-emerald-500 text-white' : 'bg-white border border-slate-200 text-slate-300'}`}><CheckCircle2 size={20} /></TaskButton>
                        ) : (
                            <div className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${cookMorningStatus === 'done' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                                {cookMorningStatus === 'loading' ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : (cookMorningStatus === 'done' ? <Utensils size={14} /> : <Clock size={14} />)}
                                {cookMorningStatus === 'loading' ? 'Checking' : (cookMorningStatus === 'done' ? 'Ready' : 'Pending')}
                            </div>
                        )}
                    </div>
                    <div className={`flex items-center justify-between p-3 rounded-xl ${isNightCookTime ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'bg-slate-50'}`}>
                        <div className="flex gap-3">
                            <Moon size={18} className={isNightCookTime ? "text-indigo-600" : "text-slate-400"} />
                            <div className="text-sm">
                                <p className="font-medium">Night</p>
                                <p className="text-[10px] text-slate-500">8:00 PM - 11:00 PM</p>
                            </div>
                        </div>
                        {(isCook || isHandler) && !isGuest ? (
                            <TaskButton onClick={() => toggleTask('cook-night')} className={`w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-[0.98] ${cookNightStatus === 'done' ? 'bg-emerald-500 text-white' : 'bg-white border border-slate-200 text-slate-300'}`}><CheckCircle2 size={20} /></TaskButton>
                        ) : (
                            <div className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${cookNightStatus === 'done' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                                {cookNightStatus === 'loading' ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : (cookNightStatus === 'done' ? <Utensils size={14} /> : <Clock size={14} />)}
                                {cookNightStatus === 'loading' ? 'Checking' : (cookNightStatus === 'done' ? 'Ready' : 'Pending')}
                            </div>
                        )}
                    </div>
                </Card>

                <Card className="border-l-4 border-l-cyan-500">
                    <div className="p-4">
                        <h2 className="text-sm font-semibold text-slate-600 flex items-center gap-2 mb-3"><Droplets size={16} className="text-cyan-500" /> Dishes</h2>
                        <div className={`flex items-center justify-between p-3 rounded-xl mb-2 transition-colors ${currentHour >= TIME_WINDOWS.dishMorning.start && currentHour < TIME_WINDOWS.dishMorning.end ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'bg-slate-50 opacity-80'}`}>
                            <div className="flex items-center gap-3">
                                <div className={currentHour >= TIME_WINDOWS.dishMorning.start && currentHour < TIME_WINDOWS.dishMorning.end ? "text-cyan-600" : "text-slate-400"}><Sun size={16} /></div>
                                <div>
                                    <p className="text-sm font-medium text-slate-700">Morning</p>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        {dailySchedule.morningDish?.map(id => {
                                            const m = members.find(mem => mem.id === id);
                                            const isExempt = exemptMembers.includes(id);
                                            return (
                                                <div key={id} className={`flex items-center gap-1 bg-slate-100 rounded-full pr-2 ${isExempt ? 'opacity-40 grayscale' : ''}`}>
                                                    <div className="relative">
                                                        <MemberAvatar size="sm" className="w-6 h-6 text-[10px]" member={m} />
                                                        {isExempt && <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full w-2 h-2 border border-white" />}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-600 truncate max-w-[50px]">{m?.name}</span>
                                                    {isExempt && <span className="text-[8px] font-black text-amber-600 ml-1">SKIP</span>}
                                                </div>
                                            );
                                        })}
                                        <span className="text-[10px] text-slate-400 ml-1">7:00 AM - 12:00 PM</span>
                                    </div>
                                </div>
                            </div>
                            {!isGuest && (dailySchedule.morningDish?.includes(currentUser.id) || isHandler) ? (
                                <TaskButton onClick={() => toggleTask('dish-morning')} className={`p-2 rounded-full transition-colors ${getTaskStatus('dish-morning') === 'done' ? 'bg-emerald-500 text-white' : 'bg-slate-100 border border-slate-200 text-slate-300'}`}><CheckCircle2 size={20} /></TaskButton>
                            ) : (
                                <div className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 text-right transition-colors ${getTaskStatus('dish-morning') === 'done' ? (currentUser.role === 'Cook' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700') : 'bg-slate-200 text-slate-500'}`}>
                                    {getTaskStatus('dish-morning') === 'done' ? <Droplets size={14} /> : <Clock size={14} />}
                                    <span className="leading-tight max-w-[100px]">{getTaskStatus('dish-morning') === 'done' ? (currentUser.role === 'Cook' ? "Dishes washed. Prep Food!" : "Dishes Washed") : "Not Washed"}</span>
                                </div>
                            )}
                        </div>
                        <div className="my-2 border-b border-slate-100"></div>
                        <div className={`flex items-center justify-between p-3 rounded-xl mb-2 transition-colors ${currentHour >= TIME_WINDOWS.dishNight.start && currentHour < TIME_WINDOWS.dishNight.end ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'bg-slate-50 opacity-80'}`}>
                            <div className="flex items-center gap-3">
                                <div className={currentHour >= TIME_WINDOWS.dishNight.start && currentHour < TIME_WINDOWS.dishNight.end ? "text-cyan-600" : "text-slate-400"}><Moon size={16} /></div>
                                <div>
                                    <p className="text-sm font-medium text-slate-700">Night</p>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        {dailySchedule.nightDish?.map(id => {
                                            const m = members.find(mem => mem.id === id);
                                            const isExempt = exemptMembers.includes(id);
                                            return (
                                                <div key={id} className={`flex items-center gap-1 bg-slate-100 rounded-full pr-2 ${isExempt ? 'opacity-40 grayscale' : ''}`}>
                                                    <div className="relative">
                                                        <MemberAvatar size="sm" className="w-6 h-6 text-[10px]" member={m} />
                                                        {isExempt && <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full w-2 h-2 border border-white" />}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-600 truncate max-w-[50px]">{m?.name}</span>
                                                    {isExempt && <span className="text-[8px] font-black text-amber-600 ml-1">SKIP</span>}
                                                </div>
                                            );
                                        })}
                                        <span className="text-[10px] text-slate-400 ml-1">5:00 PM - 10:00 PM</span>
                                    </div>
                                </div>
                            </div>
                            {!isGuest && (dailySchedule.nightDish?.includes(currentUser.id) || isHandler) ? (
                                <TaskButton onClick={() => toggleTask('dish-night')} className={`p-2 rounded-full transition-colors ${getTaskStatus('dish-night') === 'done' ? 'bg-emerald-500 text-white' : 'bg-slate-100 border border-slate-200 text-slate-300'}`}><CheckCircle2 size={20} /></TaskButton>
                            ) : (
                                <div className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 text-right transition-colors ${getTaskStatus('dish-night') === 'done' ? (currentUser.role === 'Cook' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700') : 'bg-slate-200 text-slate-500'}`}>
                                    {getTaskStatus('dish-night') === 'done' ? <Droplets size={14} /> : <Clock size={14} />}
                                    <span className="leading-tight max-w-[100px]">{getTaskStatus('dish-night') === 'done' ? (currentUser.role === 'Cook' ? "Dishes washed. Prep Food!" : "Dishes Washed") : "Not Washed"}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                    <Card className={`p-4 ${recentlyUpdatedFields.includes('schedule') ? 'ring-2 ring-indigo-400/40 transition-shadow duration-500' : ''}`}>
                        <h2 className="font-bold flex items-center gap-2 text-theme mb-2"><CheckCircle2 size={18} className="text-emerald-500" /> Cleaning</h2>
                        <div className="flex -space-x-2 overflow-hidden mb-2">
                            {dailySchedule.cleaning?.map(id => {
                                const m = members.find(mem => mem.id === id);
                                const isExempt = exemptMembers.includes(id);
                                return (
                                    <div key={id} className="relative">
                                        <MemberAvatar name={m?.name} code={m?.avatar} className={isExempt ? 'opacity-40 grayscale' : ''} />
                                        {isExempt && <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full w-3 h-3 border-2 border-white" />}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="text-xs text-muted mb-2">
                            {dailySchedule.cleaning?.map(id => {
                                const m = members.find(mem => mem.id === id);
                                return exemptMembers.includes(id) ? <span key={id} className="opacity-50 line-through mr-1">{m?.name}</span> : <span key={id} className="mr-1">{m?.name}</span>;
                            })}
                        </div>
                        {!isGuest && (dailySchedule.cleaning?.includes(currentUser.id) || isHandler) ? <ActionButton onClick={() => toggleTask('cleaning')} done={getTaskStatus('cleaning') === 'done'} label="Mark Clean" /> : <StatusIndicator status={getTaskStatus('cleaning')} text={true} />}
                    </Card>

                    <Card className={`border-l-4 border-l-amber-500 p-4 ${recentlyUpdatedFields.includes('schedule') ? 'ring-2 ring-indigo-400/40 transition-shadow duration-500' : ''}`}>
                        <h2 className="font-bold flex items-center gap-2 text-theme mb-2"><ShoppingCart size={18} className="text-amber-500" /> Market</h2>
                        {dailySchedule.market && dailySchedule.market.length > 0 ? (
                            <>
                                <div className="flex -space-x-2 overflow-hidden mb-2">
                                    {dailySchedule.market?.map(id => {
                                        const m = members.find(mem => mem.id === id);
                                        const isExempt = exemptMembers.includes(id);
                                        return (
                                            <div key={id} className="relative">
                                                <MemberAvatar name={m?.name} code={m?.avatar} className={isExempt ? 'opacity-40 grayscale' : ''} />
                                                {isExempt && <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full w-3 h-3 border-2 border-white" />}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="text-xs text-muted mb-2">
                                    {dailySchedule.market?.map(id => {
                                        const m = members.find(mem => mem.id === id);
                                        return exemptMembers.includes(id) ? <span key={id} className="opacity-50 line-through mr-1">{m?.name}</span> : <span key={id} className="mr-1">{m?.name}</span>;
                                    })}
                                </div>
                                {!isGuest && (dailySchedule.market?.includes(currentUser.id) || isHandler) ? <ActionButton onClick={() => toggleTask('market')} done={getTaskStatus('market') === 'done'} label="Bought" /> : <StatusIndicator status={getTaskStatus('market')} text={true} />}
                            </>
                        ) : <div className="text-xs text-muted mt-4">No Market Duty</div>}
                    </Card>
                </div>

                {roomMetadata?.updatedAt && (
                    <div className="flex justify-center pb-4">
                        <button onClick={setShowChangeLog} className="text-[10px] text-slate-400 font-medium">
                            Last updated by {roomMetadata.updatedBy} · {new Date(roomMetadata.updatedAt.seconds * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardView;

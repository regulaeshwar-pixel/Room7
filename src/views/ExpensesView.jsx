import React, { useState, useEffect } from 'react';
import {
    Leaf,
    Minus,
    ShoppingCart,
    Trash2,
    X,
    Plus,
    CheckCircle2,
    AlertTriangle,
    Clock,
    Edit2,
    Ban
} from 'lucide-react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import MemberAvatar from '../components/MemberAvatar';
import { formatCurrency } from '../utils/helpers';
import { CATEGORY_GROCERIES, CATEGORY_VEGETABLES } from '../constants/notifications';
import { haptic } from '../utils/haptics';

const ExpensesView = ({
    expenses,
    vegExpenses,
    vegCollections,
    vegExemptions,
    expectedAmounts,
    setExpectedAmounts,
    currentUser,
    members,
    vegHandlerId,
    addGeneralExpense,
    addVegCollection,
    toggleVegExemption,
    addVegExpense,
    deleteTransaction,
    resetMonth,
    isGuest
}) => {
    const [showGenModal, setShowGenModal] = useState(false);
    const [genAmount, setGenAmount] = useState('');
    const [genNote, setGenNote] = useState('');
    const [showVegAddModal, setShowVegAddModal] = useState(false);
    const [showVegExpModal, setShowVegExpModal] = useState(false);
    const [showEditAmountModal, setShowEditAmountModal] = useState(false);
    const [vegAmount, setVegAmount] = useState('');
    const [vegNote, setVegNote] = useState('');
    const [vegFromId, setVegFromId] = useState(members.length > 0 ? members[0].id : '');
    const [vegCategory, setVegCategory] = useState(CATEGORY_GROCERIES);
    const [editingCategory, setEditingCategory] = useState(null);
    const [newExpectedAmount, setNewExpectedAmount] = useState('');

    const isHandler = currentUser.id === vegHandlerId;
    const canReset = currentUser.role === 'Cook' || currentUser.id === vegHandlerId;

    const groceriesGiven = vegCollections.filter(c => c.category === CATEGORY_GROCERIES).reduce((sum, c) => sum + c.amount, 0);
    const groceriesExpenses = vegExpenses.filter(e => e.category === CATEGORY_GROCERIES).reduce((sum, e) => sum + e.amount, 0);
    const groceriesBalance = groceriesGiven - groceriesExpenses;

    const vegOnlyGiven = vegCollections.filter(c => c.category === CATEGORY_VEGETABLES).reduce((sum, c) => sum + c.amount, 0);
    const vegOnlyExpenses = vegExpenses.filter(e => e.category === CATEGORY_VEGETABLES).reduce((sum, e) => sum + e.amount, 0);
    const vegOnlyBalance = vegOnlyGiven - vegOnlyExpenses;

    const totalGeneralExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalMonthlyExpenses = totalGeneralExpenses + groceriesExpenses + vegOnlyExpenses;

    const handleGenSubmit = (e) => {
        e.preventDefault();
        haptic.success();
        addGeneralExpense(genAmount, genNote);
        setShowGenModal(false);
        setGenAmount('');
        setGenNote('');
    };

    const handleVegAddSubmit = (e) => {
        e.preventDefault();
        haptic.success();
        addVegCollection(vegAmount, vegFromId, vegCategory);
        setShowVegAddModal(false);
        setVegAmount('');
    };

    const handleCancelToggle = () => {
        toggleVegExemption(vegFromId, vegCategory);
    };

    const handleVegExpSubmit = (e) => {
        e.preventDefault();
        haptic.success();
        addVegExpense(vegAmount, vegNote, vegCategory);
        setShowVegExpModal(false);
        setVegAmount('');
        setVegNote('');
    };

    const handleEditAmountSubmit = (e) => {
        e.preventDefault();
        setExpectedAmounts(prev => ({ ...prev, [editingCategory]: parseFloat(newExpectedAmount) }));
        setShowEditAmountModal(false);
    };

    const getMemberStatus = React.useCallback((memberId, category) => {
        if (vegExemptions.includes(`${memberId}-${category}`)) return { status: 'cancelled', paid: 0, remaining: 0 };
        const paid = vegCollections
            .filter(c => c.fromMemberId === memberId && (c.category === category || (!c.category && category === CATEGORY_VEGETABLES)))
            .reduce((sum, c) => sum + c.amount, 0);
        const expected = expectedAmounts[category];
        if (paid >= expected) return { status: 'full', paid, remaining: 0, excess: paid - expected };
        if (paid > 0) return { status: 'partial', paid, remaining: expected - paid };
        return { status: 'pending', paid: 0, remaining: expected };
    }, [vegExemptions, vegCollections, expectedAmounts]);

    useEffect(() => {
        if (showVegAddModal) {
            const { remaining } = getMemberStatus(vegFromId, vegCategory);
            setVegAmount(remaining > 0 ? remaining : '');
        }
    }, [vegFromId, vegCategory, showVegAddModal, getMemberStatus]);

    const handleEditClick = (memberId, category) => {
        setVegFromId(memberId);
        setVegCategory(category);
        setShowVegAddModal(true);
    };



    const renderCategoryList = (title, category) => {
        const expectedPerPerson = expectedAmounts[category];
        let totalReceived = 0;
        let totalPending = 0;

        const listItems = members.map(m => {
            const { status, paid, remaining } = getMemberStatus(m.id, category);
            if (status !== 'cancelled') {
                totalReceived += paid;
                totalPending += remaining;
            }
            if (expectedPerPerson === 0 && paid === 0) return null;

            return (
                <div key={m.id} className="flex items-center justify-between py-2 text-sm border-b border-slate-50 last:border-0 group/member transition-all duration-300">
                    <div className="flex items-center gap-4">
                        <MemberAvatar name={m.name} code={m.avatar} size="sm" className="w-8 h-8 ring-2 ring-white shadow-sm transition-transform group-hover/member:scale-110" />
                        <span className="font-black text-slate-800 tracking-tight">{m.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {status === 'cancelled' && (
                            <div className="flex items-center gap-1.5 text-orange-400 bg-orange-50/50 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                                <span>Cancelled</span>
                                <Ban size={12} strokeWidth={2.5} />
                            </div>
                        )}
                        {status === 'full' && (
                            <div className="flex items-center gap-2.5 text-emerald-600 font-black text-[13px] tracking-tight">
                                <span>{formatCurrency(paid)}</span>
                                <div className="p-1 bg-emerald-50 rounded-lg"><CheckCircle2 size={14} strokeWidth={3} /></div>
                            </div>
                        )}
                        {status === 'partial' && (
                            <div className="flex items-center gap-2 text-amber-600 font-black text-[13px] tracking-tight">
                                <div className="flex flex-col items-end">
                                    <span>{formatCurrency(paid)}</span>
                                    <span className="text-[10px] text-amber-500/70 font-black uppercase tracking-widest mt-0.5">rem {formatCurrency(remaining)}</span>
                                </div>
                                <div className="p-1 bg-amber-50 rounded-lg"><AlertTriangle size={14} strokeWidth={3} /></div>
                            </div>
                        )}
                        {status === 'pending' && (
                            <div className="flex items-center gap-2.5 text-slate-300 font-black text-[12px] tracking-tight">
                                <span>{formatCurrency(expectedPerPerson)}</span>
                                <div className="p-1 bg-slate-50 rounded-lg"><Clock size={14} strokeWidth={3} /></div>
                            </div>
                        )}
                        {isHandler && (
                            <button onClick={() => handleEditClick(m.id, category)} className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all active:scale-90">
                                <Edit2 size={14} />
                            </button>
                        )}
                    </div>
                </div>
            );
        });

        return (
            <div className="mb-6">
                <div className="flex items-center gap-4 mb-5">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 whitespace-nowrap">{title} Tasks</span>
                    <div className="h-[1px] bg-slate-100 flex-1"></div>
                    {isHandler && (
                        <button onClick={() => { setEditingCategory(category); setNewExpectedAmount(expectedAmounts[category]); setShowEditAmountModal(true); }} className="p-2 bg-slate-50/50 text-slate-300 hover:text-indigo-600 rounded-xl transition-all">
                            <Edit2 size={12} />
                        </button>
                    )}
                </div>
                <div className="space-y-1 mb-4">{listItems.filter(Boolean)}</div>
                <div className="bg-slate-50/50 backdrop-blur-sm rounded-[24px] p-5 flex justify-between items-center border border-slate-100/50">
                    <div>
                        <span className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Total Received</span>
                        <span className="font-black text-xl text-emerald-600 tracking-tight">{formatCurrency(totalReceived)}</span>
                    </div>
                    <div className="text-right">
                        <span className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Still Pending</span>
                        <span className="font-black text-xl text-amber-600 tracking-tight">{formatCurrency(totalPending)}</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="pb-32 bg-[#fafafa]">
            <header className="flex justify-between items-center bg-white/95 backdrop-blur-2xl p-4 sticky top-0 z-50 rounded-b-[28px] border-b border-slate-50 shadow-[0_10px_40px_rgba(0,0,0,0.02)] pt-[max(env(safe-area-inset-top),1rem)]">
                <div>
                    <h1 className="text-[20px] font-black text-slate-900 tracking-[0.4em] uppercase drop-shadow-sm flex items-center leading-none">ROOM<span className="italic ml-1 text-xl font-black text-indigo-600/90">-7</span></h1>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                        <Leaf size={12} strokeWidth={2.5} className="text-emerald-400/60" />
                        Monthly Expenses
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative cursor-pointer transition-transform hover:scale-105" onClick={() => document.querySelector('[aria-label="Profile"]')?.click()}>
                        <MemberAvatar name={currentUser.name} code={currentUser.avatar} className="ring-2 ring-slate-100 shadow-sm" />
                    </div>
                </div>
            </header>

            <div className="p-4 space-y-4">
                <div className="relative overflow-hidden rounded-[28px] bg-white shadow-[0_8px_40px_rgba(0,0,0,0.03)] border border-slate-100/50 p-5 text-slate-900 group transition-all duration-1000">
                    {/* ELITE MESH GRADIENT LAYER */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-[0.6]">
                        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] rounded-full bg-indigo-100/40 blur-[100px] animate-mesh-1 mix-blend-multiply"></div>
                        <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-violet-100/40 blur-[100px] animate-mesh-2 mix-blend-multiply"></div>
                        <div className="absolute top-[20%] right-[10%] w-[60%] h-[60%] rounded-full bg-blue-50/50 blur-[100px] animate-mesh-3 mix-blend-multiply"></div>
                    </div>

                    <div className="relative z-10 text-center">
                        <div className="mb-4 inline-block rounded-full bg-white/40 backdrop-blur-2xl border border-white/80 px-4 py-1.5 shadow-[inset_0_1px_5px_rgba(255,255,255,0.8),0_2px_10px_rgba(0,0,0,0.02)]">
                            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400">Monthly Budget</span>
                        </div>
                        <h2 className="text-[36px] font-black tracking-[-0.04em] mb-2 leading-none text-slate-900 drop-shadow-sm">{formatCurrency(totalMonthlyExpenses)}</h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 opacity-70 flex items-center justify-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                            Total Fund
                        </p>

                        {!isGuest && (
                            <button
                                onClick={() => setShowGenModal(true)}
                                className="mx-auto px-6 py-3 bg-slate-900 text-white rounded-[20px] font-black text-[10px] tracking-[0.3em] uppercase shadow-[0_10px_25px_rgba(15,23,42,0.15)] flex items-center justify-center gap-2 hover:shadow-[0_15px_35px_rgba(15,23,42,0.25)] hover:translate-y-[-2px] transition-all duration-300 active:translate-y-[1px]"
                            >
                                <Plus size={16} strokeWidth={3} /> Add Expense
                            </button>
                        )}
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2 italic uppercase"><ShoppingCart size={18} className="text-emerald-500" strokeWidth={2.5} /> General</h3>
                        {vegHandlerId ? <Badge variant="success" className="bg-emerald-500/5 text-emerald-600 border-none px-3 py-1 text-[9px] font-black tracking-widest uppercase">Verified</Badge> : <Badge variant="warning">No Handler</Badge>}
                    </div>

                    <Card className="p-5 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-slate-100/50 overflow-hidden relative">
                        {/* Subtle Background Glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/40 blur-[60px] rounded-full pointer-events-none -mr-10 -mt-10"></div>

                        {(() => {
                            const grocPercent = groceriesGiven > 0 ? Math.min(100, Math.round((groceriesExpenses / groceriesGiven) * 100)) : 0;
                            return (
                                <>
                                    <div className="flex justify-between items-start mb-6 relative z-10">
                                        <div>
                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em] mb-2">Balance</p>
                                            <p className={`font-black tracking-[-0.03em] text-[28px] leading-none ${groceriesBalance < 0 ? 'text-rose-500' : 'text-slate-900'}`}>{formatCurrency(groceriesBalance)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em] mb-2">Spent</p>
                                            <p className="font-black text-slate-700 text-base leading-none">{formatCurrency(groceriesExpenses)} <span className="text-slate-300 text-xs font-black uppercase tracking-widest ml-1">/ {formatCurrency(groceriesGiven)}</span></p>
                                        </div>
                                    </div>

                                    <div className="mb-8 relative z-10">
                                        <div className="flex justify-between text-[9px] font-black text-slate-400 mb-2 uppercase tracking-[0.3em]">
                                            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> Budget Used</span>
                                            <span className="text-slate-900">{grocPercent}%</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-slate-50 overflow-hidden relative border border-slate-100 shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)]">
                                            <div className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-emerald-400 to-indigo-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(52,211,153,0.3)]" style={{ width: `${grocPercent}%` }} />
                                        </div>
                                    </div>
                                </>
                            );
                        })()}

                        {renderCategoryList('Groceries', CATEGORY_GROCERIES)}
                        {isHandler && !isGuest && (
                            <div className="mt-6 pt-5 border-t border-slate-100">
                                <button onClick={() => { setVegCategory(CATEGORY_GROCERIES); setShowVegExpModal(true); }} className="w-full py-3 bg-white border border-slate-100 text-rose-500 rounded-[20px] font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:bg-rose-50 hover:border-rose-100 transition-all duration-300 shadow-sm active:scale-95"><Minus size={14} strokeWidth={3} /> Add Expense</button>
                            </div>
                        )}
                    </Card>

                    <div className="flex items-center justify-between px-2 mt-6">
                        <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2 italic uppercase"><Leaf size={18} className="text-emerald-500" strokeWidth={2.5} /> Organic</h3>
                    </div>
                    <Card className="p-5 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-slate-100/50 overflow-hidden relative">
                        {/* Subtle Background Glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50/40 blur-[60px] rounded-full pointer-events-none -mr-10 -mt-10"></div>

                        {(() => {
                            const vegPercent = vegOnlyGiven > 0 ? Math.min(100, Math.round((vegOnlyExpenses / vegOnlyGiven) * 100)) : 0;
                            return (
                                <>
                                    <div className="flex justify-between items-start mb-6 relative z-10">
                                        <div>
                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em] mb-2">Balance</p>
                                            <p className={`font-black tracking-[-0.03em] text-[28px] leading-none ${vegOnlyBalance < 0 ? 'text-rose-500' : 'text-slate-900'}`}>{formatCurrency(vegOnlyBalance)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em] mb-2">Spent</p>
                                            <p className="font-black text-slate-700 text-base leading-none">{formatCurrency(vegOnlyExpenses)} <span className="text-slate-300 text-xs font-black uppercase tracking-widest ml-1">/ {formatCurrency(vegOnlyGiven)}</span></p>
                                        </div>
                                    </div>

                                    <div className="mb-8 relative z-10">
                                        <div className="flex justify-between text-[9px] font-black text-slate-400 mb-2 uppercase tracking-[0.3em]">
                                            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-400"></div> Used</span>
                                            <span className="text-slate-900">{vegPercent}%</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-slate-50 overflow-hidden relative border border-slate-100 shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)]">
                                            <div className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(251,191,36,0.3)]" style={{ width: `${vegPercent}%` }} />
                                        </div>
                                    </div>
                                </>
                            );
                        })()}

                        {renderCategoryList('Vegetables', CATEGORY_VEGETABLES)}
                        {isHandler && !isGuest && (
                            <div className="mt-6 pt-5 border-t border-slate-100">
                                <button onClick={() => { setVegCategory(CATEGORY_VEGETABLES); setShowVegExpModal(true); }} className="w-full py-3 bg-white border border-slate-100 text-rose-500 rounded-[20px] font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:bg-rose-50 hover:border-rose-100 transition-all duration-300 shadow-sm active:scale-95"><Minus size={14} strokeWidth={3} /> Add Expense</button>
                            </div>
                        )}
                    </Card>
                </div>

                <div className="bg-white rounded-[24px] shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-slate-100/50 overflow-hidden">
                    <div className="p-4 border-b border-slate-50 font-black text-slate-400 text-[9px] uppercase tracking-[0.4em]">Recent History (15)</div>
                    {expenses.length === 0 && vegExpenses.length === 0 && vegCollections.length === 0 ? <div className="p-8 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest italic">No transactions recorded.</div> : (
                        <div className="divide-y divide-slate-50 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                            {[
                                ...expenses.map(e => ({ ...e, type: 'general', collection: 'expenses', date: new Date(e.date) })),
                                ...vegExpenses.map(e => ({ ...e, type: 'vegExp', collection: 'vegExpenses', date: new Date(e.date) })),
                                ...vegCollections.map(e => ({ ...e, type: 'vegCol', collection: 'vegCollections', date: new Date(e.date) }))
                            ].sort((a, b) => b.date - a.date).slice(0, 15).map(t => {

                                const canDelete = !isGuest; // HOTFIX: Allow all to delete

                                return (
                                    <div key={t.id} className="p-4 flex justify-between items-center group/tx hover:bg-slate-50/50 transition-all duration-300">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center transition-all duration-500 shadow-sm ${t.type === 'general' ? 'bg-indigo-50 text-indigo-500' : t.type === 'vegExp' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                                {t.type === 'general' ? <ShoppingCart size={18} strokeWidth={2.5} /> : t.type === 'vegExp' ? <Minus size={18} strokeWidth={3} /> : <Plus size={18} strokeWidth={3} />}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-800 text-[13px] tracking-tight mb-1">
                                                    {t.type === 'general' ? (t.notes || 'General Expense') :
                                                        t.type === 'vegExp' ? (t.desc || 'Veg Expense') :
                                                            'Fund Contribution'}
                                                </p>
                                                <div className="flex items-center gap-2.5 text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">
                                                    <span className="text-indigo-400/80">
                                                        {t.type === 'general' ? (members.find(m => m.id === t.paidBy)?.name || 'Member') :
                                                            t.type === 'vegExp' ? 'Monthly Fund' :
                                                                (members.find(m => m.id === t.fromMemberId)?.name || 'Member')}
                                                    </span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                                    <span>{t.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`font-black text-sm tracking-tight ${t.type === 'vegCol' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                {t.type === 'vegCol' ? '+' : '-'}{formatCurrency(t.amount)}
                                            </span>
                                            {canDelete && (
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm("Purge this record?")) {
                                                            haptic.medium();
                                                            deleteTransaction(t.collection, t.id);
                                                        }
                                                    }}
                                                    className="p-2 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all md:opacity-0 group-hover/tx:opacity-100"
                                                    title="Purge"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="pt-4">
                    {canReset && !isGuest ? (
                        <button onClick={() => { haptic.medium(); resetMonth(); }} className="w-full py-4 text-slate-400 hover:text-rose-500 font-black text-[10px] uppercase tracking-[0.4em] flex justify-center items-center gap-2 hover:bg-rose-50/50 rounded-[24px] border border-transparent hover:border-rose-100 transition-all duration-500"><Trash2 size={14} /> Start New Month</button>
                    ) : <div className="text-center text-[9px] font-black text-slate-300 p-2 uppercase tracking-[0.3em]">{isGuest ? 'Authentication required for management.' : 'Authorized personnel only.'}</div>}
                </div>
            </div>

            {showGenModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 sm:p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-[28px] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-slate-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-3"><div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl"><Plus size={18} strokeWidth={3} /></div> Add Expense</h2>
                            <button onClick={() => setShowGenModal(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-300"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleGenSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 ml-1">Amount (₹)</label>
                                <input type="number" required value={genAmount} onChange={e => setGenAmount(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-[20px] font-black text-xl tracking-tight focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none" placeholder="0.00" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 ml-1">Notes</label>
                                <input type="text" value={genNote} onChange={e => setGenNote(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-[20px] font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none" placeholder="Description of expense" />
                            </div>
                            <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-[20px] font-black text-[10px] uppercase tracking-[0.3em] shadow-[0_10px_25px_rgba(15,23,42,0.15)] hover:shadow-[0_15px_35px_rgba(15,23,42,0.25)] transition-all active:scale-95">Save Expense</button>
                        </form>
                    </div>
                </div>
            )}

            {showVegAddModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 sm:p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-[38px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-slate-100">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-black text-emerald-800 tracking-tight flex items-center gap-3"><div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl"><Plus size={20} strokeWidth={3} /></div> Add Funds</h2>
                            <button onClick={() => setShowVegAddModal(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-300"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleVegAddSubmit} className="space-y-6">
                            <div className="flex bg-slate-100/50 p-1.5 rounded-[22px] border border-slate-100">
                                <button type="button" onClick={() => setVegCategory(CATEGORY_GROCERIES)} className={`flex-1 py-3 rounded-[16px] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${vegCategory === CATEGORY_GROCERIES ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-400'}`}>Groceries</button>
                                <button type="button" onClick={() => setVegCategory(CATEGORY_VEGETABLES)} className={`flex-1 py-3 rounded-[16px] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${vegCategory === CATEGORY_VEGETABLES ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-400'}`}>Organic</button>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 ml-1">Authorized Person</label>
                                {isHandler ? (
                                    <div className="flex gap-3 overflow-x-auto pb-3 no-scrollbar">
                                        {members.map(m => (
                                            <button type="button" key={m.id} onClick={() => setVegFromId(m.id)} className={`flex-shrink-0 px-5 py-3 rounded-[18px] border text-[11px] font-black tracking-tight transition-all flex items-center gap-2 group/btn ${vegFromId === m.id ? 'bg-emerald-600 text-white border-emerald-600 shadow-[0_4px_15px_rgba(16,185,129,0.3)]' : 'bg-white border-slate-100 text-slate-500 hover:border-emerald-200'}`}>
                                                <MemberAvatar name={m.name} code={m.avatar} size="xs" className={`transition-transform duration-500 ${vegFromId === m.id ? 'ring-2 ring-emerald-400/50' : ''}`} />
                                                {m.name}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-[22px] text-sm font-black text-slate-600 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <MemberAvatar name={currentUser.name} code={currentUser.avatar} size="sm" />
                                            <span>{currentUser.name} <span className="text-slate-300 font-medium ml-1">(Me)</span></span>
                                        </div>
                                        <Badge className="bg-indigo-50 text-indigo-500 border-none px-3 font-black text-[9px]">ACTIVE</Badge>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 ml-1">Amount (₹)</label>
                                <input type="number" required value={vegAmount} onChange={e => setVegAmount(e.target.value)} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[22px] font-black text-2xl tracking-tight focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none" placeholder="0.00" />
                            </div>

                            {isHandler && (
                                <div className="flex items-center justify-between p-5 bg-orange-50/30 rounded-[22px] border border-orange-100/30">
                                    <span className="text-[10px] text-orange-400 font-black uppercase tracking-[0.2em]">Skip payment?</span>
                                    <button type="button" onClick={handleCancelToggle} className={`text-[10px] font-black uppercase tracking-[0.3em] px-4 py-2.5 rounded-[14px] border transition-all ${vegExemptions.includes(`${vegFromId}-${vegCategory}`) ? 'bg-orange-500 border-orange-500 text-white shadow-lg' : 'bg-white border-orange-100 text-orange-300'}`}>
                                        {vegExemptions.includes(`${vegFromId}-${vegCategory}`) ? 'Exempt' : 'Hold'}
                                    </button>
                                </div>
                            )}
                            <button type="submit" className="w-full bg-emerald-600 text-white py-5 rounded-[22px] font-black text-[11px] uppercase tracking-[0.3em] shadow-[0_10px_25px_rgba(16,185,129,0.2)] hover:shadow-[0_15px_35px_rgba(16,185,129,0.3)] transition-all active:scale-95">Authorize Payment</button>
                        </form>
                    </div>
                </div>
            )}

            {showVegExpModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-[38px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-slate-100">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-black text-rose-800 tracking-tight flex items-center gap-3"><div className="p-2 bg-rose-50 text-rose-500 rounded-xl"><Minus size={20} strokeWidth={3} /></div> Record Expense</h2>
                            <button onClick={() => setShowVegExpModal(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-300"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleVegExpSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 ml-1">Amount (₹)</label>
                                <input type="number" required value={vegAmount} onChange={e => setVegAmount(e.target.value)} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[22px] font-black text-2xl tracking-tight focus:ring-4 focus:ring-rose-500/5 transition-all outline-none" placeholder="0.00" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 ml-1">Items Purchased</label>
                                <input type="text" value={vegNote} onChange={e => setVegNote(e.target.value)} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[22px] font-bold text-slate-700 focus:ring-4 focus:ring-rose-500/5 transition-all outline-none" placeholder="What was purchased?" />
                            </div>
                            <button type="submit" className="w-full bg-rose-600 text-white py-5 rounded-[22px] font-black text-[11px] uppercase tracking-[0.3em] shadow-[0_10px_25px_rgba(225,29,72,0.2)] hover:shadow-[0_15px_35px_rgba(225,29,72,0.3)] transition-all active:scale-95">Save Expense</button>
                        </form>
                    </div>
                </div>
            )}

            {showEditAmountModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-[38px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-slate-100">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic"><div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl"><Edit2 size={20} strokeWidth={3} /></div> Set Monthly Goal</h2>
                            <button onClick={() => setShowEditAmountModal(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-300"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleEditAmountSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 ml-1">Goal for {editingCategory} (₹)</label>
                                <input type="number" required value={newExpectedAmount} onChange={e => setNewExpectedAmount(e.target.value)} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[22px] font-black text-2xl tracking-tight focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none" placeholder="0.00" />
                            </div>
                            <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-[22px] font-black text-[11px] uppercase tracking-[0.3em] shadow-[0_10px_25px_rgba(15,23,42,0.15)] hover:shadow-[0_15px_35px_rgba(15,23,42,0.25)] transition-all active:scale-95">Save Goal</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpensesView;

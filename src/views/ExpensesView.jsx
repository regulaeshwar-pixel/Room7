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
    triggerAlert,
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

    const totalVegGiven = vegCollections.reduce((sum, c) => sum + c.amount, 0);
    const totalVegExpenses = vegExpenses.reduce((sum, e) => sum + e.amount, 0);
    const vegBalance = totalVegGiven - totalVegExpenses;
    const totalGeneralExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalMonthlyExpenses = totalGeneralExpenses + totalVegExpenses;

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
        addVegExpense(vegAmount, vegNote);
        setShowVegExpModal(false);
        setVegAmount('');
        setVegNote('');
    };

    const handleEditAmountSubmit = (e) => {
        e.preventDefault();
        setExpectedAmounts(prev => ({ ...prev, [editingCategory]: parseFloat(newExpectedAmount) }));
        setShowEditAmountModal(false);
        triggerAlert(`Default amount for ${editingCategory} updated`, "success");
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
            return (
                <div key={m.id} className="flex items-center justify-between py-2 text-sm">
                    <div className="flex items-center gap-3">
                        <MemberAvatar name={m.name} code={m.avatar} size="sm" />
                        <span className="font-medium text-slate-700">{m.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {status === 'cancelled' && (
                            <div className="flex items-center gap-1 text-orange-500 bg-orange-50 px-2 py-0.5 rounded text-xs font-bold">
                                <span>Cancelled</span>
                                <Ban size={14} />
                            </div>
                        )}
                        {status === 'full' && (
                            <div className="flex items-center gap-2 text-emerald-600 font-bold">
                                <span>{formatCurrency(paid)}</span>
                                <CheckCircle2 size={16} />
                            </div>
                        )}
                        {status === 'partial' && (
                            <div className="flex items-center gap-2 text-amber-600 font-bold">
                                <span>{formatCurrency(paid)}</span>
                                <span className="text-[10px] bg-amber-50 px-1 rounded text-amber-500 font-normal">rem {formatCurrency(remaining)}</span>
                                <AlertTriangle size={16} />
                            </div>
                        )}
                        {status === 'pending' && (
                            <div className="flex items-center gap-2 text-slate-400">
                                <span className="text-xs">{formatCurrency(expectedPerPerson)}</span>
                                <Clock size={16} />
                            </div>
                        )}
                        {isHandler && (
                            <button onClick={() => handleEditClick(m.id, category)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                                <Edit2 size={14} />
                            </button>
                        )}
                    </div>
                </div>
            );
        });

        return (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <div className="h-px bg-slate-200 flex-1"></div>
                    <div className="flex items-center gap-1">
                        <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">{title}</h4>
                        {isHandler && (
                            <button onClick={() => { setEditingCategory(category); setNewExpectedAmount(expectedAmounts[category]); setShowEditAmountModal(true); }} className="text-slate-400 hover:text-indigo-600 p-1 rounded hover:bg-indigo-50">
                                <Edit2 size={10} />
                            </button>
                        )}
                    </div>
                    <div className="h-px bg-slate-200 flex-1"></div>
                </div>
                <div className="divide-y divide-slate-100 mb-3">{listItems}</div>
                <div className="bg-white/50 rounded-lg p-2 flex justify-between text-xs border border-emerald-100/50">
                    <div className="text-emerald-700">
                        <span className="block opacity-70 uppercase text-[10px]">Received</span>
                        <span className="font-bold text-sm">{formatCurrency(totalReceived)}</span>
                    </div>
                    <div className="text-slate-500 text-right">
                        <span className="block opacity-70 uppercase text-[10px]">Pending</span>
                        <span className="font-bold text-sm text-amber-600">{formatCurrency(totalPending)}</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="pb-8 bg-slate-50">
            <header className="bg-white p-4 sticky top-0 z-10 shadow-sm flex justify-between items-center">
                <h1 className="text-xl font-bold text-theme">Expenses</h1>
                {!isGuest && <button onClick={() => { setVegFromId(currentUser.id); setShowVegAddModal(true); }} className="bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:bg-indigo-700"><Plus size={24} /></button>}
            </header>

            <div className="p-4 space-y-6">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 p-8 text-white shadow-xl">
                    <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl"></div>
                    <div className="relative z-10 text-center">
                        <div className="mb-4 inline-block rounded-full bg-white/20 px-4 py-1.5 backdrop-blur-md border border-white/10"><span className="text-[10px] font-bold uppercase tracking-widest text-indigo-50">Total Monthly Pool</span></div>
                        <h2 className="text-5xl font-black tracking-tight mb-2 drop-shadow-sm">{formatCurrency(totalMonthlyExpenses)}</h2>
                        <p className="text-xs text-indigo-200 mb-6">Includes Veg Fund Expenses</p>

                        {!isGuest && (
                            <button
                                onClick={() => setShowGenModal(true)}
                                className="mx-auto px-5 py-2.5 bg-white text-indigo-600 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 hover:bg-indigo-50 transition-all active:scale-95"
                            >
                                <Plus size={18} /> Add General Expense
                            </button>
                        )}
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2 px-1">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2"><Leaf size={18} className="text-emerald-500" /> Veg Fund</h3>
                        {vegHandlerId ? <Badge variant="success">Handler: {members.find(m => m.id === vegHandlerId)?.name}</Badge> : <Badge variant="warning">No Handler</Badge>}
                    </div>
                    <Card className="p-4 bg-emerald-50 border-emerald-100">
                        <div className="grid grid-cols-3 gap-2 text-center mb-6">
                            <div><p className="text-xs text-emerald-600 font-bold uppercase">Given</p><p className="font-bold text-theme">{formatCurrency(totalVegGiven)}</p></div>
                            <div><p className="text-xs text-rose-600 font-bold uppercase">Spent</p><p className="font-bold text-theme">{formatCurrency(totalVegExpenses)}</p></div>
                            <div><p className="text-xs text-blue-600 font-bold uppercase">Balance</p><p className={`font-black ${vegBalance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatCurrency(vegBalance)}</p></div>
                        </div>
                        {renderCategoryList('Groceries', CATEGORY_GROCERIES)}
                        {renderCategoryList('Vegetables', CATEGORY_VEGETABLES)}
                        {isHandler && !isGuest && (
                            <div className="mt-4 pt-4 border-t border-emerald-200/50">
                                <button onClick={() => setShowVegExpModal(true)} className="w-full py-2.5 bg-white border border-rose-200 text-rose-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-rose-50"><Minus size={16} /> Add Expense</button>
                            </div>
                        )}
                    </Card>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 font-bold text-slate-700">History</div>
                    {expenses.length === 0 && vegExpenses.length === 0 && vegCollections.length === 0 ? <div className="p-8 text-center text-slate-400">No transactions.</div> : (
                        <div className="divide-y divide-slate-100">
                            {[
                                ...expenses.map(e => ({ ...e, type: 'general', collection: 'expenses', date: new Date(e.date) })),
                                ...vegExpenses.map(e => ({ ...e, type: 'vegExp', collection: 'vegExpenses', date: new Date(e.date) })),
                                ...vegCollections.map(e => ({ ...e, type: 'vegCol', collection: 'vegCollections', date: new Date(e.date) }))
                            ].sort((a, b) => b.date - a.date).map(t => {

                                const canDelete = !isGuest; // HOTFIX: Allow all to delete

                                return (
                                    <div key={t.id} className="p-4 flex justify-between items-center group hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2.5 rounded-full ${t.type === 'general' ? 'bg-indigo-50 text-indigo-600' : t.type === 'vegExp' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                {t.type === 'general' ? <ShoppingCart size={18} /> : t.type === 'vegExp' ? <Minus size={18} /> : <Plus size={18} />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-theme text-sm">
                                                    {t.type === 'general' ? (t.notes || 'General Expense') :
                                                        t.type === 'vegExp' ? (t.desc || 'Veg Expense') :
                                                            'Veg Contribution'}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                                                    <span>
                                                        {t.type === 'general' ? members.find(m => m.id === t.paidBy)?.name :
                                                            t.type === 'vegExp' ? 'Veg Fund' :
                                                                members.find(m => m.id === t.fromMemberId)?.name}
                                                    </span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                    <span>{t.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`font-black text-sm ${t.type === 'vegCol' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                {t.type === 'vegCol' ? '+' : '-'}{formatCurrency(t.amount)}
                                            </span>
                                            {canDelete && (
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm("Delete this transaction?")) {
                                                            haptic.medium();
                                                            deleteTransaction(t.collection, t.id);
                                                        }
                                                    }}
                                                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {canReset && !isGuest ? (
                    <button onClick={() => { haptic.medium(); resetMonth(); }} className="w-full py-3 text-rose-600 font-medium text-sm flex justify-center items-center gap-2 hover:bg-rose-50 rounded-xl transition-colors"><Trash2 size={16} /> End Month & Reset All</button>
                ) : <div className="text-center text-xs text-slate-400 p-2 italic">{isGuest ? 'Log in to manage expenses.' : 'Only Cook or Veg Handler can reset.'}</div>}
            </div>

            {showGenModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl p-6">
                        <div className="flex justify-between items-center mb-4"><h2 className="font-bold">Add General Expense</h2><button onClick={() => setShowGenModal(false)}><X size={20} /></button></div>
                        <form onSubmit={handleGenSubmit} className="space-y-4">
                            <input type="number" required value={genAmount} onChange={e => setGenAmount(e.target.value)} className="w-full p-3 border rounded-xl" placeholder="Amount (₹)" />
                            <input type="text" value={genNote} onChange={e => setGenNote(e.target.value)} className="w-full p-3 border rounded-xl" placeholder="Description" />
                            <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold">Save</button>
                        </form>
                    </div>
                </div>
            )}

            {showVegAddModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl p-6">
                        <div className="flex justify-between items-center mb-4"><h2 className="font-bold text-emerald-800">Add Money</h2><button onClick={() => setShowVegAddModal(false)}><X size={20} /></button></div>
                        <form onSubmit={handleVegAddSubmit} className="space-y-4">
                            <div className="flex bg-slate-100 p-1 rounded-xl">
                                <button type="button" onClick={() => setVegCategory(CATEGORY_GROCERIES)} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${vegCategory === CATEGORY_GROCERIES ? 'bg-white shadow text-emerald-700' : 'text-slate-500'}`}>Groceries</button>
                                <button type="button" onClick={() => setVegCategory(CATEGORY_VEGETABLES)} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${vegCategory === CATEGORY_VEGETABLES ? 'bg-white shadow text-emerald-700' : 'text-slate-500'}`}>Vegetables</button>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">From</label>
                                {isHandler ? (
                                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                        {members.map(m => (
                                            <button type="button" key={m.id} onClick={() => setVegFromId(m.id)} className={`flex-shrink-0 px-3 py-2 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 ${vegFromId === m.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-slate-200'}`}>
                                                {vegFromId === m.id && <CheckCircle2 size={12} />}
                                                {m.name}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-3 bg-slate-50 border rounded-xl text-sm font-bold text-slate-600 flex items-center gap-2">
                                        <MemberAvatar name={currentUser.name} code={currentUser.avatar} size="sm" />
                                        {currentUser.name} (You)
                                    </div>
                                )}
                            </div>
                            <div className="relative">
                                <label className="block text-xs font-bold text-slate-500 mb-1">Amount to Add</label>
                                <input type="number" required value={vegAmount} onChange={e => setVegAmount(e.target.value)} className="w-full p-3 border rounded-xl font-mono font-bold text-lg" placeholder="Amount (₹)" />
                            </div>
                            {isHandler && (
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-xs text-slate-500 font-medium">Is this member cancelled for this month?</span>
                                    <button type="button" onClick={handleCancelToggle} className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${vegExemptions.includes(`${vegFromId}-${vegCategory}`) ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>
                                        {vegExemptions.includes(`${vegFromId}-${vegCategory}`) ? 'Cancelled' : 'Active'}
                                    </button>
                                </div>
                            )}
                            <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors">Record Payment</button>
                        </form>
                    </div>
                </div>
            )}

            {showVegExpModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl p-6">
                        <div className="flex justify-between items-center mb-4"><h2 className="font-bold text-rose-700">Add Veg Expense</h2><button onClick={() => setShowVegExpModal(false)}><X size={20} /></button></div>
                        <form onSubmit={handleVegExpSubmit} className="space-y-4">
                            <input type="number" required value={vegAmount} onChange={e => setVegAmount(e.target.value)} className="w-full p-3 border rounded-xl" placeholder="Cost (₹)" />
                            <input type="text" value={vegNote} onChange={e => setVegNote(e.target.value)} className="w-full p-3 border rounded-xl" placeholder="Items" />
                            <button type="submit" className="w-full bg-rose-600 text-white py-3 rounded-xl font-bold">Spend</button>
                        </form>
                    </div>
                </div>
            )}

            {showEditAmountModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-2xl p-6">
                        <div className="flex justify-between items-center mb-4"><h2 className="font-bold text-theme capitalize">Edit {editingCategory} Amount</h2><button onClick={() => setShowEditAmountModal(false)}><X size={20} /></button></div>
                        <form onSubmit={handleEditAmountSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Default Expected Amount</label>
                                <input type="number" required value={newExpectedAmount} onChange={e => setNewExpectedAmount(e.target.value)} className="w-full p-3 border rounded-xl font-mono font-bold text-lg" placeholder="Amount (₹)" />
                            </div>
                            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">Update Default</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpensesView;

import React, { useMemo } from 'react';
import { X, Calendar, DollarSign, Droplets, TrendingUp } from 'lucide-react';
import Card from '../components/Card';
import { formatCurrency } from '../utils/helpers';
import MemberAvatar from '../components/MemberAvatar';

const MonthlySummary = ({ members, waterPairs, expenses, onClose }) => {

    // --- HELPERS ---
    const isThisMonth = (dateString) => {
        if (!dateString) return false;
        const d = new Date(dateString);
        const now = new Date();
        return (
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear()
        );
    };

    // --- DERIVED DATA ---
    const summaryData = useMemo(() => {
        // 1. Duties Completed (Current Reset Cycle)
        const completedThisMonth = waterPairs.filter(p => p.status === 'done' && !p.archived);

        const dutiesByMember = members.map(m => ({
            ...m,
            completed: completedThisMonth.filter(p => p.members.includes(m.id)).length
        })).sort((a, b) => b.completed - a.completed); // Sort for readability, but UI will remain calm

        // 2. Expenses (This Month)
        const totalExpenses = expenses.filter(e => isThisMonth(e.date));
        const totalAmount = totalExpenses.reduce((sum, e) => sum + e.amount, 0);



        return {
            dutiesByMember,
            totalAmount
        };
    }, [members, waterPairs, expenses]);

    const { dutiesByMember, totalAmount } = summaryData;
    const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
        <div className="fixed inset-0 bg-slate-100 z-50 overflow-y-auto animate-slide-up">
            <header className="bg-white px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-10">
                <div>
                    <h2 className="text-xl font-bold text-theme">Monthly Summary</h2>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{currentMonthName}</p>
                </div>
                <button onClick={onClose} className="p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 hover:text-slate-600 transition-colors">
                    <X size={24} />
                </button>
            </header>

            <main className="p-6 space-y-6 max-w-md mx-auto">
                <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200">
                    <div className="flex items-center gap-3 mb-4 opacity-80">
                        <TrendingUp size={20} />
                        <span className="font-bold text-sm tracking-wide">HOUSE PULSE</span>
                    </div>
                    <p className="text-3xl font-bold mb-1">We're doing great!</p>
                    <p className="opacity-80 text-sm">Reviewing our shared efforts helps keep things fair and transparent.</p>
                </div>

                {/* Duties Section */}
                <Card className="p-5">
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            <Droplets size={20} />
                        </div>
                        <h3 className="font-bold text-slate-700">Water Duties Completed</h3>
                    </div>
                    <div className="space-y-3">
                        {dutiesByMember.map(m => (
                            <div key={m.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <MemberAvatar member={m} size="sm" />
                                    <span className="text-sm font-semibold text-slate-700">{m.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 rounded-full opacity-60"
                                            style={{ width: `${Math.min(100, (m.completed / Math.max(1, dutiesByMember[0].completed)) * 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-bold text-slate-600 w-6 text-right">{m.completed}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Expenses Section */}
                <Card className="p-5">
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                            <DollarSign size={20} />
                        </div>
                        <h3 className="font-bold text-slate-700">Total Expenses</h3>
                    </div>
                    <div className="text-center py-2">
                        <p className="text-4xl font-bold text-theme tracking-tight">{formatCurrency(totalAmount)}</p>
                        <p className="text-xs text-slate-400 font-bold mt-2 uppercase tracking-wide">Spent this month</p>
                    </div>
                </Card>



                <div className="h-12"></div>
            </main>
        </div>
    );
};

export default MonthlySummary;

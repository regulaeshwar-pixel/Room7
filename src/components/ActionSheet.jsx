import React from 'react';

const ActionSheet = ({ open, onClose, actions }) => {
    if (!open) return null;
    return (
        <>
            <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
            <div className="fixed bottom-0 left-0 right-0 bg-white z-50 rounded-t-2xl p-4 animate-slide-up">
                {actions.map((action, idx) => (
                    <button key={idx} onClick={() => { action.onClick(); onClose(); }} className="w-full py-3 text-left font-bold text-slate-700 border-b border-slate-100 last:border-0">
                        {action.label}
                    </button>
                ))}
            </div>
        </>
    );
};

export default ActionSheet;

import React from 'react';

const ActionSheet = ({ open, onClose, actions }) => {
    if (!open) return null;
    return (
        <>
            <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white z-50 rounded-t-[32px] p-6 pb-12 animate-slide-up shadow-[0_-20px_40px_rgba(0,0,0,0.05)] border-t border-slate-100/50">
                <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-6" />
                <div className="space-y-2">
                    {actions.map((action, idx) => (
                        <button key={idx} onClick={() => { action.onClick(); onClose(); }} className="w-full py-4 px-4 text-center text-sm font-black tracking-widest uppercase text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors active:scale-[0.98]">
                            {action.label}
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
};

export default ActionSheet;

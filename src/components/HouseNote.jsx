import React, { useState, useEffect } from 'react';

export default function HouseNote({
    note,
    canEdit,
    onSave,
}) {
    const [draft, setDraft] = useState(note?.text ?? "");
    const [editing, setEditing] = useState(false);

    useEffect(() => {
        setDraft(note?.text ?? "");
    }, [note?.text]);

    return (
        <div className="bg-card rounded-xl p-4 space-y-2 border border-theme mb-4 shadow-sm transition-all">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-theme uppercase tracking-wide opacity-70">House Note</h3>

                {canEdit && (
                    <button
                        onClick={() => setEditing(!editing)}
                        className="text-xs text-indigo-500 font-bold hover:text-indigo-600 px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                    >
                        {editing ? "Cancel" : "Edit"}
                    </button>
                )}
            </div>

            {editing ? (
                <div className="animate-fade-in-fast">
                    <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg p-3 text-sm border-2 border-indigo-100 focus:border-indigo-500 outline-none text-slate-800 bg-white"
                        placeholder="Write something everyone should know..."
                        autoFocus
                    />
                    <button
                        onClick={() => {
                            if (draft.trim() !== note?.text) {
                                onSave(draft.trim());
                            }
                            setEditing(false);
                        }}
                        className="text-xs font-bold text-white bg-indigo-600 px-4 py-2 rounded-lg mt-2 shadow-sm hover:bg-indigo-700 w-full transition-all active:scale-95"
                    >
                        Save Note
                    </button>
                </div>
            ) : (
                <div className="min-h-[20px]">
                    <p className="text-sm text-theme whitespace-pre-wrap leading-relaxed">
                        {note?.text || <span className="text-muted italic">Nothing pinned right now.</span>}
                    </p>
                </div>
            )}

            {!editing && note?.updatedAt && (
                <p className="text-[10px] text-muted text-right pt-1 border-t border-theme/10 mt-2">
                    Updated by <span className="font-medium">{note.updatedBy}</span>
                </p>
            )}
        </div>
    );
}

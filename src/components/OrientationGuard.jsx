import React, { useState, useEffect } from 'react';

/**
 * OrientationGuard - Graceful fallback for mobile browsers
 * Shows a message when device is in landscape mode
 * For installed PWAs, manifest.json handles orientation lock natively
 */
export default function OrientationGuard({ children }) {
    const [isPortrait, setIsPortrait] = useState(
        window.matchMedia("(orientation: portrait)").matches
    );

    useEffect(() => {
        const mq = window.matchMedia("(orientation: portrait)");
        const handler = (e) => setIsPortrait(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);

    if (!isPortrait) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6 text-center">
                <div className="max-w-sm">
                    <svg
                        className="w-16 h-16 mx-auto mb-4 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                    </svg>
                    <p className="text-slate-700 text-sm font-medium mb-2">
                        Please rotate your device
                    </p>
                    <p className="text-slate-500 text-xs">
                        FlowHouse works best in portrait mode
                    </p>
                </div>
            </div>
        );
    }

    return children;
}

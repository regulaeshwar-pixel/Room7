import React, { useState, useEffect, useRef } from 'react';
import MemberAvatar from "./MemberAvatar";
import MicroCheck from "./MicroCheck";

export default function DutyAvatar({
    member,
    isNext,
    progress,
}) {
    const [showCheck, setShowCheck] = useState(false);
    const mounted = useRef(false);

    useEffect(() => {
        if (mounted.current && progress >= 1) {
            setShowCheck(true);
            const timer = setTimeout(() => setShowCheck(false), 2000);
            return () => clearTimeout(timer);
        }
        mounted.current = true;
    }, [progress]);

    return (
        <div className="relative w-14 h-14 flex items-center justify-center">

            {/* Glow layer (Background) - Visual cue for 'Next' */}
            {isNext && <div className="absolute inset-0 next-glow" />}

            {/* Avatar (Middle) */}
            <div className={`relative z-10 rounded-full ${isNext ? 'bg-white p-[2px]' : ''}`}>
                <MemberAvatar name={member.name} code={member.avatar} />
            </div>

            {/* Completion Check (Top) */}
            <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none rounded-full overflow-hidden">
                <MicroCheck show={showCheck} />
            </div>

        </div>
    );
}

import { useRef } from "react";
import { haptic } from "../utils/haptics";

export function useLongPress(onLongPress, onClick, ms = 500) {
    const timerRef = useRef(null);
    const longPressTriggered = useRef(false);

    const start = () => {
        longPressTriggered.current = false;

        timerRef.current = setTimeout(() => {
            haptic.light();     // 👈 confirm long-press
            onLongPress();
            longPressTriggered.current = true;
        }, ms);
    };

    const clear = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    const click = () => {
        if (!longPressTriggered.current) {
            if (onClick) onClick();
        }
    };

    return {
        onPointerDown: start,
        onPointerUp: () => {
            clear();
            click();
        },
        onPointerLeave: clear,
    };
}

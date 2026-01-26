// Track if user has interacted (required for vibration API)
let userHasInteracted = false;

// Set up one-time interaction listener
if (typeof window !== 'undefined') {
    const markInteracted = () => {
        userHasInteracted = true;
        window.removeEventListener('click', markInteracted);
        window.removeEventListener('touchstart', markInteracted);
        window.removeEventListener('keydown', markInteracted);
    };
    window.addEventListener('click', markInteracted, { once: true });
    window.addEventListener('touchstart', markInteracted, { once: true });
    window.addEventListener('keydown', markInteracted, { once: true });
}

// Safe vibration wrapper
const safeVibrate = (pattern) => {
    if (userHasInteracted && navigator.vibrate) {
        try {
            navigator.vibrate(pattern);
        } catch (e) {
            // Silently fail if vibration not supported
        }
    }
};

export const haptic = {
    light: () => safeVibrate(8),
    medium: () => safeVibrate(18),
    success: () => safeVibrate([10, 20, 10]),
    error: () => safeVibrate([30, 40, 30]),
};

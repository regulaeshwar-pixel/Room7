import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from '../firebase';

export default function useAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (!u) {
                try {
                    await signInAnonymously(auth);
                } catch (error) {
                    console.error("Failed to sign in anonymously", error);
                }
            } else {
                setUser(u);
            }
            setLoading(false);
        });
        return unsub;
    }, []);

    return { user, loading };
}

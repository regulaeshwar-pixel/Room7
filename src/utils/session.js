export const saveUser = (user) => {
    try {
        localStorage.setItem("flowhouse_user", JSON.stringify(user));
    } catch (error) {
        console.error("Failed to save user session:", error);
    }
};

export const loadUser = () => {
    try {
        const raw = localStorage.getItem("flowhouse_user");
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        console.error("Failed to load user session:", error);
        return null;
    }
};

export const clearUser = () => {
    try {
        localStorage.removeItem("flowhouse_user");
    } catch (error) {
        console.error("Failed to clear user session:", error);
    }
};

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { saveTheme } from "../services/themeService";

const ThemeContext = createContext({
    theme: "dark",
    toggleTheme: () => {},
    setThemeFromServer: () => {},
});

const STORAGE_KEY = "tradepro_theme";

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === "light" || saved === "dark") return saved;
        return window.matchMedia?.("(prefers-color-scheme: light)").matches
            ? "light"
            : "dark";
    });

    useEffect(() => {
        const root = document.documentElement;
        root.classList.toggle("dark", theme === "dark");
        root.setAttribute("data-theme", theme);
        localStorage.setItem(STORAGE_KEY, theme);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme((prev) => {
            const next = prev === "dark" ? "light" : "dark";
            saveTheme(next);
            return next;
        });
    }, []);

    // Apply the server-stored preference on login without re-saving it.
    const setThemeFromServer = useCallback((serverTheme) => {
        if (serverTheme === "light" || serverTheme === "dark") {
            setTheme(serverTheme);
        }
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setThemeFromServer }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}

import { FaMoon, FaSun } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";

function ThemeToggle({ className = "" }) {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === "dark";

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle color theme"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className={`relative inline-flex h-9 w-16 items-center rounded-full border border-white/15 bg-white/10 px-1 transition ${className}`}
        >
            <span
                className={`flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md transition-transform duration-300 ${
                    isDark ? "translate-x-0" : "translate-x-7"
                }`}
            >
                {isDark ? <FaMoon size={13} /> : <FaSun size={13} />}
            </span>
        </button>
    );
}

export default ThemeToggle;

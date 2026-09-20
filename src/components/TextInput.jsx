// Theme-aware text input with an optional leading icon. Uses design tokens
// so it looks right in both light and dark mode.
function TextInput({ icon, className = "", ...props }) {
    return (
        <div className="relative">
            {icon && (
                <span className="absolute top-1/2 -translate-y-1/2 left-3.5 text-muted">
                    {icon}
                </span>
            )}
            <input
                {...props}
                className={`w-full ${icon ? "pl-11" : "pl-4"} pr-4 py-3 rounded-xl surface-solid text-(--text) placeholder:text-(--text-muted) outline-none border border-(--border) focus:border-(--accent) focus:ring-2 focus:ring-(--accent-soft) transition ${className}`}
            />
        </div>
    );
}

export default TextInput;

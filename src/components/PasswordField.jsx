import { useState } from "react";
import { RiLockPasswordFill } from "react-icons/ri";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { evaluatePassword } from "../utils/passwordStrength";

function PasswordField({
    value,
    onChange,
    placeholder = "Password",
    showStrength = false,
    required = false,
    name,
}) {
    const [visible, setVisible] = useState(false);
    const strength = showStrength ? evaluatePassword(value) : null;

    return (
        <div>
            <div className="relative">
                <RiLockPasswordFill className="absolute top-1/2 -translate-y-1/2 left-3.5 text-muted" />

                <input
                    type={visible ? "text" : "password"}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    className="w-full pl-11 pr-11 py-3 rounded-xl surface-solid text-(--text) placeholder:text-(--text-muted) border border-(--border) outline-none focus:border-(--accent) focus:ring-2 focus:ring-(--accent-soft) transition"
                />

                <button
                    type="button"
                    onClick={() => setVisible((v) => !v)}
                    aria-label={visible ? "Hide password" : "Show password"}
                    className="absolute top-1/2 -translate-y-1/2 right-3.5 text-muted hover:text-(--text) transition"
                >
                    {visible ? <FaEyeSlash /> : <FaEye />}
                </button>
            </div>

            {showStrength && value && (
                <div className="mt-2">
                    <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                        <div
                            className={`h-full ${strength.color} transition-all duration-300`}
                            style={{ width: `${strength.percent}%` }}
                        />
                    </div>

                    <div className="mt-1 flex items-center justify-between">
                        <span className="text-xs text-muted">{strength.label}</span>
                    </div>

                    {strength.suggestions.length > 0 && (
                        <ul className="mt-1 text-xs text-muted list-disc list-inside space-y-0.5">
                            {strength.suggestions.map((tip) => (
                                <li key={tip}>{tip}</li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}

export default PasswordField;

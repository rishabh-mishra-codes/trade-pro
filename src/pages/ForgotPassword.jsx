import { Link } from "react-router-dom";
import { MdEmail } from "react-icons/md";
import { useState } from "react";
import PasswordField from "../components/PasswordField";
import AuthLayout from "../components/AuthLayout";
import TextInput from "../components/TextInput";
import { evaluatePassword } from "../utils/passwordStrength";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

function ForgotPassword() {
    const [step, setStep] = useState(1); // 1 = request, 2 = reset, 3 = done
    const [email, setEmail] = useState("");
    const [token, setToken] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const request = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setBusy(true);
        try {
            const res = await fetch(`${API_URL}/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || "Request failed");
            if (data.resetToken) setToken(data.resetToken);
            setMessage(
                "If that email exists, a reset token has been sent. Enter it below to reset."
            );
            setStep(2);
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };

    const reset = async (e) => {
        e.preventDefault();
        setError("");
        if (evaluatePassword(newPassword).score < 2) {
            setError("Please choose a stronger password");
            return;
        }
        setBusy(true);
        try {
            const res = await fetch(`${API_URL}/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || "Reset failed");
            setMessage("Password reset! You can now log in.");
            setStep(3);
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <AuthLayout
            title="Reset password"
            subtitle="We'll help you back into your account"
        >
            {message && <p className="mb-4 text-sm text-emerald-500">{message}</p>}
            {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

            {step === 1 && (
                <form onSubmit={request} className="space-y-4">
                    <TextInput
                        type="email"
                        icon={<MdEmail />}
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Your account email"
                    />
                    <button
                        disabled={busy}
                        className="w-full bg-linear-to-r from-indigo-600 to-violet-600 hover:opacity-90 text-white font-semibold p-3 rounded-xl disabled:opacity-60 shadow-lg shadow-indigo-500/20"
                    >
                        {busy ? "Sending..." : "Send reset link"}
                    </button>
                </form>
            )}

            {step === 2 && (
                <form onSubmit={reset} className="space-y-4">
                    <TextInput
                        type="text"
                        required
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="Reset token"
                    />
                    <PasswordField
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New password"
                        required
                        showStrength
                    />
                    <button
                        disabled={busy}
                        className="w-full bg-linear-to-r from-indigo-600 to-violet-600 hover:opacity-90 text-white font-semibold p-3 rounded-xl disabled:opacity-60 shadow-lg shadow-indigo-500/20"
                    >
                        {busy ? "Resetting..." : "Reset password"}
                    </button>
                </form>
            )}

            <p className="text-muted mt-6 text-sm">
                <Link to="/" className="text-(--accent) font-semibold">
                    Back to login
                </Link>
            </p>
        </AuthLayout>
    );
}

export default ForgotPassword;

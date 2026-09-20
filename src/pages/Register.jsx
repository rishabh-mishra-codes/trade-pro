import { Link, useNavigate } from "react-router-dom";
import { FaUser } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { useState } from "react";
import authService from "../services/authService";
import PasswordField from "../components/PasswordField";
import AuthLayout from "../components/AuthLayout";
import TextInput from "../components/TextInput";
import { evaluatePassword } from "../utils/passwordStrength";

function Register() {
    const navigate = useNavigate();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        if (evaluatePassword(password).score < 2) {
            setError("Please choose a stronger password");
            return;
        }

        setSubmitting(true);
        try {
            await authService.register({ fullName, email, password, phoneNumber });
            navigate("/home");
        } catch (err) {
            setError(err.message || "Registration failed");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AuthLayout title="Create account" subtitle="Start trading in minutes">
            <form onSubmit={handleSubmit} className="space-y-4">
                <TextInput
                    type="text"
                    icon={<FaUser />}
                    placeholder="Full Name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                />

                <TextInput
                    type="email"
                    icon={<MdEmail />}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                />

                <TextInput
                    type="tel"
                    icon={<FaUser />}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Phone (optional)"
                />

                <PasswordField
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    showStrength
                />

                <PasswordField
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    required
                />

                {error && <p className="text-sm text-red-500">{error}</p>}

                <button
                    disabled={submitting}
                    className="w-full bg-linear-to-r from-indigo-600 to-violet-600 hover:opacity-90 transition text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-500/20 disabled:opacity-60"
                >
                    {submitting ? "Creating..." : "Create account"}
                </button>
            </form>

            <p className="text-muted mt-6 text-sm">
                Already have an account?
                <Link to="/" className="text-(--accent) ml-1.5 font-semibold">
                    Log in
                </Link>
            </p>
        </AuthLayout>
    );
}

export default Register;

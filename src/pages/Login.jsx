import { Link, useNavigate } from "react-router-dom";
import { MdEmail } from "react-icons/md";
import { useEffect, useState } from "react";
import authService from "../services/authService";
import PasswordField from "../components/PasswordField";
import AuthLayout from "../components/AuthLayout";
import TextInput from "../components/TextInput";

function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const checkUser = async () => {
            try {
                const user = await authService.getCurrentUser();
                if (user) navigate("/home");
            } catch {
                /* no active session */
            }
        };
        checkUser();
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);
        try {
            await authService.login(email, password);
            navigate("/home");
        } catch (err) {
            setError(err.message || "Login failed");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AuthLayout title="Welcome back" subtitle="Log in to your TradePro account">
            <form onSubmit={handleLogin} className="space-y-4">
                <TextInput
                    type="email"
                    icon={<MdEmail />}
                    value={email}
                    required
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                />

                <PasswordField
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <div className="flex justify-end">
                    <Link
                        to="/forgot-password"
                        className="text-sm text-(--accent) hover:opacity-80"
                    >
                        Forgot password?
                    </Link>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <button
                    disabled={submitting}
                    className="w-full bg-linear-to-r from-indigo-600 to-violet-600 hover:opacity-90 transition text-white font-semibold p-3 rounded-xl disabled:opacity-60 shadow-lg shadow-indigo-500/20"
                >
                    {submitting ? "Logging in..." : "Log in"}
                </button>
            </form>

            <p className="text-muted mt-6 text-sm">
                Don't have an account?
                <Link to="/register" className="text-(--accent) ml-1.5 font-semibold">
                    Create one
                </Link>
            </p>
        </AuthLayout>
    );
}

export default Login;

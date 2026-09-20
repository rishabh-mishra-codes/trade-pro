import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

// Auth pages load eagerly (entry points). Everything behind login is lazy
// loaded so the initial bundle stays small and fast.
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";

const Home = lazy(() => import("./pages/Home"));
const Profile = lazy(() => import("./pages/Profile"));
const Orders = lazy(() => import("./pages/Orders"));
const Alerts = lazy(() => import("./pages/Alerts"));

function Loader() {
    return (
        <div className="min-h-screen app-bg flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );
}

function App() {
    return (
        <Suspense fallback={<Loader />}>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/home" element={<Home />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/alerts" element={<Alerts />} />
            </Routes>
        </Suspense>
    );
}

export default App;

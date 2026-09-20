// Razorpay checkout integration.
// Flow: frontend asks backend to create an order -> opens Razorpay checkout
// -> on success, backend verifies the signature -> wallet credited.
//
// The backend endpoints live at /api/payments/* (Spring Boot). If the backend
// is not running yet, addFunds falls back to a local credit so the UI works.

import { addFunds } from "./portfolioService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

function loadRazorpayScript() {
    return new Promise((resolve) => {
        if (window.Razorpay) return resolve(true);
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

function authHeaders() {
    const token = localStorage.getItem("tradepro_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// amount in INR (rupees)
export async function payWithRazorpay({ amount, user, onSuccess, onFailure }) {
    // If the public Razorpay key id isn't configured on the frontend, we can't
    // open the checkout popup. Fall back to demo credit so the UI still works,
    // and tell the user what to fix.
    if (!RAZORPAY_KEY_ID) {
        await addFunds(amount);
        onSuccess?.({ demo: true, amount });
        onFailure?.(
            "Razorpay key missing (VITE_RAZORPAY_KEY_ID). Added funds in demo mode. Restart the dev server after editing .env."
        );
        return;
    }

    const loaded = await loadRazorpayScript();
    if (!loaded) {
        onFailure?.("Failed to load Razorpay. Check your connection.");
        return;
    }

    // 1) Create order on the backend (returns Razorpay order id + amount in paise)
    let order;
    try {
        const res = await fetch(`${API_URL}/payments/create-order`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders() },
            body: JSON.stringify({ amount }),
        });
        if (!res.ok) throw new Error("order-failed");
        order = await res.json();
    } catch {
        // Backend not available: demo fallback so the UI is still usable.
        await addFunds(amount);
        onSuccess?.({ demo: true, amount });
        return;
    }

    // 2) Open Razorpay checkout
    const options = {
        key: RAZORPAY_KEY_ID,
        amount: order.amount, // paise
        currency: order.currency || "INR",
        name: "TradePro",
        description: "Add funds to wallet",
        order_id: order.id,
        prefill: {
            name: user?.fullName || user?.name || "",
            email: user?.email || "",
        },
        theme: { color: "#4f46e5" },
        handler: async (response) => {
            // 3) Verify signature on the backend. The backend credits the
            // wallet server-side on a valid signature.
            try {
                const verifyRes = await fetch(`${API_URL}/payments/verify`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...authHeaders(),
                    },
                    body: JSON.stringify({ ...response, amount: String(amount) }),
                });
                if (!verifyRes.ok) throw new Error("verify-failed");
                onSuccess?.({ demo: false, amount });
            } catch {
                onFailure?.("Payment verification failed.");
            }
        },
        modal: {
            ondismiss: () => onFailure?.("Payment cancelled"),
        },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (resp) =>
        onFailure?.(resp?.error?.description || "Payment failed")
    );
    rzp.open();
}

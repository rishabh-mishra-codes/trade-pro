// Lightweight password strength estimator (no external deps).
// Returns { score: 0-4, label, color, suggestions[] }.

export function evaluatePassword(password = "") {
    const suggestions = [];
    let score = 0;

    if (!password) {
        return {
            score: 0,
            label: "",
            color: "bg-slate-500",
            suggestions: [],
            percent: 0,
        };
    }

    const checks = {
        length: password.length >= 8,
        longLength: password.length >= 12,
        lower: /[a-z]/.test(password),
        upper: /[A-Z]/.test(password),
        number: /\d/.test(password),
        symbol: /[^A-Za-z0-9]/.test(password),
    };

    if (checks.length) score++;
    if (checks.lower && checks.upper) score++;
    if (checks.number) score++;
    if (checks.symbol) score++;
    if (checks.longLength && score >= 3) score = 4;

    if (!checks.length) suggestions.push("Use at least 8 characters");
    if (!(checks.lower && checks.upper))
        suggestions.push("Mix uppercase and lowercase letters");
    if (!checks.number) suggestions.push("Add a number");
    if (!checks.symbol) suggestions.push("Add a symbol (e.g. !@#$)");
    if (checks.length && !checks.longLength)
        suggestions.push("12+ characters is even stronger");

    const meta = [
        { label: "Very weak", color: "bg-red-500" },
        { label: "Weak", color: "bg-orange-500" },
        { label: "Fair", color: "bg-yellow-500" },
        { label: "Strong", color: "bg-lime-500" },
        { label: "Very strong", color: "bg-emerald-500" },
    ][score];

    return {
        score,
        label: meta.label,
        color: meta.color,
        suggestions: suggestions.slice(0, 3),
        percent: ((score + 1) / 5) * 100,
    };
}

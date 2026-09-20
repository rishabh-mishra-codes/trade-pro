// Local profile extras (avatar) persisted in localStorage keyed by user id.
// Swap to backend + object storage later. Avatars are stored as data URLs.

const AVATAR_KEY = "tradepro_avatars";

function readAll() {
    try {
        return JSON.parse(localStorage.getItem(AVATAR_KEY)) || {};
    } catch {
        return {};
    }
}

export function getAvatar(userId) {
    if (!userId) return null;
    return readAll()[userId] || null;
}

export function saveAvatar(userId, dataUrl) {
    if (!userId) return;
    const all = readAll();
    all[userId] = dataUrl;
    localStorage.setItem(AVATAR_KEY, JSON.stringify(all));
}

export function removeAvatar(userId) {
    const all = readAll();
    delete all[userId];
    localStorage.setItem(AVATAR_KEY, JSON.stringify(all));
}

// Reads a File into a resized data URL (max 256px) to keep localStorage small.
export function fileToAvatarDataUrl(file, maxSize = 256) {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith("image/")) {
            reject(new Error("Please select an image file"));
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
                const canvas = document.createElement("canvas");
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL("image/jpeg", 0.85));
            };
            img.onerror = () => reject(new Error("Invalid image"));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
    });
}

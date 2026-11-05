export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export async function api(path, options = {}) {
    try {
        const res = await fetch(BASE_URL + path, {
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            ...options,
        });
        return res.json();
    } catch (error) {
        console.error('API request failed:', error);
        return { ok: false, msg: 'Network error' };
    }
}

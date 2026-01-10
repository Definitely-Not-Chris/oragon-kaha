export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = localStorage.getItem("vibepos_pos_token");
    const headers: any = {
        "Content-Type": "application/json",
        ...options?.headers,
    };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(error.message || `Request failed with status ${res.status}`);
    }

    return res.json();
}

export const api = {
    auth: {
        login: (username: string, password: string) => fetchJson<any>("/auth/login", {
            method: "POST",
            body: JSON.stringify({ username, password }),
        }),
    },
    licensing: {
        getMyLicense: () => fetchJson<any>("/licensing/me"),
        heartbeat: (key: string, deviceId: string) => fetchJson<any>("/licensing/heartbeat", {
            method: "POST",
            body: JSON.stringify({ key, deviceId })
        }),
    },
    terminals: {
        register: (organization_id: string, device_id?: string) => fetchJson<any>("/terminals/register", {
            method: "POST",
            body: JSON.stringify({ organization_id, device_id })
        }),
        list: (organization_id: string) => fetchJson<any[]>(`/terminals?organization_id=${organization_id}`)
    }
};

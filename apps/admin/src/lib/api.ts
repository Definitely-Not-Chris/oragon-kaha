export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = localStorage.getItem("vibepos_admin_token");
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
    // Auth
    login: (username: string, password: string) => fetchJson<any>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
    }),

    // License & Payments
    // Licenses
    getLicenses: () => fetchJson<any[]>("/licensing/admin/keys"),
    getMyLicense: () => fetchJson<any>("/licensing/me"),
    revokeLicense: (id: string) => fetchJson(`/licensing/admin/revoke/${id}`, { method: "PUT" }),

    // Payment Proofs
    // Payment Proofs
    createPayment: (data: any) => fetchJson("/licensing/proof", {
        method: "POST",
        body: JSON.stringify(data),
    }),
    getMyPaymentHistory: () => fetchJson<any[]>("/licensing/me/payments"),
    getProofs: (status?: string, search?: string) => {
        const params = new URLSearchParams();
        if (status) params.append("status", status);
        if (search) params.append("search", search);
        return fetchJson<any[]>(`/licensing/admin/proofs?${params.toString()}`);
    },

    updateProof: (id: string, data: { amount?: number, referenceNo?: string }) => fetchJson(`/licensing/admin/proofs/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    }),

    approveProof: (id: string, data: { adminId: string; type: "PRO" | "ENTERPRISE"; maxBranches: number, durationDays: number }) =>
        fetchJson(`/licensing/admin/approve/${id}`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
    rejectProof: (id: string, data: { adminId: string; reason: string }) =>
        fetchJson(`/licensing/admin/reject/${id}`, {
            method: "POST",
            body: JSON.stringify(data),
        }),

    // Users
    getMe: () => fetchJson<any>("/users/me"),
    getUsers: () => fetchJson<any[]>("/users"),
    createUser: (data: any) => fetchJson("/users", {
        method: "POST",
        body: JSON.stringify(data),
    }),
    updateUser: (id: string, data: any) => fetchJson(`/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
    }),
    deleteUser: (id: string) => fetchJson(`/users/${id}`, {
        method: "DELETE",
    }),

    // Organizations
    getOrganizations: () => fetchJson<any[]>("/organizations"),
    createOrganization: (data: any) => fetchJson("/organizations", {
        method: "POST",
        body: JSON.stringify(data),
    }),
    updateOrganization: (id: string, data: any) => fetchJson(`/organizations/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
    }),
    deleteOrganization: (id: string) => fetchJson(`/organizations/${id}`, {
        method: "DELETE",
    }),

    // Terminals
    getTerminals: (organizationId: string) => fetchJson<any[]>(`/terminals?organization_id=${organizationId}`),

    // Sales
    getSales: (organizationId: string, from?: string, to?: string) => {
        const params = new URLSearchParams({ organization_id: organizationId });
        if (from) params.append('from', from);
        if (to) params.append('to', to);
        return fetchJson<any[]>(`/sales?${params.toString()}`);
    },

    // Sync Logs
    getSyncLogs: () => fetchJson<string[]>('/sync/logs'),
};

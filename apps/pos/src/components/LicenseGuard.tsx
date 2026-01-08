import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function LicenseGuard({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<"LOADING" | "VALID" | "MISSING" | "EXPIRED">("LOADING");
    const location = useLocation();

    useEffect(() => {
        checkLicense();
    }, [location]);

    const checkLicense = () => {
        const token = localStorage.getItem("vibepos_pos_token");
        const licenseKey = localStorage.getItem("vibepos_license_key");
        const validUntil = localStorage.getItem("vibepos_license_valid_until");

        if (!token || !licenseKey) {
            setStatus("MISSING");
            return;
        }

        if (validUntil) {
            const expiry = new Date(validUntil);
            const now = new Date();
            if (now > expiry) {
                setStatus("EXPIRED");
                return;
            }
        }

        setStatus("VALID");
    };

    useEffect(() => {
        if (status !== 'VALID') return;

        const doHeartbeat = async () => {
            if (!navigator.onLine) return;

            const key = localStorage.getItem("vibepos_license_key");
            if (!key) return;

            try {
                // For now we use a static or random device ID if not stored
                let deviceId = localStorage.getItem("vibepos_device_id");
                if (!deviceId) {
                    deviceId = crypto.randomUUID();
                    localStorage.setItem("vibepos_device_id", deviceId);
                }

                const res = await api.licensing.heartbeat(key, deviceId);

                if (res.status === 'REVOKED' || (res.commands && res.commands.includes('DEACTIVATE'))) {
                    console.error("License Revoked via Heartbeat");
                    alert("Your license has been revoked by the server.");
                    localStorage.removeItem("vibepos_license_key");
                    localStorage.removeItem("vibepos_pos_token");
                    window.location.reload();
                }
            } catch (e) {
                // Silent fail for offline tolerance
                console.warn("Heartbeat check failed (offline?)", e);
            }
        };

        doHeartbeat(); // Run immediately on mount/valid
        const interval = setInterval(doHeartbeat, 5 * 60 * 1000); // 5 Minutes

        return () => clearInterval(interval);
    }, [status]);

    if (status === "LOADING") return null;

    if (status === "MISSING") {
        return <Navigate to="/activate" replace />;
    }

    if (status === "EXPIRED") {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-slate-50 p-4 text-center">
                <div className="p-4 bg-red-100 rounded-full text-red-600">
                    <AlertCircle className="w-12 h-12" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Subscription Expired</h1>
                <p className="max-w-md text-slate-500">
                    Your license has expired. Please connect to the internet and log in again to renew your session.
                </p>
                <Button onClick={() => {
                    localStorage.clear();
                    window.location.href = "/activate";
                }}>
                    Go to Activation
                </Button>
            </div>
        );
    }

    return <>{children}</>;
}

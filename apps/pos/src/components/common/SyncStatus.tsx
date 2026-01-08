import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db";
import { Cloud, CloudOff, RefreshCw, AlertTriangle, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { syncEngine, SYNC_API_URL } from "../../lib/SyncEngine";

export const SyncStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isRetrying, setIsRetrying] = useState(false);

    const handleRetry = async () => {
        if (isRetrying) return;
        setIsRetrying(true);
        await syncEngine.processQueue(true);
        // Add a small delay so user sees the spinner even if fast
        setTimeout(() => setIsRetrying(false), 500);
    };

    const queueStats = useLiveQuery(async () => {
        try {
            // Safety check: verify table exists
            if (!db.sync_queue) return { error: true };

            const pending = await db.sync_queue.where('status').equals('PENDING').count();
            const processing = await db.sync_queue.where('status').equals('PROCESSING').count();

            const failedItems = await db.sync_queue.where('status').equals('FAILED').limit(1).toArray();
            const failed = await db.sync_queue.where('status').equals('FAILED').count();
            const lastError = failedItems.length > 0 ? failedItems[0].error_log : null;

            return { pending, processing, failed, total: pending + processing + failed, error: false, lastError };
        } catch (err) {
            console.error("SyncQueue Error:", err);
            return { error: true };
        }
    });

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            syncEngine.processQueue();
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Periodic heartbeat to verify server reachability
        // This fixes cases where navigator.onLine is true but server is down
        const checkConnection = async () => {
            const rootUrl = SYNC_API_URL.split('/sync')[0];
            try {
                const res = await fetch(rootUrl, { method: 'GET' });
                if (res.ok) {
                    setIsOnline(true);
                    // Trigger sync if queue has items (optimization: only if known pending)
                    syncEngine.processQueue();
                } else {
                    console.warn(`Heartbeat failed with status: ${res.status}`);
                    setIsOnline(false);
                }
            } catch (e) {
                console.log("Heartbeat failed", e);
                // If ping fails, we are effectively offline for the app's purpose
                setIsOnline(false);
            }
        };
        const interval = setInterval(checkConnection, 15000);
        checkConnection(); // Initial check

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, []);

    const resetDatabase = async () => {
        if (confirm("This will clear local data to fix the corruption. Sales on server are safe. Continue?")) {
            await db.delete();
            window.location.reload();
        }
    };

    if (!queueStats) return null;

    // 0. DB ERROR STATE
    if (queueStats.error) {
        return (
            <div className="flex items-center gap-3 p-3 bg-red-50 text-red-700 rounded-xl border border-red-100 mb-2 cursor-pointer" onClick={resetDatabase}>
                <div className="w-8 h-8 rounded-lg bg-red-200 flex items-center justify-center animate-pulse">
                    <AlertTriangle size={16} />
                </div>
                <div className="hidden sm:block">
                    <p className="text-xs font-bold uppercase">System Error</p>
                    <p className="text-[10px] opacity-80">Tap to Fix Database</p>
                </div>
            </div>
        );
    }

    const { pending, processing, failed, total, lastError } = queueStats;

    // 1. OFFLINE STATE
    if (!isOnline) {
        return (
            <div className="flex items-center gap-3 p-3 bg-red-50 text-red-700 rounded-xl border border-red-100 mb-2 cursor-pointer" onClick={resetDatabase}>
                <div className="w-8 h-8 rounded-lg bg-red-200 flex items-center justify-center">
                    <CloudOff size={16} />
                </div>
                <div className="hidden sm:block">
                    <p className="text-xs font-bold uppercase">Offline</p>
                    <p className="text-[10px] opacity-80">{total} changes queued (Tap to Reset)</p>
                </div>
            </div>
        );
    }

    // 2. SYNCING STATE
    if (processing > 0) {
        return (
            <div className="flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-200 flex items-center justify-center animate-spin">
                    <RefreshCw size={16} />
                </div>
                <div className="hidden sm:block">
                    <p className="text-xs font-bold uppercase">Syncing...</p>
                    <p className="text-[10px] opacity-80">{pending} remaining</p>
                </div>
            </div>
        );
    }

    // 3. FAILED STATE
    if (failed > 0) {
        return (
            <div
                className={`flex items-center gap-3 p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 mb-2 cursor-pointer relative group ${isRetrying ? 'opacity-70 pointer-events-none' : ''}`}
                onClick={handleRetry}
            >
                <div className={`w-8 h-8 rounded-lg bg-amber-200 flex items-center justify-center ${isRetrying ? 'animate-spin' : ''}`}>
                    {isRetrying ? <RefreshCw size={16} /> : <CloudOff size={16} />}
                </div>
                <div className="hidden sm:block">
                    <p className="text-xs font-bold uppercase">{isRetrying ? 'Retrying...' : 'Sync Issue'}</p>
                    <p className="text-[10px] opacity-80">{failed} failed (Tap retry)</p>
                </div>

                {/* Tooltip for Error */}
                {lastError && (
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 bg-slate-800 text-white text-xs p-2 rounded shadow-lg z-50">
                        <p className="font-bold">Last Error:</p>
                        <p className="break-words">{lastError}</p>
                    </div>
                )}
            </div>
        );
    }

    // 4. SYNCED STATE
    return (
        <div className="flex items-center gap-3 p-3 bg-gray-50 text-gray-600 rounded-xl border border-gray-100 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-emerald-600">
                <Cloud size={16} />
                <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white translate-x-1 -translate-y-1"></div>
            </div>
            <div className="hidden sm:block">
                <p className="text-xs font-bold uppercase text-emerald-700">Online</p>
                <p className="text-[10px] opacity-80">All data synced</p>
            </div>
        </div>
    );
};

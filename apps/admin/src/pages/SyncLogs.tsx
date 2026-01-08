import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SyncLogs() {
    const [logs, setLogs] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadLogs();
        const interval = setInterval(loadLogs, 5000); // Auto-refresh every 5s
        return () => clearInterval(interval);
    }, []);

    const loadLogs = async () => {
        try {
            const data = await api.getSyncLogs();
            setLogs(data);
        } catch (error) {
            console.error("Failed to load logs", error);
        }
    };

    const handleRefresh = async () => {
        setLoading(true);
        await loadLogs();
        setLoading(false);
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-vibepos-dark">Server Sync Logs</h1>
                    <p className="text-muted-foreground">Real-time logs from the synchronization hub.</p>
                </div>
                <Button onClick={handleRefresh} disabled={loading} variant="outline">
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <Card className="bg-slate-950 text-slate-50 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-slate-200">Live Stream</CardTitle>
                    <CardDescription className="text-slate-400">
                        Showing last 50 events.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="font-mono text-xs md:text-sm space-y-1 h-[600px] overflow-y-auto p-4 bg-slate-900 rounded-md">
                        {logs.length === 0 && (
                            <div className="text-slate-500 italic text-center py-10">Waiting for events...</div>
                        )}
                        {logs.map((log, index) => (
                            <div key={index} className="break-all border-b border-slate-800 pb-1 mb-1 last:border-0">
                                <span className="text-emerald-500 mr-2">{log.split(']')[0]}]</span>
                                <span className={log.includes('Error') ? 'text-red-400' : 'text-slate-300'}>
                                    {log.split(']').slice(1).join(']')}
                                </span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

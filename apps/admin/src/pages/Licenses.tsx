import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export default function Licenses() {
    const [licenses, setLicenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        fetchLicenses();
    }, []);

    const fetchLicenses = async () => {
        setLoading(true);
        try {
            const data = await api.getLicenses();
            setLicenses(data);
        } catch (error) {
            console.error("Failed to fetch licenses", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async (id: string) => {
        if (!confirm("Are you sure you want to revoke this license? This action cannot be undone immediately.")) return;
        setProcessing(id);
        try {
            await api.revokeLicense(id);
            await fetchLicenses();
        } catch (error) {
            alert("Failed to revoke license");
        } finally {
            setProcessing(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-vibepos-dark">License Management</h1>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-vibepos-primary" />
                </div>
            ) : licenses.length === 0 ? (
                <div className="p-12 text-center border rounded-lg bg-white text-muted-foreground">
                    No licenses issued yet.
                </div>
            ) : (
                <div className="grid gap-4">
                    {licenses.map((license) => (
                        <Card key={license.id}>
                            <CardContent className="flex items-center justify-between p-6">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-full ${license.status === 'ACTIVE' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {license.status === 'ACTIVE' ? <ShieldCheck className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{license.organization?.name || "Unknown Org"}</h3>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">{license.key}</span>
                                            <span>•</span>
                                            <span>{license.type}</span>
                                            <span>•</span>
                                            <span>{license.maxBranches} Branches</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    {license.status === 'ACTIVE' ? (
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            disabled={!!processing}
                                            onClick={() => handleRevoke(license.id)}
                                        >
                                            {processing === license.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Revoke"}
                                        </Button>
                                    ) : (
                                        <Button variant="outline" size="sm" disabled>Revoked</Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

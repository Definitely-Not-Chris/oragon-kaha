import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Copy, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ClientDashboard() {
    const [license, setLicense] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyLicense();
    }, []);

    const fetchMyLicense = async () => {
        try {
            const res = await api.getMyLicense();
            setLicense(res);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-vibepos-dark">My Store</h1>
                <p className="text-muted-foreground">Manage your subscription and devices.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-l-4 border-l-vibepos-primary">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldCheck className="text-vibepos-primary" />
                            Active License
                        </CardTitle>
                        <CardDescription>Your authorization key</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {license ? (
                            <div className="space-y-2">
                                <div className="p-3 bg-slate-100 rounded-md font-mono text-center text-lg font-bold tracking-wider select-all border">
                                    {license.key}
                                </div>
                                <div className="text-xs text-center text-muted-foreground">
                                    Type: <span className="font-semibold">{license.type}</span> • Branches: {license.maxBranches}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                                <AlertCircle className="w-8 h-8 text-yellow-500" />
                                <p className="text-sm font-medium">No Active License Found</p>
                                <p className="text-xs text-muted-foreground">Please upload a payment proof to get started.</p>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full gap-2" disabled={!license} onClick={() => navigator.clipboard.writeText(license?.key)}>
                            <Copy className="w-4 h-4" /> Copy Key
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

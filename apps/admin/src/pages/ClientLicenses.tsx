import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, Calendar, Server, Copy, ArrowUpCircle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";

export default function ClientLicenses() {
    const [license, setLicense] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLicense();
    }, []);

    const fetchLicense = async () => {
        try {
            const res = await api.getMyLicense();
            setLicense(res);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load license details");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    if (!license) return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
            <h2 className="text-xl font-bold mb-2">No Active License</h2>
            <p className="text-muted-foreground mb-4">You do not have a valid subscription active.</p>
            <Button onClick={() => window.location.href = '/my-payments'}>Go to Payments</Button>
        </div>
    );

    const daysRemaining = license.validUntil ? differenceInDays(new Date(license.validUntil), new Date()) : 999;
    const isExpiringSoon = daysRemaining < 30;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-vibepos-dark">My Subscription</h1>
                <p className="text-muted-foreground">Manage your Oragon Kaha license and plan details.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Plan Status */}
                <Card className={`border-l-4 ${isExpiringSoon ? 'border-l-yellow-500' : 'border-l-green-500'}`}>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span className="flex items-center gap-2"><ShieldCheck className="text-vibepos-primary" /> Active Plan</span>
                            <Badge variant={license.type === 'ENTERPRISE' ? 'default' : 'secondary'}>{license.type}</Badge>
                        </CardTitle>
                        <CardDescription>Subscription status and validity.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-muted-foreground uppercase font-bold">Status</label>
                                <div className="text-lg font-medium text-green-600 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-green-500" /> Active
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground uppercase font-bold">Expires In</label>
                                <div className={`text-lg font-medium ${isExpiringSoon ? 'text-yellow-600' : ''}`}>
                                    {daysRemaining > 365 ? 'Lifetime / >1 Year' : `${daysRemaining} Days`}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar size={16} />
                                Valid until: <span className="font-semibold">{license.validUntil ? format(new Date(license.validUntil), 'MMM d, yyyy') : 'Lifetime'}</span>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full gap-2" variant="outline" onClick={() => {
                            toast.info("Please submit a payment proof to renew your subscription.");
                            window.location.href = '/my-payments';
                        }}>
                            <ArrowUpCircle size={16} /> Request Upgrade / Renewal
                        </Button>
                    </CardFooter>
                </Card>

                {/* License Key */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Server className="text-vibepos-primary" /> License Key
                        </CardTitle>
                        <CardDescription>Your unique authorization key and limits.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-slate-100 rounded-lg border font-mono text-center text-lg font-bold tracking-widest break-all">
                            {license.key}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold">{license.maxBranches}</div>
                                <div className="text-xs text-muted-foreground">Max Branches</div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-gray-400">-</div>
                                <div className="text-xs text-muted-foreground">Used Slots</div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button variant="ghost" className="w-full gap-2" onClick={() => {
                            navigator.clipboard.writeText(license.key);
                            toast.success("License key copied");
                        }}>
                            <Copy size={16} /> Copy to Clipboard
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

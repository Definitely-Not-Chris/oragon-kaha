import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard } from "lucide-react";
import { format } from "date-fns";

import { OrganizationSelector } from "@/components/OrganizationSelector";

export default function ClientTransactions() {
    const { user } = useAuth();
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedOrgId, setSelectedOrgId] = useState<string>("");

    // Effect for Store Owners (auto-select their org)
    useEffect(() => {
        if (user?.organizationId) {
            setSelectedOrgId(user.organizationId);
        }
    }, [user?.organizationId]);

    // Effect to load sales when org is selected
    useEffect(() => {
        if (selectedOrgId) {
            loadSales(selectedOrgId);
        } else {
            setSales([]);
        }
    }, [selectedOrgId]);

    const loadSales = async (orgId: string) => {
        setLoading(true);
        try {
            const data = await api.getSales(orgId);
            setSales(data);
        } catch (error) {
            console.error("Failed to load sales", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-vibepos-dark">Transactions</h1>
                    <p className="text-muted-foreground">Real-time sales data from your terminals.</p>
                </div>
                {/* Show Selector ONLY if user has no Organization ID (Super Admin) */}
                {!user?.organizationId && (
                    <div className="w-full md:w-auto">
                        <OrganizationSelector
                            value={selectedOrgId}
                            onSelect={(id: string) => setSelectedOrgId(id)}
                            className="w-[250px]"
                        />
                    </div>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Sales</CardTitle>
                    <CardDescription>
                        {loading ? 'Refeshing data...' : 'Showing latest transactions.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table className="text-vibepos-dark">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Payment</TableHead>
                                <TableHead>Terminal</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && sales.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Loading sales...
                                    </TableCell>
                                </TableRow>
                            )}
                            {!loading && sales.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No transactions found.
                                    </TableCell>
                                </TableRow>
                            )}
                            {sales.map((sale) => (
                                <TableRow key={sale.id}>
                                    <TableCell className="font-mono text-xs font-semibold">
                                        {sale.invoiceNumber || '—'}
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(sale.timestamp), "MMM dd, yyyy HH:mm")}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <CreditCard size={14} className="text-muted-foreground" />
                                            <span className="capitalize">{sale.paymentMethod?.toLowerCase()}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {sale.terminal ? (
                                                <Badge variant="outline" className="text-xs">
                                                    {sale.terminal.name}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">—</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={sale.status === 'COMPLETED' ? 'default' : 'secondary'}
                                            className={sale.status === 'COMPLETED' ? 'bg-green-100 text-green-700 hover:bg-green-200 border-none' : ''}
                                        >
                                            {sale.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        P {(sale.totalAmount ?? 0).toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

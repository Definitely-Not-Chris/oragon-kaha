import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, CreditCard, CheckCircle2, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function ClientPayments() {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    // Form State
    const [amount, setAmount] = useState("");
    const [referenceNo, setReferenceNo] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            const res = await api.getMyPaymentHistory();
            setPayments(res);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load payment history");
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.createPayment({
                amount: parseFloat(amount),
                referenceNo,
                notes: "Uploaded via Client Portal"
            });
            toast.success("Payment proof submitted successfully");
            setIsUploadOpen(false);
            setAmount("");
            setReferenceNo("");
            fetchPayments(); // Refresh list
        } catch (error) {
            toast.error("Failed to submit payment proof");
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium"><CheckCircle2 size={14} /> Approved</span>;
            case 'REJECTED':
                return <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-medium"><XCircle size={14} /> Rejected</span>;
            default:
                return <span className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full text-xs font-medium"><Clock size={14} /> Pending</span>;
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-vibepos-dark">Billing & Payments</h1>
                    <p className="text-muted-foreground">View your payment history and submit new proofs.</p>
                </div>
                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 bg-vibepos-primary hover:bg-vibepos-primary/90">
                            <Plus size={16} /> Submit Payment
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Submit Payment Proof</DialogTitle>
                            <DialogDescription>
                                Upload details of your bank transfer or GCash payment.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpload} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount">Amount Paid (PHP)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    placeholder="0.00"
                                    required
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ref">Reference Number / Trace No.</Label>
                                <Input
                                    id="ref"
                                    placeholder="e.g. 123456789"
                                    required
                                    value={referenceNo}
                                    onChange={e => setReferenceNo(e.target.value)}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={submitting}>
                                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Submit Proof
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="text-vibepos-primary" />
                        Payment History
                    </CardTitle>
                    <CardDescription>Recent transactions and their verification status.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Reference No.</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Notes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No payment records found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                payments.map((payment) => (
                                    <TableRow key={payment.id}>
                                        <TableCell>{format(new Date(payment.createdAt), 'MMM d, yyyy')}</TableCell>
                                        <TableCell className="font-mono">{payment.referenceNo}</TableCell>
                                        <TableCell className="font-bold">₱{payment.amount.toLocaleString()}</TableCell>
                                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                                        <TableCell className="text-right text-sm text-muted-foreground">
                                            {payment.notes || '-'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

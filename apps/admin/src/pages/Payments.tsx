import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, FileText, Loader2, Plus, Pencil, Calendar, Search } from "lucide-react";
import { api } from "@/lib/api";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrganizationSelector } from "@/components/OrganizationSelector";


export default function Payments() {
    const [proofs, setProofs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("PENDING");
    const [search, setSearch] = useState("");

    // Manual Entry Form State
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<"EXISTING" | "NEW">("EXISTING");
    const [formData, setFormData] = useState({
        organization_id: "",
        organizationName: "", // For new org
        amount: "",
        payment_method: "BANK_TRANSFER",
        reference_no: "",
        image_url: "https://via.placeholder.com/300?text=Manual+Entry"
    });
    const [submitting, setSubmitting] = useState(false);

    // Edit State
    const [editProof, setEditProof] = useState<any | null>(null);
    const [editForm, setEditForm] = useState({ amount: "", referenceNo: "" });

    // Approval State
    const [approveProofId, setApproveProofId] = useState<string | null>(null);
    const [approvalDuration, setApprovalDuration] = useState("30"); // days

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProofs();
        }, 500);
        return () => clearTimeout(timer);
    }, [search, activeTab]);

    const fetchProofs = async () => {
        setLoading(true);
        try {
            const status = activeTab === "HISTORY" ? undefined : "PENDING";
            const data = await api.getProofs(status, search);

            // Filter locally if HISTORY to exclude PENDING if desired, or show all?
            // API implementation: if no status, returns all.
            // Let's filter client side if we strictly want accepted/rejected in history
            if (activeTab === "HISTORY") {
                setProofs(data.filter((p: any) => p.status !== "PENDING"));
            } else {
                setProofs(data);
            }
        } catch (error) {
            console.error("Failed to fetch payment proofs", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (proof: any) => {
        setEditProof(proof);
        setEditForm({
            amount: proof.amount.toString(),
            referenceNo: proof.referenceNo || ""
        });
    };

    const submitEdit = async () => {
        if (!editProof) return;
        setProcessing(editProof.id);
        try {
            await api.updateProof(editProof.id, {
                amount: parseFloat(editForm.amount),
                referenceNo: editForm.referenceNo
            });
            setEditProof(null);
            fetchProofs();
        } catch (error) {
            alert("Failed to update payment");
        } finally {
            setProcessing(null);
        }
    };

    const openApprovalDialog = (id: string) => {
        setApproveProofId(id);
        setApprovalDuration("30"); // reset default
    };

    const confirmApproval = async () => {
        if (!approveProofId) return;
        setProcessing(approveProofId);
        try {
            await api.approveProof(approveProofId, {
                adminId: "admin",
                type: "PRO",
                maxBranches: 1,
                durationDays: parseInt(approvalDuration)
            });
            setApproveProofId(null);
            fetchProofs();
        } catch (error) {
            alert("Failed to approve payment");
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (id: string) => {
        const reason = prompt("Enter rejection reason:");
        if (!reason) return;

        setProcessing(id);
        try {
            await api.rejectProof(id, { adminId: "admin", reason });
            await fetchProofs();
        } catch (error) {
            alert("Failed to reject payment");
        } finally {
            setProcessing(null);
        }
    };

    const handleSubmitManual = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = { ...formData, amount: Number(formData.amount) };
            if (mode === 'NEW') {
                delete (payload as any).organization_id;
            } else {
                delete (payload as any).organizationName;
            }

            await api.createPayment(payload);
            setOpen(false);
            setFormData({
                organization_id: "",
                organizationName: "",
                amount: "",
                payment_method: "BANK_TRANSFER",
                reference_no: "",
                image_url: "https://via.placeholder.com/300?text=Manual+Entry"
            });
            await fetchProofs();
        } catch (error) {
            alert("Failed to create manual payment.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-vibepos-dark">Payment Approvals</h1>
                    <div className="text-sm text-muted-foreground mt-1">
                        Manage payment verifications and license grants.
                    </div>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" /> Record New Payment
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[450px]">
                        <DialogHeader>
                            <DialogTitle>Manual Payment Entry</DialogTitle>
                            <DialogDescription>
                                Record an over-the-counter or manual payment.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex gap-2 mb-4 border-b">
                            <button
                                className={`px-4 py-2 text-sm font-medium ${mode === 'EXISTING' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
                                onClick={() => setMode('EXISTING')}
                            >
                                Existing Customer
                            </button>
                            <button
                                className={`px-4 py-2 text-sm font-medium ${mode === 'NEW' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
                                onClick={() => setMode('NEW')}
                            >
                                New Organization
                            </button>
                        </div>

                        <form onSubmit={handleSubmitManual} className="grid gap-4">
                            {mode === 'EXISTING' ? (
                                <div className="grid gap-2">
                                    <Label htmlFor="orgId">Organization</Label>
                                    <OrganizationSelector
                                        value={formData.organization_id}
                                        onSelect={(id) => setFormData({ ...formData, organization_id: id })}
                                    />
                                </div>
                            ) : (
                                <div className="grid gap-2">
                                    <Label htmlFor="orgName">Organization Name</Label>
                                    <Input
                                        id="orgName"
                                        placeholder="e.g. My Coffee Shop"
                                        value={formData.organizationName}
                                        onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                                        required={mode === 'NEW'}
                                    />
                                    <p className="text-[10px] text-muted-foreground">A new Organization will be created automatically.</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="amount">Amount</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="method">Method</Label>
                                    <Select
                                        value={formData.payment_method}
                                        onValueChange={(val) => setFormData({ ...formData, payment_method: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Method" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                                            <SelectItem value="GCASH">GCash</SelectItem>
                                            <SelectItem value="PAYMAYA">PayMaya</SelectItem>
                                            <SelectItem value="CASH">Cash</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="ref">Reference No.</Label>
                                <Input
                                    id="ref"
                                    placeholder="OR Number or Ref ID"
                                    value={formData.reference_no}
                                    onChange={(e) => setFormData({ ...formData, reference_no: e.target.value })}
                                    required
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Record Payment
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center justify-between gap-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="PENDING">Pending Review</TabsTrigger>
                        <TabsTrigger value="HISTORY">Approve / Reject History</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="relative w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search Ref No. or Org..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <div className="">
                {loading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-vibepos-primary" />
                    </div>
                ) : proofs.length === 0 ? (
                    <div className="p-12 text-center border rounded-lg bg-white text-muted-foreground">
                        No records found.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {proofs.map((proof) => (
                            <Card key={proof.id}>
                                <CardContent className="flex items-center justify-between p-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-full ${proof.status === 'APPROVED' ? 'bg-green-100 text-green-600' :
                                            proof.status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                                                'bg-blue-100 text-blue-600'
                                            }`}>
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg flex gap-2 items-center">
                                                {proof.organization?.name || "Unknown Org"}
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${proof.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                    proof.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' :
                                                        'bg-red-50 text-red-700 border-red-200'
                                                    }`}>
                                                    {proof.status}
                                                </span>
                                            </h3>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <span className="font-semibold text-slate-800">₱{Number(proof.amount).toLocaleString()}</span>
                                                <span>•</span>
                                                <span>{proof.paymentMethod}</span>
                                                <span>•</span>
                                                <span className="font-mono">{proof.referenceNo}</span>
                                                {proof.status === 'PENDING' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 ml-2 text-muted-foreground hover:text-blue-600"
                                                        onClick={() => handleEditClick(proof)}
                                                    >
                                                        <Pencil className="w-3 h-3" />
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-400 mt-1">{new Date(proof.createdAt).toLocaleString()}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            className="text-blue-600 hover:text-blue-700"
                                            onClick={() => window.open(proof.imageUrl, '_blank')}
                                        >
                                            View Proof
                                        </Button>

                                        {proof.status === 'PENDING' && (
                                            <>
                                                <Button
                                                    variant="default"
                                                    className="bg-green-600 hover:bg-green-700 text-white gap-2"
                                                    disabled={!!processing}
                                                    onClick={() => openApprovalDialog(proof.id)}
                                                >
                                                    {processing === proof.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                    Approve
                                                </Button>

                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    disabled={!!processing}
                                                    onClick={() => handleReject(proof.id)}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>


            {/* Edit Payment Dialog */}
            <Dialog open={!!editProof} onOpenChange={(o) => !o && setEditProof(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Payment Details</DialogTitle>
                        <DialogDescription>Correct Amount or Reference Number.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="editAmount">Amount</Label>
                            <Input
                                id="editAmount"
                                type="number"
                                value={editForm.amount}
                                onChange={e => setEditForm({ ...editForm, amount: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="editRef">Reference No</Label>
                            <Input
                                id="editRef"
                                value={editForm.referenceNo}
                                onChange={e => setEditForm({ ...editForm, referenceNo: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditProof(null)}>Cancel</Button>
                        <Button onClick={submitEdit} disabled={!!processing}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Approval Duration Dialog */}
            <Dialog open={!!approveProofId} onOpenChange={(o) => !o && setApproveProofId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve & Extend License</DialogTitle>
                        <DialogDescription>
                            Select how much time to add to this organization's license.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <Label>Extension Duration</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant={approvalDuration === "30" ? "default" : "outline"}
                                onClick={() => setApprovalDuration("30")}
                                className="justify-start"
                            >
                                <Calendar className="w-4 h-4 mr-2" />
                                1 Month (+30 Days)
                            </Button>
                            <Button
                                variant={approvalDuration === "365" ? "default" : "outline"}
                                onClick={() => setApprovalDuration("365")}
                                className="justify-start"
                            >
                                <Calendar className="w-4 h-4 mr-2" />
                                1 Year (+365 Days)
                            </Button>
                            <Button
                                variant={approvalDuration === "7" ? "default" : "outline"}
                                onClick={() => setApprovalDuration("7")}
                                className="justify-start"
                            >
                                <Calendar className="w-4 h-4 mr-2" />
                                1 Week (+7 Days)
                            </Button>
                            <div className="flex items-center gap-2 border rounded-md px-3">
                                <span className="text-xs text-muted-foreground whitespace-nowrap">Custom Days:</span>
                                <Input
                                    className="border-0 h-9 p-0 focus-visible:ring-0"
                                    type="number"
                                    value={approvalDuration}
                                    onChange={e => setApprovalDuration(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setApproveProofId(null)}>Cancel</Button>
                        <Button onClick={confirmApproval} disabled={!!processing} className="bg-green-600 hover:bg-green-700 text-white">
                            Confirm Approval
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}

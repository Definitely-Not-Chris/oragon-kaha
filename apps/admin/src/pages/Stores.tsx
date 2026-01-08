import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Trash2, Store, MapPin, Phone } from "lucide-react";
import { api } from "@/lib/api";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Stores() {
    const [stores, setStores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        contact_email: "",
    });

    useEffect(() => {
        fetchStores();
    }, []);

    const fetchStores = async () => {
        setLoading(true);
        try {
            const data = await api.getOrganizations();
            setStores(data);
        } catch (error) {
            console.error("Failed to fetch stores");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.createOrganization(formData);
            setOpen(false);
            setFormData({ name: "", contact_email: "" });
            await fetchStores();
        } catch (error) {
            alert("Failed to create store");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this store?")) return;
        try {
            await api.deleteOrganization(id);
            await fetchStores();
        } catch (error) {
            alert("Failed to delete store");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-vibepos-dark">Stores & Organizations</h1>
                    <div className="text-sm text-muted-foreground mt-1">
                        Manage customer accounts and store branches.
                    </div>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" /> Add Organization
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Organization</DialogTitle>
                            <DialogDescription>
                                Create a new organization or store entity.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Store Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Contact Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.contact_email}
                                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Create
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-vibepos-primary" />
                </div>
            ) : stores.length === 0 ? (
                <div className="p-12 text-center border rounded-lg bg-white text-muted-foreground">
                    No organizations found.
                </div>
            ) : (
                <div className="grid gap-4">
                    {stores.map((store) => (
                        <Card key={store.id}>
                            <CardContent className="flex items-center justify-between p-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-full bg-blue-50 text-blue-600">
                                        <Store className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{store.name}</h3>
                                        <div className="flex gap-4 text-sm text-muted-foreground">
                                            <span>ID: <span className="font-mono">{store.id.substring(0, 8)}...</span></span>
                                            {store.contactEmail && <span>{store.contactEmail}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleDelete(store.id)}
                                    >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                        Manage
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

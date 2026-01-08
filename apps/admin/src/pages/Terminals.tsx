import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { OrganizationSelector } from "../components/OrganizationSelector";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Laptop, Clock } from "lucide-react";
import { format } from "date-fns";

interface Terminal {
    id: string;
    name: string;
    counter: number;
    deviceId?: string;
    lastSeen: string;
    createdAt: string;
    organizationId: string;
}

export default function Terminals() {
    const [terminals, setTerminals] = useState<Terminal[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedOrgId, setSelectedOrgId] = useState<string>("");

    useEffect(() => {
        if (selectedOrgId) {
            loadTerminals();
        } else {
            setTerminals([]);
        }
    }, [selectedOrgId]);

    const loadTerminals = async () => {
        setLoading(true);
        try {
            const data = await api.getTerminals(selectedOrgId);
            setTerminals(data);
        } catch (error) {
            console.error("Failed to load terminals", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Terminals</h2>
                    <p className="text-muted-foreground">
                        Manage POS terminals and view their status.
                    </p>
                </div>
                <div className="w-full md:w-auto">
                    <OrganizationSelector
                        value={selectedOrgId}
                        onSelect={(id) => setSelectedOrgId(id)}
                        className="w-[250px]"
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Terminals
                        </CardTitle>
                        <Laptop className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{terminals.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Registered devices
                        </p>
                    </CardContent>
                </Card>

                {/* Placeholder for Online Status count if we had real-time status */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Active Recently
                        </CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {/* Simple logic: Last seen within 24h */}
                        <div className="text-2xl font-bold">
                            {terminals.filter(t => {
                                const diff = new Date().getTime() - new Date(t.lastSeen).getTime();
                                return diff < 24 * 60 * 60 * 1000;
                            }).length}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Seen in last 24h
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Registered Devices</CardTitle>
                    <CardDescription>
                        List of all terminals registered to the selected organization.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!selectedOrgId ? (
                        <div className="text-center py-10 text-muted-foreground">
                            Please select an organization to view terminals.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Termianl Name</TableHead>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Registered</TableHead>
                                    <TableHead>Last Seen</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {terminals.length === 0 && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                            No terminals found.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {terminals.map((terminal) => (
                                    <TableRow key={terminal.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <div className="bg-primary/10 p-2 rounded-full">
                                                    <Laptop size={16} className="text-primary" />
                                                </div>
                                                {terminal.name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-muted-foreground">
                                            {terminal.id}
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(terminal.createdAt), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(terminal.lastSeen), "MMM d, yyyy HH:mm")}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                Registered
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

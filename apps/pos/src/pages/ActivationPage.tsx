import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { Loader2, Lock, Monitor, Plus } from "lucide-react";
import { PWAInstallPrompt } from "@/components/layout/PWAInstallPrompt";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

export default function ActivationPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Terminal Linking State
    const [showSelection, setShowSelection] = useState(false);
    const [terminals, setTerminals] = useState<any[]>([]);
    const [orgId, setOrgId] = useState("");
    const [processingSelection, setProcessingSelection] = useState(false);

    // Confirmation State
    const [confirmation, setConfirmation] = useState<{
        isOpen: boolean;
        type: 'link' | 'create' | null;
        terminal?: any;
    }>({
        isOpen: false,
        type: null,
        terminal: null
    });

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("vibepos_pos_token");
        const licenseKey = localStorage.getItem("vibepos_license_key");
        if (token && licenseKey) {
            navigate("/");
        }
    }, [navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // 1. Authenticate
            const authRes = await api.auth.login(username, password);
            localStorage.setItem("vibepos_pos_token", authRes.access_token);
            localStorage.setItem("vibepos_user", JSON.stringify(authRes.user));

            // 2. Fetch License
            const license = await api.licensing.getMyLicense();
            if (!license) {
                throw new Error("No active license found for this account.");
            }

            localStorage.setItem("vibepos_license_key", license.key);
            localStorage.setItem("vibepos_license_valid_until", license.validUntil || "");

            // 3. Robust Terminal Validation (Server-Side Check)
            // Always fetch existing terminals first to validate the current one
            const existingTerminals = await api.terminals.list(license.organizationId);
            const currentTerminalId = localStorage.getItem("vibepos_terminal_id");

            if (currentTerminalId) {
                // Check if our stored terminal actually belongs to this organization
                const isValid = existingTerminals.find(t => t.id === currentTerminalId);

                if (!isValid) {
                    console.warn(`Terminal ID ${currentTerminalId} not found in Organization ${license.organizationId}. Wiping credential.`);
                    localStorage.removeItem("vibepos_terminal_id");
                    localStorage.removeItem("vibepos_terminal_name");
                    // We don't need vibepos_organization_id anymore
                    localStorage.removeItem("vibepos_organization_id");
                }
            }

            // 4. Check for Existing Terminals (or Re-Link)
            // Re-check localStorage because we might have just wiped it
            if (!localStorage.getItem("vibepos_terminal_id")) {
                if (existingTerminals.length > 0) {
                    setTerminals(existingTerminals);
                    setShowSelection(true);
                    setOrgId(license.organizationId);
                    setLoading(false); // Stop loading to show modal
                    return; // PAUSE HERE
                } else {
                    // No terminals? Auto-register
                    await registerTerminal(license.organizationId);
                }
            }

            // 5. Redirect
            navigate("/");

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Login failed");
            localStorage.removeItem("vibepos_pos_token"); // Cleanup
            setLoading(false);
        }
    };

    const registerTerminal = async (organizationId: string) => {
        const terminal = await api.terminals.register(organizationId);
        localStorage.setItem("vibepos_terminal_id", terminal.terminal_id);
        localStorage.setItem("vibepos_terminal_name", terminal.name);
        console.log("Terminal Registered:", terminal);
    };

    const handleRegisterClick = () => {
        setConfirmation({ isOpen: true, type: 'create' });
    };

    const handleLinkClick = (terminal: any) => {
        setConfirmation({ isOpen: true, type: 'link', terminal });
    };

    const handleConfirmAction = async () => {
        setProcessingSelection(true);
        try {
            if (confirmation.type === 'create') {
                await registerTerminal(orgId);
                navigate("/");
            } else if (confirmation.type === 'link' && confirmation.terminal) {
                localStorage.setItem("vibepos_terminal_id", confirmation.terminal.id);
                localStorage.setItem("vibepos_terminal_name", confirmation.terminal.name);
                navigate("/");
            }
        } catch (err) {
            setError("Failed to process request");
            setProcessingSelection(false);
        }
        setConfirmation({ isOpen: false, type: null, terminal: null });
    };

    const getConfirmationProps = () => {
        if (confirmation.type === 'create') {
            return {
                title: "Register New Terminal?",
                message: "This will create a completely new identity for this device (e.g. Terminal #3). Use this only if this is a brand new device.",
                confirmLabel: "Yes, Create New"
            };
        }
        return {
            title: `Link to ${confirmation.terminal?.name}?`,
            message: "This will restore the identity and history of this terminal on this device.",
            confirmLabel: "Yes, Link Terminal"
        };
    };

    const { title, message, confirmLabel } = getConfirmationProps();

    return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-50 px-4">
            <ConfirmationModal
                isOpen={confirmation.isOpen}
                onClose={() => setConfirmation({ isOpen: false, type: null, terminal: null })}
                onConfirm={handleConfirmAction}
                title={title}
                message={message}
                confirmLabel={confirmLabel}
            />

            <Card className="w-full max-w-sm relative z-10">
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <Lock className="w-6 h-6 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl text-center">Terminal Activation</CardTitle>
                    <CardDescription className="text-center">
                        Login with your Client Account to activate this terminal.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="grid gap-4">
                        {error && (
                            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                                {error}
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="client1"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Activate Terminal
                        </Button>
                    </CardFooter>
                </form>

            </Card>

            {/* Custom Modal for Terminal Selection */}
            {showSelection && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
                    <Card className="w-full max-w-md shadow-lg animate-in zoom-in-95 duration-200 bg-white">
                        <CardHeader>
                            <CardTitle>Link Terminal</CardTitle>
                            <CardDescription>
                                We found existing terminals for this store. Do you want to link this device to one of them?
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3">
                                <Button
                                    variant="outline"
                                    className="justify-between h-auto py-3 px-4 hover:border-primary hover:bg-primary/5 transition-colors"
                                    onClick={handleRegisterClick}
                                    disabled={processingSelection}
                                >
                                    <div className="flex flex-col items-start gap-1">
                                        <span className="font-semibold flex items-center gap-2">
                                            <Plus className="w-4 h-4" />
                                            Register as New Terminal
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            Create a fresh identity (Terminal #{terminals.length + 1})
                                        </span>
                                    </div>
                                </Button>

                                <div className="relative py-2">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-background px-2 text-muted-foreground">
                                            Or Select Existing
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                    {terminals.map((t) => (
                                        <Button
                                            key={t.id}
                                            variant="ghost"
                                            className="w-full justify-start h-auto py-3 hover:bg-primary/10 hover:text-primary transition-all duration-200 border border-transparent hover:border-primary/20"
                                            onClick={() => handleLinkClick(t)}
                                            disabled={processingSelection}
                                        >
                                            <div className="flex flex-col items-start gap-1">
                                                <div className="font-medium flex items-center gap-2">
                                                    <Monitor className="w-4 h-4 text-vibepos-primary" />
                                                    {t.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground font-mono">
                                                    ID: {t.id.substring(0, 8)}...
                                                </div>
                                            </div>
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="absolute bottom-4 left-0 right-0 flex justify-center z-0">
                <PWAInstallPrompt />
            </div>
        </div >
    );
}

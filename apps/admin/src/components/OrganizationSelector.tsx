import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { api } from "@/lib/api";

interface OrganizationSelectorProps {
    value?: string;
    onSelect: (orgId: string, orgName: string) => void;
    placeholder?: string;
    className?: string;
}

export function OrganizationSelector({ value, onSelect, placeholder = "Select organization...", className }: OrganizationSelectorProps) {
    const [open, setOpen] = useState(false);
    const [orgs, setOrgs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchOrgs = async () => {
            setLoading(true);
            try {
                const data = await api.getOrganizations();
                setOrgs(data);
            } catch (error) {
                console.error("Failed to fetch organizations", error);
            } finally {
                setLoading(false);
            }
        };

        if (open && orgs.length === 0) {
            fetchOrgs();
        }
    }, [open]);

    const selectedOrg = orgs.find((org) => org.id === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between bg-white", className)}
                >
                    {value
                        ? (selectedOrg?.name || "Unknown Organization")
                        : (loading ? "Loading..." : placeholder)}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 bg-white shadow-lg border border-slate-200">
                <Command className="bg-white">
                    <CommandInput placeholder="Search organization..." />
                    <CommandList>
                        <CommandEmpty>No organization found.</CommandEmpty>
                        <CommandGroup>
                            {orgs.map((org) => (
                                <CommandItem
                                    key={org.id}
                                    value={org.name}
                                    onSelect={() => {
                                        onSelect(org.id, org.name);
                                        setOpen(false);
                                    }}
                                    className="cursor-pointer hover:bg-slate-100"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === org.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <span className="font-medium">{org.name}</span>
                                    {org.contactEmail && (
                                        <span className="ml-2 text-xs text-muted-foreground truncate">
                                            {org.contactEmail}
                                        </span>
                                    )}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

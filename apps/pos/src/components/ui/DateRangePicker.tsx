import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { format, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from "date-fns"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

type DatePreset = 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'LAST_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'ALL'

interface DateRangePickerProps {
    className?: string
    date: DateRange | undefined
    setDate: (date: DateRange | undefined) => void
    onPresetSelect?: (preset: DatePreset) => void
}

export function DateRangePicker({
    className,
    date,
    setDate,
    onPresetSelect
}: DateRangePickerProps) {
    const [activePreset, setActivePreset] = React.useState<DatePreset | 'CUSTOM'>('ALL')

    const handlePresetClick = (preset: DatePreset) => {
        setActivePreset(preset)
        const now = new Date()

        // Notify parent if needed for external filtering state (e.g. legacy 'dateFilter' string)
        if (onPresetSelect) {
            onPresetSelect(preset);
        }

        switch (preset) {
            case 'TODAY':
                setDate({ from: startOfDay(now), to: endOfDay(now) })
                break
            case 'YESTERDAY':
                const y = subDays(now, 1)
                setDate({ from: startOfDay(y), to: endOfDay(y) })
                break
            case 'THIS_WEEK':
                setDate({ from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) })
                break
            case 'LAST_WEEK':
                const lastWeek = subWeeks(now, 1)
                setDate({ from: startOfWeek(lastWeek, { weekStartsOn: 1 }), to: endOfWeek(lastWeek, { weekStartsOn: 1 }) })
                break
            case 'THIS_MONTH':
                setDate({ from: startOfMonth(now), to: endOfMonth(now) })
                break
            case 'LAST_MONTH':
                const lastMonth = subMonths(now, 1)
                setDate({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) })
                break
            case 'ALL':
                setDate(undefined)
                break
        }
    }

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[260px] justify-start text-left font-normal bg-white hover:bg-gray-50",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "LLL dd, y")} -{" "}
                                    {format(date.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(date.from, "LLL dd, y")
                            )
                        ) : (
                            <span>Pick a date range</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <div className="flex">
                        <div className="border-r border-gray-100 p-2 flex flex-col gap-1 w-[140px] bg-white">
                            {(['ALL', 'TODAY', 'YESTERDAY', 'THIS_WEEK', 'LAST_WEEK', 'THIS_MONTH', 'LAST_MONTH'] as const).map(preset => (
                                <button
                                    key={preset}
                                    onClick={() => handlePresetClick(preset)}
                                    className={cn(
                                        "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                                        activePreset === preset ? "bg-vibepos-primary/10 text-vibepos-primary font-medium" : "text-gray-600 hover:bg-gray-50"
                                    )}
                                >
                                    {preset === 'ALL' ? 'All Time' : preset.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                                </button>
                            ))}
                        </div>
                        <div className="p-2 bg-white">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={(newDate) => {
                                    setDate(newDate)
                                    setActivePreset('CUSTOM')
                                    // We don't necessarily need onPresetSelect('CUSTOM') unless parent tracks it strictly
                                }}
                                numberOfMonths={2}
                            />
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}

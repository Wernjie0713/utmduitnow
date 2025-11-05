"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/Components/ui/button"
import { Calendar } from "@/Components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/Components/ui/popover"

export function DateRangePicker({
  className,
  value,
  onChange,
  ...props
}) {
  // Initialize with proper structure
  const [date, setDate] = React.useState(() => {
    if (value && (value.from || value.to)) {
      return value
    }
    return { from: undefined, to: undefined }
  })

  React.useEffect(() => {
    if (value && (value.from || value.to)) {
      setDate(value)
    } else if (value === null || value === undefined) {
      setDate({ from: undefined, to: undefined })
    }
  }, [value])

  const handleSelect = (range) => {
    // Handle undefined or null range - reset to empty state
    if (!range) {
      const newRange = { from: undefined, to: undefined }
      setDate(newRange)
      if (onChange) {
        onChange(newRange)
      }
      return
    }

    // react-day-picker in range mode always provides an object with from/to
    // Ensure we always have a valid structure
    const newRange = {
      from: range.from || undefined,
      to: range.to || undefined
    }
    
    // Only update if we have at least a from date (start of range)
    // This allows users to select start date first, then end date
    setDate(newRange)
    if (onChange) {
      onChange(newRange)
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
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date && date.from ? (
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
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date && date.from ? date.from : new Date()}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={1}
            {...props}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}


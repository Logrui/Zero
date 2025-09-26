"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  PlusIcon,
  ZapIcon,
  SearchIcon,
  LayersIcon,
  CalendarIcon,
  XIcon,
  ListIcon,
  GridIcon,
  ClockIcon,
  CalendarDaysIcon,
  UsersIcon,
  FilterIcon,
} from "lucide-react"
import { type CalendarEvent, getEvents, getUserCategories, getSharedEvents } from "../lib/calendar"
import { EventDialog } from "./event-dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useActiveConnection } from "@/hooks/use-connections"
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addDays,
  subDays,
  addMonths,
  subMonths,
  parseISO,
  isWithinInterval,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  getMonth,
  getYear,
  getDate,
  addYears,
  subYears,
  getDay,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
} from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { NaturalLanguageEventDialog } from "./natural-language-event-dialog"


// Dynamic calendar types based on user's actual calendars
const getCalendarTypes = (activeConnection: any) => {
  const baseTypes = {
    personal: { name: "Personal", color: "bg-blue-500" },
    work: { name: "Work", color: "bg-green-500" },
    family: { name: "Family", color: "bg-purple-500" },
    shared: { name: "Shared", color: "bg-yellow-500" },
  };
  
  // Add provider-specific calendars if available
  if (activeConnection?.data?.providerId === 'google') {
    return {
      ...baseTypes,
      google: { name: "Google Calendar", color: "bg-red-500" },
    };
  }
  
  if (activeConnection?.data?.providerId === 'outlook') {
    return {
      ...baseTypes,
      outlook: { name: "Outlook Calendar", color: "bg-blue-600" },
    };
  }
  
  return baseTypes;
};


// Dynamic category colors - generates colors based on category names
const getCategoryColor = (categoryName: string): string => {
  const predefinedColors: Record<string, string> = {
    Work: "bg-green-500",
    Personal: "bg-blue-500",
    Family: "bg-purple-500",
    Imported: "bg-yellow-500",
    Meeting: "bg-red-500",
    Appointment: "bg-indigo-500",
    Holiday: "bg-pink-500",
    Travel: "bg-orange-500",
    Birthday: "bg-teal-500",
  };
  
  // Return predefined color if exists
  if (predefinedColors[categoryName]) {
    return predefinedColors[categoryName];
  }
  
  // Generate consistent color based on category name hash
  const colors = [
    "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500",
    "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500",
    "bg-orange-500", "bg-cyan-500", "bg-lime-500", "bg-amber-500"
  ];
  
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = ((hash << 5) - hash + categoryName.charCodeAt(i)) & 0xffffffff;
  }
  
  return colors[Math.abs(hash) % colors.length];
};

interface MultiCalendarViewProps {
  initialEvents: CalendarEvent[]
  initialCategories?: string[]
}

export function MultiCalendarView({ initialEvents, initialCategories = [] }: MultiCalendarViewProps) {
  const activeConnection = useActiveConnection()
  const calendarTypes = useMemo(() => getCalendarTypes(activeConnection), [activeConnection])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [view, setView] = useState<"month" | "week" | "day" | "year" | "agenda">("week")
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [showNaturalLanguageDialog, setShowNaturalLanguageDialog] = useState(false)
  // const [showChatPanel, setShowChatPanel] = useState(false) // Removed to prevent duplicate AI panel
  const [searchQuery, setSearchQuery] = useState("")
  const [categories, setCategories] = useState<string[]>(initialCategories)
  const [visibleCalendars, setVisibleCalendars] = useState<Record<string, boolean>>({
    personal: true,
    work: true,
    family: true,
    shared: true,
  })
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [isCalendarDrawerOpen, setIsCalendarDrawerOpen] = useState(true)
  const [expandedSections, setExpandedSections] = useState({ myCalendars: true, sharedCalendars: true })
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadTick, setReloadTick] = useState(0)
  const [sharedEvents, setSharedEvents] = useState<CalendarEvent[]>([])
  const [agendaRange, setAgendaRange] = useState<"day" | "week" | "month">("week")
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false)

  // Visual constants
  const WEEK_HOUR_PX = 60 // 60px per hour (about 30% taller than the previous look)

  // Keep time indicator live
  const [now, setNow] = useState<Date>(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])


  useEffect(() => {
    const fetchEvents = async () => {
      console.log('🚀 [MultiCalendarView] Starting fetchEvents', {
        currentDate: currentDate.toISOString(),
        view,
        agendaRange,
        activeConnection: activeConnection?.data
      });

      setIsLoading(true)
      setLoadError(null)
      try {
        let startDate: Date, endDate: Date


        if (view === "month") {

          startDate = startOfMonth(currentDate)
          if (!startDate) startDate = new Date(currentDate)


          endDate = endOfMonth(currentDate)
          if (!endDate) endDate = new Date(currentDate)


          const firstDayOfWeek = getDay(startDate)
          startDate = subDays(startDate, firstDayOfWeek)

          const lastDayOfWeek = getDay(endDate)
          endDate = addDays(endDate, 6 - lastDayOfWeek)
        } else if (view === "week") {
          startDate = startOfWeek(currentDate)
          endDate = endOfWeek(currentDate)
        } else if (view === "year") {
          startDate = startOfYear(currentDate)
          endDate = endOfYear(currentDate)
        } else if (view === "agenda") {
          if (agendaRange === "day") {
            startDate = setHours(setMinutes(setSeconds(setMilliseconds(currentDate, 0), 0), 0), 0)
            endDate = setHours(setMinutes(setSeconds(setMilliseconds(currentDate, 999), 59), 59), 23)
          } else if (agendaRange === "week") {
            startDate = startOfWeek(currentDate)
            endDate = endOfWeek(currentDate)
          } else {
            startDate = startOfMonth(currentDate)
            endDate = endOfMonth(currentDate)
          }
        } else {

          startDate = new Date(currentDate)
          startDate.setHours(0, 0, 0, 0)
          endDate = new Date(currentDate)
          endDate.setHours(23, 59, 59, 999)
        }


        console.log('📅 [MultiCalendarView] Fetching events for date range', {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });

        const fetchedEvents = await getEvents(startDate, endDate)
        console.log('📊 [MultiCalendarView] Events received from getEvents', {
          eventCount: fetchedEvents?.length || 0,
          events: fetchedEvents
        });

        if (!fetchedEvents || fetchedEvents.length === 0) {
          console.log('⚠️ [MultiCalendarView] No events returned from getEvents')
        }

        setEvents(fetchedEvents || [])


        try {
          const fetchedSharedEvents = await getSharedEvents(startDate, endDate)

          const filteredSharedEvents = (fetchedSharedEvents || []).filter((event) => {
            if (!event || !event.start) return false
            try {
              const eventStart = parseISO(event.start)
              return isWithinInterval(eventStart, { start: startDate, end: endDate })
            } catch (error) {
              console.error("Error filtering shared event:", error)
              return false
            }
          })
          setSharedEvents(filteredSharedEvents)
        } catch (sharedError) {
          console.error("[Calendar] Error fetching shared events:", sharedError)
          setSharedEvents([])
        }


        // try {
        //   const fetchedCategories = await getUserCategories()
        //   // Normalize to a string[] of category names/ids for filtering UI
        //   const names: string[] = (fetchedCategories || []).map((c: any) =>
        //     typeof c === "string" ? c : (c?.name ?? c?.id ?? "")
        //   ).filter(Boolean)
        //   setCategories(names)
        // } catch (categoriesError) {
        //   console.error("[Calendar] Error fetching categories:", categoriesError)
        //   setCategories([])
        // }
      } catch (error: any) {
        console.error("[Calendar] Error fetching calendar data:", error)
        setEvents([])
        setSharedEvents([])
        setLoadError(error?.message || "Failed to load calendar data.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [currentDate, view, agendaRange, reloadTick])


  const filteredEvents = useMemo(() => {

    const allEvents = [...events, ...sharedEvents]


    let filtered = allEvents


    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (event) =>
          (event.title && event.title.toLowerCase().includes(query)) ||
          (event.description && event.description.toLowerCase().includes(query)) ||
          (event.location && event.location.toLowerCase().includes(query)),
      )
    }


    // if (selectedCategories.length > 0) {
    //   filtered = filtered.filter((event) => event.categoryId && selectedCategories.includes(event.categoryId as string))
    // }


    filtered = filtered.filter((event) => {
      // Shared calendar visibility
      if (event.isShared && visibleCalendars.shared) return true
      // Personal/google visibility
      if (event.source === "google" && visibleCalendars.personal) return true
      // Fallback to personal if not marked shared and visible
      if (!event.isShared && visibleCalendars.personal) return true
      return false
    })

    return filtered
  }, [events, sharedEvents, searchQuery, selectedCategories, visibleCalendars])


  const daysInMonth = useMemo(() => {
    if (view !== "month") return []

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)


    const startingDayOfWeek = firstDay.getDay()


    const calendarStart = subDays(firstDay, startingDayOfWeek)


    const calendarEnd = addDays(calendarStart, 41)


    const daysInterval = eachDayOfInterval({ start: calendarStart, end: calendarEnd })


    return daysInterval.map((date) => {
      const dayEvents = filteredEvents.filter((event) => {
        if (!event.start) return false
        const eventStart = new Date(event.start)
        return isSameDay(eventStart, date)
      })

      return {
        date,
        isCurrentMonth: isSameMonth(date, currentDate),
        events: dayEvents,
      }
    })
  }, [currentDate, filteredEvents, view])


  const daysInWeek = useMemo(() => {
    if (view !== "week") return []

    const weekStart = startOfWeek(currentDate)
    const weekEnd = endOfWeek(currentDate)
    const daysInterval = eachDayOfInterval({ start: weekStart, end: weekEnd })

    return daysInterval.map((date) => {
      const dayEvents = filteredEvents.filter((event) => {
        if (!event.start) return false
        const eventStart = new Date(event.start)
        return isSameDay(eventStart, date)
      })

      return {
        date,
        events: dayEvents,
      }
    })
  }, [currentDate, filteredEvents, view])


  const eventsForDay = useMemo(() => {
    if (view !== "day") return []

    return filteredEvents.filter((event) => {
      if (!event.start) return false
      const eventStart = new Date(event.start)
      return isSameDay(eventStart, currentDate)
    })
  }, [currentDate, filteredEvents, view])


  const monthsInYear = useMemo(() => {
    if (view !== "year") return []

    const yearStart = startOfYear(currentDate)
    const yearEnd = endOfYear(currentDate)
    const monthsInterval = eachMonthOfInterval({ start: yearStart, end: yearEnd })

    return monthsInterval.map((month) => {
      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)


      const monthEvents = filteredEvents.filter((event) => {
        if (!event.start) return false
        const eventStart = new Date(event.start)
        return isWithinInterval(eventStart, { start: monthStart, end: monthEnd })
      })


      const firstDayOfMonth = getDay(monthStart)
      const calendarStart = subDays(monthStart, firstDayOfMonth)
      const daysToShow = 35
      const calendarEnd = addDays(calendarStart, daysToShow - 1)

      const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd }).map((date) => {
        const dayEvents = filteredEvents.filter((event) => {
          const eventStart = new Date(event.start)
          return isSameDay(eventStart, date)
        })

        return {
          date,
          isCurrentMonth: isSameMonth(date, month),
          events: dayEvents,
        }
      })

      return {
        month,
        events: monthEvents,
        days,
      }
    })
  }, [currentDate, filteredEvents, view])


  const eventsForAgenda = useMemo(() => {
    if (view !== "agenda") return { startDate: currentDate, endDate: currentDate, eventsByDate: {} as Record<string, CalendarEvent[]> }

    let startDate: Date, endDate: Date

    if (agendaRange === "day") {
      startDate = setHours(setMinutes(setSeconds(setMilliseconds(currentDate, 0), 0), 0), 0)
      endDate = setHours(setMinutes(setSeconds(setMilliseconds(currentDate, 999), 59), 59), 23)
    } else if (agendaRange === "week") {
      startDate = startOfWeek(currentDate)
      endDate = endOfWeek(currentDate)
    } else {
      startDate = startOfMonth(currentDate)
      endDate = endOfMonth(currentDate)
    }


    const rangeEvents = filteredEvents.filter((event) => {
      if (!event.start) return false
      const eventStart = new Date(event.start)
      return isWithinInterval(eventStart, { start: startDate, end: endDate })
    })


    const eventsByDate: Record<string, CalendarEvent[]> = {}

    rangeEvents.forEach((event) => {
      const eventDate = new Date(event.start)
      const dateKey = format(eventDate, "yyyy-MM-dd")

      if (!eventsByDate[dateKey]) {
        eventsByDate[dateKey] = []
      }

      eventsByDate[dateKey].push(event)
    })


    Object.keys(eventsByDate).forEach((dateKey) => {
      eventsByDate[dateKey].sort((a, b) => {
        return new Date(a.start).getTime() - new Date(b.start).getTime()
      })
    })

    return {
      startDate,
      endDate,
      eventsByDate,
    }
  }, [currentDate, filteredEvents, view, agendaRange])


  const handlePrevious = useCallback(() => {
    if (view === "month") {
      setCurrentDate((prev) => subMonths(prev, 1))
    } else if (view === "week") {
      setCurrentDate((prev) => subDays(prev, 7))
    } else if (view === "year") {
      setCurrentDate((prev) => subYears(prev, 1))
    } else {
      setCurrentDate((prev) => subDays(prev, 1))
    }
  }, [view])

  const handleNext = useCallback(() => {
    if (view === "month") {
      setCurrentDate((prev) => addMonths(prev, 1))
    } else if (view === "week") {
      setCurrentDate((prev) => addDays(prev, 7))
    } else if (view === "year") {
      setCurrentDate((prev) => addYears(prev, 1))
    } else {
      setCurrentDate((prev) => addDays(prev, 1))
    }
  }, [view])

  const handleToday = useCallback(() => {
    setCurrentDate(new Date())
  }, [])


  const handleEventClick = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event)
    setShowEventDialog(true)
  }, [])

  const handleCreateEvent = useCallback(() => {
    setSelectedEvent(null)
    setShowEventDialog(true)
  }, [])

  const handleCreateWithNaturalLanguage = useCallback(() => {
    setShowNaturalLanguageDialog(true)
  }, [])

  const handleAIToolExecution = useCallback(
    async (result: any) => {
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

      const refreshedEvents = await getEvents(startDate, endDate)
      setEvents(refreshedEvents)
    },
    [currentDate],
  )


  const toggleCalendarVisibility = useCallback((calendarKey: string) => {
    setVisibleCalendars((prev) => ({
      ...prev,
      [calendarKey]: !prev[calendarKey],
    }))
  }, [])

  // const toggleCategoryFilter = useCallback((category: string) => {
  //   setSelectedCategories((prev) => {
  //     if (prev.includes(category)) {
  //       return prev.filter((c) => c !== category)
  //     } else {
  //       return [...prev, category]
  //     }
  //   })
  // }, [])

  const getEventColor = useCallback((event: CalendarEvent) => {
    // Prefer categoryId-driven coloring if available
    // if ((event as any).categoryId) {
    //   return getCategoryColor((event as any).categoryId as string)
    // }

    // Shared events color
    if ((event as any).isShared) {
      return calendarTypes.shared.color
    }

    // Source-based fallback
    if (event.source === "google") {
      return calendarTypes.personal.color
    }

    return "bg-gray-500"
  }, [calendarTypes])


  const viewTitle = useMemo(() => {
    if (view === "month") {
      return format(currentDate, "MMMM yyyy")
    } else if (view === "week") {
      const weekStart = startOfWeek(currentDate)
      const weekEnd = endOfWeek(currentDate)
      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${format(weekStart, "MMM d")} - ${format(weekEnd, "d, yyyy")}`
      } else if (weekStart.getFullYear() === weekEnd.getFullYear()) {
        return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`
      } else {
        return `${format(weekStart, "MMM d, yyyy")} - ${format(weekEnd, "MMM d, yyyy")}`
      }
    } else if (view === "year") {
      return format(currentDate, "yyyy")
    } else if (view === "agenda") {
      if (agendaRange === "day") {
        return format(currentDate, "EEEE, MMMM d, yyyy")
      } else if (agendaRange === "week") {
        const weekStart = startOfWeek(currentDate)
        const weekEnd = endOfWeek(currentDate)
        return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`
      } else {
        return format(currentDate, "MMMM yyyy")
      }
    } else {
      return format(currentDate, "EEEE, MMMM d, yyyy")
    }
  }, [currentDate, view, agendaRange])

  return (
    <div className="h-full w-full mx-auto flex flex-col bg-background rounded-2xl shadow-2xl border border-border/20 overflow-hidden backdrop-blur-sm scrollbar-hide">
      {/* Enhanced Modern Header */}
      <div className="relative border-b border-border/30 bg-background sticky top-0 z-20">
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 p-8">
          <div className="flex items-center gap-8">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-gradient-to-b from-primary to-primary/60 rounded-full" />
                <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent tracking-tight">{viewTitle}</h1>
              </div>
              <p className="text-sm text-muted-foreground/80 ml-4 font-medium">Organize your time, achieve your goals</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-background/60 backdrop-blur-sm rounded-full p-1 border border-border/40 shadow-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevious}
                  className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-300 hover:scale-105"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNext}
                  className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-300 hover:scale-105"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToday}
                className="h-9 px-4 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30 hover:from-primary/20 hover:to-accent/20 hover:border-primary/50 transition-all duration-300 text-sm font-semibold hover:shadow-lg hover:scale-105"
              >
                Today
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            {/* Enhanced Search */}
            <div className="relative group">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
              <Input
                placeholder="Search events..."
                className="pl-11 pr-4 w-72 h-10 rounded-2xl border-border/40 bg-background/60 backdrop-blur-md text-sm focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md focus-visible:shadow-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Enhanced View Selector */}
            {(() => {
              const selectViewValue = view === "year" || view === "agenda" ? "month" : view
              return (
                <Select value={selectViewValue} onValueChange={(v) => setView(v as "month" | "week" | "day") }>
                  <SelectTrigger className="w-32 h-10 rounded-2xl border-border/40 bg-background/60 backdrop-blur-md text-sm font-medium hover:bg-background/80 transition-all duration-300 shadow-sm hover:shadow-md">
                    <SelectValue placeholder="View" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border/30 backdrop-blur-xl bg-background/95 shadow-xl">
                    <SelectItem value="month" className="rounded-xl cursor-pointer hover:bg-primary/10 transition-colors duration-200">Month</SelectItem>
                    <SelectItem value="week" className="rounded-xl cursor-pointer hover:bg-primary/10 transition-colors duration-200">Week</SelectItem>
                    <SelectItem value="day" className="rounded-xl cursor-pointer hover:bg-primary/10 transition-colors duration-200">Day</SelectItem>
                  </SelectContent>
                </Select>
              )
            })()}

            {/* Enhanced Action Buttons */}
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-10 w-10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md",
                        isCalendarDrawerOpen 
                          ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 hover:scale-105" 
                          : "bg-background/60 backdrop-blur-md border border-border/40 hover:bg-primary/10 hover:border-primary/30 hover:scale-105"
                      )}
                      onClick={() => setIsCalendarDrawerOpen(!isCalendarDrawerOpen)}
                    >
                      <LayersIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="rounded-xl bg-background/95 backdrop-blur-md border-border/30">
                    <p>Toggle calendars</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-2xl bg-background/60 backdrop-blur-md border border-border/40 hover:bg-accent/50 hover:border-accent/40 transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105"
                onClick={() => setShowFilterMenu((p) => !p)}
              >
                <FilterIcon className="h-4 w-4" />
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    className="h-10 px-6 rounded-2xl bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary/80 hover:to-primary/70 text-primary-foreground shadow-lg hover:shadow-2xl transition-all duration-300 text-sm font-semibold hover:scale-105 border border-primary/20"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    New Event
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2 rounded-2xl border-border/30 backdrop-blur-xl bg-background/95 shadow-2xl">
                  <div className="grid gap-2">
                    <Button variant="ghost" className="justify-start font-medium h-10 rounded-xl hover:bg-primary/10 transition-all duration-200" onClick={handleCreateEvent}>
                      <CalendarIcon className="mr-3 h-4 w-4 text-primary" />
                      <span>Create Event</span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start font-medium h-10 rounded-xl hover:bg-accent/10 transition-all duration-200"
                      onClick={handleCreateWithNaturalLanguage}
                    >
                      <ZapIcon className="mr-3 h-4 w-4 text-accent" />
                      <span>Natural Language</span>
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Error Banner */}
      {loadError && (
        <div className="mx-6 mb-4 p-4 rounded-xl border border-destructive/20 bg-destructive/5 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
              <div className="text-sm font-medium text-destructive">{loadError}</div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setReloadTick((t) => t + 1)} className="h-7 px-3 rounded-lg">
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Modern Info Banner */}
      {!activeConnection?.data?.id && (
        <div className="mx-6 mb-4 p-4 rounded-xl border border-blue-200/50 bg-blue-50/50 dark:border-blue-800/50 dark:bg-blue-900/20 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
              No active account connected. Connect an account to load your calendars.
            </div>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <div className="flex-1 flex gap-6 p-6 min-h-0 h-full">
        {/* Enhanced Modern Left Sidebar */}
        {isCalendarDrawerOpen && (
          <div className="w-80 flex-shrink-0 bg-gradient-to-b from-card/60 via-card/50 to-card/40 backdrop-blur-xl border border-border/30 rounded-3xl shadow-2xl overflow-hidden">
            <div className="relative flex h-16 items-center justify-between px-8 border-b border-border/30 bg-gradient-to-r from-background/80 via-background/60 to-background/80">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5" />
              <div className="relative flex items-center gap-4">
                <div className="h-3 w-3 rounded-full bg-gradient-to-br from-primary to-primary/60 shadow-sm" />
                <span className="font-bold text-lg text-foreground">Calendars</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative h-9 w-9 rounded-2xl hover:bg-accent/20 hover:scale-105 transition-all duration-300 shadow-sm" 
                onClick={() => setIsCalendarDrawerOpen(false)}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="h-[calc(80vh-200px)] scrollbar-hide">
              <div className="p-8 space-y-8">
                {/* Enhanced My Calendars Section */}
                <div className="space-y-4">
                  <button
                    className="flex items-center justify-between w-full py-3 px-4 rounded-2xl hover:bg-gradient-to-r hover:from-accent/10 hover:to-primary/5 transition-all duration-300 group shadow-sm hover:shadow-md"
                    onClick={() => setExpandedSections((s) => ({ ...s, myCalendars: !s.myCalendars }))}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-2 w-2 rounded-full bg-gradient-to-br from-primary to-primary/60 shadow-sm" />
                      <span className="text-sm font-semibold text-foreground">My Calendars</span>
                    </div>
                    <ChevronDownIcon
                      className={`h-4 w-4 text-muted-foreground transition-all duration-200 ${
                        expandedSections.myCalendars ? "rotate-0" : "-rotate-90"
                      } group-hover:text-foreground`}
                    />
                  </button>
                  {expandedSections.myCalendars && (
                    <div className="space-y-2 pl-6">
                      {Object.entries(calendarTypes).map(([key, { name, color }]) => (
                        <button
                          key={key}
                          className="flex items-center gap-3 w-full py-2 px-3 rounded-lg hover:bg-accent/50 transition-all duration-200 group"
                          onClick={() =>
                            setVisibleCalendars((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))
                          }
                        >
                          <div className={`h-3 w-3 rounded-full transition-all duration-200 ${
                            calendarTypes[key as keyof typeof calendarTypes].color
                          } ${visibleCalendars[key] ? 'opacity-100 scale-100' : 'opacity-40 scale-90'}`} />
                          <span className={`text-sm transition-colors duration-200 ${
                            visibleCalendars[key] ? "text-foreground font-medium" : "text-muted-foreground"
                          } group-hover:text-foreground`}>
                            {name}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Shared Calendars Section */}
                <div className="space-y-3">
                  <button
                    className="flex items-center justify-between w-full py-2 px-3 rounded-xl hover:bg-accent/50 transition-all duration-200 group"
                    onClick={() => setExpandedSections((s) => ({ ...s, sharedCalendars: !s.sharedCalendars }))}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                      <span className="text-sm font-medium text-foreground">Shared Calendars</span>
                      <Badge variant="secondary" className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                        Beta
                      </Badge>
                    </div>
                    <ChevronDownIcon
                      className={`h-4 w-4 text-muted-foreground transition-all duration-200 ${
                        expandedSections.sharedCalendars ? "rotate-0" : "-rotate-90"
                      } group-hover:text-foreground`}
                    />
                  </button>
                  {expandedSections.sharedCalendars && (
                    <div className="space-y-2 pl-6">
                      {sharedEvents.length > 0 ? (
                        <div className="space-y-2">
                          <button
                            className="flex items-center gap-3 w-full py-2 px-3 rounded-lg hover:bg-accent/50 transition-all duration-200 group"
                            onClick={() => setVisibleCalendars((prev) => ({ ...prev, shared: !prev.shared }))}
                          >
                            <div className={`h-3 w-3 rounded-full transition-all duration-200 ${
                              calendarTypes.shared.color
                            } ${visibleCalendars.shared ? 'opacity-100 scale-100' : 'opacity-40 scale-90'}`} />
                            <span className={`text-sm transition-colors duration-200 ${
                              visibleCalendars.shared ? "text-foreground font-medium" : "text-muted-foreground"
                            } group-hover:text-foreground`}>
                              Shared Events ({sharedEvents.length})
                            </span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground italic bg-muted/30 rounded-lg p-3 text-center">
                          No shared calendars available
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Categories Section */}
                {/* <div className="space-y-3">
                  <div className="flex items-center justify-between px-3">
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                      <span className="text-sm font-medium text-foreground">Categories</span>
                    </div>
                    {selectedCategories.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs rounded-full hover:bg-accent"
                        onClick={() => setSelectedCategories([])}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2 pl-6">
                    {categories.map((category) => (
                      <label
                        key={category}
                        className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-accent/50 cursor-pointer transition-all duration-200 group"
                      >
                        <Checkbox
                          id={`category-${category}`}
                          checked={selectedCategories.includes(category)}
                          onCheckedChange={(checked) =>
                            setSelectedCategories((prev) =>
                              Boolean(checked)
                                ? Array.from(new Set([...prev, category]))
                                : prev.filter((c) => c !== category),
                            )
                          }
                          className="rounded-md"
                        />
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${getCategoryColor(category)}`} />
                          <span className="text-sm group-hover:text-foreground transition-colors">{category}</span>
                        </div>
                      </label>
                    ))}
                    {categories.length === 0 && (
                      <div className="text-sm text-muted-foreground italic bg-muted/30 rounded-lg p-3 text-center">
                        <div className="mb-2">No categories found</div>
                        <div className="text-xs">
                          Categories will appear here when you create events with categories
                        </div>
                      </div>
                    )}
                  </div>
                </div> */}

                {/* Quick Actions */}
                <div className="space-y-3 pt-6 border-t border-border/50">
                  <div className="flex items-center gap-3 px-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span className="text-sm font-medium text-foreground">Quick Actions</span>
                  </div>
                  <div className="space-y-2 pl-6">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start font-normal h-8 rounded-lg hover:bg-accent/50"
                      onClick={() => setView(view === "agenda" ? "month" : "agenda")}
                    >
                      <CalendarIcon className="mr-3 h-4 w-4" />
                      <span className="text-sm">{view === "agenda" ? "Calendar View" : "Agenda View"}</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start font-normal h-8 rounded-lg hover:bg-accent/50"
                      onClick={() => {
                        // Toggle between different view modes
                        const viewCycle = ["month", "week", "day"];
                        const currentIndex = viewCycle.indexOf(view);
                        const nextIndex = (currentIndex + 1) % viewCycle.length;
                        setView(viewCycle[nextIndex] as typeof view);
                      }}
                    >
                      <GridIcon className="mr-3 h-4 w-4" />
                      <span className="text-sm">Switch View ({view})</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start font-normal h-8 rounded-lg hover:bg-accent/50"
                      onClick={() => setCurrentDate(new Date())}
                    >
                      <ClockIcon className="mr-3 h-4 w-4" />
                      <span className="text-sm">Go to Today</span>
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Modern Calendar View */}
        <div className="flex-1 bg-card/30 backdrop-blur border border-border/50 rounded-2xl shadow-xl overflow-hidden relative">
          {isLoading && (
            <div className="absolute top-4 right-4 z-10 flex items-center gap-3 px-3 py-2 bg-background/80 backdrop-blur rounded-full border border-border/50 shadow-lg">
              <div className="animate-spin h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full" />
              <span className="text-sm font-medium text-foreground">Loading events...</span>
            </div>
          )}

          {/* Calendar Views Container */}
          <div className="flex-1 min-h-0 h-full">
            {/* Enhanced Modern Month View */}
            {view === "month" && (
              <div className="h-full flex flex-col rounded-2xl overflow-hidden bg-gradient-to-br from-background/50 to-muted/20 backdrop-blur-sm">
                <div className="grid grid-cols-7 border-b border-border/20 bg-gradient-to-r from-background/80 via-background/60 to-background/80 backdrop-blur-md shadow-sm">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center py-5 font-bold text-sm text-muted-foreground/80 border-r border-border/10 last:border-r-0 hover:bg-primary/5 transition-colors duration-200">
                    {day}
                  </div>
                ))}
                </div>
                <div
                  className="grid grid-cols-7 flex-1"
                  style={{ gridTemplateRows: "repeat(6, minmax(0, 1fr))" }}
                >
                  {daysInMonth.map((day, index) => (
                    <div
                      key={index}
                      className={cn(
                        "min-h-[140px] p-4 border-b border-r border-border/10 hover:bg-gradient-to-br hover:from-accent/10 hover:to-primary/5 transition-all duration-300 group cursor-pointer hover:shadow-lg hover:scale-[1.02] hover:z-10 relative",
                        !day.isCurrentMonth && "bg-gradient-to-br from-muted/10 to-muted/5 text-muted-foreground/60",
                        isSameDay(day.date, new Date()) && "bg-gradient-to-br from-primary/10 via-primary/5 to-accent/5 border-primary/30 shadow-md",
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={cn(
                            "text-sm font-bold transition-all duration-200 flex items-center justify-center w-7 h-7 rounded-xl",
                            !day.isCurrentMonth && "text-muted-foreground/60",
                            isSameDay(day.date, new Date()) && "text-primary-foreground bg-gradient-to-br from-primary to-primary/80 shadow-lg font-extrabold",
                          )}
                        >
                          {format(day.date, "d")}
                        </span>
                        {isSameDay(day.date, new Date()) && (
                          <Badge className="h-5 text-xs bg-primary/10 text-primary border-primary/20 rounded-full px-2">
                            Today
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1">
                        {day.events.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className={cn(
                              "text-xs px-2 py-1 rounded-md truncate cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-sm",
                              getEventColor(event),
                              "text-white font-medium"
                            )}
                            onClick={() => handleEventClick(event)}
                          >
                            {event.title}
                          </div>
                        ))}
                        {day.events.length > 3 && (
                          <button
                            className="text-xs w-full text-center py-1 cursor-pointer hover:bg-accent/50 rounded-md transition-colors text-muted-foreground hover:text-foreground font-medium"
                            onClick={() => {
                              setCurrentDate(day.date)
                              setView("day")
                            }}
                          >
                            +{day.events.length - 3} more
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Week View */}
          {view === "week" && (
            <div className="h-full">
              <div className="h-full overflow-y-scroll [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {/* Sticky header inside the scroll container to match widths */}
                <div
                  className="grid sticky top-0 z-10 border-b border-mono-200 dark:border-mono-700 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
                  style={{ gridTemplateColumns: "80px repeat(7, minmax(0,1fr))" }}
                >
                  <div className="py-3 px-2 text-center font-medium text-sm text-mono-500 dark:text-mono-400 border-r border-mono-200 dark:border-mono-700 box-border">
                    Time
                  </div>
                  {daysInWeek.map((day) => (
                    <div
                      key={day.date.toISOString()}
                      className={cn(
                        "py-3 px-2 text-center font-medium text-sm border-r border-mono-200 dark:border-mono-700 last:border-r-0 box-border",
                        isSameDay(day.date, new Date())
                          ? "bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400"
                          : "text-mono-500 dark:text-mono-400",
                      )}
                    >
                      <div>{format(day.date, "EEE")}</div>
                      <div>{format(day.date, "MMM d")}</div>
                    </div>
                  ))}
                </div>

                {/* Body grid with time column and 7 day columns */}
                <div
                  className="grid"
                  style={{ gridTemplateColumns: "80px repeat(7, minmax(0,1fr))" }}
                >
                  {/* Time column */}
                  <div className="border-r border-mono-200 dark:border-mono-700 box-border">
                    {Array.from({ length: 24 }).map((_, hour) => (
                      <div
                        key={hour}
                        className="text-xs text-mono-500 dark:text-mono-400 text-right pr-2 pt-0 border-b border-mono-200 dark:border-mono-700 last:border-b-0"
                        style={{ height: `${WEEK_HOUR_PX}px` }}
                      >
                        {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
                      </div>
                    ))}
                  </div>

                  {/* 7 day columns */}
                  {daysInWeek.map((day) => (
                    <div
                      key={day.date.toISOString()}
                      className="relative border-r border-mono-200 dark:border-mono-700 last:border-r-0 box-border"
                    >
                      {/* Hour grid lines */}
                      {Array.from({ length: 24 }).map((_, hour) => (
                        <div
                          key={hour}
                          className="border-b border-mono-200 dark:border-mono-700 last:border-b-0"
                          style={{ height: `${WEEK_HOUR_PX}px` }}
                        ></div>
                      ))}

                      {/* Events for this day */}
                      {day.events.map((event) => {
                        const startDate = new Date(event.start)
                        const endDate = event.end ? new Date(event.end) : new Date(new Date(event.start).getTime() + 60 * 60 * 1000)

                        const startHour = startDate.getHours() + startDate.getMinutes() / 60
                        const endHour = endDate.getHours() + endDate.getMinutes() / 60
                        const duration = endHour - startHour

                        const top = startHour * WEEK_HOUR_PX
                        const height = Math.max(duration * WEEK_HOUR_PX, 16)

                        return (
                          <div
                            key={event.id}
                            className={cn(
                              "absolute left-0 right-1 px-1 py-0.5 rounded text-white text-xs overflow-hidden cursor-pointer",
                              getEventColor(event),
                            )}
                            style={{ top: `${top}px`, height: `${height}px` }}
                            onClick={() => handleEventClick(event)}
                          >
                            <div className="font-medium truncate">{event.title}</div>
                            {height > 30 && (
                              <div className="text-[10px] opacity-90 truncate">
                                {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}
                              </div>
                            )}
                          </div>
                        )
                      })}
                      {/* Current time indicator in current day's column only */}
                      {isSameDay(day.date, now) && (
                        <div
                          className="absolute left-0 right-0 border-t-2 border-red-500 z-10 pointer-events-none"
                          style={{ top: `${(now.getHours() + now.getMinutes() / 60) * WEEK_HOUR_PX}px` }}
                        >
                          <div className="absolute -left-[5px] -top-[5px] w-[10px] h-[10px] rounded-full bg-red-500"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Day View */}
          {view === "day" && (
            <div className="h-full">
              <div className="h-full overflow-y-auto scrollbar-hide">
                {/* Sticky header inside scroll container */}
                <div className="sticky top-0 z-10 border-b border-mono-200 dark:border-mono-700 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                  <div className="grid" style={{ gridTemplateColumns: "80px minmax(0,1fr)" }}>
                    <div className="py-3 px-2 text-center font-medium text-sm text-mono-500 dark:text-mono-400 border-r border-mono-200 dark:border-mono-700 box-border">
                      Time
                    </div>
                    <div className="py-3 px-4 text-center font-medium">
                      {format(currentDate, "EEEE, MMMM d, yyyy")}
                      {isSameDay(currentDate, new Date()) && (
                        <Badge className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Today</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Body grid with shared template */}
                <div className="grid" style={{ gridTemplateColumns: "80px minmax(0,1fr)" }}>
                  {/* Time column */}
                  <div className="border-r border-mono-200 dark:border-mono-700 box-border">
                    {Array.from({ length: 24 }).map((_, hour) => (
                      <div
                        key={hour}
                        className="text-xs text-mono-500 dark:text-mono-400 text-right pr-2 pt-0 border-b border-mono-200 dark:border-mono-700 last:border-b-0"
                        style={{ height: `${WEEK_HOUR_PX}px` }}
                      >
                        {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
                      </div>
                    ))}
                  </div>

                  {/* Day column */}
                  <div className="relative box-border">
                    {/* Hour grid lines */}
                    {Array.from({ length: 24 }).map((_, hour) => (
                      <div
                        key={hour}
                        className="border-b border-mono-200 dark:border-mono-700 last:border-b-0"
                        style={{ height: `${WEEK_HOUR_PX}px` }}
                      ></div>
                    ))}

                    {/* Events for this day */}
                    {eventsForDay.map((event) => {
                      const startDate = new Date(event.start)
                      const endDate = event.end ? new Date(event.end) : new Date(new Date(event.start).getTime() + 60 * 60 * 1000)

                      const startHour = startDate.getHours() + startDate.getMinutes() / 60
                      const endHour = endDate.getHours() + endDate.getMinutes() / 60
                      const duration = endHour - startHour

                      const top = startHour * WEEK_HOUR_PX
                      const height = Math.max(duration * WEEK_HOUR_PX, 24)

                      return (
                        <div
                          key={event.id}
                          className={cn("absolute left-2 right-2 px-2 py-1 rounded text-white", getEventColor(event))}
                          style={{ top: `${top}px`, height: `${height}px` }}
                          onClick={() => handleEventClick(event)}
                        >
                          <div className="font-medium truncate">{event.title}</div>
                          {height > 40 && (
                            <>
                              <div className="text-xs opacity-90">
                                {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}
                              </div>
                              {event.location && height > 60 && (
                                <div className="text-xs opacity-90 truncate mt-1">📍 {event.location}</div>
                              )}
                            </>
                          )}
                        </div>
                      )
                    })}

                    {/* Current time indicator */}
                    {isSameDay(currentDate, new Date()) && (
                      <div
                        className="absolute left-0 right-0 border-t-2 border-red-500 z-10"
                        style={{ top: `${(new Date().getHours() + new Date().getMinutes() / 60) * WEEK_HOUR_PX}px` }}
                      >
                        <div className="absolute -left-[5px] -top-[5px] w-[10px] h-[10px] rounded-full bg-red-500"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Year View */}
          {view === "year" && (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {monthsInYear.map((monthData) => (
                <div
                  key={format(monthData.month, "MMM-yyyy")}
                  className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div
                    className={cn(
                      "py-2 px-3 font-medium text-center border-b",
                      getMonth(currentDate) === getMonth(monthData.month) &&
                        getYear(currentDate) === getYear(monthData.month) &&
                        "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
                    )}
                    onClick={() => {
                      setCurrentDate(monthData.month)
                      setView("month")
                    }}
                  >
                    {format(monthData.month, "MMMM")}
                  </div>

                  <div className="grid grid-cols-7 text-center text-xs">
                    {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                      <div key={i} className="py-1 text-mono-500">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 text-center text-xs">
                    {monthData.days.map((day, i) => (
                      <div
                        key={i}
                        className={cn(
                          "py-1 relative",
                          !day.isCurrentMonth && "text-mono-400",
                          isSameDay(day.date, new Date()) && "font-bold text-blue-600",
                          day.events.length > 0 && "font-medium",
                        )}
                        onClick={() => {
                          setCurrentDate(day.date)
                          setView("day")
                        }}
                      >
                        {getDate(day.date)}
                        {day.events.length > 0 && (
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500"></div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="p-2 border-t text-xs">
                    <div className="font-medium">{monthData.events.length} events</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Agenda View */}
          {view === "agenda" && (
            <div className="p-4">
              <div className="space-y-4">
                {Object.keys(eventsForAgenda.eventsByDate).length > 0 ? (
                  Object.keys(eventsForAgenda.eventsByDate)
                    .sort()
                    .map((dateKey) => {
                      const date = new Date(dateKey)
                      const events = eventsForAgenda.eventsByDate[dateKey]

                      return (
                        <div key={dateKey} className="border rounded-lg overflow-hidden">
                          <div
                            className={cn(
                              "py-2 px-4 font-medium border-b",
                              isSameDay(date, new Date()) &&
                                "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
                            )}
                          >
                            {format(date, "EEEE, MMMM d, yyyy")}
                            {isSameDay(date, new Date()) && (
                              <Badge className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                Today
                              </Badge>
                            )}
                          </div>

                          <div className="divide-y">
                            {events.map((event) => {
                              const startDate = new Date(event.start)
                              const endDate = event.end ? new Date(event.end) : new Date(new Date(event.start).getTime() + 60 * 60 * 1000)

                              return (
                                <div
                                  key={event.id}
                                  className="p-3 hover:bg-mono-50 dark:hover:bg-mono-900/50 cursor-pointer"
                                  onClick={() => handleEventClick(event)}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="w-20 flex-shrink-0 text-sm text-mono-600 dark:text-mono-400">
                                      {format(startDate, "h:mm a")}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <div className={cn("w-2 h-2 rounded-full", getEventColor(event))}></div>
                                        <div className="font-medium">{event.title}</div>
                                      </div>
                                      {event.location && (
                                        <div className="text-sm text-mono-600 dark:text-mono-400 mt-1">
                                          📍 {event.location}
                                        </div>
                                      )}
                                      <div className="text-sm text-mono-500 dark:text-mono-500 mt-1">
                                        {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}
                                        {event.recurrence && (
                                          <span className="ml-2 inline-flex items-center">
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              width="12"
                                              height="12"
                                              viewBox="0 0 24 24"
                                              fill="none"
                                              stroke="currentColor"
                                              strokeWidth="2"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              className="mr-1"
                                            >
                                              <path d="M17 2.1l4 4-4 4" />
                                              <path d="M3 12.2v-2a4 4 0 0 1 4-4h12.8M7 21.9l-4-4 4-4" />
                                              <path d="M21 11.8v2a4 4 0 0 1-4 4H4.2" />
                                            </svg>
                                            Recurring
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })
                ) : (
                  <div className="text-center py-8 text-mono-500 dark:text-mono-400">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-lg font-medium">No events found</p>
                    <p className="text-sm mt-1">There are no events scheduled for this time period.</p>
                    <Button variant="outline" className="mt-4" onClick={handleCreateEvent}>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Create Event
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Open Calendars Sidebar button (only when closed) */}
      {!isCalendarDrawerOpen && (
        <div className="fixed top-20 left-4 z-40">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-lg"
            onClick={() => setIsCalendarDrawerOpen(true)}
            aria-label="Open Calendars Sidebar"
          >
            <LayersIcon className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Event Dialogs */}
      <EventDialog
        open={showEventDialog}
        onOpenChange={setShowEventDialog}
        event={selectedEvent}
        categories={categories}
        onEventUpdated={(updatedEvent) => {
          setEvents((prev) => prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e)))
          setSelectedEvent(null)
        }}
        onEventDeleted={(eventId) => {
          setEvents((prev) => prev.filter((e) => e.id !== eventId))
          setSelectedEvent(null)
        }}
      />

      <NaturalLanguageEventDialog
        open={showNaturalLanguageDialog}
        onOpenChange={(open: boolean) => setShowNaturalLanguageDialog(open)}
        onEventCreated={() => {
          const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
          const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
          getEvents(startDate, endDate).then((refreshedEvents) => {
            setEvents(refreshedEvents)
          })
        }}
      />
    </div>
  )
}

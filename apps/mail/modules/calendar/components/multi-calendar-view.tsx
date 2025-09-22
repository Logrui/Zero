"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
import { ChatPanel } from "@/components/chat-panel"
import { AISidebar } from "@/components/ai-sidebar"
import AIToggleButton from "@/components/ai-toggle-button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useActiveConnection } from "@/hooks/use-connections"
// (removed duplicate Checkbox import)
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


const CALENDAR_TYPES = {
  personal: { name: "Personal", color: "bg-blue-500" },
  work: { name: "Work", color: "bg-green-500" },
  family: { name: "Family", color: "bg-purple-500" },
  shared: { name: "Shared", color: "bg-yellow-500" },
}


const CATEGORY_COLORS: Record<string, string> = {
  Work: "bg-green-500",
  Personal: "bg-blue-500",
  Family: "bg-purple-500",
  Imported: "bg-yellow-500",
  Meeting: "bg-red-500",
  Appointment: "bg-indigo-500",
  Holiday: "bg-pink-500",
  Travel: "bg-orange-500",
  Birthday: "bg-teal-500",
}

interface MultiCalendarViewProps {
  initialEvents: CalendarEvent[]
  initialCategories?: string[]
}

export function MultiCalendarView({ initialEvents, initialCategories = [] }: MultiCalendarViewProps) {
  const activeConnection = useActiveConnection()
  const activeUserId = activeConnection.data?.id
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [view, setView] = useState<"month" | "week" | "day" | "year" | "agenda">("month")
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [showNaturalLanguageDialog, setShowNaturalLanguageDialog] = useState(false)
  const [showChatPanel, setShowChatPanel] = useState(false)
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
    if (!activeUserId) return

    const fetchEvents = async () => {
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


        const fetchedEvents = await getEvents(activeUserId, startDate, endDate)
        setEvents(fetchedEvents || [])


        try {
          const fetchedSharedEvents = await getSharedEvents(activeUserId, startDate, endDate)

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


        try {
          const fetchedCategories = await getUserCategories(activeUserId)
          // Normalize to a string[] of category names/ids for filtering UI
          const names: string[] = (fetchedCategories || []).map((c: any) =>
            typeof c === "string" ? c : (c?.name ?? c?.id ?? "")
          ).filter(Boolean)
          setCategories(names)
        } catch (categoriesError) {
          console.error("[Calendar] Error fetching categories:", categoriesError)
          setCategories([])
        }
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
  }, [currentDate, view, activeUserId, agendaRange, reloadTick])


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


    if (selectedCategories.length > 0) {
      filtered = filtered.filter((event) => event.categoryId && selectedCategories.includes(event.categoryId as string))
    }


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

      if (activeUserId) {
        const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

        const refreshedEvents = await getEvents(activeUserId, startDate, endDate)
        setEvents(refreshedEvents)
      }
    },
    [currentDate, activeUserId],
  )


  const toggleCalendarVisibility = useCallback((calendarKey: string) => {
    setVisibleCalendars((prev) => ({
      ...prev,
      [calendarKey]: !prev[calendarKey],
    }))
  }, [])

  const toggleCategoryFilter = useCallback((category: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category)
      } else {
        return [...prev, category]
      }
    })
  }, [])


  const getEventColor = useCallback((event: CalendarEvent) => {
    // Prefer categoryId-driven coloring if available
    if ((event as any).categoryId && CATEGORY_COLORS[(event as any).categoryId as keyof typeof CATEGORY_COLORS]) {
      return CATEGORY_COLORS[(event as any).categoryId as keyof typeof CATEGORY_COLORS]
    }

    // Shared events color
    if ((event as any).isShared) {
      return CALENDAR_TYPES.shared.color
    }

    // Source-based fallback
    if (event.source === "google") {
      return CALENDAR_TYPES.personal.color
    }

    return "bg-gray-500"
  }, [])


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
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h2 className="text-3xl font-bold text-mono-900 dark:text-mono-50 tracking-tight">{viewTitle}</h2>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevious}
              className="rounded-lg h-9 w-9 bg-mono-100 dark:bg-mono-800"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              className="rounded-lg h-9 w-9 bg-mono-100 dark:bg-mono-800"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="rounded-lg h-9 border-mono-200 dark:border-mono-700"
          >
            Today
          </Button>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <div className="relative w-56">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mono-400" />
            <Input
              placeholder="Search events..."
              className="pl-9 rounded-lg bg-mono-50 dark:bg-mono-900 h-9 text-sm focus-visible:ring-mono-400 dark:focus-visible:ring-mono-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {(() => {
            const selectViewValue = view === "year" || view === "agenda" ? "month" : view
            return (
              <Select value={selectViewValue} onValueChange={(v) => setView(v as "month" | "week" | "day") }>
                <SelectTrigger className="w-32 rounded-lg h-9 border-mono-200 dark:border-mono-700">
                  <SelectValue placeholder="View" />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-mono-200 dark:border-mono-700">
                  <SelectItem value="month" className="rounded-md my-1 cursor-pointer">Month</SelectItem>
                  <SelectItem value="week" className="rounded-md my-1 cursor-pointer">Week</SelectItem>
                  <SelectItem value="day" className="rounded-md my-1 cursor-pointer">Day</SelectItem>
                </SelectContent>
              </Select>
            )
          })()}

          {/* Filter button (icon) */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg h-9 w-9 bg-mono-100 dark:bg-mono-800"
            onClick={() => setShowFilterMenu((p) => !p)}
          >
            <FilterIcon className="h-4 w-4" />
          </Button>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "rounded-lg h-9 w-9",
                    isCalendarDrawerOpen ? "bg-mono-200 dark:bg-mono-700" : "bg-mono-100 dark:bg-mono-800",
                  )}
                  onClick={() => setIsCalendarDrawerOpen(!isCalendarDrawerOpen)}
                >
                  <LayersIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle calendars</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="default" size="sm" className="rounded-lg h-9 gap-1 shadow-soft">
                <PlusIcon className="h-4 w-4" />
                <span>Event</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2">
              <div className="grid gap-1">
                <Button variant="ghost" className="justify-start font-normal h-9" onClick={handleCreateEvent}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span>Create Event</span>
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start font-normal h-9"
                  onClick={handleCreateWithNaturalLanguage}
                >
                  <ZapIcon className="mr-2 h-4 w-4" />
                  <span>Natural Language</span>
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="sm"
            className="rounded-lg h-9 gap-1 bg-mono-100 dark:bg-mono-800"
            onClick={() => setShowChatPanel(true)}
          >
            <ZapIcon className="h-4 w-4" />
            <span>AI</span>
          </Button>
        </div>
      </div>

      {/* Non-blocking error banner */}
      {loadError && (
        <div className="mb-2 p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200 dark:border-red-900">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm">{loadError}</div>
            <Button size="sm" variant="outline" onClick={() => setReloadTick((t) => t + 1)}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Info banner when no active connection */}
      {!activeUserId && (
        <div className="mb-2 p-3 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-900">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm">No active account connected. Connect an account to load your calendars.</div>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        {/* Left Sidebar: Calendars / Categories (styled like zero-calendar) */}
        {isCalendarDrawerOpen && (
          <div className="relative w-64 flex-shrink-0 h-[calc(90vh-200px)] border-r bg-card rounded-lg">
            <div className="flex h-12 items-center justify-between border-b px-4">
              <span className="font-medium">Calendars</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsCalendarDrawerOpen(false)}>
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="h-[calc(100%-3rem)]">
              <div className="px-3 py-3 space-y-4">
                {/* My Calendars */}
                <div className="space-y-1">
                  <div
                    className="flex items-center justify-between py-1 px-2 cursor-pointer hover:bg-muted rounded-md"
                    onClick={() => setExpandedSections((s) => ({ ...s, myCalendars: !s.myCalendars }))}
                  >
                    <div className="flex items-center text-sm font-medium">
                      <ChevronDownIcon
                        className={`h-4 w-4 mr-1 transition-transform ${expandedSections.myCalendars ? "" : "-rotate-90"}`}
                      />
                      My Calendars
                    </div>
                  </div>
                  {expandedSections.myCalendars && (
                    <div className="space-y-1 ml-2">
                      {Object.entries(CALENDAR_TYPES).map(([key, { name, color }]) => (
                        <div
                          key={key}
                          className="flex items-center py-1 px-2 rounded-md hover:bg-muted cursor-pointer"
                          onClick={() =>
                            setVisibleCalendars((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))
                          }
                        >
                          <span className="mr-2 h-3 w-3 rounded-full" style={{ opacity: visibleCalendars[key] ? 1 : 0.4 }}>
                            <span className={`block h-3 w-3 rounded-full ${CALENDAR_TYPES[key as keyof typeof CALENDAR_TYPES].color}`} />
                          </span>
                          <span className={`text-sm ${visibleCalendars[key] ? "" : "text-muted-foreground"}`}>{name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Shared Calendars */}
                <div className="space-y-1">
                  <div
                    className="flex items-center justify-between py-1 px-2 cursor-pointer hover:bg-muted rounded-md"
                    onClick={() => setExpandedSections((s) => ({ ...s, sharedCalendars: !s.sharedCalendars }))}
                  >
                    <div className="flex items-center text-sm font-medium">
                      <ChevronDownIcon
                        className={`h-4 w-4 mr-1 transition-transform ${expandedSections.sharedCalendars ? "" : "-rotate-90"}`}
                      />
                      Shared Calendars
                    </div>
                    <Badge variant="outline" className="text-xs bg-muted text-muted-foreground ml-1">Beta</Badge>
                  </div>
                  {expandedSections.sharedCalendars && (
                    <div className="ml-2 py-2 px-2">
                      <div className="text-sm text-muted-foreground italic">Coming soon</div>
                    </div>
                  )}
                </div>

                {/* Categories */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-medium text-mono-500">
                    <span>Categories</span>
                    {selectedCategories.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setSelectedCategories([])}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="space-y-1 ml-2">
                    {categories.map((category) => (
                      <div key={category} className="flex items-center py-1 px-2 rounded-md hover:bg-muted cursor-pointer">
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
                        />
                        <label htmlFor={`category-${category}`} className="ml-2 text-sm font-medium flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${CATEGORY_COLORS[category] || "bg-gray-500"}`}></span>
                          {category}
                        </label>
                      </div>
                    ))}
                    {categories.length === 0 && <div className="text-sm text-mono-500 italic">No categories found</div>}
                  </div>
                </div>

                {/* Navigation (disabled placeholder) */}
                <div className="space-y-1 pt-2">
                  <Button variant="ghost" className="w-full justify-start font-normal" disabled>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Calendar
                  </Button>
                  <Button variant="ghost" className="w-full justify-start font-normal" disabled>
                    <ListIcon className="mr-2 h-4 w-4" />
                    Tasks
                  </Button>
                  <Button variant="ghost" className="w-full justify-start font-normal" disabled>
                    <UsersIcon className="mr-2 h-4 w-4" />
                    People
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Calendar View */}
        <Card className="rounded-xl border-mono-200 dark:border-mono-700 shadow-soft overflow-hidden flex-1 relative">
          {isLoading && (
            <div className="absolute top-2 right-3 z-10 flex items-center gap-2 text-xs text-mono-500 dark:text-mono-400">
              <div className="animate-spin h-4 w-4 border-2 border-mono-300 border-t-mono-900 rounded-full"></div>
              <span>Loading…</span>
            </div>
          )}

          {/* Month View */}
          {view === "month" && (
            <div className="h-[calc(90vh-200px)] overflow-hidden">
              <div className="h-full overflow-y-auto scrollbar-hide flex flex-col">
                <div className="grid grid-cols-7 border-b border-mono-200 dark:border-mono-700 bg-mono-50 dark:bg-mono-900">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="text-center py-3 font-medium text-sm text-mono-500 dark:text-mono-400">
                      {day}
                    </div>
                  ))}
                </div>
                <div
                  className="grid grid-cols-7 flex-1 bg-background"
                  style={{ gridTemplateRows: "repeat(6, minmax(0, 1fr))" }}
                >
                  {daysInMonth.map((day, index) => (
                    <div
                      key={index}
                      className={cn(
                        "min-h-[100px] p-1 border-b border-r border-mono-200 dark:border-mono-700",
                        !day.isCurrentMonth && "bg-mono-50/50 dark:bg-mono-900/50",
                        isSameDay(day.date, new Date()) && "bg-mono-100/50 dark:bg-mono-800/50",
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            !day.isCurrentMonth && "text-mono-400 dark:text-mono-600",
                            isSameDay(day.date, new Date()) && "text-mono-900 dark:text-mono-50",
                          )}
                        >
                          {format(day.date, "d")}
                        </span>
                        {isSameDay(day.date, new Date()) && (
                          <Badge className="h-5 text-xs bg-mono-200 text-mono-700 dark:bg-mono-700 dark:text-mono-200 rounded-md px-1.5">
                            Today
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 space-y-1">
                        {day.events.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className={cn(
                              "text-xs px-2 py-1 rounded truncate cursor-pointer",
                              getEventColor(event),
                            )}
                            onClick={() => handleEventClick(event)}
                          >
                            {event.title}
                          </div>
                        ))}
                        {day.events.length > 3 && (
                          <div
                            className="text-xs text-center cursor-pointer hover:underline text-mono-500 dark:text-mono-400"
                            onClick={() => {
                              setCurrentDate(day.date)
                              setView("day")
                            }}
                          >
                            +{day.events.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Week View */}
          {view === "week" && (
            <div className="h-[calc(90vh-200px)]">
              <div className="h-full overflow-y-auto scrollbar-hide">
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
            <div className="h-[calc(90vh-200px)]">
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
        </Card>
      </div>

      {/* Calendars Side Panel */}
      {isCalendarDrawerOpen && (
        <div className="fixed top-20 right-4 z-40 w-72 max-h-[80vh] rounded-xl border border-mono-200 dark:border-mono-700 bg-background shadow-lg">
          <div className="p-4 border-b border-mono-200 dark:border-mono-700">
            <div className="text-sm font-medium">Calendars</div>
            <div className="text-xs text-mono-500">Show or hide calendars</div>
          </div>
          <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(80vh-56px)]">
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wide text-mono-500">Default</div>
              {([
                { key: "personal", label: "Personal", color: "bg-blue-500" },
                { key: "work", label: "Work", color: "bg-green-500" },
                { key: "family", label: "Family", color: "bg-purple-500" },
                { key: "shared", label: "Shared", color: "bg-yellow-500" },
              ] as const).map((cal) => (
                <label key={cal.key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={visibleCalendars[cal.key]}
                    onCheckedChange={(checked) =>
                      setVisibleCalendars((prev) => ({ ...prev, [cal.key]: Boolean(checked) }))
                    }
                  />
                  <span className={cn("w-2 h-2 rounded-full", cal.color)} />
                  <span>{cal.label}</span>
                </label>
              ))}
            </div>

            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wide text-mono-500">Categories</div>
              {categories.length === 0 ? (
                <div className="text-xs text-mono-500">No categories</div>
              ) : (
                categories.map((cat) => (
                  <label key={cat} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={selectedCategories.includes(cat)}
                      onCheckedChange={(checked) =>
                        setSelectedCategories((prev) =>
                          Boolean(checked) ? Array.from(new Set([...prev, cat])) : prev.filter((c) => c !== cat),
                        )
                      }
                    />
                    <span className={cn("w-2 h-2 rounded-full", CATEGORY_COLORS[cat] ?? "bg-mono-400")} />
                    <span>{cat}</span>
                  </label>
                ))
              )}
            </div>

            <div className="pt-2">
              <Button variant="outline" className="w-full" onClick={() => setIsCalendarDrawerOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Event Dialog */}
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
        open={showNaturalLanguageDialog && !!activeUserId}
        onOpenChange={(open: boolean) => setShowNaturalLanguageDialog(open)}
        userId={activeUserId || ""}
        onEventCreated={() => {
          if (activeUserId) {
            const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
            const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
            getEvents(activeUserId, startDate, endDate).then((refreshedEvents) => {
              setEvents(refreshedEvents)
            })
          }
        }}
      />

      {/* AI Chat Panel in right sidebar */}
      <AISidebar open={showChatPanel} onOpenChange={setShowChatPanel}>
        <ChatPanel
          open={showChatPanel}
          onOpenChange={setShowChatPanel}
          onToolExecution={handleAIToolExecution}
        />
      </AISidebar>

      {/* AI Toggle Button (shared) */}
      <AIToggleButton open={showChatPanel} onOpenChange={setShowChatPanel} />

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
    </div>
  )
}

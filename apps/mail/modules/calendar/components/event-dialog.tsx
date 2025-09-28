import { FormDescription } from "@/components/ui/form"

import { useState, useEffect } from "react"
import { useActiveConnection } from "@/hooks/use-connections"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  TrashIcon,
  MapPinIcon,
  ClockIcon,
  AlignLeftIcon,
  XIcon,
  CheckIcon,
  RepeatIcon,
  BellIcon,
  TagIcon,
  GlobeIcon,
} from "lucide-react"
import { type CalendarEvent, createEvent, updateEvent, deleteEvent } from "../lib/calendar"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { format, parseISO, addDays } from "date-fns"



const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  start: z.string().min(1, "Start date is required"),
  end: z.string().min(1, "End date is required"),
  location: z.string().optional(),
  color: z.string().default("#3b82f6"),
  timezone: z.string(),
  allDay: z.boolean().default(false),

  isRecurring: z.boolean().default(false),
  recurrenceFrequency: z.enum(["daily", "weekly", "monthly", "yearly"]).optional(),
  recurrenceInterval: z.number().min(1).max(365).optional(),
  recurrenceEndType: z.enum(["never", "after", "on"]).optional(),
  recurrenceEndAfter: z.number().min(1).max(999).optional(),
  recurrenceEndOn: z.string().optional(),
  recurrenceByDay: z.array(z.enum(["MO", "TU", "WE", "TH", "FR", "SA", "SU"])).optional(),
  recurrenceByMonthDay: z.array(z.number().min(1).max(31)).optional(),
  recurrenceByMonth: z.array(z.number().min(1).max(12)).optional(),

  reminders: z
    .array(
      z.object({
        time: z.number(),
        unit: z.enum(["minutes", "hours", "days"]),
      }),
    )
    .default([]),

  category: z.string().optional(),
})

interface EventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event?: CalendarEvent | null
  onEventUpdated?: (event: CalendarEvent) => void
  onEventDeleted?: (eventId: string) => void
  categories?: string[]
}

export function EventDialog({
  open,
  onOpenChange,
  event,
  onEventUpdated,
  onEventDeleted,
  categories = [],
}: EventDialogProps) {
  const activeConnection = useActiveConnection()
  const activeUserId = activeConnection.data?.id
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  const [customCategory, setCustomCategory] = useState("")
  const [availableTimezones, setAvailableTimezones] = useState<string[]>([])
  const [isRecurringInstance, setIsRecurringInstance] = useState(false)
  const [editOption, setEditOption] = useState<"this" | "all" | "future">("this")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      start: new Date().toISOString().slice(0, 16),
      end: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
      location: "",
      color: "#3b82f6",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      allDay: false,
      isRecurring: false,
      recurrenceFrequency: "weekly",
      recurrenceInterval: 1,
      recurrenceEndType: "never",
      recurrenceEndAfter: 10,
      recurrenceEndOn: new Date(Date.now() + 30 * 24 * 3600000).toISOString().slice(0, 10),
      recurrenceByDay: [],
      recurrenceByMonthDay: [],
      recurrenceByMonth: [],
      reminders: [{ time: 30, unit: "minutes" }],
      category: "",
    },
  })

  const isRecurring = form.watch("isRecurring")
  const recurrenceEndType = form.watch("recurrenceEndType")
  const recurrenceFrequency = form.watch("recurrenceFrequency")
  const selectedCategory = form.watch("category")
  const selectedTimezone = form.watch("timezone")
  const isAllDay = form.watch("allDay")

  useEffect(() => {

    const timezones = Intl.supportedValuesOf("timeZone")
    setAvailableTimezones(timezones)


    setConfirmDelete(false)
  }, [open])

  useEffect(() => {
    if (event) {

      setIsRecurringInstance(!!event.isRecurringInstance)


      form.reset({
        title: event.title,
        description: event.description || "",
        start: formatDateTimeForInput(event.start, event.timezone, event.allDay),
        end: formatDateTimeForInput(event.end, event.timezone, event.allDay),
        location: event.location || "",
        color: event.color || "#3b82f6",
        timezone: event.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        allDay: event.allDay || false,
        isRecurring: !!event.recurrence,
        recurrenceFrequency: event.recurrence?.frequency || "weekly",
        recurrenceInterval: event.recurrence?.interval || 1,
        recurrenceEndType: event.recurrence?.until ? "on" : event.recurrence?.count ? "after" : "never",
        recurrenceEndAfter: event.recurrence?.count || 10,
        recurrenceEndOn: event.recurrence?.until
          ? event.recurrence.until.slice(0, 10)
          : addDays(new Date(), 30).toISOString().slice(0, 10),
        recurrenceByDay: event.recurrence?.byDay || [],
        recurrenceByMonthDay: event.recurrence?.byMonthDay || [],
        recurrenceByMonth: event.recurrence?.byMonth || [],
        reminders: event.reminders?.map((r) => ({ time: r.minutes, unit: "minutes" as const })) || [
          { time: 30, unit: "minutes" as const },
        ],
        category: event.category || "",
      })
    } else {

      setIsRecurringInstance(false)
      form.reset({
        title: "",
        description: "",
        start: new Date().toISOString().slice(0, 16),
        end: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
        location: "",
        color: "#3b82f6",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        allDay: false,
        isRecurring: false,
        recurrenceFrequency: "weekly",
        recurrenceInterval: 1,
        recurrenceEndType: "never",
        recurrenceEndAfter: 10,
        recurrenceEndOn: addDays(new Date(), 30).toISOString().slice(0, 10),
        recurrenceByDay: [],
        recurrenceByMonthDay: [],
        recurrenceByMonth: [],
        reminders: [{ time: 30, unit: "minutes" }],
        category: "",
      })
    }
  }, [event, form, open])


  function formatDateTimeForInput(dateStr: string, timezone?: string, allDay?: boolean): string {
    try {
      const date = parseISO(dateStr)

      if (allDay) {
        return format(date, "yyyy-MM-dd")
      }


      return format(date, "yyyy-MM-dd'T'HH:mm")
    } catch (error) {
      console.error("Error formatting date:", error)
      return dateStr
    }
  }


  function convertToUTC(dateStr: string, timezone: string, allDay?: boolean): string {
    try {
      if (allDay) {

        return `${dateStr.slice(0, 10)}T00:00:00.000Z`
      }


      const localDate = parseISO(dateStr)


      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false,
      })


      const formattedParts = formatter.formatToParts(localDate)


      const components: Record<string, number> = {}
      formattedParts.forEach((part) => {
        if (part.type !== "literal") {
          components[part.type] = Number.parseInt(part.value, 10)
        }
      })


      const utcDate = new Date(
        Date.UTC(
          components.year,
          components.month - 1,
          components.day,
          components.hour,
          components.minute,
          components.second || 0,
        ),
      )

      return utcDate.toISOString()
    } catch (error) {
      console.error("Error converting to UTC:", error)
      return dateStr
    }
  }

  const addReminder = () => {
    const currentReminders = form.getValues("reminders") || []
    form.setValue("reminders", [...currentReminders, { time: 15, unit: "minutes" }])
  }

  const removeReminder = (index: number) => {
    const currentReminders = form.getValues("reminders") || []
    form.setValue(
      "reminders",
      currentReminders.filter((_, i) => i !== index),
    )
  }

  const toggleDaySelection = (day: "MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU") => {
    const currentDays = form.getValues("recurrenceByDay") || []
    if (currentDays.includes(day)) {
      form.setValue(
        "recurrenceByDay",
        currentDays.filter((d) => d !== day),
      )
    } else {
      form.setValue("recurrenceByDay", [...currentDays, day])
    }
  }

  const toggleMonthDaySelection = (day: number) => {
    const currentDays = form.getValues("recurrenceByMonthDay") || []
    if (currentDays.includes(day)) {
      form.setValue(
        "recurrenceByMonthDay",
        currentDays.filter((d) => d !== day),
      )
    } else {
      form.setValue("recurrenceByMonthDay", [...currentDays, day])
    }
  }

  const toggleMonthSelection = (month: number) => {
    const currentMonths = form.getValues("recurrenceByMonth") || []
    if (currentMonths.includes(month)) {
      form.setValue(
        "recurrenceByMonth",
        currentMonths.filter((m) => m !== month),
      )
    } else {
      form.setValue("recurrenceByMonth", [...currentMonths, month])
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!activeUserId) {
      toast({
        title: "Error",
        description: "You must be logged in to create events",
        variant: "destructive",
      })
      return
    }

    try {

      const startUTC = convertToUTC(values.start, values.timezone, values.allDay)
      const endUTC = convertToUTC(values.end, values.timezone, values.allDay)


      const recurrence = values.isRecurring
        ? {
            frequency: values.recurrenceFrequency,
            interval: values.recurrenceInterval,
            count: values.recurrenceEndType === "after" ? values.recurrenceEndAfter : undefined,
            until:
              values.recurrenceEndType === "on" ? convertToUTC(values.recurrenceEndOn, values.timezone) : undefined,
            byDay: values.recurrenceByDay?.length ? values.recurrenceByDay : undefined,
            byMonthDay: values.recurrenceByMonthDay?.length ? values.recurrenceByMonthDay : undefined,
            byMonth: values.recurrenceByMonth?.length ? values.recurrenceByMonth : undefined,
          }
        : undefined


      let finalCategory = values.category
      if (finalCategory === "custom" && customCategory) {
        finalCategory = customCategory
      }


      const reminders = values.reminders.map((reminder) => {
        let minutes = reminder.time
        if (reminder.unit === "hours") minutes *= 60
        if (reminder.unit === "days") minutes *= 60 * 24
        return { minutes, method: "popup" as const }
      })


      const eventData: CalendarEvent = {
        id: event?.id || `event_${Date.now()}`,
        title: values.title,
        description: values.description,
        start: startUTC,
        end: endUTC,
        location: values.location,
        color: values.color,
        userId: activeUserId,
        timezone: values.timezone,
        allDay: values.allDay,
        recurrence,
        reminders,
        category: finalCategory,
      }


      if (isRecurringInstance && event?.originalEventId) {
        if (editOption === "this") {

          eventData.originalEventId = event.originalEventId
          eventData.isRecurringInstance = true
          eventData.exceptionDate = event.exceptionDate || event.start
        } else if (editOption === "all") {

          eventData.id = event.originalEventId
          delete eventData.isRecurringInstance
          delete eventData.originalEventId
          delete eventData.exceptionDate
        } else if (editOption === "future") {

          eventData.id = `event_${Date.now()}`
          delete eventData.isRecurringInstance
          delete eventData.originalEventId
          delete eventData.exceptionDate



        }
      }

      if (event && !isRecurringInstance) {
        const updatedEvent = await updateEvent(eventData)
        toast({
          title: "Event updated",
          description: "Your event has been updated successfully",
        })
        if (onEventUpdated) {
          onEventUpdated(updatedEvent)
        }
      } else {
        const newEvent = await createEvent(eventData)
        toast({
          title: "Event created",
          description: "Your event has been created successfully",
        })
        if (onEventUpdated) {
          onEventUpdated(newEvent)
        }
      }

      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error saving your event",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!event || !activeUserId) return

    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }

    setIsDeleting(true)
    try {

      if (isRecurringInstance && event.originalEventId) {
        if (editOption === "this") {

          await deleteEvent(activeUserId, event.id)
        } else if (editOption === "all") {

          await deleteEvent(activeUserId, event.originalEventId, true)
        } else if (editOption === "future") {


          await deleteEvent(activeUserId, event.id)
        }
      } else {

        await deleteEvent(activeUserId, event.id)
      }

      toast({
        title: "Event deleted",
        description: "Your event has been deleted successfully",
      })
      if (onEventDeleted) {
        onEventDeleted(event.id)
      }
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error deleting your event",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dialog-content max-w-lg">
        <DialogHeader className="dialog-header">
          <DialogTitle className="dialog-title">{event ? "Edit Event" : "Create Event"}</DialogTitle>
          <DialogDescription className="dialog-description">
            {event ? "Make changes to your event here." : "Add a new event to your calendar."}
          </DialogDescription>
        </DialogHeader>

        {isRecurringInstance && (
          <div className="bg-mono-100 dark:bg-mono-800 p-4 rounded-lg mb-4">
            <h3 className="font-medium mb-2">Edit recurring event</h3>
            <RadioGroup value={editOption} onValueChange={(value: "this" | "all" | "future") => setEditOption(value)}>
              <div className="flex items-center space-x-2 py-1">
                <RadioGroupItem value="this" id="edit-this" />
                <label htmlFor="edit-this" className="text-sm">
                  This event only
                </label>
              </div>
              <div className="flex items-center space-x-2 py-1">
                <RadioGroupItem value="all" id="edit-all" />
                <label htmlFor="edit-all" className="text-sm">
                  All events in the series
                </label>
              </div>
              <div className="flex items-center space-x-2 py-1">
                <RadioGroupItem value="future" id="edit-future" />
                <label htmlFor="edit-future" className="text-sm">
                  This and future events
                </label>
              </div>
            </RadioGroup>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-5 mb-4">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="recurrence">Recurrence</TabsTrigger>
                <TabsTrigger value="reminders">Reminders</TabsTrigger>
                <TabsTrigger value="timezone">Timezone</TabsTrigger>
                <TabsTrigger value="more">More</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 px-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="Event title"
                          {...field}
                          className="text-lg font-medium border-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-mono-400"
                        />
                      </FormControl>
                      <FormMessage className="text-mono-500" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="allDay"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>All-day event</FormLabel>
                        <FormDescription>Event will last the entire day</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 flex items-center justify-center rounded-lg bg-mono-100 dark:bg-mono-800 text-mono-500">
                    <ClockIcon className="h-5 w-5" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 flex-1">
                    <FormField
                      control={form.control}
                      name="start"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type={isAllDay ? "date" : "datetime-local"}
                              {...field}
                              className="rounded-lg border-mono-200 dark:border-mono-700 h-9 text-sm focus-visible:ring-mono-400 dark:focus-visible:ring-mono-500"
                            />
                          </FormControl>
                          <FormMessage className="text-mono-500" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="end"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type={isAllDay ? "date" : "datetime-local"}
                              {...field}
                              className="rounded-lg border-mono-200 dark:border-mono-700 h-9 text-sm focus-visible:ring-mono-400 dark:focus-visible:ring-mono-500"
                            />
                          </FormControl>
                          <FormMessage className="text-mono-500" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 flex items-center justify-center rounded-lg bg-mono-100 dark:bg-mono-800 text-mono-500">
                    <MapPinIcon className="h-5 w-5" />
                  </div>
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="Add location"
                            {...field}
                            className="rounded-lg border-mono-200 dark:border-mono-700 h-9 text-sm focus-visible:ring-mono-400 dark:focus-visible:ring-mono-500"
                          />
                        </FormControl>
                        <FormMessage className="text-mono-500" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 flex items-center justify-center rounded-lg bg-mono-100 dark:bg-mono-800 text-mono-500">
                    <AlignLeftIcon className="h-5 w-5" />
                  </div>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Textarea
                            placeholder="Add a description"
                            className="resize-none rounded-lg min-h-[100px] border-mono-200 dark:border-mono-700 focus-visible:ring-mono-400 dark:focus-visible:ring-mono-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-mono-500" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center overflow-hidden">
                    <div
                      className={cn(
                        "w-full h-full",
                        form.watch("color") === "#3b82f6" && "bg-mono-900 dark:bg-mono-100",
                        form.watch("color") === "#10b981" && "bg-mono-700 dark:bg-mono-300",
                        form.watch("color") === "#ef4444" && "bg-mono-500 dark:bg-mono-500",
                        form.watch("color") === "#f59e0b" && "bg-mono-300 dark:bg-mono-700",
                        form.watch("color") === "#8b5cf6" && "bg-mono-200 dark:bg-mono-800",
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-lg border-mono-200 dark:border-mono-700 h-9">
                              <SelectValue placeholder="Select a color" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-lg border-mono-200 dark:border-mono-700">
                            <SelectItem value="#3b82f6" className="rounded-md my-1 cursor-pointer">
                              <div className="flex items-center">
                                <div className="mr-2 h-4 w-4 rounded-full bg-mono-900 dark:bg-mono-100" />
                                <span>Black</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="#10b981" className="rounded-md my-1 cursor-pointer">
                              <div className="flex items-center">
                                <div className="mr-2 h-4 w-4 rounded-full bg-mono-700 dark:bg-mono-300" />
                                <span>Dark Gray</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="#ef4444" className="rounded-md my-1 cursor-pointer">
                              <div className="flex items-center">
                                <div className="mr-2 h-4 w-4 rounded-full bg-mono-500 dark:bg-mono-500" />
                                <span>Gray</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="#f59e0b" className="rounded-md my-1 cursor-pointer">
                              <div className="flex items-center">
                                <div className="mr-2 h-4 w-4 rounded-full bg-mono-300 dark:bg-mono-700" />
                                <span>Light Gray</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="#8b5cf6" className="rounded-md my-1 cursor-pointer">
                              <div className="flex items-center">
                                <div className="mr-2 h-4 w-4 rounded-full bg-mono-200 dark:bg-mono-800" />
                                <span>Subtle</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-mono-500" />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="recurrence" className="space-y-4 px-6">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 flex items-center justify-center rounded-lg bg-mono-100 dark:bg-mono-800 text-mono-500">
                    <RepeatIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <FormField
                      control={form.control}
                      name="isRecurring"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Recurring Event</FormLabel>
                            <FormDescription>Set this event to repeat on a schedule</FormDescription>
                          </div>
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {isRecurring && (
                      <div className="space-y-4 animate-fade-in">
                        <FormField
                          control={form.control}
                          name="recurrenceFrequency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Repeat</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="rounded-lg border-mono-200 dark:border-mono-700">
                                    <SelectValue placeholder="Select frequency" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="daily">Daily</SelectItem>
                                  <SelectItem value="weekly">Weekly</SelectItem>
                                  <SelectItem value="monthly">Monthly</SelectItem>
                                  <SelectItem value="yearly">Yearly</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="recurrenceInterval"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Repeat every</FormLabel>
                              <div className="flex items-center gap-2">
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={1}
                                    max={365}
                                    {...field}
                                    onChange={(e) => field.onChange(Number.parseInt(e.target.value) || 1)}
                                    className="w-20 rounded-lg border-mono-200 dark:border-mono-700"
                                  />
                                </FormControl>
                                <span>
                                  {recurrenceFrequency === "daily" && "day(s)"}
                                  {recurrenceFrequency === "weekly" && "week(s)"}
                                  {recurrenceFrequency === "monthly" && "month(s)"}
                                  {recurrenceFrequency === "yearly" && "year(s)"}
                                </span>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {recurrenceFrequency === "weekly" && (
                          <div className="space-y-2">
                            <FormLabel>Repeat on</FormLabel>
                            <div className="flex flex-wrap gap-2">
                              {[
                                { day: "MO", label: "M" },
                                { day: "TU", label: "T" },
                                { day: "WE", label: "W" },
                                { day: "TH", label: "T" },
                                { day: "FR", label: "F" },
                                { day: "SA", label: "S" },
                                { day: "SU", label: "S" },
                              ].map(({ day, label }) => (
                                <Button
                                  key={day}
                                  type="button"
                                  variant="outline"
                                  className={cn(
                                    "h-8 w-8 p-0 rounded-full",
                                    form.watch("recurrenceByDay")?.includes(day as any)
                                      ? "bg-mono-900 text-mono-50 dark:bg-mono-50 dark:text-mono-900"
                                      : "bg-transparent",
                                  )}
                                  onClick={() => toggleDaySelection(day as any)}
                                >
                                  {label}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}

                        {recurrenceFrequency === "monthly" && (
                          <div className="space-y-2">
                            <FormLabel>Repeat on day</FormLabel>
                            <div className="flex flex-wrap gap-2">
                              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                <Button
                                  key={day}
                                  type="button"
                                  variant="outline"
                                  className={cn(
                                    "h-8 w-8 p-0 rounded-full",
                                    form.watch("recurrenceByMonthDay")?.includes(day)
                                      ? "bg-mono-900 text-mono-50 dark:bg-mono-50 dark:text-mono-900"
                                      : "bg-transparent",
                                  )}
                                  onClick={() => toggleMonthDaySelection(day)}
                                >
                                  {day}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}

                        {recurrenceFrequency === "yearly" && (
                          <div className="space-y-2">
                            <FormLabel>Repeat in months</FormLabel>
                            <div className="flex flex-wrap gap-2">
                              {[
                                { month: 1, label: "Jan" },
                                { month: 2, label: "Feb" },
                                { month: 3, label: "Mar" },
                                { month: 4, label: "Apr" },
                                { month: 5, label: "May" },
                                { month: 6, label: "Jun" },
                                { month: 7, label: "Jul" },
                                { month: 8, label: "Aug" },
                                { month: 9, label: "Sep" },
                                { month: 10, label: "Oct" },
                                { month: 11, label: "Nov" },
                                { month: 12, label: "Dec" },
                              ].map(({ month, label }) => (
                                <Button
                                  key={month}
                                  type="button"
                                  variant="outline"
                                  className={cn(
                                    "h-8 px-2 rounded-full",
                                    form.watch("recurrenceByMonth")?.includes(month)
                                      ? "bg-mono-900 text-mono-50 dark:bg-mono-50 dark:text-mono-900"
                                      : "bg-transparent",
                                  )}
                                  onClick={() => toggleMonthSelection(month)}
                                >
                                  {label}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}

                        <FormField
                          control={form.control}
                          name="recurrenceEndType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ends</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="space-y-2"
                                >
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="never" id="never" />
                                    <label htmlFor="never" className="text-sm font-medium">
                                      Never
                                    </label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="after" id="after" />
                                    <label htmlFor="after" className="text-sm font-medium">
                                      After
                                    </label>
                                    {recurrenceEndType === "after" && (
                                      <FormField
                                        control={form.control}
                                        name="recurrenceEndAfter"
                                        render={({ field }) => (
                                          <FormItem className="flex items-center gap-2 ml-2">
                                            <FormControl>
                                              <Input
                                                type="number"
                                                min={1}
                                                max={999}
                                                {...field}
                                                onChange={(e) => field.onChange(Number.parseInt(e.target.value) || 1)}
                                                className="w-16 h-8 rounded-lg border-mono-200 dark:border-mono-700"
                                              />
                                            </FormControl>
                                            <span className="text-sm">occurrences</span>
                                          </FormItem>
                                        )}
                                      />
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="on" id="on" />
                                    <label htmlFor="on" className="text-sm font-medium">
                                      On date
                                    </label>
                                    {recurrenceEndType === "on" && (
                                      <FormField
                                        control={form.control}
                                        name="recurrenceEndOn"
                                        render={({ field }) => (
                                          <FormItem className="ml-2">
                                            <FormControl>
                                              <Input
                                                type="date"
                                                {...field}
                                                className="w-40 h-8 rounded-lg border-mono-200 dark:border-mono-700"
                                              />
                                            </FormControl>
                                          </FormItem>
                                        )}
                                      />
                                    )}
                                  </div>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="reminders" className="space-y-4 px-6">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 flex items-center justify-center rounded-lg bg-mono-100 dark:bg-mono-800 text-mono-500">
                    <BellIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium">Reminders</h3>
                      <Button type="button" variant="outline" size="sm" onClick={addReminder} className="h-8 text-xs">
                        Add Reminder
                      </Button>
                    </div>

                    {form.watch("reminders")?.map((_, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <FormField
                          control={form.control}
                          name={`reminders.${index}.time`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  type="number"
                                  min={1}
                                  max={999}
                                  {...field}
                                  onChange={(e) => field.onChange(Number.parseInt(e.target.value) || 1)}
                                  className="w-20 rounded-lg border-mono-200 dark:border-mono-700 h-9"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`reminders.${index}.unit`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="rounded-lg border-mono-200 dark:border-mono-700 h-9">
                                    <SelectValue placeholder="Select unit" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="minutes">Minutes</SelectItem>
                                  <SelectItem value="hours">Hours</SelectItem>
                                  <SelectItem value="days">Days</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeReminder(index)}
                          className="h-9 w-9"
                          disabled={form.watch("reminders")?.length <= 1}
                        >
                          <XIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    <p className="text-xs text-mono-500">Reminders will be sent before the event starts</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="timezone" className="space-y-4 px-6">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 flex items-center justify-center rounded-lg bg-mono-100 dark:bg-mono-800 text-mono-500">
                    <GlobeIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name="timezone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Timezone</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="rounded-lg border-mono-200 dark:border-mono-700">
                                <SelectValue placeholder="Select timezone" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-[300px]">
                              {availableTimezones.map((tz) => (
                                <SelectItem key={tz} value={tz}>
                                  {tz.replace(/_/g, " ")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>Event times will be displayed in this timezone</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="mt-4 p-3 bg-mono-100 dark:bg-mono-800 rounded-lg">
                      <h4 className="text-sm font-medium mb-2">Current time in {selectedTimezone}:</h4>
                      <p className="text-sm">{new Date().toLocaleString("en-US", { timeZone: selectedTimezone })}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="more" className="space-y-4 px-6">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 flex items-center justify-center rounded-lg bg-mono-100 dark:bg-mono-800 text-mono-500">
                    <TagIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger className="rounded-lg border-mono-200 dark:border-mono-700">
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {categories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                              <SelectItem value="custom">Custom...</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {selectedCategory === "custom" && (
                      <div className="mt-2">
                        <Input
                          placeholder="Enter custom category"
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          className="rounded-lg border-mono-200 dark:border-mono-700 h-9"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="px-6 py-4 mt-4 bg-mono-50 dark:bg-mono-900">
              <div className="flex w-full items-center justify-between">
                {event && (
                  <Button
                    type="button"
                    variant={confirmDelete ? "destructive" : "ghost"}
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className={cn(
                      "rounded-lg text-sm",
                      confirmDelete
                        ? "bg-mono-500 text-mono-50 hover:bg-mono-600 dark:bg-mono-400 dark:text-mono-900"
                        : "text-mono-500 hover:text-mono-700 hover:bg-mono-100 dark:text-mono-400 dark:hover:text-mono-200",
                    )}
                  >
                    {confirmDelete ? (
                      <>
                        <CheckIcon className="mr-2 h-4 w-4" />
                        Confirm
                      </>
                    ) : (
                      <>
                        <TrashIcon className="mr-2 h-4 w-4" />
                        {isDeleting ? "Deleting..." : "Delete"}
                      </>
                    )}
                  </Button>
                )}
                <div className="flex gap-2 ml-auto">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onOpenChange(false)}
                    className="rounded-lg text-sm bg-mono-100 dark:bg-mono-800 hover:bg-mono-200 dark:hover:bg-mono-700"
                  >
                    <XIcon className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={form.formState.isSubmitting}
                    className="rounded-lg text-sm bg-mono-900 text-mono-50 hover:bg-mono-800 dark:bg-mono-50 dark:text-mono-900 dark:hover:bg-mono-200"
                  >
                    <CheckIcon className="mr-2 h-4 w-4" />
                    {form.formState.isSubmitting ? "Saving..." : event ? "Update" : "Create"}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export type RecurrenceRule = {
  frequency: "daily" | "weekly" | "monthly" | "yearly"
  interval: number
  count?: number
  until?: string
  byDay?: string[]
  byMonthDay?: number[]
  byMonth?: number[]
  bySetPos?: number[]
  weekStart?: string
  exceptions?: string[]
}

export type CalendarEvent = {
  id: string
  title: string
  description?: string
  start: string
  end: string
  allDay: boolean
  location?: string
  color?: string
  categoryId?: string
  userId: string
  recurring?: {
    frequency: "daily" | "weekly" | "monthly" | "yearly"
    interval: number
    endDate?: string
    count?: number
  }
  source?: "google" | "local" | "microsoft"
  sourceId?: string
  recurrence?: RecurrenceRule
  exceptions?: {
    date: string
    status: "cancelled" | "modified"
    modifiedEvent?: Omit<CalendarEvent, "id" | "userId" | "recurrence" | "exceptions">
  }[]
  attendees?: { email: string; name?: string; status?: "accepted" | "declined" | "tentative" | "needs-action" }[]
  categories?: string[]
  reminders?: { minutes: number; method: "email" | "popup" }[]
  timezone?: string
  isRecurring?: boolean
  isShared?: boolean
  sharedBy?: string
  sharedWith?: string[]
  isRecurringInstance?: boolean
  originalEventId?: string
  exceptionDate?: string
  // Google Calendar specific fields
  googleEventId?: string
  googleCalendarId?: string
  syncStatus?: "synced" | "pending" | "failed"
  lastSynced?: string
  createdAt?: string
  updatedAt?: string
  recurringEventId?: string
  originalStartTime?: string
  status?: string
  htmlLink?: string
  hangoutLink?: string
  conferenceData?: any
}

export type UnsavedCalendarEvent = Omit<CalendarEvent, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'googleEventId' | 'googleCalendarId' | 'syncStatus' | 'lastSynced' | 'recurringEventId' | 'originalStartTime' | 'status' | 'htmlLink' | 'hangoutLink' | 'conferenceData'>;

export type CalendarCategory = {
  id: string
  name: string
  color: string
  userId: string
  visible: boolean
}

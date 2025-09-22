"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MultiCalendarView } from "../components/multi-calendar-view";

export default function CalendarPage() {
  console.log('CalendarPage: Component is rendering!');
  
  return (
    <div className="flex h-full flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <MultiCalendarView initialEvents={[]} initialCategories={[]} />
        </CardContent>
      </Card>
    </div>
  );
}

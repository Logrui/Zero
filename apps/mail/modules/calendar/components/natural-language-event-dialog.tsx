import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { createEvent, type CalendarEvent } from "../lib/calendar";
import { Loader2, Sparkles } from "lucide-react";

interface NaturalLanguageEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventCreated?: (event: CalendarEvent) => void;
}

export function NaturalLanguageEventDialog({
  open,
  onOpenChange,
  onEventCreated,
}: NaturalLanguageEventDialogProps) {
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const parseNaturalLanguage = (text: string): Partial<CalendarEvent> | null => {
    // Simple natural language parsing - can be enhanced with AI later
    const cleanText = text.trim().toLowerCase();
    
    if (!cleanText) return null;

    // Extract time patterns
    const timePatterns = [
      /(\d{1,2}):(\d{2})\s*(am|pm)?/gi,
      /(\d{1,2})\s*(am|pm)/gi,
      /at\s+(\d{1,2}):?(\d{2})?\s*(am|pm)?/gi,
    ];

    // Extract date patterns
    const datePatterns = [
      /tomorrow/gi,
      /today/gi,
      /next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi,
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/gi,
      /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})/gi,
    ];

    // Extract duration patterns
    const durationPatterns = [
      /for\s+(\d+)\s*(hour|hours|hr|hrs)/gi,
      /for\s+(\d+)\s*(minute|minutes|min|mins)/gi,
      /(\d+)\s*(hour|hours|hr|hrs)/gi,
    ];

    let title = text;
    let startDate = new Date();
    let endDate = new Date();
    let startTime = "09:00";
    let duration = 60; // default 1 hour

    // Parse date
    if (/tomorrow/gi.test(cleanText)) {
      startDate.setDate(startDate.getDate() + 1);
      title = title.replace(/tomorrow/gi, "").trim();
    } else if (/today/gi.test(cleanText)) {
      // Keep today's date
      title = title.replace(/today/gi, "").trim();
    }

    // Parse time
    const timeMatch = cleanText.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const ampm = timeMatch[3]?.toLowerCase();

      if (ampm === "pm" && hours !== 12) hours += 12;
      if (ampm === "am" && hours === 12) hours = 0;

      startTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
      
      // Remove time from title
      title = title.replace(/at\s+\d{1,2}:?\d{0,2}\s*(am|pm)?/gi, "").trim();
      title = title.replace(/\d{1,2}:?\d{0,2}\s*(am|pm)?/gi, "").trim();
    }

    // Parse duration
    const durationMatch = cleanText.match(/for\s+(\d+)\s*(hour|hours|hr|hrs)/i);
    if (durationMatch) {
      duration = parseInt(durationMatch[1]) * 60;
      title = title.replace(/for\s+\d+\s*(hour|hours|hr|hrs)/gi, "").trim();
    }

    // Set start and end times
    const [startHour, startMinute] = startTime.split(":").map(Number);
    startDate.setHours(startHour, startMinute, 0, 0);
    
    endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + duration);

    // Clean up title
    title = title.replace(/\s+/g, " ").trim();
    title = title.replace(/^(with|meeting|call|appointment)\s+/gi, "");
    
    if (!title) {
      title = "New Event";
    }

    return {
      title: title.charAt(0).toUpperCase() + title.slice(1),
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      allDay: false,
    };
  };

  const handleSubmit = async () => {
    if (!input.trim()) {
      toast({
        title: "Input required",
        description: "Please enter a description for your event.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const parsedEvent = parseNaturalLanguage(input);
      
      if (!parsedEvent) {
        toast({
          title: "Parsing failed",
          description: "Could not understand the event description. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const eventData: CalendarEvent = {
        id: "", // Will be set by the backend
        title: parsedEvent.title || "New Event",
        start: parsedEvent.start || new Date().toISOString(),
        end: parsedEvent.end || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        allDay: parsedEvent.allDay || false,
        description: `Created from: "${input}"`,
        source: "local",
      };

      const createdEvent = await createEvent(eventData);

      toast({
        title: "Event created",
        description: `"${eventData.title}" has been added to your calendar.`,
      });

      setInput("");
      onOpenChange(false);
      onEventCreated?.(createdEvent || eventData);
    } catch (error) {
      console.error("Failed to create event:", error);
      toast({
        title: "Failed to create event",
        description: "There was an error creating your event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const examples = [
    "Meeting with John tomorrow at 2pm",
    "Dentist appointment Friday at 10:30am for 1 hour",
    "Team standup today at 9am",
    "Lunch with Sarah next Tuesday at 12:30pm",
    "Conference call at 3pm for 2 hours",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Create Event with Natural Language
          </DialogTitle>
          <DialogDescription>
            Describe your event in plain English and we'll create it for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="event-description">Event Description</Label>
            <Textarea
              id="event-description"
              placeholder="e.g., Meeting with John tomorrow at 2pm for 1 hour"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[100px] resize-none"
              disabled={isProcessing}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Examples:</Label>
            <div className="grid gap-1">
              {examples.map((example, index) => (
                <button
                  key={index}
                  onClick={() => setInput(example)}
                  className="text-left text-sm text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-muted"
                  disabled={isProcessing}
                >
                  "{example}"
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isProcessing || !input.trim()}
            className="min-w-[120px]"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Create Event
              </>
            )}
          </Button>
        </DialogFooter>

        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+Enter</kbd> to create event
        </div>
      </DialogContent>
    </Dialog>
  );
}

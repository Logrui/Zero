"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "../../../hooks/use-toast";
import { RefreshCwIcon, CheckIcon, AlertCircleIcon } from "lucide-react";
import { hasGoogleCalendarConnected } from "../lib/calendar";
import { useActiveConnection } from "@/hooks/use-connections";

export function GoogleCalendarSync() {
  const { toast } = useToast();
  const activeConnection = useActiveConnection();
  const activeUserId = activeConnection.data?.id;

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "success" | "error">("idle");
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (!activeUserId) {
          setIsConnected(false);
          return;
        }
        const connected = await hasGoogleCalendarConnected(activeUserId);
        setIsConnected(connected);
      } catch (err) {
        console.error("Error checking Google Calendar connection:", err);
        setIsConnected(false);
      }
    };
    checkConnection();
  }, [activeUserId]);

  const handleSync = async () => {
    if (!isConnected) {
      toast({
        title: "Google Calendar not connected",
        description: "Please connect your Google Calendar first",
        variant: "destructive",
      });
      return;
    }
    setIsSyncing(true);
    setSyncStatus("idle");
    try {
      const response = await fetch("/api/calendar/sync", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Failed to sync with Google Calendar");
      setSyncStatus("success");
      toast({ title: "Sync successful", description: "Your calendar has been synced with Google Calendar" });
      setTimeout(() => setSyncStatus("idle"), 3000);
    } catch (error: any) {
      setSyncStatus("error");
      toast({ title: "Sync failed", description: error?.message || "Failed to sync with Google Calendar", variant: "destructive" });
      setTimeout(() => setSyncStatus("idle"), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isConnected) {
    return (
      <Button variant="outline" size="sm" disabled className="flex items-center gap-2 opacity-70">
        <AlertCircleIcon className="h-4 w-4" />
        Google Calendar not connected
      </Button>
    );
  }

  return (
    <Button
      onClick={handleSync}
      disabled={isSyncing}
      variant="outline"
      size="sm"
      className={`flex items-center gap-2 ${
        syncStatus === "success"
          ? "bg-green-50 text-green-700 border-green-200"
          : syncStatus === "error"
          ? "bg-red-50 text-red-700 border-red-200"
          : ""
      }`}
    >
      {isSyncing ? (
        <RefreshCwIcon className="h-4 w-4 animate-spin" />
      ) : syncStatus === "success" ? (
        <CheckIcon className="h-4 w-4 text-green-600" />
      ) : syncStatus === "error" ? (
        <AlertCircleIcon className="h-4 w-4 text-red-600" />
      ) : (
        <RefreshCwIcon className="h-4 w-4" />
      )}
      {isSyncing ? "Syncing..." : syncStatus === "success" ? "Sync complete" : syncStatus === "error" ? "Sync failed" : "Sync with Google Calendar"}
    </Button>
  );
}

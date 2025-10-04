import { Calendar, Plus } from "@/components/icons/icons";
import { NotificationIcon } from "@/components/notifications/notification-badge";
import { NotificationOverlay } from "@/components/notifications/notification-overlay";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Search, Settings, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";

export function AppBottombar() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Notification state management - fetching from real API
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  // Fetch notifications from API - only unread ones for the overlay
  const loadNotifications = async () => {
    setIsLoadingNotifications(true);
    try {
      const response = await fetch('http://localhost:8787/notifications/api?userId=test-user-123');
      const result = await response.json();
      if (result.success) {
        // Filter to show only unread notifications in the overlay
        const unreadNotifications = result.data.filter((n: any) => !n.readStatus);
        setNotifications(unreadNotifications);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  // Load notifications on mount and refresh every 5 seconds
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Keep a CSS variable in sync with the actual header height so other fixed
  // elements (like the sidebar) can offset correctly above the bottombar.
  useEffect(() => {
    const updateVar = () => {
      const h = 48; // default 3rem (h-12)
      document.documentElement.style.setProperty("--app-bottombar-height", `${h}px`);
    };
    updateVar();
    window.addEventListener("resize", updateVar);
    return () => window.removeEventListener("resize", updateVar);
  }, []);

  return (
    <header className="fixed inset-x-0 bottom-0 z-50 w-full bg-background outline-none m-0 mt-0 p-0 pt-0">
      <div className="flex h-12 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            {/* Brand icon temporarily disabled */}
            {false && (
              <div className="h-9 w-9 flex items-center justify-center rounded-lg bg-muted text-foreground">
                <Calendar className="h-5 w-5" />
              </div>
            )}
            <span className="text-xl font-bold tracking-tight">ZeroOS</span>
          </div>

          <nav className="hidden md:flex items-center space-x-1">
            <Button asChild variant="ghost" className="text-sm font-medium rounded-lg hover:bg-muted outline-none focus:outline-none">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
            <Button asChild variant="ghost" className="text-sm font-medium rounded-lg hover:bg-muted outline-none focus:outline-none">
              <Link to="/mail">Mail</Link>
            </Button>
            <Button asChild variant="ghost" className="text-sm font-medium rounded-lg hover:bg-muted outline-none focus:outline-none">
              <Link to="/calendar">Calendar</Link>
            </Button>
            <Button asChild variant="ghost" className="text-sm font-medium rounded-lg hover:bg-muted outline-none focus:outline-none">
              <Link to="/organizations">Organizations</Link>
            </Button>
            <Button asChild variant="ghost" className="text-sm font-medium rounded-lg hover:bg-muted outline-none focus:outline-none">
              <Link to="/people">People</Link>
            </Button>
            <Button asChild variant="ghost" className="text-sm font-medium rounded-lg hover:bg-muted outline-none focus:outline-none">
              <Link to="/agents">Agents</Link>
            </Button>
            <Button asChild variant="ghost" className="text-sm font-medium rounded-lg hover:bg-muted outline-none focus:outline-none">
              <Link to="/scheduling">Scheduling</Link>
            </Button>
            <Button asChild variant="ghost" className="text-sm font-medium rounded-lg hover:bg-muted outline-none focus:outline-none">
              <Link to="/tasks">Tasks</Link>
            </Button>
            <Button asChild variant="ghost" className="text-sm font-medium rounded-lg hover:bg-muted outline-none focus:outline-none">
              <Link to="/workspaces">Workspaces</Link>
            </Button>
            <Button asChild variant="ghost" className="text-sm font-medium rounded-lg hover:bg-muted outline-none focus:outline-none">
              <Link to="/notifications">Notifications</Link>
            </Button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Desktop search temporarily disabled */}
          {false && (
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="w-64 pl-9 rounded-full bg-muted border-none focus-visible:ring-1 h-9 text-sm"
              />
            </div>
          )}

          <ThemeToggle className="rounded-lg h-9 w-9 outline-none focus:outline-none" />

          {/* Desktop create button temporarily disabled */}
          {false && (
            <Button variant="outline" size="sm" className="hidden md:flex gap-1 h-9 items-center rounded-lg">
              <Plus className="h-4 w-4" />
              <span>Create</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg h-9 w-9 outline-none focus:outline-none"
            onClick={() => setIsNotificationOpen(true)}
          >
            <NotificationIcon
              count={notifications.filter(n => !n.isRead).length}
              size="md"
              onClick={() => { }}
              icon={<Bell className="h-5 w-5" />}
            />
          </Button>

          {/* User dropdown menu temporarily disabled */}
          {false && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-lg overflow-hidden h-9 w-9 outline-none focus:outline-none">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground">
                    {/* Placeholder initial until wired to auth */}
                    U
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-lg p-1">
                <DropdownMenuLabel className="py-2 px-3">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">User</p>
                    <p className="text-xs text-muted-foreground">user@example.com</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="py-2 px-3 text-sm rounded-md cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="py-2 px-3 text-sm rounded-md cursor-pointer">
                  <span className="mr-2">🚪</span>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg md:hidden h-9 w-9 outline-none focus:outline-none"
            onClick={() => setShowMobileMenu((v) => !v)}
            aria-label="Toggle menu"
          >
            <span className="text-lg">☰</span>
          </Button>
        </div>
      </div>

      {showMobileMenu && (
        <div className="md:hidden px-4 py-3 border-b animate-in slide-in-from-bottom-2 absolute bottom-full left-0 right-0 bg-background">
          <div className="space-y-2">
            {/* Mobile search temporarily disabled */}
            {false && (
              <div className="relative mb-3">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="w-full pl-9 rounded-lg bg-muted border-none focus-visible:ring-1"
                />
              </div>
            )}
            <Button asChild variant="ghost" className="w-full justify-start text-sm rounded-lg hover:bg-muted outline-none focus:outline-none">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start text-sm rounded-lg hover:bg-muted outline-none focus:outline-none">
              <Link to="/mail">Mail</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start text-sm rounded-lg hover:bg-muted outline-none focus:outline-none">
              <Link to="/calendar">Calendar</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start text-sm rounded-lg hover:bg-muted outline-none focus:outline-none">
              <Link to="/events">Events</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start text-sm rounded-lg hover:bg-muted outline-none focus:outline-none">
              <Link to="/tasks">Tasks</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start text-sm rounded-lg hover:bg-muted outline-none focus:outline-none">
              <Link to="/organizations">Organizations</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start text-sm rounded-lg hover:bg-muted outline-none focus:outline-none">
              <Link to="/people">People</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start text-sm rounded-lg hover:bg-muted outline-none focus:outline-none">
              <Link to="/agents">Agents</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start text-sm rounded-lg hover:bg-muted outline-none focus:outline-none">
              <Link to="/scheduling">Scheduling</Link>
            </Button>

            <Button asChild variant="ghost" className="w-full justify-start text-sm rounded-lg hover:bg-muted outline-none focus:outline-none">
              <Link to="/workspaces">Workspaces</Link>
            </Button>
            {/* Mobile create button temporarily disabled */}
            {false && (
              <Button variant="outline" className="w-full gap-1 mt-2 rounded-lg">
                <Plus className="h-4 w-4" />
                <span>Create</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Notification Overlay */}
      <NotificationOverlay
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        onNotificationClick={(notification) => {
          console.log("Clicked notification:", notification);
        }}
        onNotificationDelete={async (notificationIds) => {
          try {
            // Mark each notification as read via API
            await Promise.all(
              notificationIds.map(id =>
                fetch(`http://localhost:8787/notifications/api/${id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ isRead: true })
                })
              )
            );
            // Refresh notifications
            await loadNotifications();
          } catch (error) {
            console.error('Failed to mark notifications as read:', error);
            throw error;
          }
        }}
        onMarkAsRead={async (notificationIds) => {
          try {
            // Mark each notification as read via API
            await Promise.all(
              notificationIds.map(id =>
                fetch(`http://localhost:8787/notifications/api/${id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ isRead: true })
                })
              )
            );
            // Refresh notifications
            await loadNotifications();
          } catch (error) {
            console.error('Failed to mark notifications as read:', error);
            throw error;
          }
        }}
      />
    </header>
  );
}

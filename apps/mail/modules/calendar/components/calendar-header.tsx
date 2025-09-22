"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CalendarIcon, SettingsIcon, LogOutIcon, BellIcon, SearchIcon, PlusIcon, MenuIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"

export function CalendarHeader() {
  const { data: session } = useSession()
  const router = useRouter()
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  return (
    <header className="border-b bg-background shadow-soft">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 flex items-center justify-center rounded-lg bg-mono-900 text-mono-50 dark:bg-mono-100 dark:text-mono-900">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">Zero</span>
          </div>
          <nav className="hidden md:flex items-center space-x-1">
            <Button
              variant="ghost"
              className="text-sm font-medium rounded-lg transition-colors hover:bg-mono-100 dark:hover:bg-mono-800"
            >
              Calendar
            </Button>
            <Button
              variant="ghost"
              className="text-sm font-medium rounded-lg transition-colors hover:bg-mono-100 dark:hover:bg-mono-800"
            >
              Schedule
            </Button>
            <Button
              variant="ghost"
              className="text-sm font-medium rounded-lg transition-colors hover:bg-mono-100 dark:hover:bg-mono-800"
            >
              Tasks
            </Button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mono-400" />
            <Input
              placeholder="Search..."
              className="w-64 pl-9 rounded-full bg-mono-100 dark:bg-mono-800 border-none focus-visible:ring-1 h-9 text-sm"
            />
          </div>

          <ThemeToggle className="rounded-lg bg-mono-100 dark:bg-mono-800 h-9 w-9" />

          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex gap-1 h-9 items-center rounded-lg border-mono-200 dark:border-mono-700"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Create</span>
          </Button>

          <Button variant="ghost" size="icon" className="relative rounded-lg h-9 w-9 bg-mono-100 dark:bg-mono-800">
            <BellIcon className="h-4 w-4" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-mono-900 dark:bg-mono-100 rounded-full"></span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-lg overflow-hidden h-9 w-9">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-mono-200 dark:bg-mono-800 text-mono-900 dark:text-mono-100">
                  {session?.user?.name?.[0] || "U"}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 border-mono-200 dark:border-mono-700 rounded-lg shadow-glow p-1"
            >
              <DropdownMenuLabel className="py-2 px-3">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{session?.user?.name || "User"}</p>
                  <p className="text-xs text-mono-500">{session?.user?.email || ""}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-mono-200 dark:bg-mono-700" />
              <DropdownMenuItem
                onClick={() => router.push("/settings")}
                className="py-2 px-3 text-sm rounded-md cursor-pointer hover:bg-mono-100 dark:hover:bg-mono-800"
              >
                <SettingsIcon className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-mono-200 dark:bg-mono-700" />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/" })}
                className="py-2 px-3 text-sm rounded-md cursor-pointer hover:bg-mono-100 dark:hover:bg-mono-800"
              >
                <LogOutIcon className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg md:hidden h-9 w-9"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <MenuIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {showMobileMenu && (
        <div className="md:hidden px-4 py-3 border-t border-mono-200 dark:border-mono-700 animate-slide-in-down">
          <div className="space-y-2">
            <div className="relative mb-3">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mono-400" />
              <Input
                placeholder="Search..."
                className="w-full pl-9 rounded-lg bg-mono-100 dark:bg-mono-800 border-none focus-visible:ring-1"
              />
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm rounded-lg hover:bg-mono-100 dark:hover:bg-mono-800"
            >
              Calendar
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm rounded-lg hover:bg-mono-100 dark:hover:bg-mono-800"
            >
              Schedule
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm rounded-lg hover:bg-mono-100 dark:hover:bg-mono-800"
            >
              Tasks
            </Button>
            <Button variant="outline" className="w-full gap-1 mt-2 rounded-lg border-mono-200 dark:border-mono-700">
              <PlusIcon className="h-4 w-4" />
              <span>Create</span>
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}

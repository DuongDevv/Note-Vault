import {
  Search,
  Sun,
  Moon,
  Bell,
  User,
  ChevronDown,
  History,
  Clock,
  X,
} from 'lucide-react'
import { useRef, useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { NoteVaultLogo } from '@/components/common/NoteVaultLogo'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface HeaderProps {
  searchQuery: string
  onSearchChange: (val: string) => void
  isDark: boolean
  onToggleTheme: () => void
}

const STORAGE_KEY = 'notevault_recent_searches'
const DEFAULT_SEARCHES = ['Deep Work', 'Đồ án', 'Machine Learning', 'Thuật toán']

export function Header({
  searchQuery,
  onSearchChange,
  isDark,
  onToggleTheme,
}: HeaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const mobileInputRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)

  // Load recent searches from localStorage
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed: unknown = JSON.parse(saved)
        if (
          Array.isArray(parsed) &&
          parsed.every((item): item is string => typeof item === 'string') &&
          parsed.length > 0
        ) {
          return parsed
        }
      }
    } catch {
      // Fallback on parse error
    }
    return DEFAULT_SEARCHES
  })

  // Global ⌘K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setIsFocused(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        e.target instanceof Node &&
        !searchContainerRef.current.contains(e.target)
      ) {
        setIsFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus mobile input when toggled open
  useEffect(() => {
    if (isMobileSearchOpen) {
      setTimeout(() => mobileInputRef.current?.focus(), 50)
    }
  }, [isMobileSearchOpen])

  const saveSearch = (term: string) => {
    const trimmed = term.trim()
    if (!trimmed) return
    const updated = [trimmed, ...recentSearches.filter((s) => s !== trimmed)].slice(0, 8)
    setRecentSearches(updated)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch {
      // Ignore
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      saveSearch(searchQuery)
      setIsFocused(false)
      setIsMobileSearchOpen(false)
      inputRef.current?.blur()
      mobileInputRef.current?.blur()
    } else if (e.key === 'Escape') {
      setIsFocused(false)
      setIsMobileSearchOpen(false)
      inputRef.current?.blur()
      mobileInputRef.current?.blur()
    }
  }

  const handleSelectRecent = (term: string) => {
    onSearchChange(term)
    saveSearch(term)
    setIsFocused(false)
    setIsMobileSearchOpen(false)
  }

  const handleRemoveRecent = (e: React.MouseEvent, term: string) => {
    e.stopPropagation()
    const updated = recentSearches.filter((s) => s !== term)
    setRecentSearches(updated)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch {
      // Ignore
    }
  }

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    setRecentSearches([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore
    }
  }

  // Filter recent searches if user is typing
  const filteredRecents = useMemo(() => {
    if (!searchQuery.trim()) return recentSearches
    const q = searchQuery.toLowerCase()
    return recentSearches.filter((item) => item.toLowerCase().includes(q))
  }, [recentSearches, searchQuery])

  return (
    <header className="relative sticky top-0 z-40 w-full bg-background/80 backdrop-blur-xl border-b border-border transition-colors">
      <div className="h-14 md:h-16 w-full flex items-center justify-between px-4 md:px-6">
        {/* Left side: Mobile App Logo / Desktop Sidebar Trigger */}
        <div className="flex items-center gap-2">
          <div className="md:hidden flex items-center justify-center">
            <NoteVaultLogo size={28} className="size-7" />
          </div>
          <SidebarTrigger className="-ml-1 hidden md:flex" />
        </div>

        {/* Center Mobile Title - Mathematically Centered */}
        <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none md:hidden">
          <h1 className="text-base font-semibold text-foreground tracking-tight">Ghi Chú</h1>
        </div>

        {/* Center Desktop: Search Input Bar & Dropdown */}
        <div
          ref={searchContainerRef}
          className="hidden md:block absolute left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4"
        >
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <Search className="size-4" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onFocus={() => setIsFocused(true)}
              onKeyDown={handleInputKeyDown}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm kiếm ghi chú…"
              className="w-full h-9 pl-9 pr-12 rounded-lg bg-muted/60 text-foreground placeholder:text-muted-foreground text-sm border border-transparent focus:border-border focus:bg-background focus:outline-none transition-all"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <kbd className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border shadow-xs">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Dropdown for Recent Searches */}
          {isFocused && filteredRecents.length > 0 && (
            <div className="absolute top-full left-4 right-4 mt-1.5 rounded-xl border border-border bg-popover/95 backdrop-blur-md p-1.5 text-popover-foreground shadow-lg z-50">
              <div className="flex items-center justify-between px-2.5 py-1.5 text-xs text-muted-foreground font-medium border-b border-border/50 mb-1">
                <span className="flex items-center gap-1.5">
                  <History className="size-3.5" />
                  Tìm kiếm gần đây
                </span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer hover:underline"
                >
                  Xóa tất cả
                </button>
              </div>

              <div className="flex flex-col gap-0.5">
                {filteredRecents.map((item) => (
                  <div
                    key={item}
                    onClick={() => handleSelectRecent(item)}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm hover:bg-muted/80 cursor-pointer group transition-colors"
                  >
                    <span className="flex items-center gap-2 text-foreground text-xs">
                      <Clock className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                      {item}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveRecent(e, item)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-destructive rounded transition-opacity cursor-pointer"
                      aria-label={`Xóa "${item}" khỏi lịch sử`}
                      title="Xóa"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action icons & User profile using shadcn Buttons */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Mobile Search Toggle Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileSearchOpen((prev) => !prev)}
            aria-label="Tìm kiếm"
            className="md:hidden size-9 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <Search className="size-5" />
          </Button>

          {/* Theme Toggle Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggleTheme}
            aria-label="Chuyển đổi giao diện sáng/tối"
            title={isDark ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối'}
            className="size-9 rounded-lg text-muted-foreground hover:text-foreground"
          >
            {isDark ? (
              <Sun className="size-5 text-amber-400" />
            ) : (
              <Moon className="size-5" />
            )}
          </Button>

          {/* Notifications Button (Desktop only) */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Thông báo"
            className="hidden md:inline-flex relative size-9 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <Bell className="size-5" />
            <span className="absolute top-2 right-2 size-2 rounded-full bg-destructive ring-2 ring-background" />
          </Button>

          {/* User profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  className="flex items-center gap-1.5 p-1 h-8 md:h-9 rounded-full cursor-pointer group"
                >
                  <div className="size-7 rounded-full bg-primary flex items-center justify-center shadow-xs text-primary-foreground">
                    <User className="size-4" />
                  </div>
                  <ChevronDown className="hidden md:block size-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-48 bg-card text-card-foreground">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-semibold text-foreground">Ngọc Trần</p>
                <p className="text-xs text-muted-foreground">user@notevault.local</p>
              </div>
              <DropdownMenuItem className="cursor-pointer">
                Hồ sơ cá nhân
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                Bảo mật Vault
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Expandable Mobile Search Input & Recents */}
      {isMobileSearchOpen && (
        <div className="md:hidden w-full px-4 pb-3 pt-1 border-t border-border/40 bg-background/95 backdrop-blur-xl">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <Search className="size-4" />
            </div>
            <input
              ref={mobileInputRef}
              type="text"
              value={searchQuery}
              onKeyDown={handleInputKeyDown}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm kiếm ghi chú…"
              className="w-full h-9 pl-9 pr-8 rounded-lg bg-muted/70 text-foreground placeholder:text-muted-foreground text-sm border border-border focus:bg-background focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {filteredRecents.length > 0 && (
            <div className="mt-2 flex flex-col gap-1">
              <div className="flex items-center justify-between px-1 py-1 text-[11px] text-muted-foreground font-medium">
                <span className="flex items-center gap-1">
                  <History className="size-3" />
                  Gần đây
                </span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="hover:underline hover:text-foreground"
                >
                  Xóa
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {filteredRecents.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleSelectRecent(item)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-foreground text-xs hover:bg-muted/80 transition-colors"
                  >
                    <Clock className="size-3 text-muted-foreground" />
                    <span>{item}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  )
}

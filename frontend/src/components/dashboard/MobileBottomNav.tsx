import { StickyNote, Folder, Lock, Settings } from 'lucide-react'
import { useSidebar } from '@/components/ui/sidebar'

export type MobileTab = 'notes' | 'topics' | 'locked' | 'settings'

interface MobileBottomNavProps {
  activeTab: MobileTab
  onTabChange: (tab: MobileTab) => void
  onSelectTopic: (id: string) => void
}

export function MobileBottomNav({
  activeTab,
  onTabChange,
  onSelectTopic,
}: MobileBottomNavProps) {
  const { setOpenMobile } = useSidebar()

  const handleTabClick = (tab: MobileTab) => {
    onTabChange(tab)
    if (tab === 'topics') {
      setOpenMobile(true)
    } else if (tab === 'notes') {
      onSelectTopic('')
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background/90 backdrop-blur-xl border-t border-border pb-[env(safe-area-inset-bottom,0px)] shadow-lg">
      <div className="h-16 flex items-center justify-around px-2 max-w-[390px] mx-auto">
        <button
          type="button"
          onClick={() => handleTabClick('notes')}
          className={`flex-1 flex flex-col items-center justify-center h-12 py-1 transition-colors cursor-pointer ${
            activeTab === 'notes'
              ? 'text-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <StickyNote className="size-5" />
          <span className="text-[11px] mt-0.5">Ghi chú</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('topics')}
          className={`flex-1 flex flex-col items-center justify-center h-12 py-1 transition-colors cursor-pointer ${
            activeTab === 'topics'
              ? 'text-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Folder className="size-5" />
          <span className="text-[11px] mt-0.5">Chủ đề</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('locked')}
          className={`flex-1 flex flex-col items-center justify-center h-12 py-1 transition-colors cursor-pointer ${
            activeTab === 'locked'
              ? 'text-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Lock className="size-5" />
          <span className="text-[11px] mt-0.5">Riêng tư</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('settings')}
          className={`flex-1 flex flex-col items-center justify-center h-12 py-1 transition-colors cursor-pointer ${
            activeTab === 'settings'
              ? 'text-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Settings className="size-5" />
          <span className="text-[11px] mt-0.5">Cài đặt</span>
        </button>
      </div>
    </nav>
  )
}

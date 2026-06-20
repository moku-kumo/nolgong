import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Settings, Flame, Trophy, Timer } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import TimerBar from './TimerBar'
import ScoreBoard from './ScoreBoard'
import SettingsModal from '@/components/SettingsModal'
import { useStudyTimer } from '@/hooks/useStudyTimer'
import type { ReactNode } from 'react'

type BestRecord =
  | { type: 'streak'; value: number }
  | { type: 'highScore'; value: number }
  | { type: 'bestTime'; value: number | null }

interface GameLayoutProps {
  title: string
  icon?: LucideIcon | React.ComponentType<any>
  iconGradient?: string
  backTo: string
  backLabel?: string
  score: number
  total: number
  bestRecord?: BestRecord
  timerEnabled?: boolean
  timerSeconds?: number
  timerKey?: number
  onTimeUp?: () => void
  children: ReactNode
}

export default function GameLayout({
  title,
  icon: Icon,
  iconGradient = 'from-indigo-500 to-purple-600',
  backTo,
  backLabel: _backLabel = '뒤로',
  score,
  total,
  bestRecord,
  timerEnabled = true,
  timerSeconds = 10,
  timerKey,
  onTimeUp,
  children,
}: GameLayoutProps) {
  useStudyTimer()
  const [settingsOpen, setSettingsOpen] = useState(false)
  return (
    <div className="min-h-dvh flex flex-col bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/30">
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center justify-between px-5 h-[60px]">
          <Link to={backTo} className="p-2.5 -ml-2 rounded-xl hover:bg-gray-100/80 transition-colors">
            <ChevronLeft size={20} className="text-gray-500" />
          </Link>
          <div className="flex items-center gap-2">
            {Icon && (
              <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${iconGradient} flex items-center justify-center shadow-sm`}>
                <Icon size={14} className="text-white" strokeWidth={2.5} />
              </div>
            )}
            <h2 className="text-[17px] font-bold text-gray-900">{title}</h2>
          </div>
          <div className="flex items-center gap-1.5">
            {bestRecord && bestRecord.value !== null && bestRecord.value > 0 && (
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/60 rounded-full px-2.5 py-1.5">
                {bestRecord.type === 'streak' && <Flame size={13} className="text-orange-500" />}
                {bestRecord.type === 'highScore' && <Trophy size={13} className="text-amber-500" />}
                {bestRecord.type === 'bestTime' && <Timer size={13} className="text-blue-500" />}
                <span className="text-xs font-bold text-amber-700">
                  {bestRecord.type === 'bestTime'
                    ? `${Math.floor(bestRecord.value! / 60)}:${String(bestRecord.value! % 60).padStart(2, '0')}`
                    : bestRecord.value}
                </span>
              </div>
            )}
            <ScoreBoard score={score} total={total} />
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2.5 rounded-xl hover:bg-gray-100/80 transition-colors"
              aria-label="설정"
            >
              <Settings size={18} className="text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      {timerEnabled && (
        <div className="max-w-lg mx-auto w-full px-5 pt-3">
          <TimerBar key={timerKey} seconds={timerSeconds} onTimeUp={onTimeUp} />
        </div>
      )}

      <main className="flex-1 flex flex-col items-center justify-center gap-6 p-5">
        {children}
      </main>

      {settingsOpen && <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />}
    </div>
  )
}

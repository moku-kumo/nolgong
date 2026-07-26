import { useState } from 'react'
import { Link } from 'react-router-dom'
import SubjectCard from '@/components/SubjectCard'
import SettingsModal from '@/components/SettingsModal'
import { ChevronLeft, Settings, BookOpen, PenTool } from 'lucide-react'

function GieukIcon({ size = 22, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fill="currentColor" fontSize="16" fontWeight="700" fontFamily="sans-serif">ㄱ</text>
    </svg>
  )
}

const modes = [
  { to: '/korean/jamo', icon: GieukIcon, label: '자음/모음', desc: 'ㄱㄴㄷ ㅁㅂㅅ 배우기', gradient: 'bg-gradient-to-br from-violet-500 to-purple-600', iconColor: 'text-white' },
  { to: '/korean/word', icon: BookOpen, label: '단어읽기', desc: '한글 단어를 속도감 있게', gradient: 'bg-gradient-to-br from-purple-500 to-fuchsia-600', iconColor: 'text-white' },
  { to: '/korean/writing', icon: PenTool, label: '글씨 쓰기', desc: '따라쓰기 · 자유쓰기', gradient: 'bg-gradient-to-br from-fuchsia-500 to-pink-600', iconColor: 'text-white' },
]

export default function KoreanHome() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  return (
    <div className="min-h-dvh bg-gradient-to-br from-violet-50 via-purple-50/30 to-slate-50">
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center justify-between px-5 h-[60px]">
          <Link to="/" className="p-2.5 -ml-2 rounded-xl hover:bg-gray-100/80 transition-colors">
            <ChevronLeft size={20} className="text-gray-500" />
          </Link>
          <h1 className="text-[17px] font-bold text-gray-900">한글</h1>
          <button onClick={() => setSettingsOpen(true)} className="p-2.5 rounded-xl hover:bg-gray-100/80 transition-colors" aria-label="설정">
            <Settings size={20} className="text-gray-400" />
          </button>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-5 pt-6 pb-8 space-y-3">
        {modes.map((m, i) => (
          <SubjectCard key={m.to} {...m} index={i} />
        ))}
      </main>
      {settingsOpen && <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />}
    </div>
  )
}

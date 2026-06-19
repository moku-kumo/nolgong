import { useState } from 'react'
import { Link } from 'react-router-dom'
import SubjectCard from '@/components/SubjectCard'
import SettingsModal from '@/components/SettingsModal'
import { ChevronLeft, Settings, Plus, PenLine, Shapes, Clock } from 'lucide-react'

const modes = [
  { to: '/math/addition', icon: Plus, label: '더하기', desc: '덧셈과 뺄셈 연습', gradient: 'bg-gradient-to-br from-blue-500 to-indigo-600', iconColor: 'text-white' },
  { to: '/math/blank', icon: PenLine, label: '빈칸채우기', desc: '빠진 숫자를 찾아보세요', gradient: 'bg-gradient-to-br from-sky-500 to-blue-600', iconColor: 'text-white' },
  { to: '/math/pattern', icon: Shapes, label: '패턴채우기', desc: '규칙을 찾아 완성해요', gradient: 'bg-gradient-to-br from-indigo-500 to-violet-600', iconColor: 'text-white' },
  { to: '/math/clock', icon: Clock, label: '시계 읽기', desc: '시계를 보고 시간을 맞춰요', gradient: 'bg-gradient-to-br from-amber-500 to-orange-600', iconColor: 'text-white' },
]

export default function MathHome() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  return (
    <div className="min-h-dvh bg-gradient-to-br from-blue-50 via-indigo-50/30 to-slate-50">
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center justify-between px-5 h-[60px]">
          <Link to="/" className="p-2.5 -ml-2 rounded-xl hover:bg-gray-100/80 transition-colors">
            <ChevronLeft size={20} className="text-gray-500" />
          </Link>
          <h1 className="text-[17px] font-bold text-gray-900">수학</h1>
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

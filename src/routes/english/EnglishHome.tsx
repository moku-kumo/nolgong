import { useState } from 'react'
import { Link } from 'react-router-dom'
import SubjectCard from '@/components/SubjectCard'
import SettingsModal from '@/components/SettingsModal'
import { ChevronLeft, Settings, ALargeSmall, Image, Volume2, PencilLine } from 'lucide-react'

const modes = [
  { to: '/english/alphabet', icon: ALargeSmall, label: '알파벳', desc: 'A부터 Z까지 배워요', gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600', iconColor: 'text-white' },
  { to: '/english/writing', icon: PencilLine, label: '글씨 쓰기', desc: '대문자와 소문자를 따라 써요', gradient: 'bg-gradient-to-br from-emerald-500 to-green-600', iconColor: 'text-white' },
  { to: '/english/picture', icon: Image, label: '그림단어', desc: '그림을 보고 단어를 찾아요', gradient: 'bg-gradient-to-br from-green-500 to-emerald-600', iconColor: 'text-white' },
  { to: '/english/listen', icon: Volume2, label: '듣기', desc: '듣고 맞는 단어를 골라요', gradient: 'bg-gradient-to-br from-cyan-500 to-teal-600', iconColor: 'text-white' },
]

export default function EnglishHome() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  return (
    <div className="min-h-dvh bg-gradient-to-br from-emerald-50 via-teal-50/30 to-slate-50">
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center justify-between px-5 h-[60px]">
          <Link to="/" className="p-2.5 -ml-2 rounded-xl hover:bg-gray-100/80 transition-colors">
            <ChevronLeft size={20} className="text-gray-500" />
          </Link>
          <h1 className="text-[17px] font-bold text-gray-900">영어</h1>
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

import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Settings, BarChart3, LogOut, Calculator, Gamepad2, Trophy, Clock, Flame } from 'lucide-react'
import { useStudyTimeStore, getTodaySeconds, isGameUnlocked, canPlayGame, getRemainingGameSeconds, getRequiredStudySeconds } from '@/stores/studyTimeStore'
import { useAuthStore } from '@/stores/authStore'
import SettingsModal from '@/components/SettingsModal'

// 한글 '가' 아이콘
function GaIcon({ size = 22, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fill="currentColor" fontSize="16" fontWeight="700" fontFamily="sans-serif">가</text>
    </svg>
  )
}

// 영어 'A' 아이콘
function AIcon({ size = 22, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fill="currentColor" fontSize="17" fontWeight="700" fontFamily="sans-serif">A</text>
    </svg>
  )
}

const subjects = [
  {
    to: '/math',
    icon: Calculator,
    label: '수학',
    desc: '더하기 · 빈칸 · 패턴',
    gradient: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    iconColor: 'text-white',
  },
  {
    to: '/korean',
    icon: GaIcon,
    label: '한글',
    desc: '자음모음 · 단어읽기',
    gradient: 'bg-gradient-to-br from-violet-500 to-purple-600',
    iconColor: 'text-white',
  },
  {
    to: '/english',
    icon: AIcon,
    label: '영어',
    desc: '알파벳 · 파닉스 · 단어',
    gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    iconColor: 'text-white',
  },
]

export default function Home() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const todaySeconds = useStudyTimeStore(getTodaySeconds)
  const required = getRequiredStudySeconds()
  const unlocked = useStudyTimeStore(isGameUnlocked)
  const playable = useStudyTimeStore(canPlayGame)
  const remainingGame = useStudyTimeStore(getRemainingGameSeconds)
  const mins = Math.floor(todaySeconds / 60)
  const progress = Math.min(100, (todaySeconds / required) * 100)
  const remMins = Math.floor(remainingGame / 60)
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/40 relative">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center justify-between px-5 h-[60px]">
          <Link to="/parent" className="p-2.5 -ml-2 rounded-xl hover:bg-gray-100/80 transition-colors" aria-label="학습 통계">
            <BarChart3 size={20} className="text-indigo-500" />
          </Link>
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Flame size={14} className="text-white" />
            </div>
            <span className="text-[17px] font-bold text-gray-900">놀공</span>
          </div>
          <div className="flex items-center gap-0.5">
            {user && (
              <button onClick={signOut} className="p-2.5 rounded-xl hover:bg-gray-100/80 transition-colors" aria-label="로그아웃">
                <LogOut size={20} className="text-gray-400" />
              </button>
            )}
            <button onClick={() => setSettingsOpen(true)} className="p-2.5 rounded-xl hover:bg-gray-100/80 transition-colors" aria-label="설정">
              <Settings size={20} className="text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-6 pb-10">
        {/* 오늘의 학습 진행 카드 */}
        <motion.section
          className="mb-7"
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-5 shadow-lg shadow-indigo-500/20 relative overflow-hidden">
            {/* 데코 */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-white/70" />
                  <span className="text-sm font-medium text-white/70">오늘의 학습</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1">
                  <Trophy size={13} className="text-yellow-300" />
                  <span className="text-sm font-bold text-white">{mins}분</span>
                </div>
              </div>

              <div className="mt-4 w-full bg-white/20 rounded-full h-3 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-yellow-300 to-orange-300"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <p className="text-[13px] text-white/50 mt-2">
                {unlocked ? '🎉 게임 잠금해제 완료!' : `${Math.floor(required / 60)}분 달성하면 게임이 열려요`}
              </p>
            </div>
          </div>
        </motion.section>

        {/* 과목 섹션 */}
        <section className="mb-7">
          <h2 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">과목</h2>
          <div className="space-y-3">
            {subjects.map((s, i) => (
              <motion.div
                key={s.to}
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 + i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link
                  to={s.to}
                  className="group flex items-center gap-4 p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm hover:shadow-lg hover:bg-white active:scale-[0.97] transition-all"
                >
                  <div className={`w-12 h-12 rounded-xl ${s.gradient} flex items-center justify-center shrink-0 shadow-md shadow-${s.gradient.includes('blue') ? 'blue' : s.gradient.includes('emerald') ? 'emerald' : 'violet'}-500/25`}>
                    <s.icon size={22} className={s.iconColor} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[16px] font-semibold text-gray-800 block">{s.label}</span>
                    <span className="text-[13px] text-gray-400">{s.desc}</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-300 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 게임 섹션 */}
        <section>
          <h2 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">보상</h2>
          <motion.div
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              to="/game"
              className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all active:scale-[0.97] ${
                playable
                  ? 'bg-gradient-to-r from-orange-50 to-pink-50 border-orange-200/60 shadow-sm hover:shadow-lg'
                  : 'bg-white/60 border-gray-200/50 shadow-sm hover:shadow-md'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                playable
                  ? 'bg-gradient-to-br from-orange-400 to-rose-500 shadow-orange-500/25'
                  : 'bg-gradient-to-br from-gray-300 to-gray-400 shadow-gray-400/20'
              }`}>
                <Gamepad2 size={22} className="text-white" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[16px] font-semibold text-gray-800 block">
                  {playable ? '게임하기' : unlocked ? '시간 소진' : '게임 잠김'}
                </span>
                <span className="text-[13px] text-gray-400">
                  {playable
                    ? `남은 시간 ${remMins}분 — 지금 플레이!`
                    : unlocked
                      ? '더 공부하면 시간이 늘어나요'
                      : `${mins}분 / ${Math.floor(required / 60)}분 달성 중`}
                </span>
              </div>
              {playable ? (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shrink-0 shadow-sm">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              )}
            </Link>
          </motion.div>
        </section>
      </main>

      {settingsOpen && <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />}
    </div>
  )
}

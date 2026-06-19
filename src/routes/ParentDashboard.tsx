import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Calendar, Target, Clock, TrendingUp, Lock, LogOut } from 'lucide-react'
import { motion } from 'framer-motion'
import { useStatsStore, getSessionsByDate, getRecentDays, MODE_NAMES, type SessionRecord } from '@/stores/statsStore'
import { useStudyTimeStore } from '@/stores/studyTimeStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAuthStore } from '@/stores/authStore'

function DaySummary({ date, sessions }: { date: string; sessions: SessionRecord[] }) {
  const totalCorrect = sessions.reduce((s, r) => s + r.correct, 0)
  const totalQ = sessions.reduce((s, r) => s + r.total, 0)
  const totalMin = Math.round(sessions.reduce((s, r) => s + r.durationSec, 0) / 60)
  const accuracy = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0

  const d = new Date(date)
  const dayName = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()]
  const label = `${d.getMonth() + 1}/${d.getDate()}(${dayName})`

  if (sessions.length === 0) {
    return (
      <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-gray-50/50">
        <span className="text-sm text-gray-400 w-20">{label}</span>
        <span className="text-sm text-gray-300">기록 없음</span>
      </div>
    )
  }

  const byMode: Record<string, { correct: number; total: number }> = {}
  sessions.forEach(s => {
    if (!byMode[s.mode]) byMode[s.mode] = { correct: 0, total: 0 }
    byMode[s.mode].correct += s.correct
    byMode[s.mode].total += s.total
  })

  return (
    <div className="py-3 px-4 rounded-xl bg-white/80 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-gray-700">{label}</span>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>{totalQ}문제</span>
          <span className="text-emerald-500 font-medium">{accuracy}%</span>
          <span>{totalMin}분</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(byMode).map(([mode, data]) => {
          const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
          return (
            <span key={mode} className={`text-xs px-2 py-1 rounded-full font-medium ${pct >= 80 ? 'bg-emerald-50 text-emerald-600' : pct >= 50 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
              {MODE_NAMES[mode] ?? mode} {pct}%
            </span>
          )
        })}
      </div>
    </div>
  )
}

export default function ParentDashboard() {
  const sessions = useStatsStore(s => s.sessions)
  const dailySeconds = useStudyTimeStore(s => s.dailySeconds)

  const [authed, setAuthed] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [error, setError] = useState(false)
  const parentPin = useSettingsStore(s => s.parentPin)
  const requiredStudyMinutes = useSettingsStore(s => s.requiredStudyMinutes)
  const setRequiredStudyMinutes = useSettingsStore(s => s.setRequiredStudyMinutes)

  const checkAnswer = useCallback(() => {
    if (pinInput === parentPin) {
      setAuthed(true)
    } else {
      setError(true)
      setPinInput('')
    }
  }, [pinInput, parentPin])

  const days = getRecentDays(7)
  const weekSessions = days.flatMap(d => getSessionsByDate(sessions, d))
  const weekCorrect = weekSessions.reduce((s, r) => s + r.correct, 0)
  const weekTotal = weekSessions.reduce((s, r) => s + r.total, 0)
  const weekAccuracy = weekTotal > 0 ? Math.round((weekCorrect / weekTotal) * 100) : 0
  const weekStudyMin = Math.round(days.reduce((s, d) => s + (dailySeconds[d] ?? 0), 0) / 60)
  const activeDays = days.filter(d => getSessionsByDate(sessions, d).length > 0).length

  if (!authed) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/40 p-6">
        <Link to="/" className="absolute top-6 left-6 p-2.5 rounded-xl hover:bg-gray-100/80 transition-colors">
          <ChevronLeft size={20} className="text-gray-500" />
        </Link>
        <motion.div
          className="bg-white rounded-2xl p-7 max-w-sm w-full shadow-lg border border-gray-100"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
              <Lock size={22} className="text-white" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-center text-gray-900 mb-1">부모 인증</h2>
          <p className="text-center text-sm text-gray-400 mb-6">PIN을 입력해주세요 (초기: 0000)</p>
          {error && <p className="text-center text-rose-500 text-sm mb-3">PIN이 틀렸어요!</p>}
          <input
            type="password"
            inputMode="numeric"
            maxLength={10}
            value={pinInput}
            onChange={e => { setPinInput(e.target.value); setError(false) }}
            onKeyDown={e => e.key === 'Enter' && checkAnswer()}
            placeholder="PIN 입력"
            className="w-full text-center text-2xl font-bold border-2 border-gray-200 rounded-xl py-3 mb-4 focus:border-indigo-500 focus:outline-none transition-colors tracking-[0.3em]"
            autoFocus
          />
          <button
            onClick={checkAnswer}
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-500/25"
          >
            확인
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/40">
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center justify-between px-5 h-[60px]">
          <Link to="/" className="p-2.5 -ml-2 rounded-xl hover:bg-gray-100/80 transition-colors">
            <ChevronLeft size={20} className="text-gray-500" />
          </Link>
          <h1 className="text-[17px] font-bold text-gray-900">학습 통계</h1>
          <div className="w-8" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-6 pb-8">
        {/* 주간 요약 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { icon: Calendar, label: '학습일', value: `${activeDays}/7일`, color: 'from-blue-500 to-indigo-600' },
            { icon: Target, label: '정답률', value: `${weekAccuracy}%`, color: 'from-emerald-500 to-teal-600' },
            { icon: TrendingUp, label: '문제 수', value: `${weekTotal}`, color: 'from-violet-500 to-purple-600' },
            { icon: Clock, label: '공부시간', value: `${weekStudyMin}분`, color: 'from-orange-400 to-rose-500' },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-100"
            >
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center mb-2`}>
                <item.icon size={15} className="text-white" />
              </div>
              <p className="text-xl font-bold text-gray-800">{item.value}</p>
              <p className="text-xs text-gray-400">{item.label}</p>
            </motion.div>
          ))}
        </div>

        {/* 일별 상세 */}
        <h2 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">최근 7일</h2>
        <div className="space-y-2">
          {days.map(d => (
            <DaySummary key={d} date={d} sessions={getSessionsByDate(sessions, d)} />
          ))}
        </div>

        {sessions.length === 0 && (
          <p className="text-center text-gray-400 mt-8">아직 학습 기록이 없어요</p>
        )}

        {/* 게임 해금 시간 */}
        <div className="mt-8 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-700 mb-3">게임 해금 시간</h3>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">공부 후 게임 잠금 해제</span>
            <span className="text-sm font-semibold text-indigo-500">{requiredStudyMinutes}분</span>
          </div>
          <input
            type="range"
            min={1}
            max={60}
            step={1}
            value={requiredStudyMinutes}
            onChange={(e) => setRequiredStudyMinutes(Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
          <p className="text-xs text-gray-400 mt-2">설정한 시간만큼 공부해야 게임을 할 수 있어요</p>
        </div>

        {/* PIN 변경 */}
        <div className="mt-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-700 mb-3">부모 PIN 변경</h3>
          <div className="flex items-center gap-3">
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              value={parentPin}
              onChange={(e) => useSettingsStore.getState().setParentPin(e.target.value)}
              className="flex-1 text-center text-lg font-bold border-2 border-gray-200 rounded-xl py-2 focus:border-indigo-500 focus:outline-none tracking-[0.3em]"
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">게임 시간제한 해제 및 학습 통계 접근에 사용됩니다</p>
        </div>

        {/* 로그아웃 */}
        <div className="mt-4">
          <button
            onClick={() => useAuthStore.getState().signOut()}
            className="w-full py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={18} />
            로그아웃
          </button>
        </div>
      </main>
    </div>
  )
}

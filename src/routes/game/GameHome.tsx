import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Lock, Clock, Unlock, Target, Bomb, Search, Navigation, Layers } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStudyTimeStore, getTodaySeconds, isGameUnlocked, canPlayGame, getRemainingGameSeconds, isTimeLimitOff, getRequiredStudySeconds } from '@/stores/studyTimeStore'
import SubjectCard from '@/components/SubjectCard'
import { useSettingsStore } from '@/stores/settingsStore'

const games = [
  { to: '/game/whack', icon: Target, label: '두더지잡기', desc: '빠르게 터치!', gradient: 'bg-gradient-to-br from-orange-400 to-red-500', iconColor: 'text-white' },
  { to: '/game/dodge', icon: Bomb, label: '똥 피하기', desc: '피하고 살아남자', gradient: 'bg-gradient-to-br from-amber-400 to-orange-500', iconColor: 'text-white' },
  { to: '/game/spot', icon: Search, label: '틀린그림찾기', desc: '다른 점을 찾아요', gradient: 'bg-gradient-to-br from-pink-400 to-rose-500', iconColor: 'text-white' },
  { to: '/game/maze', icon: Navigation, label: '미로찾기', desc: '출구를 찾아요', gradient: 'bg-gradient-to-br from-cyan-400 to-blue-500', iconColor: 'text-white' },
  { to: '/game/memory', icon: Layers, label: '기억력 게임', desc: '같은 그림 카드 찾기', gradient: 'bg-gradient-to-br from-violet-400 to-purple-500', iconColor: 'text-white' },
]

export default function GameHome() {
  const todaySeconds = useStudyTimeStore(getTodaySeconds)
  const unlocked = useStudyTimeStore(isGameUnlocked)
  const playable = useStudyTimeStore(canPlayGame)
  const remainingGame = useStudyTimeStore(getRemainingGameSeconds)
  const timeLimitOff = useStudyTimeStore(isTimeLimitOff)
  const setTimeLimitOff = useStudyTimeStore(s => s.setTimeLimitOff)
  const clearTimeLimitOff = useStudyTimeStore(s => s.clearTimeLimitOff)
  const required = getRequiredStudySeconds()

  const mins = Math.floor(todaySeconds / 60)
  const secs = todaySeconds % 60
  const requiredMins = Math.floor(required / 60)
  const progress = Math.min(100, (todaySeconds / required) * 100)
  const remMins = Math.floor(remainingGame / 60)
  const remSecs = remainingGame % 60

  // PIN 인증 모달
  const [showPin, setShowPin] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)
  const parentPin = useSettingsStore(s => s.parentPin)

  const openPinModal = useCallback(() => {
    setPinInput('')
    setPinError(false)
    setShowPin(true)
  }, [])

  const checkPin = useCallback(() => {
    if (pinInput === parentPin) {
      setTimeLimitOff()
      setShowPin(false)
    } else {
      setPinError(true)
      setPinInput('')
    }
  }, [pinInput, parentPin, setTimeLimitOff])

  return (
    <div className="min-h-dvh bg-gradient-to-br from-orange-50 via-rose-50/30 to-slate-50">
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center justify-between px-5 h-[60px]">
          <Link to="/" className="p-2.5 -ml-2 rounded-xl hover:bg-gray-100/80 transition-colors">
            <ChevronLeft size={20} className="text-gray-500" />
          </Link>
          <h1 className="text-[17px] font-bold text-gray-900">게임</h1>
          <div className="w-8" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-6 pb-8">

      {/* 공부 시간 프로그레스 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>오늘 공부 시간</span>
          <span>{mins}분 {secs}초 / {requiredMins}분</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${unlocked ? 'bg-gradient-to-r from-green-400 to-emerald-400' : 'bg-gradient-to-r from-orange-400 to-pink-400'}`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        {!unlocked && (
          <p className="text-center text-sm text-gray-400 mt-2">
            {requiredMins}분 이상 공부하면 게임을 할 수 있어요
          </p>
        )}
      </div>

      {/* 남은 게임 시간 / 시간제한 해제 */}
      <div className="mb-6 text-center">
        {timeLimitOff ? (
          <div className="flex flex-col items-center gap-2">
            <div className="inline-flex items-center gap-2 bg-emerald-50 rounded-xl px-4 py-2.5 border border-emerald-200">
              <Unlock size={16} className="text-emerald-500" />
              <span className="font-semibold text-emerald-600 text-sm">시간제한 해제됨</span>
            </div>
            <button
              onClick={clearTimeLimitOff}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl font-semibold text-sm transition-colors"
            >
              다시 잠그기
            </button>
          </div>
        ) : unlocked ? (
          <>
            <div className="inline-flex items-center gap-2 bg-white/80 rounded-xl px-4 py-2.5 shadow-sm border border-gray-100">
              <Clock size={16} className={playable ? 'text-emerald-500' : 'text-rose-400'} />
              <span className={`font-semibold text-sm ${playable ? 'text-emerald-600' : 'text-rose-500'}`}>
                남은 게임 시간: {remMins}분 {remSecs}초
              </span>
            </div>
            {playable ? (
              <p className="text-xs text-gray-400 mt-2">공부한 만큼 게임할 수 있어요</p>
            ) : (
              <p className="text-xs text-rose-400 mt-2">게임 시간을 다 썼어요! 더 공부하면 시간이 늘어나요</p>
            )}
          </>
        ) : null}
        {!timeLimitOff && (
          <button
            onClick={openPinModal}
            className="mt-3 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-semibold text-sm transition-all shadow-md shadow-indigo-500/25"
          >
            PIN 입력하고 시간제한 해제
          </button>
        )}
      </div>

      <div className="space-y-3 mt-6">
        {games.map((g, i) =>
          playable ? (
            <SubjectCard key={g.to} {...g} index={i} />
          ) : (
            <div
              key={g.to}
              className="flex items-center gap-4 p-4 bg-white/60 rounded-2xl border border-gray-200/50 opacity-50"
            >
              <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center shrink-0">
                <g.icon size={22} className="text-gray-400" strokeWidth={2} />
              </div>
              <span className="text-[16px] font-semibold text-gray-400 flex-1">{g.label}</span>
              <Lock size={16} className="text-gray-300" />
            </div>
          ),
        )}
      </div>
      </main>

      {/* PIN 인증 모달 */}
      <AnimatePresence>
        {showPin && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowPin(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 10 }}
              className="bg-white rounded-2xl p-7 max-w-sm w-full shadow-2xl border border-gray-100"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-center text-gray-900 mb-1">시간제한 해제</h3>
              <p className="text-center text-sm text-gray-400 mb-6">부모 PIN을 입력해주세요</p>
              {pinError && (
                <p className="text-center text-rose-500 text-sm mb-3">PIN이 틀렸어요!</p>
              )}
              <input
                type="password"
                inputMode="numeric"
                maxLength={10}
                value={pinInput}
                onChange={e => { setPinInput(e.target.value); setPinError(false) }}
                onKeyDown={e => e.key === 'Enter' && checkPin()}
                placeholder="PIN 입력"
                className="w-full text-center text-2xl font-bold border-2 border-gray-200 rounded-xl py-3 mb-4 focus:border-indigo-500 focus:outline-none transition-colors tracking-[0.3em]"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPin(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-600 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={checkPin}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-500/25"
                >
                  확인
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

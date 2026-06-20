import { create } from 'zustand'
import { load, save } from '@/lib/storage'

export interface SessionRecord {
  mode: string        // e.g. "math/addition", "english/phonics"
  date: string        // YYYY-MM-DD
  correct: number
  total: number
  durationSec: number // 소요 시간
}

interface StatsState {
  sessions: SessionRecord[]
  addSession: (record: SessionRecord) => void
}

const MAX_SESSIONS = 500

export const useStatsStore = create<StatsState>((set, get) => ({
  sessions: load<SessionRecord[]>('sessions', []),
  addSession: (record) => {
    const sessions = [...get().sessions, record].slice(-MAX_SESSIONS)
    save('sessions', sessions)
    set({ sessions })
  },
}))

/** 특정 날짜의 세션들 */
export function getSessionsByDate(sessions: SessionRecord[], date: string): SessionRecord[] {
  return sessions.filter(s => s.date === date)
}

/** 최근 N일 날짜 목록 */
export function getRecentDays(n: number): string[] {
  const days: string[] = []
  for (let i = 0; i < n; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
  }
  return days
}

/** 모드별 한글 이름 */
export const MODE_NAMES: Record<string, string> = {
  'math/addition': '더하기',
  'math/subtraction': '빼기',
  'math/multiplication': '곱하기',
  'math/blank': '빈칸채우기',
  'math/pattern': '패턴채우기',
  'math/clock': '시계 보기',
  'english/alphabet': '알파벳',
  'english/picture': '그림단어',
  'english/listen': '듣기',
  'english/phonics': '파닉스',
  'korean/jamo': '자음모음',
  'korean/word': '단어읽기',
  'korean/batchim': '받침읽기',
}

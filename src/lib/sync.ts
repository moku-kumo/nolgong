import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useStatsStore, type SessionRecord } from '@/stores/statsStore'
import { useProgressStore } from '@/stores/progressStore'

/**
 * 로그인 시 로컬 데이터를 Supabase에 동기화하고,
 * 서버 데이터를 병합하여 로컬에 반영합니다.
 *
 * Supabase 테이블 스키마 (나중에 대시보드에서 생성):
 *
 * -- sessions 테이블
 * create table public.sessions (
 *   id uuid default gen_random_uuid() primary key,
 *   user_id uuid references auth.users not null,
 *   mode text not null,
 *   date text not null,
 *   correct int not null,
 *   total int not null,
 *   duration_sec int not null,
 *   created_at timestamptz default now()
 * );
 * alter table public.sessions enable row level security;
 * create policy "Users can manage own sessions" on public.sessions
 *   for all using (auth.uid() = user_id);
 *
 * -- stars 테이블
 * create table public.stars (
 *   user_id uuid references auth.users not null,
 *   mode text not null,
 *   count int not null default 0,
 *   primary key (user_id, mode)
 * );
 * alter table public.stars enable row level security;
 * create policy "Users can manage own stars" on public.stars
 *   for all using (auth.uid() = user_id);
 */

/** 로그인 후 전체 동기화 */
export async function syncAll(): Promise<void> {
  const user = useAuthStore.getState().user
  if (!user) return

  await Promise.all([syncSessions(user.id), syncStars(user.id)])
}

/** 세션 기록을 서버에 업로드하고 서버 데이터로 병합 */
async function syncSessions(userId: string): Promise<void> {
  const localSessions = useStatsStore.getState().sessions

  // 로컬 → 서버: upsert (중복 방지를 위해 mode+date+correct+total 조합 비교)
  if (localSessions.length > 0) {
    const rows = localSessions.map((s) => ({
      user_id: userId,
      mode: s.mode,
      date: s.date,
      correct: s.correct,
      total: s.total,
      duration_sec: s.durationSec,
    }))

    await supabase.from('sessions').upsert(rows, { onConflict: 'user_id,mode,date,correct,total' }).select()
  }

  // 서버 → 로컬: 전체 가져와서 교체
  const { data } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(500)

  if (data && data.length > 0) {
    const merged: SessionRecord[] = data.map((r) => ({
      mode: r.mode,
      date: r.date,
      correct: r.correct,
      total: r.total,
      durationSec: r.duration_sec,
    }))
    useStatsStore.setState({ sessions: merged })
  }
}

/** 별 동기화 */
async function syncStars(userId: string): Promise<void> {
  const localStars = useProgressStore.getState().stars

  // 로컬 → 서버
  const entries = Object.entries(localStars)
  if (entries.length > 0) {
    const rows = entries.map(([mode, count]) => ({
      user_id: userId,
      mode,
      count,
    }))
    await supabase.from('stars').upsert(rows, { onConflict: 'user_id,mode' }).select()
  }

  // 서버 → 로컬
  const { data } = await supabase
    .from('stars')
    .select('mode, count')
    .eq('user_id', userId)

  if (data && data.length > 0) {
    const merged: Record<string, number> = {}
    for (const row of data) {
      merged[row.mode] = Math.max(row.count, localStars[row.mode] ?? 0)
    }
    // 로컬에만 있는 것도 유지
    for (const [mode, count] of Object.entries(localStars)) {
      if (!(mode in merged)) merged[mode] = count
    }
    useProgressStore.setState({ stars: merged })
  }
}

/** 개별 세션 저장 시 서버에도 전송 (실시간) */
export async function pushSession(record: SessionRecord): Promise<void> {
  const user = useAuthStore.getState().user
  if (!user) return

  await supabase.from('sessions').insert({
    user_id: user.id,
    mode: record.mode,
    date: record.date,
    correct: record.correct,
    total: record.total,
    duration_sec: record.durationSec,
  })
}

/** 별 추가 시 서버에도 전송 */
export async function pushStar(mode: string, newCount: number): Promise<void> {
  const user = useAuthStore.getState().user
  if (!user) return

  await supabase.from('stars').upsert({
    user_id: user.id,
    mode,
    count: newCount,
  }, { onConflict: 'user_id,mode' })
}

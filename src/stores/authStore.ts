import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  guest: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  enterAsGuest: () => void
  initialize: () => () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  guest: false,

  signInWithGoogle: async () => {
    const redirectTo = window.location.origin + import.meta.env.BASE_URL

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: false,
      },
    })
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null, guest: false })
  },

  enterAsGuest: () => {
    set({ guest: true, loading: false })
  },

  initialize: () => {
    // 현재 세션 가져오기 (implicit flow: URL hash에서 토큰을 자동 감지)
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, user: session?.user ?? null, loading: false })
      // URL hash에 남은 토큰 파라미터 정리
      if (window.location.hash.includes('access_token')) {
        window.history.replaceState({}, '', window.location.pathname)
      }
    })

    // 인증 상태 변경 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        set({ session, user: session?.user ?? null, loading: false })
      }
    )

    return () => subscription.unsubscribe()
  },
}))

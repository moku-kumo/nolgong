import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { Navigate } from 'react-router-dom'
import { BookOpen, Sparkles } from 'lucide-react'

export default function Login() {
  const { user, loading, signInWithGoogle } = useAuthStore()

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
        <motion.div
          className="w-12 h-12 rounded-full border-3 border-white/20 border-t-white"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
        />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 px-6 relative overflow-hidden">
      {/* 배경 장식 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full bg-pink-400/10 blur-3xl" />
        <div className="absolute top-[20%] right-[10%] w-4 h-4 rounded-full bg-yellow-300/40 animate-pulse" />
        <div className="absolute bottom-[30%] left-[15%] w-3 h-3 rounded-full bg-cyan-300/30 animate-pulse" />
      </div>

      <motion.div
        className="flex flex-col items-center w-full max-w-sm relative z-10"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo */}
        <motion.div
          className="w-24 h-24 rounded-3xl bg-white/15 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl mb-8"
          initial={{ scale: 0.8, rotate: -5 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <BookOpen size={42} className="text-white" strokeWidth={1.5} />
        </motion.div>

        <motion.div
          className="flex items-center gap-2 mb-2"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Sparkles size={18} className="text-yellow-300" />
          <h1 className="text-4xl font-bold text-white tracking-tight">놀공</h1>
          <Sparkles size={18} className="text-yellow-300" />
        </motion.div>
        <p className="text-white/60 text-base mb-14">놀면서 배우는 스마트 학습</p>

        {/* Google Sign In */}
        <motion.button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 h-[56px] bg-white rounded-2xl shadow-xl shadow-black/10 hover:shadow-2xl hover:shadow-black/15 transition-all text-gray-800 font-semibold text-[16px]"
          whileHover={{ y: -2, scale: 1.01 }}
          whileTap={{ scale: 0.97 }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google로 시작하기
        </motion.button>

        <motion.button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-2 h-[56px] mt-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white/90 font-medium text-[15px] hover:bg-white/15 transition-all"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
        >
          체험해보기
        </motion.button>

        <p className="text-xs text-white/30 mt-8 text-center">
          로그인하면 모든 기기에서 학습 기록이 동기화됩니다
        </p>
      </motion.div>
    </div>
  )
}

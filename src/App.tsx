import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { syncAll } from '@/lib/sync'
import { unlockAudio } from '@/lib/audio'
import ProtectedRoute from '@/components/ProtectedRoute'
import Login from '@/routes/Login'
import Home from '@/routes/Home'
import MathHome from '@/routes/math/MathHome'
import Addition from '@/routes/math/Addition'
import BlankFill from '@/routes/math/BlankFill'
import Pattern from '@/routes/math/Pattern'
import ClockReading from '@/routes/math/ClockReading'
import Multiplication from '@/routes/math/Multiplication'
import Subtraction from '@/routes/math/Subtraction'
import EnglishHome from '@/routes/english/EnglishHome'
import Alphabet from '@/routes/english/Alphabet'
import PictureWord from '@/routes/english/PictureWord'
import ListenWord from '@/routes/english/ListenWord'
import KoreanHome from '@/routes/korean/KoreanHome'
import Jamo from '@/routes/korean/Jamo'
import ReadWord from '@/routes/korean/ReadWord'
import Writing from '@/routes/korean/Writing'
import GameHome from '@/routes/game/GameHome'
import WhackAMole from '@/routes/game/WhackAMole'
import DodgePoop from '@/routes/game/DodgePoop'
import SpotDiff from '@/routes/game/SpotDiff'
import MazeFinder from '@/routes/game/MazeFinder'
import Sewing from '@/routes/game/Sewing'
import MemoryMatch from '@/routes/game/MemoryMatch'
import Snake from '@/routes/game/Snake'
import ParentDashboard from '@/routes/ParentDashboard'
import Phonics from '@/routes/english/Phonics'

function App() {
  const initialize = useAuthStore((s) => s.initialize)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    const unsubscribe = initialize()
    return unsubscribe
  }, [initialize])

  // 첫 유저 제스처에서 AudioContext unlock (Galaxy 태블릿 등)
  useEffect(() => {
    const handler = () => {
      unlockAudio()
      window.removeEventListener('pointerdown', handler)
      window.removeEventListener('touchstart', handler)
    }
    window.addEventListener('pointerdown', handler, { once: true })
    window.addEventListener('touchstart', handler, { once: true })
    return () => {
      window.removeEventListener('pointerdown', handler)
      window.removeEventListener('touchstart', handler)
    }
  }, [])

  // 로그인 후 서버 동기화
  useEffect(() => {
    if (user) syncAll()
  }, [user])

  return (
    <BrowserRouter basename="/nolgong">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/math" element={<ProtectedRoute><MathHome /></ProtectedRoute>} />
        <Route path="/math/addition" element={<ProtectedRoute><Addition /></ProtectedRoute>} />
        <Route path="/math/subtraction" element={<ProtectedRoute><Subtraction /></ProtectedRoute>} />
        <Route path="/math/blank" element={<ProtectedRoute><BlankFill /></ProtectedRoute>} />
        <Route path="/math/pattern" element={<ProtectedRoute><Pattern /></ProtectedRoute>} />
        <Route path="/math/clock" element={<ProtectedRoute><ClockReading /></ProtectedRoute>} />
        <Route path="/math/multiplication" element={<ProtectedRoute><Multiplication /></ProtectedRoute>} />
        <Route path="/english" element={<ProtectedRoute><EnglishHome /></ProtectedRoute>} />
        <Route path="/english/alphabet" element={<ProtectedRoute><Alphabet /></ProtectedRoute>} />
        <Route path="/english/picture" element={<ProtectedRoute><PictureWord /></ProtectedRoute>} />
        <Route path="/english/listen" element={<ProtectedRoute><ListenWord /></ProtectedRoute>} />
        <Route path="/korean" element={<ProtectedRoute><KoreanHome /></ProtectedRoute>} />
        <Route path="/korean/jamo" element={<ProtectedRoute><Jamo /></ProtectedRoute>} />
        <Route path="/korean/word" element={<ProtectedRoute><ReadWord /></ProtectedRoute>} />
        <Route path="/korean/writing" element={<ProtectedRoute><Writing /></ProtectedRoute>} />
        <Route path="/game" element={<ProtectedRoute><GameHome /></ProtectedRoute>} />
        <Route path="/game/whack" element={<ProtectedRoute><WhackAMole /></ProtectedRoute>} />
        <Route path="/game/dodge" element={<ProtectedRoute><DodgePoop /></ProtectedRoute>} />
        <Route path="/game/spot" element={<ProtectedRoute><SpotDiff /></ProtectedRoute>} />
        <Route path="/game/maze" element={<ProtectedRoute><MazeFinder /></ProtectedRoute>} />
        <Route path="/game/sewing" element={<ProtectedRoute><Sewing /></ProtectedRoute>} />
        <Route path="/game/memory" element={<ProtectedRoute><MemoryMatch /></ProtectedRoute>} />
        <Route path="/game/snake" element={<ProtectedRoute><Snake /></ProtectedRoute>} />
        <Route path="/parent" element={<ProtectedRoute><ParentDashboard /></ProtectedRoute>} />
        <Route path="/english/phonics" element={<ProtectedRoute><Phonics /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, guest } = useAuthStore()

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-orange-50 to-pink-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-300 border-t-orange-500" />
      </div>
    )
  }

  if (!user && !guest) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

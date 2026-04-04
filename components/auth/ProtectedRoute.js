import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

/**
 * ProtectedRoute — redirects unauthenticated users to /login.
 * Shows a loading spinner while auth state is being determined.
 */
export default function ProtectedRoute({ children }) {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [user, loading])

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-primary)' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--accent) 0%, #818cf8 100%)' }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles size={22} className="text-white" />
            </motion.div>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading Nexus…</p>
        </motion.div>
      </div>
    )
  }

  if (!user) return null

  return children
}

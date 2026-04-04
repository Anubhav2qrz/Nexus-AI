import { useEffect, useState } from 'react'
import Head from 'next/head'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import DesktopLayout from '../components/chat/DesktopLayout'
import MobileLayout from '../components/chat/MobileLayout'
import { useAuth } from '../hooks/useAuth'

/**
 * Root page — the main chat interface.
 * Renders DesktopLayout or MobileLayout based on screen width.
 * Protected: requires authentication.
 */
export default function HomePage() {
  const { user } = useAuth()
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <>
      <Head>
        <title>Nexus AI — Intelligent Conversations</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <ProtectedRoute>
        {mounted && (
          isMobile
            ? <MobileLayout user={user} />
            : <DesktopLayout user={user} />
        )}
      </ProtectedRoute>
    </>
  )
}

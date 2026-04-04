import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import '../styles/globals.css'
import useStore from '../store/useStore'

export default function App({ Component, pageProps }) {
  const { isDark } = useStore()

  // Apply dark mode class on initial load
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  return (
    <>
      <Component {...pageProps} />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: isDark ? '#1e293b' : '#fff',
            color: isDark ? '#f1f5f9' : '#0f172a',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
            borderRadius: '10px',
            fontSize: '14px',
            fontFamily: 'var(--font-sans)',
            boxShadow: isDark 
              ? '0 8px 32px rgba(0,0,0,0.5)' 
              : '0 8px 32px rgba(0,0,0,0.1)',
          },
          success: {
            iconTheme: { primary: '#14b8a6', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#f43f5e', secondary: '#fff' },
          },
        }}
      />
    </>
  )
}

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, MessageSquare, Code, BookOpen, Palette, Zap } from 'lucide-react'
import MessageBubble from './MessageBubble'
import useStore from '../../store/useStore'

/**
 * MessageList — scrollable chat area.
 * Shows loading skeletons, welcome screen, or messages.
 */
export default function MessageList({ messages, user, isLoading }) {
  const bottomRef = useRef(null)
  const { isStreaming } = useStore()

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <MessageSkeleton key={i} isUser={i % 2 === 0} />
        ))}
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto flex items-center justify-center p-4">
        <WelcomeScreen />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6">
        {messages.map((message, i) => (
          <MessageBubble
            key={message.id || i}
            message={message}
            user={user}
          />
        ))}
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  )
}

// ─── Welcome Screen ──────────────────────────────────────────────────────────

function WelcomeScreen() {
  const { selectedPersonality } = useStore()

  const suggestions = [
    { icon: Code, text: 'Write a REST API in Node.js with Express', category: 'Code' },
    { icon: BookOpen, text: 'Explain quantum entanglement simply', category: 'Learn' },
    { icon: Palette, text: 'Help me brainstorm a sci-fi short story', category: 'Create' },
    { icon: Zap, text: 'Give me a 7-day productivity system', category: 'Plan' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="text-center w-full max-w-2xl mx-auto"
    >
      {/* Hero */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
        style={{
          background: 'linear-gradient(135deg, var(--accent) 0%, #818cf8 100%)',
          boxShadow: '0 8px 32px rgba(20,184,166,0.25)',
        }}
      >
        <Sparkles size={28} className="text-white" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-3xl md:text-4xl font-bold mb-3"
        style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
      >
        How can I help you?
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-base mb-8"
        style={{ color: 'var(--text-secondary)' }}
      >
        I'm Nexus — your intelligent assistant. Ask me anything.
      </motion.p>

      {/* Suggestion cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
        {suggestions.map((s, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.05 }}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.99 }}
            className="flex items-start gap-3 p-4 rounded-xl text-left transition-all"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.border = '1px solid var(--accent)'
              e.currentTarget.style.boxShadow = 'var(--glow)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.border = '1px solid var(--border)'
              e.currentTarget.style.boxShadow = 'var(--shadow)'
            }}
            onClick={() => {
              // Find the input and set its value — trigger via custom event
              const event = new CustomEvent('nexus:suggestion', { detail: s.text })
              window.dispatchEvent(event)
            }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: 'var(--accent-soft)' }}>
              <s.icon size={15} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--accent)' }}>{s.category}</p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{s.text}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function MessageSkeleton({ isUser }) {
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar skeleton */}
      <div className="w-8 h-8 rounded-full shrink-0 shimmer" />

      {/* Bubble skeleton */}
      <div className={`space-y-2 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className="h-10 rounded-2xl shimmer"
          style={{ width: `${180 + Math.random() * 120}px` }} />
        {!isUser && (
          <div className="h-4 rounded shimmer" style={{ width: `${120 + Math.random() * 80}px` }} />
        )}
      </div>
    </div>
  )
}

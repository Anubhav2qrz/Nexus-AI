import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, MessageSquare, Trash2, LogOut, Sun, Moon,
  Sparkles, ChevronDown, Settings, User, Search,
  MoreHorizontal, X
} from 'lucide-react'
import toast from 'react-hot-toast'
import useStore from '../../store/useStore'
import { useAuth } from '../../hooks/useAuth'
import { useChat } from '../../hooks/useChat'
import { groupChatsByDate, getUserInitials, getUserDisplayName, AI_PERSONALITIES } from '../../utils/helpers'
import { cn } from '../../utils/helpers'

/**
 * Sidebar — shows chat history, new chat button, user profile.
 * Works for both desktop (persistent) and mobile (drawer overlay).
 */
export default function Sidebar({ onClose }) {
  const { isDark, toggleTheme, selectedPersonality, setSelectedPersonality } = useStore()
  const { user, signOut } = useAuth()
  const { chats, currentChatId, selectChat, deleteChat, newChat, loadChats } = useChat()
  const [searchQuery, setSearchQuery] = useState('')
  const [showPersonality, setShowPersonality] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [chatMenuId, setChatMenuId] = useState(null)

  useEffect(() => {
    loadChats()
  }, [user])

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out')
    } catch {
      toast.error('Failed to sign out')
    }
  }

  const handleDeleteChat = async (e, chatId) => {
    e.stopPropagation()
    setDeletingId(chatId)
    try {
      await deleteChat(chatId)
    } catch {}
    finally { setDeletingId(null); setChatMenuId(null) }
  }

  const handleSelectChat = (chatId) => {
    selectChat(chatId)
    if (onClose) onClose()
  }

  const handleNewChat = () => {
    newChat()
    if (onClose) onClose()
  }

  const filteredChats = chats.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const grouped = groupChatsByDate(filteredChats)
  const personality = AI_PERSONALITIES.find(p => p.id === selectedPersonality)

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--sidebar-bg)' }}>

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)' }}>
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--accent) 0%, #818cf8 100%)' }}>
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="font-bold text-base" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Nexus
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Theme toggle */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--sidebar-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            title="Toggle theme"
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </motion.button>

          {/* Mobile close button */}
          {onClose && (
            <button onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center ml-1"
              style={{ color: 'var(--text-muted)' }}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleNewChat}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium text-sm transition-all"
          style={{
            background: 'linear-gradient(135deg, var(--accent) 0%, #0891b2 100%)',
            color: '#fff',
            boxShadow: '0 2px 12px rgba(20,184,166,0.2)',
          }}
        >
          <Plus size={16} />
          New Chat
        </motion.button>
      </div>

      {/* Personality selector */}
      <div className="px-3 pb-2">
        <button
          onClick={() => setShowPersonality(!showPersonality)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all"
          style={{
            background: 'var(--sidebar-active)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border)',
          }}
        >
          <span className="flex items-center gap-2">
            <span>{personality?.icon}</span>
            <span className="font-medium">{personality?.label} mode</span>
          </span>
          <ChevronDown size={14} className={`transition-transform ${showPersonality ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showPersonality && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-1 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                {AI_PERSONALITIES.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedPersonality(p.id); setShowPersonality(false) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors"
                    style={{
                      background: selectedPersonality === p.id ? 'var(--sidebar-active)' : 'var(--bg-card)',
                      color: selectedPersonality === p.id ? 'var(--accent)' : 'var(--text-secondary)',
                    }}
                    onMouseEnter={e => { if (selectedPersonality !== p.id) e.currentTarget.style.background = 'var(--sidebar-hover)' }}
                    onMouseLeave={e => { if (selectedPersonality !== p.id) e.currentTarget.style.background = 'var(--bg-card)' }}
                  >
                    <span>{p.icon}</span>
                    <span className="font-medium">{p.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className="w-full pl-8 pr-3 py-2 text-xs rounded-lg outline-none"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
      </div>

      {/* Chat history */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {chats.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare size={24} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--text-muted)' }} />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No chats yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Start a conversation!</p>
          </div>
        ) : (
          Object.entries(grouped).map(([period, periodChats]) => {
            if (periodChats.length === 0) return null
            return (
              <div key={period} className="mb-3">
                <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}>
                  {period}
                </p>
                {periodChats.map((chat, i) => (
                  <motion.div
                    key={chat.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="relative group"
                  >
                    <button
                      onClick={() => handleSelectChat(chat.id)}
                      className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left transition-all text-sm"
                      style={{
                        background: currentChatId === chat.id ? 'var(--sidebar-active)' : 'transparent',
                        color: currentChatId === chat.id ? 'var(--accent)' : 'var(--text-secondary)',
                      }}
                      onMouseEnter={e => { if (currentChatId !== chat.id) e.currentTarget.style.background = 'var(--sidebar-hover)' }}
                      onMouseLeave={e => { if (currentChatId !== chat.id) e.currentTarget.style.background = 'transparent' }}
                    >
                      <MessageSquare size={13} className="shrink-0 opacity-60" />
                      <span className="truncate flex-1 text-xs leading-relaxed">{chat.title}</span>

                      {/* Actions */}
                      <button
                        onClick={e => { e.stopPropagation(); setChatMenuId(chatMenuId === chat.id ? null : chat.id) }}
                        className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <MoreHorizontal size={13} />
                      </button>
                    </button>

                    {/* Chat context menu */}
                    <AnimatePresence>
                      {chatMenuId === chat.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute right-2 top-8 z-20 rounded-lg shadow-lg py-1 min-w-28"
                          style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            boxShadow: 'var(--shadow)',
                          }}
                        >
                          <button
                            onClick={e => handleDeleteChat(e, chat.id)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors"
                            style={{ color: '#ef4444' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )
          })
        )}
      </div>

      {/* User profile section */}
      <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg"
          style={{ background: 'var(--sidebar-hover)' }}>
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--accent) 0%, #818cf8 100%)' }}>
            {getUserInitials(user)}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {getUserDisplayName(user)}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
              {user?.email}
            </p>
          </div>

          <button
            onClick={handleSignOut}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

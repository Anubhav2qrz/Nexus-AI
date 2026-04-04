import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, ChevronDown, Check, Cpu, Sun, Moon, PanelLeftOpen, PanelLeftClose } from 'lucide-react'
import useStore from '../../store/useStore'
import { AI_MODELS } from '../../utils/helpers'

/**
 * TopBar — contains hamburger menu (mobile), model selector, theme toggle.
 */
export default function TopBar() {
  const {
    isDark, toggleTheme,
    sidebarOpen, toggleSidebar,
    setMobileDrawerOpen,
    selectedModel, setSelectedModel,
    currentChatId, chats,
  } = useStore()

  const [showModelMenu, setShowModelMenu] = useState(false)

  const currentChat = chats.find(c => c.id === currentChatId)
  const currentModel = AI_MODELS.find(m => m.id === selectedModel) || AI_MODELS[0]

  return (
    <div
      className="shrink-0 flex items-center justify-between px-3 md:px-4 py-3 border-b"
      style={{
        borderColor: 'var(--border)',
        background: 'var(--bg-primary)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      {/* Left: sidebar toggle + chat title */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Desktop sidebar toggle */}
        <button
          onClick={toggleSidebar}
          className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--sidebar-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
          title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        >
          {sidebarOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
        </button>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="flex md:hidden w-8 h-8 items-center justify-center rounded-lg"
          style={{ color: 'var(--text-muted)' }}
        >
          <Menu size={18} />
        </button>

        {/* Current chat title */}
        {currentChat && (
          <p className="text-sm font-medium truncate max-w-xs" style={{ color: 'var(--text-secondary)' }}>
            {currentChat.title}
          </p>
        )}
      </div>

      {/* Center: Model selector */}
      <div className="relative">
        <button
          onClick={() => setShowModelMenu(!showModelMenu)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
          style={{
            color: 'var(--text-primary)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <Cpu size={14} style={{ color: 'var(--accent)' }} />
          <span className="hidden sm:inline">{currentModel.label}</span>
          <span className="sm:hidden text-xs">{currentModel.label.split(' ').slice(-1)}</span>
          <ChevronDown size={13} className={`transition-transform ${showModelMenu ? 'rotate-180' : ''}`}
            style={{ color: 'var(--text-muted)' }} />
        </button>

        {/* Model dropdown */}
        <AnimatePresence>
          {showModelMenu && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-10" onClick={() => setShowModelMenu(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 z-20 rounded-xl overflow-hidden py-1 min-w-52"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow)',
                }}
              >
                <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}>
                  Select Model
                </p>
                {AI_MODELS.map(model => (
                  <button
                    key={model.id}
                    onClick={() => { setSelectedModel(model.id); setShowModelMenu(false) }}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors"
                    style={{
                      background: selectedModel === model.id ? 'var(--sidebar-active)' : 'transparent',
                      color: 'var(--text-primary)',
                    }}
                    onMouseEnter={e => { if (selectedModel !== model.id) e.currentTarget.style.background = 'var(--sidebar-hover)' }}
                    onMouseLeave={e => { if (selectedModel !== model.id) e.currentTarget.style.background = 'transparent' }}
                  >
                    <div className="text-left">
                      <p className="font-medium">{model.label}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{model.description}</p>
                    </div>
                    {selectedModel === model.id && (
                      <Check size={14} style={{ color: 'var(--accent)' }} />
                    )}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Right: Theme toggle */}
      <button
        onClick={toggleTheme}
        className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--sidebar-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
        title={isDark ? 'Light mode' : 'Dark mode'}
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </div>
  )
}

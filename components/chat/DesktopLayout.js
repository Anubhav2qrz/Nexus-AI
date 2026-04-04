import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '../sidebar/Sidebar'
import TopBar from '../ui/TopBar'
import MessageList from '../chat/MessageList'
import ChatInput from '../input/ChatInput'
import useStore from '../../store/useStore'
import { useChat } from '../../hooks/useChat'

/**
 * DesktopLayout — full sidebar + main chat area.
 * Sidebar can be toggled open/closed with smooth animation.
 */
export default function DesktopLayout({ user }) {
  const { sidebarOpen } = useStore()
  const { messages, sendMessage, isStreaming } = useChat()
  const { isLoadingMessages } = useStore()

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>

      {/* Sidebar */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="shrink-0 overflow-hidden border-r"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="w-[260px] h-full">
              <Sidebar />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main chat area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />

        <MessageList
          messages={messages}
          user={user}
          isLoading={isLoadingMessages}
        />

        <ChatInput onSend={sendMessage} disabled={isStreaming} />
      </main>
    </div>
  )
}

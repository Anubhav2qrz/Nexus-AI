import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '../sidebar/Sidebar'
import TopBar from '../ui/TopBar'
import MessageList from '../chat/MessageList'
import ChatInput from '../input/ChatInput'
import useStore from '../../store/useStore'
import { useChat } from '../../hooks/useChat'

/**
 * MobileLayout — fullscreen chat with slide-out drawer sidebar.
 * Optimized for touch: larger targets, gesture-friendly animations.
 */
export default function MobileLayout({ user }) {
  const { mobileDrawerOpen, setMobileDrawerOpen } = useStore()
  const { messages, sendMessage, generateImage, isStreaming } = useChat()
  const { isLoadingMessages } = useStore()

  const closeDrawer = () => setMobileDrawerOpen(false)

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <TopBar />

      <MessageList
        messages={messages}
        user={user}
        isLoading={isLoadingMessages}
      />

      <ChatInput onSend={sendMessage} onGenerateImage={generateImage} disabled={isStreaming} />

      {/* Mobile drawer overlay */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
              onClick={closeDrawer}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed left-0 top-0 bottom-0 z-50 w-72 shadow-2xl"
              style={{ boxShadow: '4px 0 40px rgba(0,0,0,0.4)' }}
            >
              <Sidebar onClose={closeDrawer} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

/**
 * Global application state using Zustand.
 * Manages: theme, sidebar, current chat, messages, model, personality.
 * Chat data is fetched from Supabase and cached here.
 */
const useStore = create(
  devtools(
    persist(
      (set, get) => ({
        // ─── Theme ───────────────────────────────────────────────
        isDark: true,
        toggleTheme: () => {
          const newDark = !get().isDark
          set({ isDark: newDark })
          if (newDark) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
        },

        // ─── Sidebar ─────────────────────────────────────────────
        sidebarOpen: true,
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

        // Mobile drawer
        mobileDrawerOpen: false,
        setMobileDrawerOpen: (open) => set({ mobileDrawerOpen: open }),

        // ─── Chats ───────────────────────────────────────────────
        chats: [],
        setChats: (chats) => set({ chats }),
        addChat: (chat) => set((s) => ({ chats: [chat, ...s.chats] })),
        updateChat: (chatId, updates) =>
          set((s) => ({
            chats: s.chats.map((c) => (c.id === chatId ? { ...c, ...updates } : c)),
          })),
        removeChat: (chatId) =>
          set((s) => ({
            chats: s.chats.filter((c) => c.id !== chatId),
            currentChatId: s.currentChatId === chatId ? null : s.currentChatId,
            messages: s.currentChatId === chatId ? [] : s.messages,
          })),

        // ─── Current Chat ─────────────────────────────────────────
        currentChatId: null,
        setCurrentChatId: (id) => set({ currentChatId: id }),

        // ─── Messages ─────────────────────────────────────────────
        messages: [],
        setMessages: (messages) => set({ messages }),
        addMessage: (message) =>
          set((s) => ({ messages: [...s.messages, message] })),
        updateLastAssistantMessage: (content) =>
          set((s) => {
            const msgs = [...s.messages]
            for (let i = msgs.length - 1; i >= 0; i--) {
              if (msgs[i].role === 'assistant') {
                msgs[i] = { ...msgs[i], content }
                break
              }
            }
            return { messages: msgs }
          }),

        // ─── Loading States ────────────────────────────────────────
        isLoadingChats: false,
        setIsLoadingChats: (v) => set({ isLoadingChats: v }),
        isLoadingMessages: false,
        setIsLoadingMessages: (v) => set({ isLoadingMessages: v }),
        isStreaming: false,
        setIsStreaming: (v) => set({ isStreaming: v }),

        // ─── AI Config ────────────────────────────────────────────
        selectedModel: 'gemini-2.5-flash',
        setSelectedModel: (model) => set({ selectedModel: model }),
        selectedPersonality: 'assistant',
        setSelectedPersonality: (personality) => set({ selectedPersonality: personality }),

        // ─── New Chat ─────────────────────────────────────────────
        startNewChat: () =>
          set({
            currentChatId: null,
            messages: [],
          }),

        // ─── User ─────────────────────────────────────────────────
        user: null,
        setUser: (user) => set({ user }),
      }),
      {
        name: 'nexus-ai-store',
        version: 1,
        // Only persist theme preference and model selection
        partialize: (state) => ({
          isDark: state.isDark,
          selectedModel: state.selectedModel,
          selectedPersonality: state.selectedPersonality,
        }),
        migrate: (persistedState, version) => {
          if (version === 0 || !version) {
            // Migration: remap old gemini-1.5 models to the available gemini-2.5-flash
            const state = persistedState
            if (state.selectedModel && state.selectedModel.startsWith('gemini-1.5')) {
              state.selectedModel = 'gemini-2.5-flash'
            }
            return state
          }
          return persistedState
        }
      }
    )
  )
)

export default useStore

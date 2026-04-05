import { useCallback } from 'react'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import useStore from '../store/useStore'
import {
  getUserChats,
  createChat,
  getChatMessages,
  saveMessage,
  deleteChat,
  updateChatTitle,
  touchChat,
} from '../lib/db'
import { generateChatTitle, AI_PERSONALITIES } from '../utils/helpers'

/**
 * useChat — orchestrates all chat-related operations.
 * Connects Supabase DB operations with Zustand state.
 */
export function useChat() {
  const router = useRouter()
  const {
    user,
    currentChatId,
    setCurrentChatId,
    messages,
    setMessages,
    addMessage,
    updateLastAssistantMessage,
    chats,
    setChats,
    addChat,
    updateChat,
    removeChat,
    setIsLoadingChats,
    setIsLoadingMessages,
    setIsStreaming,
    isStreaming,
    startNewChat,
    selectedModel,
    selectedPersonality,
  } = useStore()

  /**
   * Load all chats for the current user.
   */
  const loadChats = useCallback(async () => {
    if (!user) return
    setIsLoadingChats(true)
    try {
      const data = await getUserChats(user.id)
      setChats(data)
    } catch (err) {
      console.error('Failed to load chats:', err)
      toast.error('Failed to load chat history')
    } finally {
      setIsLoadingChats(false)
    }
  }, [user])

  /**
   * Select and load a specific chat.
   */
  const selectChat = useCallback(async (chatId) => {
    if (chatId === currentChatId) return
    setCurrentChatId(chatId)
    setIsLoadingMessages(true)
    try {
      const data = await getChatMessages(chatId)
      setMessages(data)
    } catch (err) {
      console.error('Failed to load messages:', err)
      toast.error('Failed to load messages')
    } finally {
      setIsLoadingMessages(false)
    }
  }, [currentChatId])

  /**
   * Send a message and stream AI response.
   */
  const sendMessage = useCallback(async (content, images = []) => {
    if (!user || (!content.trim() && images.length === 0) || isStreaming) return

    const personality = AI_PERSONALITIES.find(p => p.id === selectedPersonality)
    const systemPrompt = personality?.prompt || AI_PERSONALITIES[0].prompt

    // Create a new chat if none is selected
    let chatId = currentChatId
    let isNewChat = false

    if (!chatId) {
      try {
        const title = generateChatTitle(content)
        const newChat = await createChat(user.id, title, selectedModel)
        chatId = newChat.id
        setCurrentChatId(chatId)
        addChat(newChat)
        isNewChat = true
      } catch (err) {
        console.error('Failed to create chat:', err)
        toast.error('Failed to create chat')
        return
      }
    }

    // Add user message to UI immediately (optimistic)
    const userMessage = {
      id: `temp-${Date.now()}`,
      chat_id: chatId,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }
    addMessage(userMessage)

    // Add placeholder for assistant response
    const placeholderMessage = {
      id: `streaming-${Date.now()}`,
      chat_id: chatId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
      isStreaming: true,
    }
    addMessage(placeholderMessage)
    setIsStreaming(true)

    // Save user message to DB
    try {
      await saveMessage(chatId, 'user', content)
    } catch (err) {
      console.error('Failed to save user message:', err)
    }

    // Build message history for API call (exclude temp/streaming messages)
    const history = messages
      .filter(m => !m.isStreaming && !m.id?.startsWith('temp-') && !m.id?.startsWith('streaming-'))
      .map(m => ({ role: m.role, content: m.content }))

    // Stream AI response
    let fullResponse = ''
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...history, { role: 'user', content }],
          model: selectedModel,
          systemPrompt,
          images: images.map(img => ({ data: img.content, mimeType: img.mimeType })),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'API request failed')
      }

      // Read the stream
      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '))

        for (const line of lines) {
          const data = line.slice(6)
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices?.[0]?.delta?.content || ''
            fullResponse += delta
            updateLastAssistantMessage(fullResponse)
          } catch {
            // Skip malformed chunks
          }
        }
      }

      // Save assistant response to DB
      if (fullResponse) {
        await saveMessage(chatId, 'assistant', fullResponse)
        await touchChat(chatId)

        // Auto-update chat title from first response if new chat
        if (isNewChat) {
          const autoTitle = generateChatTitle(content)
          await updateChatTitle(chatId, autoTitle)
          updateChat(chatId, { title: autoTitle, updated_at: new Date().toISOString() })
        } else {
          updateChat(chatId, { updated_at: new Date().toISOString() })
        }
      }
    } catch (err) {
      console.error('Streaming error:', err)
      toast.error(err.message || 'Failed to get response')
      updateLastAssistantMessage('Sorry, I encountered an error. Please try again.')
    } finally {
      setIsStreaming(false)
      // Mark streaming message as complete
      const msgs = useStore.getState().messages
      const updatedMsgs = msgs.map(m =>
        m.id?.startsWith('streaming-') ? { ...m, isStreaming: false } : m
      )
      setMessages(updatedMsgs)
    }
  }, [user, currentChatId, messages, isStreaming, selectedModel, selectedPersonality])

  /**
   * Generate an image with DALL·E 3 and add it to the chat.
   */
  const generateImage = useCallback(async (prompt) => {
    if (!user || !prompt.trim() || isStreaming) return

    // Create a new chat if needed
    let chatId = currentChatId
    if (!chatId) {
      try {
        const newChat = await createChat(user.id, `🖼️ ${generateChatTitle(prompt)}`, selectedModel)
        chatId = newChat.id
        setCurrentChatId(chatId)
        addChat(newChat)
      } catch (err) {
        toast.error('Failed to create chat')
        return
      }
    }

    // Add user prompt to UI
    const userMessage = {
      id: `temp-${Date.now()}`,
      chat_id: chatId,
      role: 'user',
      content: `🖼️ Generate image: ${prompt}`,
      created_at: new Date().toISOString(),
    }
    addMessage(userMessage)

    // Add loading placeholder
    const placeholderId = `img-loading-${Date.now()}`
    addMessage({
      id: placeholderId,
      chat_id: chatId,
      role: 'assistant',
      content: '',
      type: 'image-loading',
      created_at: new Date().toISOString(),
      isStreaming: true,
    })
    setIsStreaming(true)

    try {
      await saveMessage(chatId, 'user', `🖼️ Generate image: ${prompt}`)

      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Image generation failed')

      const imageMessage = `![Generated Image](${data.imageUrl})\n\n**Prompt:** ${data.revisedPrompt || prompt}`

      // Replace loading placeholder with actual image
      const msgs = useStore.getState().messages
      const updatedMsgs = msgs.map(m =>
        m.id === placeholderId
          ? { ...m, content: imageMessage, type: 'image', isStreaming: false }
          : m
      )
      setMessages(updatedMsgs)

      await saveMessage(chatId, 'assistant', imageMessage)
      await touchChat(chatId)
      updateChat(chatId, { updated_at: new Date().toISOString() })

    } catch (err) {
      console.error('Image generation error:', err)
      toast.error(err.message || 'Failed to generate image')
      const msgs = useStore.getState().messages
      const updatedMsgs = msgs.map(m =>
        m.id === placeholderId
          ? { ...m, content: '❌ Failed to generate image. Please try again.', type: undefined, isStreaming: false }
          : m
      )
      setMessages(updatedMsgs)
    } finally {
      setIsStreaming(false)
    }
  }, [user, currentChatId, isStreaming, selectedModel])

  /**
   * Delete a chat.
   */
  const handleDeleteChat = useCallback(async (chatId) => {
    try {
      await deleteChat(chatId)
      removeChat(chatId)
      toast.success('Chat deleted')
    } catch (err) {
      console.error('Failed to delete chat:', err)
      toast.error('Failed to delete chat')
    }
  }, [])

  /**
   * Start a new chat session.
   */
  const handleNewChat = useCallback(() => {
    startNewChat()
  }, [])

  return {
    loadChats,
    selectChat,
    sendMessage,
    generateImage,
    deleteChat: handleDeleteChat,
    newChat: handleNewChat,
    currentChatId,
    messages,
    chats,
    isStreaming,
  }
}

import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes without conflicts.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a chat title from the first user message.
 * Truncates to a reasonable length.
 */
export function generateChatTitle(message) {
  const cleaned = message.trim().replace(/\n+/g, ' ')
  if (cleaned.length <= 50) return cleaned
  return cleaned.slice(0, 47) + '...'
}

/**
 * Format a date for sidebar display.
 * Shows "Today", "Yesterday", or the date.
 */
export function formatChatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date

  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  if (sameDay(date, now)) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (sameDay(date, yesterday)) return 'Yesterday'

  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return date.toLocaleDateString([], { weekday: 'long' })
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

/**
 * Group chats by time period for sidebar display.
 */
export function groupChatsByDate(chats) {
  const groups = { Today: [], Yesterday: [], 'This Week': [], 'Older': [] }
  const now = new Date()

  chats.forEach(chat => {
    const date = new Date(chat.updated_at)
    const diff = now - date
    const days = diff / (1000 * 60 * 60 * 24)

    const sameDay = date.toDateString() === now.toDateString()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const isYesterday = date.toDateString() === yesterday.toDateString()

    if (sameDay) groups.Today.push(chat)
    else if (isYesterday) groups.Yesterday.push(chat)
    else if (days < 7) groups['This Week'].push(chat)
    else groups.Older.push(chat)
  })

  return groups
}

/**
 * Copy text to clipboard.
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback for older browsers
    const el = document.createElement('textarea')
    el.value = text
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    return true
  }
}

/**
 * Get user initials from name or email.
 */
export function getUserInitials(user) {
  const name = user?.user_metadata?.full_name || user?.email || ''
  if (!name) return '?'
  const parts = name.split(/[\s@]/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

/**
 * Get display name from user object.
 */
export function getUserDisplayName(user) {
  return user?.user_metadata?.full_name || 
         user?.user_metadata?.name || 
         user?.email?.split('@')[0] || 
         'User'
}

/**
 * Available AI models configuration.
 */
export const AI_MODELS = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', provider: 'google', description: 'Faster & free' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', provider: 'google', description: 'Most capable' },
  { id: 'gpt-4o', label: 'GPT-4o', provider: 'openai', description: 'Most capable' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'openai', description: 'Faster & efficient' },
  { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', provider: 'openai', description: 'Classic & fast' },
]

/**
 * AI Personalities / system prompts.
 */
export const AI_PERSONALITIES = [
  {
    id: 'assistant',
    label: 'Assistant',
    icon: '✨',
    prompt: 'You are Nexus, a helpful, creative, and intelligent AI assistant. You provide clear, accurate, and thoughtful responses.',
  },
  {
    id: 'coder',
    label: 'Coder',
    icon: '💻',
    prompt: 'You are Nexus Code, an expert software engineer and coding assistant. You write clean, efficient, well-documented code and explain technical concepts clearly. Always use appropriate code blocks with language tags.',
  },
  {
    id: 'teacher',
    label: 'Teacher',
    icon: '📚',
    prompt: 'You are Nexus Teach, a patient and engaging educator. You break down complex topics into easy-to-understand explanations, use analogies and examples, and encourage curiosity.',
  },
  {
    id: 'creative',
    label: 'Creative',
    icon: '🎨',
    prompt: 'You are Nexus Creative, a creative writing partner with a flair for storytelling, poetry, and imaginative thinking. You help with creative projects, brainstorming, and artistic expression.',
  },
]

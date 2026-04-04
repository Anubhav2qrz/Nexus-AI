import { supabase } from './supabaseClient'

// ─── Chat Operations ───────────────────────────────────────────────────────────

/**
 * Fetch all chats for the current user, ordered by most recent.
 */
export async function getUserChats(userId) {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) {
    if (error.code === '42P01') {
      console.error('Supabase Error: The "chats" table does not exist. Please run the SQL schema in supabase-schema.sql.')
      throw new Error('Database tables not found. Please run the setup script in Supabase.')
    }
    throw error
  }
  return data || []
}

/**
 * Create a new chat for the current user.
 * @param {string} userId
 * @param {string} title - Auto-generated from first message
 * @param {string} model - AI model used
 */
export async function createChat(userId, title = 'New Chat', model = 'gpt-4o') {
  const { data, error } = await supabase
    .from('chats')
    .insert([{ user_id: userId, title, model }])
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update a chat's title.
 */
export async function updateChatTitle(chatId, title) {
  const { error } = await supabase
    .from('chats')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', chatId)

  if (error) throw error
}

/**
 * Update a chat's updated_at timestamp (called when a new message is added).
 */
export async function touchChat(chatId) {
  const { error } = await supabase
    .from('chats')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', chatId)

  if (error) throw error
}

/**
 * Delete a chat and all its messages (cascade should be set in DB, but explicit for safety).
 */
export async function deleteChat(chatId) {
  // Messages will cascade-delete if FK is set with ON DELETE CASCADE
  const { error } = await supabase
    .from('chats')
    .delete()
    .eq('id', chatId)

  if (error) throw error
}

// ─── Message Operations ────────────────────────────────────────────────────────

/**
 * Fetch all messages for a given chat, ordered by creation time.
 */
export async function getChatMessages(chatId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Save a single message to the database.
 * @param {string} chatId
 * @param {'user'|'assistant'|'system'} role
 * @param {string} content
 */
export async function saveMessage(chatId, role, content) {
  const { data, error } = await supabase
    .from('messages')
    .insert([{ chat_id: chatId, role, content }])
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete all messages in a chat (for "clear chat" functionality).
 */
export async function clearChatMessages(chatId) {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('chat_id', chatId)

  if (error) throw error
}

// ─── User Profile Operations ───────────────────────────────────────────────────

/**
 * Get or create a user profile row in the `profiles` table.
 * This is typically auto-created via a Supabase trigger on auth.users insert.
 */
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

/**
 * Update user profile fields (display name, avatar, preferences).
 */
export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() })
    .select()
    .single()

  if (error) throw error
  return data
}

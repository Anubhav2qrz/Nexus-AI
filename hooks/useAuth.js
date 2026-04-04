import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import useStore from '../store/useStore'

/**
 * useAuth — manages authentication state and exposes auth helpers.
 * Listens to Supabase auth state changes and syncs with Zustand.
 */
export function useAuth() {
  const { user, setUser } = useStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  /**
   * Sign in with email/password.
   */
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  }

  /**
   * Sign up with email/password.
   */
  const signUp = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })
    if (error) throw error
    return data
  }

  /**
   * Sign in with Google OAuth.
   */
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    })
    if (error) throw error
  }

  /**
   * Sign out the current user.
   */
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    // Store cleanup happens via the onAuthStateChange listener
  }

  /**
   * Reset password via email link.
   */
  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  }

  return {
    user,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
  }
}

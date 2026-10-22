"use client"

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"
import { authService } from "@/services/authServices"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true)
      const session = await authService.getSession()
      if (session?.user) {
        setUser(session.user)
      } else {
        setUser(null)
      }
    } catch (err) {
      console.error("Failed to fetch user:", err)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch - run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => {
    const fetch = async () => {
      await fetchUser()
    }
    fetch()
  }, [])

  const login = useCallback(async (email, password) => {
    setError(null)
    try {
      const user = await authService.loginUser({ email, password })
      setUser(user)
      return user
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const register = useCallback(async userData => {
    setError(null)
    try {
      const user = await authService.registerUser(userData)
      setUser(user)
      return user
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logoutUser()
      setUser(null)
    } catch (err) {
      console.error("Logout error:", err)
      setUser(null)
    }
  }, [])

  const updateProfile = useCallback(
    async profileData => {
      setError(null)
      try {
        await authService.updateProfile(profileData)
        if (user) {
          setUser({ ...user, ...profileData })
        }
      } catch (err) {
        setError(err.message)
        throw err
      }
    },
    [user]
  )

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      login,
      register,
      logout,
      updateProfile,
      isAuthenticated: !!user,
      clearError: () => setError(null)
    }),
    [user, loading, error, login, register, logout, updateProfile]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

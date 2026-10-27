"use client"

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"
import { authService } from "@/services/authServices"
import { profileService } from "@/services/profileService"

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
        let userData = session.user
        try {
          const profile = await profileService.getProfile()
          userData = { ...session.user, ...profile }
        } catch (profileErr) {
          console.warn("Failed to fetch profile:", profileErr.message)
        }
        setUser(userData)
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
      try {
        const profile = await profileService.getProfile()
        setUser({ ...user, ...profile })
      } catch (profileErr) {
        console.warn("Failed to fetch profile after login:", profileErr.message)
        setUser(user)
      }
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
      try {
        const profile = await profileService.getProfile()
        setUser({ ...user, ...profile })
      } catch (profileErr) {
        console.warn("Failed to fetch profile after register:", profileErr.message)
        setUser(user)
      }
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

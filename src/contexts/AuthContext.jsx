"use client"

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react"
import { authService } from "@/services/authServices"
import { profileService } from "@/services/profileService"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Id de quem está no estado agora, lido pelo listener sem depender de re-render
  const currentUserId = useRef(null)
  // Número da busca de perfil mais recente: só ela pode gravar o usuário. No cadastro, o signUp
  // avisa SIGNED_IN antes de o perfil existir; sem isso, essa busca (sem nome) poderia terminar
  // depois da busca do register e apagar o nome no Header.
  const latestLoad = useRef(0)

  const setUser = useCallback(next => {
    currentUserId.current = next?.id ?? null
    setUserState(next)
  }, [])

  // Invalida as buscas em andamento e esvazia o usuário (logout aqui ou em outra aba)
  const clearUser = useCallback(() => {
    latestLoad.current += 1
    setUser(null)
  }, [setUser])

  // Junta o usuário do Auth com o perfil. Se o perfil falhar, o usuário entra sem o nome
  const loadUser = useCallback(
    async authUser => {
      const load = ++latestLoad.current
      let userData = authUser
      try {
        const profile = await profileService.getProfile()
        // Só o nome: espalhar o perfil sobrescreveria created_at/updated_at do usuário do Auth
        userData = { ...authUser, full_name: profile?.full_name ?? null }
      } catch (profileErr) {
        console.warn("Failed to fetch profile:", profileErr.message)
      }
      if (load === latestLoad.current) setUser(userData)
      return userData
    },
    [setUser]
  )

  const fetchUser = useCallback(async () => {
    try {
      const session = await authService.getSession()
      if (session?.user) {
        await loadUser(session.user)
      } else {
        setUser(null)
      }
    } catch (err) {
      console.error("Failed to fetch user:", err)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [loadUser, setUser])

  // Initial fetch - run once on mount

  useEffect(() => {
    const loadInitialUser = async () => {
      await fetchUser()
    }
    loadInitialUser()
  }, [fetchUser])

  // Mudanças de sessão vindas de fora deste fluxo: logout ou login de outro usuário em outra aba,
  // sessão encerrada pelo servidor. O INITIAL_SESSION fica com o fetchUser acima; login e cadastro
  // desta aba gravam o usuário eles mesmos, antes de a página navegar.
  useEffect(
    () =>
      authService.onAuthChange((event, session) => {
        if (event === "SIGNED_OUT") {
          clearUser()
          return
        }
        if (event === "INITIAL_SESSION") return
        const authUser = session?.user
        if (authUser && authUser.id !== currentUserId.current) {
          // Fora do callback: buscar o perfil lá dentro travaria o cliente do Supabase
          setTimeout(() => loadUser(authUser), 0)
        }
      }),
    [clearUser, loadUser]
  )

  const login = useCallback(
    async (email, password) => {
      setError(null)
      try {
        const user = await authService.loginUser({ email, password })
        await loadUser(user)
        return user
      } catch (err) {
        setError(err.message)
        throw err
      }
    },
    [loadUser]
  )

  const register = useCallback(
    async userData => {
      setError(null)
      try {
        const user = await authService.registerUser(userData)
        await loadUser(user)
        return user
      } catch (err) {
        setError(err.message)
        throw err
      }
    },
    [loadUser]
  )

  const logout = useCallback(async () => {
    try {
      await authService.logoutUser()
    } catch (err) {
      console.error("Logout error:", err)
    }
    clearUser()
  }, [clearUser])

  const updateProfile = useCallback(
    async profileData => {
      setError(null)
      try {
        await profileService.updateProfile(profileData)
        // Campo vazio não muda nada no banco, então também não apaga o nome do Header
        if (user && profileData.full_name) {
          setUser({ ...user, full_name: profileData.full_name })
        }
      } catch (err) {
        setError(err.message)
        throw err
      }
    },
    [user, setUser]
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

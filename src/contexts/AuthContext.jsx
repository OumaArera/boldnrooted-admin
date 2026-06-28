import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [tokens, setTokens] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load auth from localStorage on mount
  useEffect(() => {
    const savedTokens = localStorage.getItem('auth_tokens')
    const savedUser = localStorage.getItem('auth_user')
    if (savedTokens && savedUser) {
      setTokens(JSON.parse(savedTokens))
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('https://goalkeepers-backend-2.onrender.com/auth/api/v1/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        throw new Error('Login failed. Please check your credentials.')
      }

      const data = await response.json()
      const authData = {
        access: data.access,
        refresh: data.refresh,
      }

      setTokens(authData)
      setUser(data.user)
      localStorage.setItem('auth_tokens', JSON.stringify(authData))
      localStorage.setItem('auth_user', JSON.stringify(data.user))

      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setTokens(null)
    localStorage.removeItem('auth_tokens')
    localStorage.removeItem('auth_user')
  }

  const isAuthenticated = !!tokens?.access

  return (
    <AuthContext.Provider value={{ user, tokens, loading, error, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

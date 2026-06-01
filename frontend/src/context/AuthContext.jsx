import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // Quan trọng: Phải luôn là true lúc mới F5

  // Hàm load lại user khi F5
  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }
      
      const res = await api.get('/user')
      setUser(res.data.user)
    } catch (error) {
      console.error('Lỗi khi fetch user (Token hết hạn/không hợp lệ):', error)
      localStorage.removeItem('token')
      setUser(null)
    } finally {
      setLoading(false) // Chỉ set false khi API đã chạy xong xuôi
    }
  }

  // Chạy 1 lần duy nhất khi ứng dụng tải
  useEffect(() => {
    fetchUser()
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/login', { email, password })
    localStorage.setItem('token', res.data.access_token)
    setUser(res.data.user)
    return res.data
  }

  const logout = async () => {
    try {
      await api.post('/logout')
    } catch (e) {
      console.error('Lỗi khi gọi API logout:', e)
    } finally {
      localStorage.removeItem('token')
      setUser(null)
      window.location.href = '/login'
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
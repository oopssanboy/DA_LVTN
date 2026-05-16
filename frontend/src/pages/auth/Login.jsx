import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/axios'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Sử dụng instance api đã cấu hình sẵn baseURL và headers
      const response = await api.post('/login', { email, password })
      const { access_token, user } = response.data

      // Lưu thông tin vào bộ nhớ trình duyệt
      localStorage.setItem('token', access_token)
      localStorage.setItem('user', JSON.stringify(user))

      // Điều hướng màn hình theo quyền hạn phân vai
      if (user.role === 'admin') {
        navigate('/admin/dashboard')
      } else if (user.role === 'teacher') {
        navigate('/teacher/dashboard')
      } else if (user.role === 'proctor') {
        navigate('/proctor/dashboard')
      } else {
        navigate('/student/home')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Kết nối đến máy chủ thất bại. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">HỆ THỐNG THI TRỰC TUYẾN</h2>
          <p className="text-sm text-slate-500 mt-1">Đăng nhập tài khoản để vào phòng thi</p>
        </div>
        
        {error && (
          <div className="mb-5 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Địa chỉ Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition text-slate-800"
              placeholder="nhap-email@gmail.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Mật khẩu</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition text-slate-800"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-sm transition disabled:bg-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  )
}
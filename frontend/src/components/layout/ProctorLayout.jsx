import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'

export default function ProctorLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b px-6 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold text-primary-600">Proctor Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.name}</span>
          <button onClick={handleLogout} className="text-red-500 hover:text-red-700">
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
          </button>
        </div>
      </nav>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  )
}
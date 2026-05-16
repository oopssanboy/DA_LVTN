import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/admin');
    } catch (error) {
      toast.error('Đăng nhập thất bại');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center text-primary">ExamPro</h1>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border rounded p-2 mb-4" required />
        <input type="password" placeholder="Mật khẩu" value={password} onChange={e => setPassword(e.target.value)} className="w-full border rounded p-2 mb-4" required />
        <button type="submit" className="w-full bg-primary text-white py-2 rounded-lg">Đăng nhập</button>
      </form>
    </div>
  );
}
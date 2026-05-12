import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault(); 
        
        fetch(`${import.meta.env.VITE_API_URL}/login`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json' 
            },
            body: JSON.stringify({ email, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.access_token) {
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('role', data.user.role); 
                localStorage.setItem('userName', data.user.name); 

                if (data.user.role === 1) {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/student'); 
                }
            } else {
                setError('Email hoặc mật khẩu không đúng!');
            }
        })
        .catch(() => setError('Không thể kết nối đến máy chủ!'));
    };

    return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
            <div className="card border-0 shadow-sm" style={{ width: '100%', maxWidth: '420px', borderRadius: '16px' }}>
                <div className="card-body p-5">
                    <div className="text-center mb-4">
                        <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle mb-3" style={{ width: '64px', height: '64px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="bi bi-shield-lock-fill" viewBox="0 0 16 16">
                                <path fillRule="evenodd" d="M8 0c-.69 0-1.843.265-2.928.56-1.11.3-2.229.655-2.887.87a1.54 1.54 0 0 0-1.044 1.262c-.596 4.477.787 7.795 2.465 9.99a11.777 11.777 0 0 0 2.517 2.453c.386.273.744.482 1.048.625.28.132.581.24.829.24s.548-.108.829-.24a7.159 7.159 0 0 0 1.048-.625 11.775 11.775 0 0 0 2.517-2.453c1.678-2.195 3.061-5.513 2.465-9.99a1.541 1.541 0 0 0-1.044-1.263 62.467 62.467 0 0 0-2.887-.87C9.843.266 8.69 0 8 0zm0 5a1.5 1.5 0 0 1 .5 2.915l.385 1.99a.5.5 0 0 1-.491.595h-.788a.5.5 0 0 1-.49-.595l.384-1.99A1.5 1.5 0 0 1 8 5z"/>
                            </svg>
                        </div>
                        <h3 className="fw-bold" style={{ color: '#0f172a' }}>Hệ Thống Thi</h3>
                        <p className="text-muted">Đăng nhập để tiếp tục</p>
                    </div>

                    {error && <div className="alert alert-danger py-2 border-0 rounded-3 text-center" style={{ fontSize: '14px' }}>{error}</div>}
                    
                    <form onSubmit={handleLogin}>
                        <div className="mb-3">
                            <label className="form-label fw-medium text-secondary" style={{ fontSize: '14px' }}>Email đăng nhập</label>
                            <input type="email" className="form-control form-control-lg bg-light border-0" required
                                placeholder="name@example.com"
                                onChange={(e) => setEmail(e.target.value)} 
                                style={{ fontSize: '15px' }}/>
                        </div>
                        <div className="mb-4">
                            <label className="form-label fw-medium text-secondary" style={{ fontSize: '14px' }}>Mật khẩu</label>
                            <input type="password" className="form-control form-control-lg bg-light border-0" required
                                placeholder="••••••••"
                                onChange={(e) => setPassword(e.target.value)} 
                                style={{ fontSize: '15px' }}/>
                        </div>
                        <button type="submit" className="btn btn-primary btn-lg w-100 fw-bold border-0 shadow-sm" style={{ backgroundColor: '#2563eb', borderRadius: '8px', fontSize: '16px' }}>
                            Đăng Nhập
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
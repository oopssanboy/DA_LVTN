import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSave, FaCog, FaGlobe, FaShieldAlt } from 'react-icons/fa';

export default function SystemSettings() {
    const [settings, setSettings] = useState({
        app_name: '', contact_email: '', maintenance_mode: false, allow_registration: true,
    });
    const [isLoading, setIsLoading] = useState(false);
    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('token');

    useEffect(() => {
        axios.get(`${API_URL}/admin/settings`, { headers: { Authorization: `Bearer ${token}` }})
            .then(res => setSettings(res.data))
            .catch(err => console.error(err));
    }, [API_URL, token]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings({ ...settings, [name]: type === 'checkbox' ? checked : value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await axios.post(`${API_URL}/admin/settings`, settings, { headers: { Authorization: `Bearer ${token}` }});
            alert('Lưu cấu hình hệ thống thành công!');
        } catch (error) {
            alert('Lỗi lưu cấu hình!');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container-fluid py-4">
            <h3 className="fw-bold mb-4 text-dark d-flex align-items-center">
                <FaCog className="me-2 text-primary" /> Cài Đặt Hệ Thống
            </h3>

            <div className="card shadow-sm border-0" style={{ borderRadius: '12px', maxWidth: '800px' }}>
                <div className="card-body p-4 p-md-5">
                    <form onSubmit={handleSubmit}>
                        <h6 className="text-primary fw-bold mb-3"><FaGlobe className="me-2" /> Thông tin chung</h6>
                        <div className="mb-3">
                            <label className="form-label fw-bold">Tên ứng dụng / Trường học</label>
                            <input type="text" className="form-control" name="app_name" value={settings.app_name} onChange={handleChange} required />
                        </div>
                        <div className="mb-4">
                            <label className="form-label fw-bold">Email liên hệ hỗ trợ</label>
                            <input type="email" className="form-control" name="contact_email" value={settings.contact_email || ''} onChange={handleChange} />
                        </div>

                        <hr className="my-4" />

                        <h5 className="text-danger fw-bold mb-3"><FaShieldAlt className="me-2" /> Cấu hình bảo mật</h5>
                        {/* <div className="form-check form-switch mb-3 fs-5">
                            <input className="form-check-input" type="checkbox" id="allowRegistration" name="allow_registration" checked={settings.allow_registration} onChange={handleChange} />
                            <label className="form-check-label fs-6 mt-1 ms-2" htmlFor="allowRegistration">Cho phép sinh viên tự do đăng ký tài khoản</label>
                        </div> */}
                        <div className="form-check form-switch mb-4 fs-5">
                            <input className="form-check-input bg-danger border-danger" type="checkbox" id="maintenanceMode" name="maintenance_mode" checked={settings.maintenance_mode} onChange={handleChange} />
                            <label className="form-check-label fs-6 mt-1 ms-2 text-danger fw-bold" htmlFor="maintenanceMode">Bật chế độ bảo trì (Đóng trang web với sinh viên)</label>
                        </div>

                        <div className="text-end mt-4 pt-3 border-top">
                            <button type="submit" className="btn btn-primary px-5 py-2 fw-bold rounded-pill" disabled={isLoading}>
                                {isLoading ? 'Đang lưu...' : <><FaSave className="me-2" /> Lưu Thay Đổi</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
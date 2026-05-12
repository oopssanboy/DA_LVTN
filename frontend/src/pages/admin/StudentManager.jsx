import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function StudentManager() {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [sapxep, setSapxep] = useState('');
    const navigate = useNavigate();
    
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', class: '' });
    const [modalMode, setModalMode] = useState('add');
    const [editingId, setEditingId] = useState(null);

    const fetchUsers = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        fetch(`${import.meta.env.VITE_API_URL}/users?search=${search}&sort_class=${sapxep}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(response => response.json())
            .then(data => setUsers(data));
    };

    useEffect(() => {
        fetchUsers();
    }, [search, sapxep]);

    

    const handleSubmit = (e) => {
        e.preventDefault(); 
        const token = localStorage.getItem('token');
        let url = `${import.meta.env.VITE_API_URL}/users`;
        let method = 'POST';

        if (modalMode === 'edit') {
            url = `${import.meta.env.VITE_API_URL}/users/${editingId}`; 
            method = 'PUT';
        }

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        })
            .then(response => response.json())
            .then(data => {
                if (data.student) {
                    if (modalMode === 'add') {
                        setUsers([data.student, ...users]);
                        Swal.fire('Thành công!', 'Thêm sinh viên thành công!', 'success');
                    } else {
                        setUsers(users.map(u => u.id === editingId ? data.student : u));
                        Swal.fire('Thành công!', 'Cập nhật thông tin thành công!', 'success');
                    }
                    setShowModal(false);
                } else {
                    Swal.fire('Lỗi!', 'Email đã tồn tại hoặc nhập sai định dạng!', 'error');
                }
            })
            .catch(error => console.error("Lỗi:", error));
    };

    const handleEditClick = (user) => {
        setModalMode('edit');
        setEditingId(user.id);
        setFormData({
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            class: user.class || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        const confirm = await Swal.fire({
            title: 'Xóa sinh viên?',
            text: "Bạn có thực sự muốn xóa sinh viên này không?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Đồng ý xóa',
            cancelButtonText: 'Hủy'
        });

        if (confirm.isConfirmed) {
            const token = localStorage.getItem('token');
            fetch(`${import.meta.env.VITE_API_URL}/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(response => response.json())
                .then(() => {
                    setUsers(users.filter(user => user.id !== id));
                    Swal.fire('Đã xóa!', 'Sinh viên đã được xóa khỏi hệ thống.', 'success');
                })
                .catch(error => console.error("Lỗi khi xóa:", error));
        }
    };

    const handleImportExcel = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const confirm = await Swal.fire({
            title: 'Tải lên Excel?',
            text: `Xác nhận import danh sách sinh viên từ file ${file.name}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Có, tải lên',
            cancelButtonText: 'Hủy'
        });

        if (!confirm.isConfirmed) {
            e.target.value = null;
            return;
        }

        const token = localStorage.getItem('token');
        const formDataExcel = new FormData();
        formDataExcel.append('file', file);

        fetch(`${import.meta.env.VITE_API_URL}/users/import`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formDataExcel
        })
            .then(response => response.json())
            .then(data => {
                Swal.fire('Thành công!', data.message, 'success');
                e.target.value = null;
                fetchUsers();
            })
            .catch(error => {
                console.error("Lỗi khi import:", error);
                Swal.fire('Lỗi!', 'Đã xảy ra lỗi không xác định khi import file.', 'error');
                e.target.value = null;
            });
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="container-fluid py-2">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold text-dark mb-0">Quản lý Sinh viên</h3>
            </div>

            <div className="card shadow-sm border-0" style={{ borderRadius: '16px' }}>
                <div className="card-body p-4">
                    <div className="row mb-4 align-items-center">
                        <div className="col-md-5">
                            <input type="text" className="form-control bg-light border-0 py-2" placeholder="🔍 Tìm theo tên, email, SĐT..."
                                onChange={(e) => setSearch(e.target.value)} style={{ borderRadius: '8px' }}/>
                        </div>
                        <div className="col-md-7 text-end">
                            <input type="file" id="importFile" className="d-none" accept=".xlsx, .xls, .csv"
                                onChange={handleImportExcel} />
                            <button className="btn btn-outline-success me-2 fw-medium py-2 px-3" style={{ borderRadius: '8px' }} onClick={() => document.getElementById('importFile').click()}>
                                Tải lên Excel
                            </button>
                            <button className="btn btn-primary fw-medium py-2 px-3" style={{ borderRadius: '8px', backgroundColor: '#2563eb', border: 'none' }} onClick={() => {
                                setModalMode('add');
                                setFormData({ name: '', email: '', phone: '', class: '' });
                                setShowModal(true);
                            }}>+ Thêm Sinh viên</button>
                        </div>
                    </div>

                    {showModal && (
                        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(2px)' }}>
                            <div className="modal-dialog modal-dialog-centered">
                                <div className="modal-content border-0 shadow" style={{ borderRadius: '16px' }}>
                                    <div className="modal-header border-bottom-0 pb-0">
                                        <h5 className="modal-title fw-bold text-dark">
                                            {modalMode === 'edit' ? 'Sửa Thông Tin Sinh Viên' : 'Thêm Sinh Viên Mới'}
                                        </h5>
                                        <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                                    </div>

                                    <form onSubmit={handleSubmit}>
                                        <div className="modal-body pt-4">
                                            <div className="mb-3">
                                                <label className="form-label text-muted fw-medium" style={{ fontSize: '14px' }}>Họ và Tên <span className="text-danger">*</span></label>
                                                <input type="text" className="form-control bg-light border-0" name="name"
                                                    value={formData.name} onChange={handleInputChange} required />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label text-muted fw-medium" style={{ fontSize: '14px' }}>Email <span className="text-danger">*</span></label>
                                                <input type="email" className="form-control bg-light border-0" name="email"
                                                    value={formData.email} onChange={handleInputChange} required disabled={modalMode === 'edit'} />
                                                    {modalMode === 'edit' && <small className="text-muted">Không thể thay đổi email.</small>}
                                            </div>
                                            <div className="row">
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label text-muted fw-medium" style={{ fontSize: '14px' }}>Lớp học</label>
                                                    <input type="text" className="form-control bg-light border-0" name="class"
                                                        value={formData.class} onChange={handleInputChange} placeholder="VD: 12A1" />
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label text-muted fw-medium" style={{ fontSize: '14px' }}>Số điện thoại</label>
                                                    <input type="text" className="form-control bg-light border-0" name="phone"
                                                        value={formData.phone} onChange={handleInputChange} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="modal-footer border-top-0 pt-0">
                                            <button type="button" className="btn btn-light px-4" style={{ borderRadius: '8px' }} onClick={() => setShowModal(false)}>Hủy</button>
                                            <button type="submit" className="btn btn-primary px-4" style={{ borderRadius: '8px', backgroundColor: '#2563eb', border: 'none' }}>
                                                {modalMode === 'edit' ? 'Cập Nhật' : 'Lưu Sinh Viên'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th className="py-3 px-3 border-0 text-muted fw-semibold" style={{ fontSize: '13px', width: '60px' }}>ID</th>
                                    <th className="py-3 px-3 border-0 text-muted fw-semibold" style={{ fontSize: '13px' }}>HỌ VÀ TÊN</th>
                                    <th className="py-3 px-3 border-0 text-muted fw-semibold" style={{ fontSize: '13px' }}>EMAIL</th>
                                <th className="py-3 px-3 border-0 text-muted fw-semibold text-center" style={{ fontSize: '13px', width: '160px' }}>
                                    LỚP HỌC
                                    <div className="d-inline-flex ms-2 border rounded">
                                        <button className={`btn btn-sm px-2 py-0 ${sapxep === 'asc' ? 'bg-primary text-white' : 'bg-light text-muted'}`} style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}  onClick={() => setSapxep(sapxep === 'asc' ? '' : 'asc')}>Tắng dần</button>
                                        <button className={`btn btn-sm px-2 py-0 ${sapxep === 'desc' ? 'bg-primary text-white' : 'bg-light text-muted'}`} style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}  onClick={() => setSapxep(sapxep === 'desc' ? '' : 'desc')}>Giảm dần</button>
                                    </div>
                                    </th>
                                    <th className="py-3 px-3 border-0 text-muted fw-semibold" style={{ fontSize: '13px' }}>SỐ ĐIỆN THOẠI</th>
                                    <th className="py-3 px-3 border-0 text-muted fw-semibold text-end" style={{ fontSize: '13px' }}>HÀNH ĐỘNG</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr><td colSpan="6" className="text-center py-5 text-muted">Không tìm thấy sinh viên nào.</td></tr>
                                ) : users.map(user => (
                                    <tr key={user.id}>
                                        <td className="px-3 py-3 border-bottom-0 border-top text-muted">{user.id}</td>
                                        <td className="px-3 py-3 border-bottom-0 border-top fw-bold text-dark">{user.name}</td>
                                        <td className="px-3 py-3 border-bottom-0 border-top text-muted">{user.email}</td>
                                        <td className="px-3 py-3 border-bottom-0 border-top text-center"><span className="badge bg-secondary bg-opacity-10 text-secondary">{user.class || 'N/A'}</span></td>
                                        <td className="px-3 py-3 border-bottom-0 border-top text-muted">{user.phone || 'Chưa cập nhật'}</td>
                                        <td className="px-3 py-3 border-bottom-0 border-top text-end">
                                            <button className="btn btn-sm btn-light text-primary me-2 fw-medium" onClick={() => handleEditClick(user)}>Sửa</button>
                                            <button className="btn btn-sm btn-light text-danger fw-medium" onClick={() => handleDelete(user.id)}>Xóa</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
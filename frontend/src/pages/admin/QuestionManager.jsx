import { useState, useEffect } from 'react';
import { FaPlus, FaSearch, FaEdit, FaTrash, FaFileImport, FaQuestionCircle } from 'react-icons/fa';
import Swal from 'sweetalert2';

export default function QuestionManager() {
    const [questions, setQuestions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDifficulty, setFilterDifficulty] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [editingId, setEditingId] = useState(null);
    
    const [formData, setFormData] = useState({
        subject: '', content: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'A', difficulty: 'medium'
    });

    const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api') + '/questions'; 
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = () => {
        fetch(API_URL, { 
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } 
        })
        .then(res => res.json())
        .then(data => setQuestions(Array.isArray(data) ? data : []))
        .catch(err => console.error("Lỗi:", err));
    };

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = (e) => {
        e.preventDefault();
        const method = modalMode === 'add' ? 'POST' : 'PUT';
        const url = modalMode === 'add' ? API_URL : `${API_URL}/${editingId}`;

        fetch(url, {
            method,
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(() => {
            Swal.fire('Thành công!', 'Đã lưu câu hỏi.', 'success');
            setShowModal(false);
            fetchQuestions();
        });
    };

    const filteredQuestions = questions.filter(q => {
        const matchesSearch = q.content.toLowerCase().includes(searchTerm.toLowerCase()) || q.subject.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDifficulty = filterDifficulty === 'all' || q.difficulty === filterDifficulty;
        return matchesSearch && matchesDifficulty;
    });

    const handleImportExcel = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const confirm = await Swal.fire({
            title: 'Tải lên Excel?',
            text: `Xác nhận import câu hỏi từ file: ${file.name}?`,
            icon: 'info',
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
        const formData = new FormData();
        formData.append('file', file); 

        fetch(`${API_URL}/import`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            Swal.fire('Thành công!', data.message, 'success');
            e.target.value = null; 
            fetchQuestions(); 
        })
        .catch(err => {
            console.error("Lỗi Import:", err);
            Swal.fire('Lỗi!', 'Có lỗi xảy ra khi import file!', 'error');
            e.target.value = null;
        });
    };

    return (
        <div className="container-fluid py-2">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="fw-bold text-dark mb-1">Ngân hàng Câu hỏi</h3>
                    <p className="text-muted small mb-0">Quản lý và biên soạn nội dung các kỳ thi</p>
                </div>
                <div className="d-flex gap-2">
                    <div>
                        <input type="file" id="importQuestionFile" className="d-none" accept=".xlsx, .xls" onChange={handleImportExcel} />
                        <button className="btn btn-outline-success d-flex align-items-center gap-2 fw-medium px-3 py-2"
                                style={{ borderRadius: '8px' }}
                                onClick={() => document.getElementById('importQuestionFile').click()}>
                            <FaFileImport /> Tải lên Excel
                        </button>
                    </div>
                    <button className="btn btn-primary d-flex align-items-center gap-2 border-0 fw-medium px-3 py-2" 
                            style={{ borderRadius: '8px', backgroundColor: '#2563eb' }}
                            onClick={() => { setModalMode('add'); setFormData({subject:'', content:'', option_a:'', option_b:'', option_c:'', option_d:'', correct_answer:'A', difficulty:'medium'}); setShowModal(true); }}>
                        <FaPlus /> Thêm Câu hỏi
                    </button>
                </div>
            </div>

            <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '16px' }}>
                <div className="card-body p-3">
                    <div className="row g-3 align-items-center">
                        <div className="col-md-8">
                            <div className="input-group">
                                <span className="input-group-text bg-light border-0 ps-3 pe-2" style={{ borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}>
                                    <FaSearch className="text-muted" />
                                </span>
                                <input type="text" className="form-control bg-light border-0 py-2" 
                                       placeholder="Tìm kiếm theo nội dung hoặc môn học..." 
                                       style={{ borderTopRightRadius: '8px', borderBottomRightRadius: '8px', boxShadow: 'none' }}
                                       onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                        </div>
                        <div className="col-md-4">
                            <select className="form-select bg-light border-0 py-2" style={{ borderRadius: '8px', boxShadow: 'none' }} onChange={(e) => setFilterDifficulty(e.target.value)}>
                                <option value="all">Tất cả độ khó</option>
                                <option value="easy">Dễ</option>
                                <option value="medium">Trung bình</option>
                                <option value="hard">Khó</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card shadow-sm border-0" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th className="py-3 px-4 border-0 text-muted fw-semibold" style={{ fontSize: '13px', width: '150px' }}>MÔN HỌC</th>
                                <th className="py-3 px-3 border-0 text-muted fw-semibold" style={{ fontSize: '13px' }}>NỘI DUNG CÂU HỎI</th>
                                <th className="py-3 px-3 border-0 text-muted fw-semibold" style={{ fontSize: '13px', width: '120px' }}>ĐỘ KHÓ</th>
                                <th className="py-3 px-3 border-0 text-muted fw-semibold text-center" style={{ fontSize: '13px', width: '100px' }}>ĐÁP ÁN</th>
                                <th className="py-3 px-4 border-0 text-muted fw-semibold text-end" style={{ fontSize: '13px', width: '120px' }}>THAO TÁC</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredQuestions.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-5 text-muted">Không tìm thấy câu hỏi nào.</td></tr>
                            ) : filteredQuestions.map(q => (
                                <tr key={q.id}>
                                    <td className="px-4 py-3 border-bottom-0 border-top">
                                        <span className="badge bg-secondary bg-opacity-10 text-secondary px-2 py-1 rounded">{q.subject}</span>
                                    </td>
                                    <td className="px-3 py-3 border-bottom-0 border-top">
                                        <div className="text-dark fw-medium" style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {q.content}
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 border-bottom-0 border-top">
                                        {q.difficulty === 'easy' && <span className="badge bg-success bg-opacity-10 text-success px-2 py-1 rounded">Dễ</span>}
                                        {q.difficulty === 'medium' && <span className="badge bg-warning bg-opacity-10 text-warning px-2 py-1 rounded">Trung bình</span>}
                                        {q.difficulty === 'hard' && <span className="badge bg-danger bg-opacity-10 text-danger px-2 py-1 rounded">Khó</span>}
                                    </td>
                                    <td className="px-3 py-3 border-bottom-0 border-top text-center font-monospace fw-bold" style={{ color: '#2563eb' }}>{q.correct_answer}</td>
                                    <td className="px-4 py-3 border-bottom-0 border-top text-end">
                                        <button className="btn btn-sm btn-light text-primary me-2 fw-medium" 
                                                onClick={() => { setModalMode('edit'); setEditingId(q.id); setFormData(q); setShowModal(true); }}>
                                            Sửa
                                        </button>
                                        <button className="btn btn-sm btn-light text-danger fw-medium" 
                                                onClick={async () => {
                                                    const confirm = await Swal.fire({
                                                        title: 'Xóa câu hỏi?',
                                                        text: "Hành động này không thể hoàn tác!",
                                                        icon: 'warning',
                                                        showCancelButton: true,
                                                        confirmButtonColor: '#ef4444',
                                                        cancelButtonColor: '#94a3b8',
                                                        confirmButtonText: 'Xóa',
                                                        cancelButtonText: 'Hủy'
                                                    });
                                                    if (confirm.isConfirmed) {
                                                        fetch(`${API_URL}/${q.id}`, {method:'DELETE', headers:{'Authorization':`Bearer ${token}`}})
                                                        .then(()=>{
                                                            Swal.fire('Đã xóa!', 'Câu hỏi đã bị xóa khỏi hệ thống.', 'success');
                                                            fetchQuestions();
                                                        });
                                                    }
                                                }}>
                                            Xóa
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(2px)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-header border-bottom-0 pb-0 pt-4 px-4">
                                    <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                                        <FaQuestionCircle className="text-primary" /> {modalMode === 'add' ? 'Thêm câu hỏi mới' : 'Chỉnh sửa câu hỏi'}
                                    </h5>
                                    <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                                </div>
                                <div className="modal-body p-4">
                                    <div className="row g-3 mb-4">
                                        <div className="col-md-7">
                                            <label className="form-label text-muted fw-medium small mb-1">Môn học</label>
                                            <input type="text" className="form-control bg-light border-0 py-2" style={{ borderRadius: '8px' }} name="subject" value={formData.subject} onChange={handleInputChange} placeholder="VD: Lập trình Web" required />
                                        </div>
                                        <div className="col-md-5">
                                            <label className="form-label text-muted fw-medium small mb-1">Độ khó</label>
                                            <select className="form-select bg-light border-0 py-2" style={{ borderRadius: '8px' }} name="difficulty" value={formData.difficulty} onChange={handleInputChange}>
                                                <option value="easy">Dễ (Kiến thức cơ bản)</option>
                                                <option value="medium">Trung bình (Vận dụng thấp)</option>
                                                <option value="hard">Khó (Vận dụng cao)</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div className="mb-4">
                                        <label className="form-label text-muted fw-medium small mb-1">Nội dung câu hỏi</label>
                                        <textarea className="form-control bg-light border-0" style={{ borderRadius: '8px', padding: '12px' }} rows="3" name="content" value={formData.content} onChange={handleInputChange} placeholder="Nhập câu hỏi tại đây..." required></textarea>
                                    </div>
                                    
                                    <label className="form-label text-muted fw-medium small mb-2">Các đáp án lựa chọn</label>
                                    <div className="row g-3">
                                        {['a', 'b', 'c', 'd'].map(opt => (
                                            <div className="col-md-6" key={opt}>
                                                <div className="input-group">
                                                    <span className="input-group-text border-0 text-muted fw-bold" style={{ backgroundColor: '#e2e8f0', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}>{opt.toUpperCase()}</span>
                                                    <input type="text" className="form-control bg-light border-0 py-2" style={{ borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }} name={`option_${opt}`} value={formData[`option_${opt}`]} onChange={handleInputChange} required />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-4 p-3 rounded-3" style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
                                        <div className="d-flex align-items-center justify-content-between">
                                            <label className="fw-semibold mb-0" style={{ color: '#1e40af' }}>ĐÁP ÁN ĐÚNG LÀ:</label>
                                            <div className="d-flex gap-4">
                                                {['A', 'B', 'C', 'D'].map(val => (
                                                    <div className="form-check" key={val}>
                                                        <input className="form-check-input" type="radio" name="correct_answer" id={`ans${val}`} value={val} 
                                                               checked={formData.correct_answer === val} onChange={handleInputChange} style={{ cursor: 'pointer' }}/>
                                                        <label className="form-check-label fw-bold text-dark" htmlFor={`ans${val}`} style={{ cursor: 'pointer' }}>{val}</label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer border-top-0 px-4 pb-4 pt-0">
                                    <button type="button" className="btn btn-light px-4" style={{ borderRadius: '8px' }} onClick={() => setShowModal(false)}>Hủy bỏ</button>
                                    <button type="submit" className="btn btn-primary px-4 border-0" style={{ borderRadius: '8px', backgroundColor: '#2563eb' }}>Lưu dữ liệu</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
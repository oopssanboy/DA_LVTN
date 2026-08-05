import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, Loader2, Upload, Download, Filter, ArrowLeft, BookOpen, FolderOpen, FileSpreadsheet } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';

export default function QuestionList() {
    const { user } = useAuth();
    const apiPrefix = user?.role === 'admin' ? '/admin' : '/teacher';

    const [subjects, setSubjects] = useState([]);
    const [subjectPagination, setSubjectPagination] = useState({});
    const [loadingSubjects, setLoadingSubjects] = useState(true);
    const [subjectSearch, setSubjectSearch] = useState('');

    const [selectedSubject, setSelectedSubject] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [questionPagination, setQuestionPagination] = useState({});
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [questionSearch, setQuestionSearch] = useState('');
    const [filters, setFilters] = useState({ difficulty: '', type: ''});


    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef(null);

    const fetchSubjects = useCallback(async (url = `${apiPrefix}/subjects`, params = {}) => {
        setLoadingSubjects(true);
        try {
            const res = await api.get(url, { params });
            setSubjects(res.data.data || res.data);
            setSubjectPagination({
                links: res.data.links || res.data.meta?.links,
                meta: res.data.meta || res.data
            });
        } catch (error) {
            toast.error('Lỗi tải danh sách môn học');
        } finally {
            setLoadingSubjects(false);
        }
    }, [apiPrefix]);

    const fetchQuestions = useCallback(async (url = `${apiPrefix}/questions`, params = {}) => {
        setLoadingQuestions(true);
        try {
            const res = await api.get(url, { params });
            setQuestions(res.data.data || res.data);
            setQuestionPagination({
                links: res.data.links || res.data.meta?.links,
                meta: res.data.meta || res.data
            });
        } catch (error) {
            toast.error('Lỗi tải danh sách câu hỏi');
        } finally {
            setLoadingQuestions(false);
        }
    }, [apiPrefix]);

    useEffect(() => {
        fetchSubjects();
    }, [fetchSubjects]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchSubjects(`${apiPrefix}/subjects`, { search: subjectSearch });
        }, 300);
        return () => clearTimeout(timer);
    }, [subjectSearch, fetchSubjects, apiPrefix]);

    useEffect(() => {
        if (selectedSubject) {
            fetchQuestions(`${apiPrefix}/questions`, {
                subject_id: selectedSubject.id,
                search: questionSearch,
                difficulty: filters.difficulty,
                type: filters.type
            });
        }
    }, [filters, selectedSubject, questionSearch, fetchQuestions, apiPrefix]);

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Xóa câu hỏi?',
            text: "Không thể hoàn tác hành động này!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy'
        });
        if (result.isConfirmed) {
            try {
                await api.delete(`${apiPrefix}/questions/${id}`);
                toast.success('Xóa câu hỏi thành công');
                fetchQuestions(`${apiPrefix}/questions`, {
                    subject_id: selectedSubject.id,
                    search: questionSearch
                });
                fetchSubjects(`${apiPrefix}/subjects`, { search: subjectSearch });
            } catch (error) {
                toast.error(error.response?.data?.message || 'Lỗi khi xóa câu hỏi');
            }
        }
    };

    
    const handleImportClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setIsImporting(true);
        const toastId = toast.loading('Đang import dữ liệu...');
        
        try {
            await api.post(`${apiPrefix}/questions/import`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Import câu hỏi thành công!', { id: toastId });
            
         
            if (selectedSubject) {
                fetchQuestions(`${apiPrefix}/questions`, {
                    subject_id: selectedSubject.id,
                    search: questionSearch,
                    difficulty: filters.difficulty,
                    type: filters.type
                });
            }
            fetchSubjects(`${apiPrefix}/subjects`, { search: subjectSearch });
            
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi import file', { id: toastId });
        } finally {
            setIsImporting(false);
            e.target.value = ''; 
        }
    };

    const handleExport = async () => {
        const toastId = toast.loading('Đang xuất file Excel...');
        try {
            const response = await api.get(`${apiPrefix}/questions/export`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'ngan_hang_cau_hoi.xlsx');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            toast.success('Xuất file thành công', { id: toastId });
        } catch (error) {
            toast.error('Lỗi khi xuất file', { id: toastId });
        }
    };

    const downloadTemplate = () => {
        const csvContent = "subject_code,topic_name,type,difficulty,content,score,choices,answer\n"
                         + "IT301,Cơ bản PHP,single,easy,PHP là viết tắt của chữ gì?,1,A:Personal Home Page; B:PHP Hypertext Preprocessor; C:Private Page,B\n"
                         + "IT301,OOP trong PHP,multiple,medium,Đặc điểm của OOP?,2,A:Đa hình; B:Kế thừa; C:Trừu tượng; D:Tuần tự,A,B,C\n"
                         + "IT301,OOP trong PHP,fill_blank,hard,Từ khóa để kế thừa trong PHP là gì?,2,,extends|extend";

        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' }); 
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "mau_import_cau_hoi.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!selectedSubject) {
        return (
            <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Ngân hàng Câu hỏi</h1>
                        <p className="text-slate-500 mt-1">Chọn một môn học để xem và quản lý câu hỏi bên trong.</p>
                    </div>
                    <div className="flex gap-3">
                        <Link to={`${apiPrefix}/questions/create`} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition flex items-center gap-2 shadow-sm">
                            <Plus className="w-5 h-5" /> Thêm câu hỏi mới
                        </Link>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm môn học..."
                            value={subjectSearch}
                            onChange={(e) => setSubjectSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-medium"
                        />
                    </div>
                </div>

                {loadingSubjects ? (
                    <div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 text-blue-600 animate-spin" /></div>
                ) : subjects.length === 0 ? (
                    <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center shadow-sm">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-4">
                            <FolderOpen className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">Chưa có môn học nào</h3>
                        <p className="text-slate-500 mt-1">Vui lòng tạo môn học trước khi quản lý ngân hàng câu hỏi.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {subjects.map(subject => (
                                <div
                                    key={subject.id}
                                    onClick={() => {
                                        setSelectedSubject(subject);
                                        setQuestionSearch('');
                                    }}
                                    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-blue-300 transition-all duration-300 flex flex-col items-center text-center group"
                                >
                                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <FolderOpen className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                                        {subject.name}
                                    </h3>
                                    <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full">
                                        {subject.code}
                                    </span>
                                    <div className="mt-4 pt-4 border-t border-slate-100 w-full flex justify-between items-center text-sm">
                                        <span className="text-slate-500 font-medium">Tổng số câu:</span>
                                        <span className="font-black text-blue-600 text-lg">{subject.questions_count || 0}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {subjectPagination.links && subjectPagination.links.length > 3 && (
                            <div className="flex flex-wrap justify-center gap-1 pt-4">
                                {subjectPagination.links.map((link, idx) => {
                                    let label = link.label;
                                    if (label.includes('Previous')) label = 'Trang trước';
                                    else if (label.includes('Next')) label = 'Trang sau';
                                    return (
                                        <button
                                            key={idx}
                                            disabled={!link.url}
                                            onClick={() => fetchSubjects(link.url)}
                                            className={`px-4 py-2 text-sm font-medium rounded-xl transition border
                                                ${link.active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'}
                                                ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}
                                            `}
                                            dangerouslySetInnerHTML={{ __html: label }}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <button
                        onClick={() => {
                            setSelectedSubject(null);
                            setQuestionSearch('');
                        }}
                        className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold mb-2 transition"
                    >
                        <ArrowLeft className="w-4 h-4" /> Quay lại thư mục
                    </button>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-blue-600"/> Ngân hàng: {selectedSubject.name}
                    </h1>
                    <p className="text-slate-500 mt-1">Quản lý và biên soạn câu hỏi trắc nghiệm, điền khuyết.</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button onClick={downloadTemplate} className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-2 shadow-sm text-sm md:text-base">
                        <FileSpreadsheet className="w-4 h-4" /> File mẫu
                    </button>
                    
                    <button onClick={handleImportClick} disabled={isImporting} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-2 shadow-sm disabled:opacity-70 text-sm md:text-base">
                        {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Nhập Excel
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" />
                    </button>

                    <button onClick={handleExport} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-2 shadow-sm text-sm md:text-base">
                        <Download className="w-4 h-4" /> Xuất Excel
                    </button>

                    <Link to={`${apiPrefix}/questions/create`} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition flex items-center gap-2 shadow-sm text-sm md:text-base">
                        <Plus className="w-5 h-5" /> Thêm mới
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex gap-4 bg-slate-50/50">
                    <div className="relative flex-1 max-w-2xl">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm nội dung..."
                            value={questionSearch}
                            onChange={(e) => setQuestionSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-medium text-slate-700"
                        />
                    </div>
                    <div className="flex gap-3 items-center">
                        <select
                            value={filters.difficulty}
                            onChange={(e) => setFilters({...filters, difficulty: e.target.value})}
                            className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:border-blue-500"
                        >
                            <option value="">Tất cả độ khó</option>
                            <option value="easy">Dễ</option>
                            <option value="medium">Trung bình</option>
                            <option value="hard">Khó</option>
                        </select>
                        <select
                            value={filters.type}
                            onChange={(e) => setFilters({...filters, type: e.target.value})}
                            className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:border-blue-500"
                        >
                            <option value="">Tất cả loại</option>
                            <option value="single">Trắc nghiệm 1 đáp án</option>
                            <option value="multiple">Trắc nghiệm nhiều đáp án</option>
                            <option value="fill_blank">Điền khuyết</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loadingQuestions ? (
                        <div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 text-blue-600 animate-spin" /></div>
                    ) : questions.length === 0 ? (
                        <div className="p-20 text-center text-slate-500">Môn học này chưa có câu hỏi nào.</div>
                    ) : (
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Chủ đề</th>
                                    <th className="px-6 py-4 w-1/3">Nội dung tóm tắt</th>
                                    <th className="px-6 py-4 text-center">Loại</th>
                                    <th className="px-6 py-4 text-center">Độ khó</th>
                                    <th className="px-6 py-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {questions.map((q) => {
                                    const tmp = document.createElement('div');
                                    tmp.innerHTML = q.content;
                                    const textContent = tmp.textContent || tmp.innerText || '';

                                    return (
                                        <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-700">{q.topic?.name || 'N/A'}</td>
                                            <td className="px-6 py-4">
                                                <div className="line-clamp-2 text-slate-800 font-medium" title={textContent}>
                                                    {textContent}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-md text-xs font-bold ${
                                                    q.type === 'fill_blank' ? '' : ''
                                                }`}>
                                                    {q.type === 'fill_blank' ? 'Điền khuyết' : 'Trắc nghiệm'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-md text-[10px] font-black tracking-wider uppercase ${
                                                    q.difficulty === 'easy' ? '' :
                                                    q.difficulty === 'medium' ? '' :
                                                    ''
                                                }`}>
                                                    {q.difficulty}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link to={`${apiPrefix}/questions/${q.id}/edit`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                                                        <Edit className="w-5 h-5" />
                                                    </Link>
                                                    <button onClick={() => handleDelete(q.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition">
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {questionPagination.links && questionPagination.links.length > 3 && (
                    <div className="p-4 border-t border-slate-100 flex flex-wrap justify-center gap-1">
                        {questionPagination.links.map((link, idx) => {
                            let label = link.label;
                            if (label.includes('Previous')) label = 'Trang trước';
                            else if (label.includes('Next')) label = 'Trang sau';
                            return (
                                <button
                                    key={idx}
                                    disabled={!link.url}
                                    onClick={() => fetchQuestions(link.url)}
                                    className={`px-4 py-2 text-sm font-medium rounded-xl transition border
                                        ${link.active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'}
                                        ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}
                                    `}
                                    dangerouslySetInnerHTML={{ __html: label }}
                                />
                            );
                        })}
                    </div>
                )}
                {questionPagination.meta && (
                    <div className="px-6 py-3 text-sm text-slate-500 border-t border-slate-100">
                        Hiển thị {questions.length} trên tổng số {questionPagination.meta.total || questions.length} câu hỏi
                    </div>
                )}
            </div>
        </div>
    );
}
import { useState, useEffect } from 'react';
import { BookOpen, FolderOpen, ArrowRight } from 'lucide-react';
import api from '../services/api';
import GuestLayout from '../components/common/GuestLayout';

export default function Courses() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await api.get('/auth/public/courses'); 
                setCourses(res.data);
            } catch (error) {
                console.error("Lỗi tải khóa học", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    const defaultImages = [
        '',
        '',
        ''
    ];

    return (
        <GuestLayout>
            <div className="pt-10 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Các Khóa Học & Môn Thi</h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">Khám phá hệ thống môn học được thiết kế bài bản theo chương trình chuẩn mực.</p>
                </div>

                {loading ? (
                    <div className="flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
                ) : courses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {courses.map((course, index) => (
                            <div key={course.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col">
                                <div className="h-48 overflow-hidden relative">
                               
                                    
                                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-blue-700 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                                        {course.code}
                                    </div>
                                </div>
                                <div className="p-6 flex flex-col flex-1">
                                    <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">{course.name}</h3>
                                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-6 flex-1">
                                        <div className="flex items-center gap-1"><FolderOpen className="w-4 h-4 text-blue-500"/> {course.topics_count || 0} Chủ đề</div>
                                        <div className="flex items-center gap-1"><BookOpen className="w-4 h-4 text-emerald-500"/> {course.questions_count || 0} Câu hỏi</div>
                                    </div>
                                    <button className="w-full bg-slate-50 hover:bg-blue-50 text-blue-600 border border-blue-100 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                                        Tham gia khóa học <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-slate-500">Chưa có khóa học nào trên hệ thống.</div>
                )}
            </div>
        </GuestLayout>
    );
}
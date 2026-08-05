import { useState, useEffect } from 'react';
import { Mail, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import GuestLayout from '../components/common/GuestLayout';

export default function Teachers() {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                const res = await api.get('/auth/public/teachers'); 
                setTeachers(res.data);
            } catch (error) {
                console.error("Lỗi tải giảng viên", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTeachers();
    }, []);

    return (
        <GuestLayout>
            <div className="pt-10 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Đội ngũ Giảng viên</h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">Gặp gỡ những chuyên gia và giảng viên tận tâm, đồng hành cùng bạn trên con đường chinh phục công nghệ.</p>
                </div>

                {loading ? (
                    <div className="flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
                ) : teachers.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {teachers.map(teacher => (
                            <div key={teacher.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:shadow-xl transition-all text-center group">
                                <div className="relative w-24 h-24 mx-auto mb-4">
                                    <div className="w-full h-full bg-blue-100 text-blue-600 flex items-center justify-center rounded-full text-3xl font-bold border-4 border-slate-50 group-hover:border-blue-100 transition-colors uppercase">
                                        {teacher?.avatar ? (
                                            <img src={teacher.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="font-bold text-slate-500">{teacher?.name?.charAt(0)?.toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-sm">
                                        Giảng viên
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-1">{teacher.name}</h3>
                                <p className="text-sm text-slate-500 mb-4 flex items-center justify-center gap-1">
                                    <Mail className="w-3 h-3"/> {teacher.email}
                                </p>
                                <div className="flex justify-center items-center gap-4 pt-4 border-t border-slate-100 text-sm font-medium text-slate-600">
                                    <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">
                                        <ShieldCheck className="w-4 h-4"/> Chuyên môn cao
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-slate-500">Chưa có thông tin giảng viên.</div>
                )}
            </div>
        </GuestLayout>
    );
}
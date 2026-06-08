import { useState, useEffect } from 'react';
import { BookOpen, FileText, CheckSquare, BarChart } from 'lucide-react';

export default function TeacherDashboard() {
    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Không gian Giảng viên</h1>
                <p className="text-slate-500 mt-1">Quản lý lớp học, ngân hàng câu hỏi và xem báo cáo học vụ.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><BookOpen className="w-6 h-6" /></div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">4</h3>
                    <p className="text-slate-500 text-sm mt-1">Lớp đang phụ trách</p>
                </div>
                
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><FileText className="w-6 h-6" /></div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">125</h3>
                    <p className="text-slate-500 text-sm mt-1">Câu hỏi đã soạn</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><CheckSquare className="w-6 h-6" /></div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">3</h3>
                    <p className="text-slate-500 text-sm mt-1">Kỳ thi sắp tới</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><BarChart className="w-6 h-6" /></div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">2</h3>
                    <p className="text-slate-500 text-sm mt-1">Báo cáo cần duyệt</p>
                </div>
            </div>

            {/* Quick Links */}
            <h2 className="text-xl font-bold text-slate-800 mt-10 mb-4">Phím tắt nhanh</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-300 transition cursor-pointer flex gap-4 items-center">
                    <div className="p-4 bg-slate-50 text-slate-600 rounded-full"><FileText className="w-6 h-6"/></div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-lg">Soạn câu hỏi mới</h4>
                        <p className="text-sm text-slate-500">Thêm câu hỏi trắc nghiệm hoặc điền khuyết vào ngân hàng.</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-300 transition cursor-pointer flex gap-4 items-center">
                    <div className="p-4 bg-slate-50 text-slate-600 rounded-full"><CheckSquare className="w-6 h-6"/></div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-lg">Tạo kỳ thi (Ma trận)</h4>
                        <p className="text-sm text-slate-500">Thiết lập luật random câu hỏi theo độ khó cho kỳ thi mới.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
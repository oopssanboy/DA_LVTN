import React, { useState, useEffect } from "react";
import { Users, GraduationCap, BookOpen, FileCheck, TrendingUp, Loader2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import api from '../../services/api';

const COLORS = ['#10b981', '#f43f5e']; 

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    totalAttempts: 0,
  });
  
  const [revenueData, setRevenueData] = useState([]);
  const [passRateData, setPassRateData] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/dashboard-stats');
      const data = res.data.data;

      if (data) {
        setStats(data.stats);
        setRevenueData(data.revenueData);
        setPassRateData(data.passRateData);
        setRecentUsers(data.recentUsers);
      }
    } catch (error) {
      console.error("Lỗi tải dữ liệu thống kê:", error);
    } finally {
      setLoading(false);
    }
  };

  const passRatePercentage = passRateData.length > 0 
    ? passRateData.find(d => d.name === 'Đậu')?.value || 0 
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans pb-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Tổng quan Hệ thống</h1>
        <p className="text-slate-500 mt-1">Dữ liệu thống kê trực tiếp từ cơ sở dữ liệu.</p>
      </div>

    
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Tổng học viên", value: stats.totalStudents, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { title: "Giảng viên", value: stats.totalTeachers, icon: GraduationCap, color: "text-purple-600", bg: "bg-purple-50" },
          { title: "Môn học", value: stats.totalCourses, icon: BookOpen, color: "text-amber-600", bg: "bg-amber-50" },
          { title: "Tổng lượt thi", value: stats.totalAttempts, icon: FileCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition">
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-500">{stat.title}</div>
              <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" /> Tăng trưởng lượt thi (6 tháng)
            </h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                  itemStyle={{color: '#0f172a', fontWeight: 'bold'}}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2 ">
            <FileCheck className="w-5 h-5 text-emerald-600" /> Tỷ lệ Đậu / Rớt
          </h2>
          <div className="flex-1 min-h-[200px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={passRateData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {passRateData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-slate-800">{passRatePercentage}%</span>
              <span className="text-sm text-slate-500 font-medium">Tỷ lệ đậu</span>
            </div>
          </div>
          <div className="mt-4 flex justify-center gap-6">
            {passRateData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="text-sm font-medium text-slate-600">{entry.name} ({entry.value}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

   
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">Học viên mới đăng ký</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4">Tên hiển thị</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Ngày tham gia</th>
                <th className="px-6 py-4">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentUsers.length > 0 ? (
                recentUsers.map((user, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                        {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <span className="font-semibold text-slate-800">{user.name}</span>
                    </td>
                    <td className="px-6 py-4 font-medium">{user.email}</td>
                    <td className="px-6 py-4 text-slate-500">{user.date}</td>
                    <td className="px-6 py-4">
                      {user.status === 'active' ? (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold tracking-wide">
                          HOẠT ĐỘNG
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold tracking-wide">
                          BỊ KHÓA
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                    Chưa có học viên nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
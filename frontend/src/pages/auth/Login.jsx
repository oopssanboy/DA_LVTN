import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen,GraduationCap, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import FloatingContact from '../../components/common/FloatingContact';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("student");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  
  const { login } = useAuth();

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole === "admin") {
      setEmail("admin@gmail.com");
      setPassword("123456");
    } else {
      setEmail("student1@gmail.com");
      setPassword("123456");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const data = await login(email, password);
      toast.success("Đăng nhập thành công!");
      const userRole = data.user.role;
      if (userRole === "admin" || userRole === "teacher") return navigate("/admin/dashboard");
      if (userRole === "proctor") return navigate("/proctor/dashboard");
      if (userRole === "student") return navigate("/student/dashboard"); 
      
    } catch (error) {
      toast.error(error.response?.data?.message || "Sai tài khoản hoặc mật khẩu!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">

      <div className="hidden md:flex flex-1 bg-blue-400 text-white flex-col justify-between p-12 relative overflow-hidden">

        <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/5/5a/STU_01.jpg')] bg-cover bg-center  mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 to-transparent"></div>
        
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2 mb-12 w-max">
            <div className="bg-white p-2 rounded-xl">
             <GraduationCap className="w-8 h-8 text-blue-600"/>
            </div>
            <span className="font-bold text-2xl tracking-tight">NQ EduTech</span>
          </Link>
          
          <div>
            <h1 className="text-4xl lg:text-5xl font-extrabold mb-6 leading-tight">
              Nền tảng thi <br/> trắc nghiệm <br/> trực tuyến.
            </h1>
            <p className="text-blue-100 text-lg max-w-md leading-relaxed">
              Hệ thống đánh giá năng lực minh bạch, bảo mật và thân thiện. Áp dụng công nghệ giám sát phòng thi thời gian thực.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-sm font-medium text-blue-200">
          <span>© 2026 NQ EduTech</span>
          <div className="w-1 h-1 rounded-full bg-blue-400"></div>
          <a href="#" className="hover:text-white transition">Hỗ trợ</a>
        </div>
      </div>

   
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative">
        <div className="w-full max-w-md">
       
          <Link to="/" className="flex items-center gap-2 mb-8 md:hidden justify-center">
            <div className="bg-blue-600 p-2 rounded-xl">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-slate-800">NQ EduTech</span>
          </Link>

          <div className="mb-10 text-center md:text-left">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Đăng nhập</h2>
            <p className="text-slate-500">Vui lòng điền thông tin để truy cập hệ thống.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
        
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input 
                    type="text" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white text-slate-800 placeholder:text-slate-400 font-medium"
                    placeholder="VD: student1@stu.edu.vn"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-semibold text-slate-700">Mật khẩu</label>
                  <Link to="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition">Quên mật khẩu?</Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-11 pr-11 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white text-slate-800 font-medium"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

         
            <div className="pt-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Auto-fill test</label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  type="button"
                  onClick={() => handleRoleChange("student")}
                  className={`py-2.5 rounded-xl font-bold text-sm border transition-all
                    ${role === 'student' ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}
                  `}
                >
                  Học viên
                </button>
                <button 
                  type="button"
                  onClick={() => handleRoleChange("admin")}
                  className={`py-2.5 rounded-xl font-bold text-sm border transition-all
                    ${role === 'admin' ? 'border-slate-800 bg-slate-900 text-white shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}
                  `}
                >
                  Quản trị viên
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70"
            >
              {loading ? (
                <>Đang xử lý <Loader2 className="w-5 h-5 animate-spin" /></>
              ) : (
                <>Đăng nhập hệ thống <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center text-sm font-medium text-slate-500">
            Chưa có tài khoản? Liên Trung Tâm Đào Tạo hoặc giảng viên hướng dẫn.
          </div>
        </div>
      </div>
      <FloatingContact />
    </div>
  );
}
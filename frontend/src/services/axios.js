import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Tự động đính kèm token vào header nếu có
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Xử lý khi API trả về lỗi
instance.interceptors.response.use(
    (response) => response,
    (error) => {
        // Chỉ bắt lỗi 401 khi API trả về thực sự là Unauthenticated
        if (error.response && error.response.status === 401) {
            console.warn("Token hết hạn hoặc không hợp lệ. Đang đá ra trang login...");
            localStorage.removeItem('token'); // Xóa token rác
            
            // Tránh việc redirect liên tục nếu đã ở trang login
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default instance;
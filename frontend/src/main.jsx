import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css';

import axios from 'axios';

axios.defaults.baseURL = 'http://127.0.0.1:8000';
axios.defaults.headers.common['Accept'] = 'application/json';

axios.interceptors.request.use(
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

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Nếu Backend báo 401 (Token sai hoặc hết hạn), tự động xóa data cũ và ép đăng nhập lại
      localStorage.removeItem('token');
      localStorage.removeItem('userName');
      localStorage.removeItem('userRole');
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

// RENDER APP CHÍNH
createRoot(document.getElementById('root')).render(
  // Tạm tắt StrictMode nếu nó gọi API 2 lần gây khó chịu khi test
  // <React.StrictMode>
    <App />
  // </React.StrictMode>,
)
// src/auth/AuthContext.jsx

import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

// Khởi tạo Context - KHÔNG có bất kỳ hằng số nào khác ở cấp độ module này
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // ĐỊNH NGHĨA BIẾN HẰNG VÀ ENDPOINT BÊN TRONG COMPONENT AuthProvider
  // Điều này giúp Fast Refresh hoạt động trơn tru
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const LOGOUT_ENDPOINT = `${SUPABASE_URL}/auth/v1/logout`;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hàm kiểm tra phiên đăng nhập ban đầu
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = () => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("accessToken");
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      // Cấu hình Axios để tự động thêm token vào các request
      axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
    }
    setLoading(false);
  };

  // Hàm login được gọi từ Login.jsx
  const login = (userData, accessToken, refreshToken) => {
    setUser(userData);
    // Lưu trữ thông tin phiên và token vào Local Storage
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);

    // Cập nhật Axios default header cho các request tiếp theo
    axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
  };

  // Hàm logout được gọi từ Header.jsx
  const logout = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        await axios.post(
          LOGOUT_ENDPOINT, // Sử dụng endpoint được định nghĩa bên trong
          {}, // Body trống
          {
            headers: {
              apikey: SUPABASE_ANON_KEY, // Sử dụng key được định nghĩa bên trong
              Authorization: `Bearer ${accessToken}`, // Token hiện tại
            },
          }
        );
      }
    } catch (error) {
      // Vẫn xóa phiên cục bộ ngay cả khi API gặp lỗi
      console.error("Lỗi khi gọi Supabase Logout API:", error);
    } finally {
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      delete axios.defaults.headers.common["Authorization"];
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Hook tùy chỉnh
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  return useContext(AuthContext);
};

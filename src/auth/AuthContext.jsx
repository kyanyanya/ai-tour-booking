// src/auth/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const LOGOUT_ENDPOINT = `${SUPABASE_URL}/auth/v1/logout`;

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();

    // === THÊM INTERCEPTOR ĐỂ BẮT LỖI 401 ===
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token hết hạn hoặc không hợp lệ → tự động logout
          console.warn("Vui lòng Đăng nhập lại");
          handleAutoLogout();
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptor khi component unmount
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkSession = () => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("accessToken");
    const storedRefreshToken = localStorage.getItem("refreshToken");

    if (storedUser && storedToken) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setSession({
        access_token: storedToken,
        refresh_token: storedRefreshToken,
      });
      axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
    }
    setLoading(false);
  };

  const login = (userData, accessToken, refreshToken) => {
    setUser(userData);
    setSession({ access_token: accessToken, refresh_token: refreshToken });

    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("userId", userData.id);

    axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
  };

  // Hàm logout chung (dùng cho cả logout thủ công và tự động)
  const performLogout = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        await axios.post(
          LOGOUT_ENDPOINT,
          {},
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
      }
    } catch (error) {
      console.error("Lỗi gọi logout API:", error);
    } finally {
      // Xóa toàn bộ dữ liệu
      setUser(null);
      setSession(null);
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userId");
      delete axios.defaults.headers.common["Authorization"];
    }
  };

  // Logout thủ công (khi user nhấn nút logout)
  const logout = async () => {
    await performLogout();
    toast.info("Bạn đã đăng xuất thành công!");
    window.location.href = "/login"; // Reload để chắc chắn
  };

  // Logout tự động khi token hết hạn
  const handleAutoLogout = async () => {
    await performLogout();
    toast.warn("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
    window.location.href = "/login"; // Chuyển ngay về login
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  return useContext(AuthContext);
};

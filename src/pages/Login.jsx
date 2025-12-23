import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth } from "../auth/AuthContext.jsx";
import { toast } from "react-toastify";
import "../styles/pages/Login.css";

const Login = () => {
  // Định nghĩa các biến môi trường và Endpoint bên trong component để tránh lỗi Fast Refresh
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const SIGNIN_ENDPOINT = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
  const USER_ROLE_ENDPOINT = `${SUPABASE_URL}/rest/v1/users`;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // Giữ lại để hiển thị lỗi dưới form
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Bước 1: Gọi API Sign In (Đăng nhập)
      const signinResponse = await axios.post(
        SIGNIN_ENDPOINT,
        { email, password },
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            "Content-Type": "application/json",
          },
        }
      );

      const accessToken = signinResponse.data.access_token;
      const user_id = signinResponse.data.user.id;
      const refresh_token = signinResponse.data.refresh_token;

      // Bước 2: Dùng Access Token để lấy Role từ bảng 'users'
      const roleResponse = await axios.get(
        `${USER_ROLE_ENDPOINT}?user_id=eq.${user_id}&select=role,full_name`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const userRole = roleResponse.data[0]?.role;
      const fullName = roleResponse.data[0]?.full_name || "Guest";

      if (!userRole) {
        toast.error(
          "Tài khoản chưa có thông tin profile. Vui lòng liên hệ Admin."
        );
        throw new Error(
          "Không thể lấy vai trò người dùng. Tài khoản chưa có profile."
        );
      }

      // Bước 3: Cập nhật Auth Context và chuyển hướng
      const userData = {
        id: user_id,
        email: email,
        role: userRole,
        full_name: fullName,
      };

      login(userData, accessToken, refresh_token);

      // Thêm: Lưu userId vào localStorage để dùng ở các file khác (PaymentResult, v.v.)
      localStorage.setItem("userId", user_id);

      // Thông báo thành công bằng toastify
      toast.success(
        `Chào mừng trở lại, ${fullName}! Đang chuyển hướng đến Trang chủ...`
      );

      // CHUYỂN HƯỚNG: Luôn về Home
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err) {
      console.error(
        "Lỗi Đăng nhập:",
        err.response ? err.response.data : err.message
      );
      const errMsg =
        err.response?.data?.error_description ||
        "Email hoặc Mật khẩu không chính xác.";

      toast.error(errMsg);
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Phần return giữ nguyên không thay đổi
  return (
    <>
      <Header />

      <main className="lg-page">
        <div className="lg-container">
          {/* Cột trái: Thông tin + Ảnh thật */}
          <div className="lg-info">
            <h1>Đăng nhập vào tài khoản</h1>
            <p>
              Truy cập hồ sơ, theo dõi đơn đặt tour, thanh toán nhanh, và nhận
              gợi ý cá nhân hóa.
            </p>

            <div className="lg-image">
              <img
                src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80"
                alt="Điểm đến du lịch tuyệt đẹp - Đà Lạt"
                className="lg-img"
              />
            </div>
          </div>

          {/* Cột phải: Form đăng nhập */}
          <div className="lg-form">
            <div className="lg-card">
              <form onSubmit={handleSubmit}>
                <div className="lg-input-group">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="lg-input-group">
                  <label>Mật khẩu</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {error && <p className="lg-error">{error}</p>}

                <div className="lg-form-options">
                  <label className="lg-checkbox-label">
                    <input type="checkbox" defaultChecked />
                    <span className="lg-checkmark"></span>
                    Ghi nhớ
                  </label>
                  <a href="#forgot" className="lg-forgot-link">
                    Quên mật khẩu?
                  </a>
                </div>

                <button
                  type="submit"
                  className="lg-btn-login"
                  disabled={loading}
                >
                  {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                </button>
              </form>

              <div className="lg-social-login">
                {/* ... Social buttons ... */}
              </div>

              <p className="lg-signup-link">
                Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default Login;

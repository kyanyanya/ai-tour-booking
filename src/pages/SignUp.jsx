// src/pages/SignUp.jsx

import React, { useState } from "react";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "../styles/pages/SignUp.css";

const SignUp = () => {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const SIGNUP_ENDPOINT = `${SUPABASE_URL}/auth/v1/signup`;

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreedToTerms: false,
  });
  const [loading, setLoading] = useState(false);

  // Xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Xử lý sự kiện đăng ký
  const handleSubmit = async (e) => {
    e.preventDefault();

    const { fullName, email, password, confirmPassword, agreedToTerms } =
      formData;

    // Kiểm tra validation
    if (!fullName || !email || !password || !confirmPassword) {
      toast.error("Vui lòng điền đầy đủ các trường bắt buộc.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Mật khẩu và Nhập lại mật khẩu không khớp.");
      return;
    }
    if (password.length < 6) {
      toast.error("Mật khẩu phải chứa ít nhất 6 ký tự.");
      return;
    }
    if (!agreedToTerms) {
      toast.error("Vui lòng đồng ý với Điều khoản dịch vụ.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        email: email,
        password: password,
        data: {
          full_name: fullName,
        },
      };

      // Thực hiện gọi API đăng ký bằng Axios
      const response = await axios.post(SIGNUP_ENDPOINT, payload, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          "Content-Type": "application/json",
        },
      });

      // Kiểm tra Status Code thành công (2xx)
      if (response.status >= 200 && response.status < 300) {
        // --- CẬP NHẬT THÔNG BÁO ---
        toast.success("Đăng ký thành công!");

        // --- CẬP NHẬT THỜI GIAN CHUYỂN HƯỚNG (1 giây) ---
        setTimeout(() => {
          navigate("/login");
        }, 1000);
      } else {
        toast.error("Đăng ký thất bại. Phản hồi server không hợp lệ.");
      }
    } catch (err) {
      // Xử lý lỗi (ví dụ: Email đã tồn tại)
      console.error(
        "🔥 Lỗi ĐĂNG KÝ:",
        err.response ? err.response.data : err.message
      );

      const errorData = err.response?.data;
      let errMsg =
        "Đã xảy ra lỗi hệ thống. Vui lòng kiểm tra lại Email và Mật khẩu.";

      if (errorData?.msg || errorData?.error_description) {
        errMsg = errorData.msg || errorData.error_description;
      }

      // Xử lý lỗi phổ biến nhất: Email đã tồn tại (thường là status 400)
      if (
        err.response?.status === 400 &&
        errMsg.toLowerCase().includes("email")
      ) {
        errMsg = `Email ${email} đã được đăng ký. Vui lòng đăng nhập hoặc sử dụng email khác.`;
      }

      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />

      <main className="su-page">
        <div className="su-container">
          <div className="su-info">
            <h1>Tạo tài khoản mới</h1>
            <p>
              Đăng ký ngay để nhận ưu đãi đầu tiên, gợi ý tour cá nhân hóa và
              theo dõi hành trình du lịch của bạn!
            </p>

            <div className="su-image">
              <img
                src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80"
                alt="Du lịch biển - Phú Quốc"
                className="su-img"
              />
            </div>
          </div>
          <div className="su-form">
            <div className="su-card">
              <form onSubmit={handleSubmit}>
                <div className="su-input-group">
                  <label>Tên đầy đủ</label>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Nguyễn Văn A"
                    value={formData.fullName}
                    onChange={handleChange}
                  />
                </div>

                <div className="su-input-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="su-input-group">
                  <label>Mật khẩu</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="•••••••• (Tối thiểu 6 ký tự)"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>

                <div className="su-input-group">
                  <label>Nhập lại mật khẩu</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>

                <div className="su-form-options">
                  <label className="su-checkbox-label">
                    <input
                      type="checkbox"
                      name="agreedToTerms"
                      className="su-checkbox-input"
                      checked={formData.agreedToTerms}
                      onChange={handleChange}
                    />
                    <span className="su-checkmark"></span>
                    <span className="su-checkbox-text">
                      Tôi đồng ý với{" "}
                      <a href="#terms" className="su-terms-link">
                        Điều khoản dịch vụ
                      </a>{" "}
                      và{" "}
                      <a href="#privacy" className="su-terms-link">
                        Chính sách bảo mật
                      </a>
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="su-btn-signup"
                  disabled={loading}
                >
                  {loading ? (
                    "Đang xử lý..."
                  ) : (
                    <>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                      Đăng ký
                    </>
                  )}
                </button>
              </form>

              <p className="su-signin-link">
                Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default SignUp;

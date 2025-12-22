// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Home from "./pages/Home";
import AllToursList from "./pages/AllToursList";
import TourDetailPage from "./pages/TourDetailPage";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import AdminDashboard from "./pages/AdminDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import PartnerDashboard from "./pages/PartnerDashboard";
import Cart from "./pages/Cart.jsx";
import ContactInfo from "./pages/ContactInfo";
import Checkout from "./pages/Checkout";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tours" element={<AllToursList />} />
          <Route path="/tours/:id" element={<TourDetailPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<SignUp />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/customer" element={<CustomerDashboard />} />
          <Route path="/partner" element={<PartnerDashboard />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout/contact" element={<ContactInfo />} />
          <Route path="/checkout" element={<Checkout />} />
        </Routes>

        {/* TOAST CONTAINER */}
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </Router>
    </AuthProvider>
  );
}

export default App;

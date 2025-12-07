
import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/pages/Cart.css";

const Cart = () => {
  return (
    <>
      <Header />
      <div className="cart-container">
        <div className="cart-content">
          <h1>Giỏ hàng</h1>
          <p>Chưa có tour nào trong giỏ hàng.</p>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Cart;
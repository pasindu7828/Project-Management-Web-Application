import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoImg from "../assets/Logo.jpg";
import axios from "axios";
import Cookies from "js-cookie";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const API_URL = import.meta.env.VITE_API_BASE_URL;

  const handleSubmit = async () => {
    // Reset messages
    setError("");
    setSuccess("");

    // Validation
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);

    try {
      //   const response = await fetch("http://localhost:8090/api/v1/userAuth/userLogin", {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //     credentials: "include",
      //     body: JSON.stringify({ email, password }),
      //   });
      const res = await axios.post(
        `${API_URL}/api/v1/employee/userLogin`,
        { email, password },
        { withCredentials: true }
      );
      console.log(res);

      //   const data = await response.json();

      if (res.data.success) {
        setSuccess("Login successful!");

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.data));
        Cookies.set("access_token", res.data.token, { path: "/" });
        console.log(res.data.token);

        const role = res.data.data.role;

        setTimeout(() => {
          if (role === 3) {
            navigate("/admin/dashboard");
          } else if (role === 2) {
            navigate("/manager/dashboard"); // manager uses user dashboard
          } else if (role === 1) {
            navigate("/user/dashboard"); // employee
          } else {
            navigate("/login");
          }
        }, 1000);
      } else {
        setError(res.data.message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong!. please check your password and email");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Decorative Shapes */}
      <div className="absolute inset-0 z-0">
        {/* Top Right Corner */}
        <div className="absolute top-0 right-0 w-72 h-72 md:w-96 md:h-96 lg:w-[28rem] lg:h-[28rem]  bg-[#E5E7EB] rounded-bl-[160px]"></div>
        <div className="absolute top-0 right-0 w-56 h-56  md:w-72 md:h-72 lg:w-[22rem] lg:h-[22rem] bg-[#087990] rounded-bl-[120px]"></div>

        {/* Bottom Left Corner */}
        <div className="absolute bottom-0 left-0 w-72 h-72 md:w-96 md:h-96  lg:w-[28rem] lg:h-[28rem] bg-[#E5E7EB] rounded-tr-[160px]"></div>
        <div className="absolute bottom-0 left-0 w-56 h-56 md:w-72 md:h-72 lg:w-[22rem] lg:h-[22rem] bg-[#087990] rounded-tr-[120px]">
          {" "}
        </div>
      </div>

      {/* Card wrapper */}
      <div className="relative z-10 flex w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* LEFT BRAND SECTION */}
        <div className="hidden md:flex md:w-1/2 bg-[#087990] items-center justify-center relative p-12">
          <div className="absolute top-0 left-0 w-32 h-32 bg-[#E5E7EB] bg-opacity-20 rounded-br-full"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white bg-opacity-10 rounded-tr-[80px]"></div>

          <div className="text-center relative z-10">
            {/* Logo Container */}
            <div className="mb-8 flex justify-center">
              <div className="w-40 h-40 bg-white rounded-2xl shadow-lg flex items-center justify-center p-4">
                <img
                  src={LogoImg}
                  alt="Work Sync Logo"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
            </div>

            <h1 className="text-white text-4xl font-light tracking-wide mb-2">
              Work Sync
            </h1>
            <p className="text-white text-sm opacity-90">
              Workforce Management System
            </p>
          </div>
        </div>

        {/* RIGHT LOGIN SECTION */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 lg:p-12 flex items-center justify-center bg-white">
          <div className="w-full max-w-sm">
            <h2 className="text-2xl font-semibold text-[#087990] text-center mb-2">
              Sign In
            </h2>
            <p className="text-center text-gray-600 text-sm mb-8">
              Welcome back! Please log in to your account.
            </p>

            {/* Error Message */}
            {error && (
              <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-300 p-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-300 p-3 rounded-lg">
                {success}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087990] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087990] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                />
              </div>

              <div className="text-right">
                <button className="text-sm text-[#087990] hover:text-[#065f72] hover:underline bg-transparent border-0 cursor-pointer transition-colors">
                  Forgot Password?
                </button>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-[#087990] hover:bg-[#065f72] text-white py-3 rounded-lg transition-all font-medium disabled:bg-[#087990] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>

              <p className="text-center text-sm text-gray-600 mt-6">
                Don't have an account?{" "}
                <button
                  onClick={() => navigate("/signup")}
                  className="text-[#087990] hover:text-[#065f72] font-medium bg-transparent border-0 cursor-pointer transition-colors"
                >
                  Sign up
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

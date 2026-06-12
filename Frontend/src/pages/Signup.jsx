import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import LogoImg from "../assets/Logo.jpg";

export default function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    NIC: "",
    resume: null,
    contactNumber: "",
    gender: "",
    email: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fileName, setFileName] = useState("");

  const API_URL = import.meta.env.VITE_API_BASE_URL;

  // NIC VALIDATION 
  const isValidNIC = (nic) => {
    const oldNIC = /^[0-9]{9}[vVxX]$/;
    const newNIC = /^[0-9]{12}$/;
    return oldNIC.test(nic) || newNIC.test(nic);
  };
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a PDF or DOC file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setFormData({ ...formData, resume: file });
    setFileName(file.name);
    setError("");
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    // ===== BASIC VALIDATION =====
    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError("Please fill in all required fields");
      return;
    }

    if (!formData.NIC || !formData.contactNumber || !formData.gender) {
      setError("Please fill in all required fields");
      return;
    }

    // ===== NIC VALIDATION =====
    if (formData.NIC && !isValidNIC(formData.NIC)) {
      setError("Please enter a valid Sri Lankan NIC number");
      return;
    }

    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append("FirstName", formData.firstName);
      submitData.append("LastName", formData.lastName);
      submitData.append("email", formData.email);
      submitData.append("NIC", formData.NIC);
      submitData.append("ContactNumber", formData.contactNumber);
      submitData.append("Gender", formData.gender);
      
      if (formData.resume) {
        submitData.append("resume", formData.resume);
      }

      const response = await axios.post(
        `${API_URL}/api/v1/userAuth/userRegistration`,
        submitData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        setSuccess("Account created successfully! Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(response.data.message || "Registration failed");
      }
    } catch (err) {
      console.error("Registration error:", err);
      
      if (err.response) {
        // Server responded with error
        setError(err.response.data.message || "Registration failed");
      } else if (err.request) {
        // No response from server
        setError("Unable to connect to server. Please check if the backend is running.");
      } else {
        // Other errors
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSubmit();
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
        <div className="absolute bottom-0 left-0 w-56 h-56 md:w-72 md:h-72 lg:w-[22rem] lg:h-[22rem] bg-[#087990] rounded-tr-[120px]"></div>
      </div>

      {/* Card wrapper */}
      <div className="relative z-10 flex w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* LEFT BRAND SECTION */}
        <div className="hidden md:flex md:w-2/5 bg-[#087990] items-center justify-center relative p-12">
          <div className="text-center relative z-10">
            <div className="mb-8 flex justify-center">
              <div className="w-40 h-40 bg-white rounded-2xl shadow-lg flex items-center justify-center p-4">
                <img src={LogoImg} alt="Work Sync Logo" className="w-full h-full object-contain rounded-lg" />
              </div>
            </div>
            <h1 className="text-white text-4xl font-light tracking-wide">Work Sync</h1>
            <p className="text-white text-sm opacity-90">Workforce Management System</p>
          </div>
        </div>

        {/* RIGHT SIGNUP SECTION */}
        <div className="w-full md:w-3/5 p-6 sm:p-8 lg:p-10 flex items-center justify-center bg-white">
          <div className="w-full max-w-xl">
            <h2 className="text-2xl font-semibold text-[#087990] text-center mb-1">Sign Up</h2>
            <p className="text-center text-gray-600 text-sm mb-6">Manage smart. Work better.</p>

            {error && <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-300 p-3 rounded-lg">{error}</div>}
            {success && <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-300 p-3 rounded-lg">{success}</div>}

            <div className="space-y-4">
              {/* First Name and Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087990] focus:border-transparent transition-all"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleChange}
                    onKeyPress={handleKeyPress}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087990] focus:border-transparent transition-all"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleChange}
                    onKeyPress={handleKeyPress}
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  National Identity No <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="NIC"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087990] focus:border-transparent transition-all"
                  placeholder="200012345678 or 965432109V"
                  value={formData.NIC}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                />
              </div>

              {/* Resume Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Resume (Optional)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    id="resume-upload"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    disabled={loading}
                    className="hidden"
                  />
                  <label
                    htmlFor="resume-upload"
                    className="w-full px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#087990] transition-all flex items-center justify-center bg-gray-50 hover:bg-gray-100"
                  >
                    <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm text-gray-600">
                      {fileName || "Click to upload Resume (PDF, DOC, DOCX - Max 5MB)"}
                    </span>
                  </label>
                </div>
                {fileName && (
                  <p className="text-xs text-[#087990] mt-1">Selected: {fileName}</p>
                )}
              </div>

              {/* Contact Number and Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="contactNumber"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087990] focus:border-transparent transition-all"
                    placeholder="+94 77 123 1234"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    onKeyPress={handleKeyPress}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087990] focus:border-transparent bg-white transition-all"
                    value={formData.gender}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-1">
                  This will function as your username
                </p>
                <input
                  type="email"
                  name="email"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087990] focus:border-transparent transition-all"
                  placeholder="yourname@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                />
              </div>

              {/* Create Account Button */}
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-[#087990] hover:bg-[#065f72] text-white py-3 rounded-lg transition-all font-medium disabled:bg-[#087990] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl mt-2"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>

              {/* Already have an account */}
              <p className="text-center text-sm text-gray-600 mt-4">
                Already have an account?{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="text-[#087990] hover:text-[#065f72] font-medium bg-transparent border-0 cursor-pointer transition-colors"
                >
                  Log In
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
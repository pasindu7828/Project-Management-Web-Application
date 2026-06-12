import React, { useState, useEffect } from "react";
import { Clock, X, AlertCircle, Check } from "lucide-react";
import Sidebar from "../../components/sidebar/Sidebar";
import DashboardHeader from "../../components/DashboardHeader";
import axios from "axios";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}${
  import.meta.env.VITE_API_VERSION
}`;

const UserAttendance = () => {
  const storedUser =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const userData = storedUser ? JSON.parse(storedUser) : null;
  const fullName = [userData?.FirstName, userData?.LastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const displayName =
    userData?.name || (fullName ? fullName : userData?.email?.split("@")[0] || "User");
  const roleLabel = { 1: "Employee", 2: "Manager", 3: "Admin" }[userData?.role] || "Employee";

  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [correctionType, setCorrectionType] = useState("CheckIn");
  const [correctTime, setCorrectTime] = useState("");
  const [reason, setReason] = useState("");
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [workingHours, setWorkingHours] = useState("0h 0m");
  const [showAutoCheckoutWarning, setShowAutoCheckoutWarning] = useState(false);
  const [autoCheckoutCountdown, setAutoCheckoutCountdown] = useState(null);

  // Filter and pagination states
  const [dateFilter, setDateFilter] = useState("all");
  const [customDate, setCustomDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      if (now.getHours() === 19 && now.getMinutes() === 0 && isCheckedIn) {
        setShowAutoCheckoutWarning(true);
      }

      if (now.getHours() === 19 && now.getMinutes() >= 30 && isCheckedIn) {
        if (!autoCheckoutCountdown) {
          setAutoCheckoutCountdown(true);
          setTimeout(() => {
            fetchAttendanceHistory();
            setAutoCheckoutCountdown(null);
          }, 2000);
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isCheckedIn, autoCheckoutCountdown]);

  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_BASE_URL}/attendance/my-history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setAttendanceData(response.data.attendance);

        const today = new Date().toISOString().split("T")[0];
        const todayRecord = response.data.attendance.find(
          (record) => record.date === today
        );

        if (todayRecord) {
          setTodayAttendance(todayRecord);
          setIsCheckedIn(todayRecord.inTime && !todayRecord.outTime);
          if (todayRecord.inTime) {
            setCheckInTime(new Date(todayRecord.inTime));
          }
        }
      }
    } catch (error) {
      console.error("Error fetching attendance history:", error);
      alert(
        error.response?.data?.message || "Failed to fetch attendance history"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceHistory();
  }, []);

  useEffect(() => {
    if (isCheckedIn && checkInTime) {
      const interval = setInterval(() => {
        const duration = Math.floor((new Date() - checkInTime) / 1000 / 60);
        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;
        setWorkingHours(`${hours}h ${minutes}m`);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isCheckedIn, checkInTime]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateFilter, customDate, statusFilter]);

  const handleCheckIn = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const today = new Date().toISOString().split("T")[0];

      const response = await axios.post(
        `${API_BASE_URL}/attendance/startAttendent`,
        { date: today },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        const attendance =
          response.data.newAttendance || response.data.attendance;
        setIsCheckedIn(true);
        setCheckInTime(new Date(attendance.inTime));
        setTodayAttendance(attendance);
        alert(response.data.message);
        fetchAttendanceHistory();
      }
    } catch (error) {
      console.error("Error checking in:", error);
      alert(error.response?.data?.message || "Failed to check in");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        alert("No authentication token found. Please log in again.");
        setLoading(false);
        return;
      }

      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      
      const response = await axios.patch(
        `${API_BASE_URL}/attendance/EndAttendance/checkout`,
        { date: dateString },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setIsCheckedIn(false);
        setCheckInTime(null);
        setWorkingHours("0h 0m");
        setShowAutoCheckoutWarning(false);
        alert(response.data.message);
        setTimeout(() => {
          fetchAttendanceHistory();
        }, 500);
      }
    } catch (error) {
      console.error("Error checking out:", error);
      
      if (error.response?.status === 404) {
        alert("No attendance record found for today. Did you check in?");
      } else if (error.response?.status === 400) {
        alert(error.response?.data?.message || "You may have already checked out.");
      } else {
        alert(error.response?.data?.message || "Failed to check out. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCheckInTime = () => {
    if (!checkInTime) return "00:00:00";
    const hours = String(checkInTime.getHours()).padStart(2, "0");
    const minutes = String(checkInTime.getMinutes()).padStart(2, "0");
    const seconds = String(checkInTime.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const formatTime = (dateString) => {
    if (!dateString || dateString === "-") return "-";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleRequestCorrection = (row) => {
    setSelectedDate(row);
    setCorrectionType("CheckIn");
    setCorrectTime("");
    setReason("");
    setShowCorrectionForm(true);
  };

  const handleSubmitCorrection = async () => {
    if (!correctTime.trim()) {
      alert("Please enter the correct time");
      return;
    }

    if (!reason.trim()) {
      alert("Please provide a reason for the correction");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const requestedDateTime = new Date(`${selectedDate.date}T${correctTime}`);

      const response = await axios.post(
        `${API_BASE_URL}/attendance/request-correction`,
        {
          date: selectedDate.date,
          type: correctionType,
          requestedTime: requestedDateTime.toISOString(),
          reason: reason,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        alert(response.data.message);
        setShowCorrectionForm(false);
        fetchAttendanceHistory();
      }
    } catch (error) {
      console.error("Error requesting correction:", error);
      alert(error.response?.data?.message || "Failed to request correction");
    } finally {
      setLoading(false);
    }
  };

  const getOriginalTime = () => {
    if (!selectedDate) return "";
    return correctionType === "CheckIn"
      ? selectedDate.checkIn
      : selectedDate.checkOut;
  };

  // Filter logic
  const filteredData = attendanceData.filter((row) => {
    // Date filter
    let matchesDate = true;
    if (dateFilter === "today") {
      const today = new Date().toISOString().split("T")[0];
      matchesDate = row.date === today;
    } else if (dateFilter === "week") {
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const rowDate = new Date(row.date);
      matchesDate = rowDate >= weekAgo && rowDate <= today;
    } else if (dateFilter === "month") {
      const today = new Date();
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const rowDate = new Date(row.date);
      matchesDate = rowDate >= monthAgo && rowDate <= today;
    } else if (dateFilter === "custom" && customDate) {
      matchesDate = row.date === customDate;
    }

    // Status filter
    const matchesStatus = statusFilter === "all" || row.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesDate && matchesStatus;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Pagination handlers
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (showCorrectionForm) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar role="employee" activeItem="attendance" />

        <div className="flex-1 flex flex-col">
          <DashboardHeader />

          <div className="flex-1 overflow-auto p-6">
            <div className="mb-6">
              <button
                onClick={() => setShowCorrectionForm(false)}
                className="flex items-center gap-2 text-[#087990] hover:text-[#065a70] mb-4"
              >
                <X size={20} />
                Back to Attendance
              </button>

              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                  My Attendance
                </h1>
                <p className="text-sm text-gray-600">Welcome Back {displayName}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white border-2 border-gray-300 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 mb-2">Date</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedDate?.date}
                  </p>
                </div>

                <div className="bg-white border-2 border-gray-300 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 mb-2">Status</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedDate?.status}
                  </p>
                </div>

                <div className="bg-white border-2 border-gray-300 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 mb-2">Check In</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedDate?.checkIn}
                  </p>
                </div>

                <div className="bg-white border-2 border-gray-300 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 mb-2">Check Out</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedDate?.checkOut}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  What do you need to Correct ?
                </h3>

                <div className="grid grid-cols-2 gap-6">
                  <button
                    onClick={() => setCorrectionType("CheckIn")}
                    className={`p-6 border-2 rounded-lg cursor-pointer transition text-center font-semibold text-lg ${
                      correctionType === "CheckIn"
                        ? "border-[#087990] bg-[#087990] text-white shadow-md"
                        : "border-gray-300 text-gray-700 bg-white hover:border-gray-400"
                    }`}
                  >
                    Check in Time
                  </button>

                  <button
                    onClick={() => setCorrectionType("CheckOut")}
                    className={`p-6 border-2 rounded-lg cursor-pointer transition text-center font-semibold text-lg ${
                      correctionType === "CheckOut"
                        ? "border-[#087990] bg-[#087990] text-white shadow-md"
                        : "border-gray-300 text-gray-700 bg-white hover:border-gray-400"
                    }`}
                  >
                    Check Out Time
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6 mb-8">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-3">
                      {correctionType === "CheckIn"
                        ? "Original Check in Time"
                        : "Original Check Out Time"}
                    </h3>
                    <div className="bg-white border border-gray-300 p-4 rounded-lg text-center">
                      <p className="text-xl font-bold text-gray-900">
                        {getOriginalTime() || "-"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-3">
                      Requested{" "}
                      {correctionType === "CheckIn"
                        ? "Check in Time"
                        : "Check Out Time"}
                    </h3>
                    <input
                      type="time"
                      value={correctTime}
                      onChange={(e) => setCorrectTime(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087990] focus:border-transparent text-center text-lg"
                      placeholder="--:--"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Reason For the Correction
                </h3>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087990] focus:border-transparent mb-3"
                  placeholder="Type your reason here..."
                />
                <p className="text-sm text-gray-600 mb-3">
                  Please explain why you need this correction. Be specific and
                  honest. Example,
                </p>
                <ul className="text-sm text-gray-600 mb-4 space-y-1">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      System was down and I could not check{" "}
                      {correctionType === "CheckIn" ? "in" : "out"}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      Forgot to check{" "}
                      {correctionType === "CheckIn" ? "in" : "out"} at correct
                      time
                    </span>
                  </li>
                </ul>
              </div>

              <div className="border-t border-gray-200 pt-6 flex justify-end">
                <button
                  onClick={handleSubmitCorrection}
                  disabled={loading}
                  className="px-8 py-3 text-white rounded-lg hover:opacity-90 transition text-lg font-medium disabled:opacity-50"
                  style={{ backgroundColor: "#087990" }}
                >
                  {loading ? "Submitting..." : "Request Correction"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar role="employee" activeItem="attendance" />

      <div className="flex-1 flex flex-col">
        <DashboardHeader />

        <div className="flex-1 overflow-auto p-6">
          {showAutoCheckoutWarning && isCheckedIn && (
            <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg flex gap-3">
              <AlertCircle
                size={20}
                className="text-yellow-600 flex-shrink-0 mt-0.5"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-800">
                  Auto Checkout Warning
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  You will be automatically checked out at 7:30 PM if you don't
                  check out manually. Please check out before 7:30 PM to avoid
                  automatic checkout.
                </p>
              </div>
              <button
                onClick={() => setShowAutoCheckoutWarning(false)}
                className="text-yellow-600 hover:text-yellow-800"
              >
                <X size={20} />
              </button>
            </div>
          )}

          {autoCheckoutCountdown && (
            <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg flex gap-3">
              <Clock
                size={20}
                className="text-blue-600 flex-shrink-0 mt-0.5 animate-spin"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-800">
                  Auto Checkout Applied
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  You have been automatically checked out at 7:30 PM. Please
                  refresh to see the update.
                </p>
              </div>
            </div>
          )}

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
                <p className="text-sm text-gray-600">Welcome Back {displayName}</p>
          </div>

          <div
            className="rounded-lg p-8 mb-6 shadow-sm"
            style={{ backgroundColor: "#E5E7EB" }}
          >
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center mb-4 text-white">
                <Clock size={32} />
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Today's Attendance
              </h2>

              {!isCheckedIn ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-gray-700 mb-6">
                    <AlertCircle size={18} className="text-gray-900" />
                    <span>You haven't check in today</span>
                  </div>

                  <button
                    onClick={handleCheckIn}
                    disabled={loading}
                    className="px-8 py-2 text-white rounded text-sm font-medium disabled:opacity-50"
                    style={{ backgroundColor: "#087990" }}
                  >
                    {loading ? "Processing..." : "Check IN"}
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sm text-gray-700 mb-6">
                    <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
                      <Check size={16} className="text-white" strokeWidth={3} />
                    </div>
                    <span>You are checked in</span>
                  </div>

                  <div className="flex items-center gap-20 mb-6">
                    <div className="bg-white rounded-lg px-10 py-4 text-center">
                      <p className="text-xs text-gray-600 mb-2">
                        Check IN Time
                      </p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatCheckInTime()}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg px-10 py-4 text-center">
                      <p className="text-xs text-gray-600 mb-2">
                        Working Hours
                      </p>
                      <p className="text-xl font-bold text-gray-900">
                        {workingHours}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckOut}
                    disabled={loading}
                    className="px-8 py-2 bg-red-500 text-white rounded text-sm font-medium hover:bg-red-600 disabled:opacity-50"
                  >
                    {loading ? "Processing..." : "Check Out"}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Personal Attendance Summary
            </h2>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6 justify-end">
              <select
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  if (e.target.value !== "custom") {
                    setCustomDate("");
                  }
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 bg-white"
                style={{ focusRingColor: "#087990" }}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="custom">Custom Date</option>
              </select>

              {dateFilter === "custom" && (
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 bg-white"
                  style={{ focusRingColor: "#087990" }}
                />
              )}

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 bg-white"
                style={{ focusRingColor: "#087990" }}
              >
                <option value="all">All Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="working">Working</option>
              </select>
            </div>

            {loading && attendanceData.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                Loading attendance data...
              </div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                No attendance records found
              </div>
            ) : (
              <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-[#087990]">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-white border-r border-white">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-white border-r border-white">
                        Check IN
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-white border-r border-white">
                        Check Out
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-white border-r border-white">
                        Hours
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-white border-r border-white">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-white">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.map((row, index) => (
                      <tr
                        key={row._id || index}
                        className="border-b border-white bg-gray-100"
                      >
                        <td className="py-3 px-4 text-sm text-gray-800 border-r border-white">
                          {row.date}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-800 border-r border-white">
                          {formatTime(row.inTime)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-800 border-r border-white">
                          {formatTime(row.outTime)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-800 border-r border-white">
                          {row.hoursWorked || "-"}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-800 border-r border-white">
                          <span
                            className={`px-3 py-1 text-xs font-medium ${
                              row.status === "Present"
                                ? "text-green-600"
                                : row.status === "Absent"
                                ? "text-red-600"
                                : row.status === "Late"
                                ? "text-yellow-600"
                                : "text-blue-600"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-800">
                          <button
                            className="px-3 py-1 text-xs text-white rounded hover:opacity-90 disabled:opacity-50"
                            style={{ backgroundColor: "#087990" }}
                            onClick={() =>
                              handleRequestCorrection({
                                ...row,
                                checkIn: formatTime(row.inTime),
                                checkOut: formatTime(row.outTime),
                                hours: row.hoursWorked,
                              })
                            }
                            disabled={
                              row.correction?.isRequested &&
                              row.correction?.status === "Pending"
                            }
                          >
                            {row.correction?.isRequested &&
                            row.correction?.status === "Pending"
                              ? "Pending"
                              : "Request Correction"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center p-4 bg-gray-100 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} entries
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                      </button>
                      
                      {getPageNumbers().map((page, index) => (
                        page === '...' ? (
                          <span key={`ellipsis-${index}`} className="px-3 py-1 text-sm text-gray-600">...</span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1 text-sm rounded ${
                              currentPage === page
                                ? 'bg-[#087990] text-white'
                                : 'text-gray-600 hover:text-gray-800 border border-gray-300'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      ))}
                      
                      <button 
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAttendance;
import React, { useState, useEffect } from "react";
import {
  Download,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Users,
  FileText,
  Search,
  ChevronLeft,
} from "lucide-react";
import Sidebar from "../../components/sidebar/Sidebar";
import DashboardHeader from "../../components/DashboardHeader";
import axios from "axios";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}${import.meta.env.VITE_API_VERSION}`;

const AdminAttendance = () => {
  const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const userData = storedUser ? JSON.parse(storedUser) : null;
  // Prefer explicit FirstName from DB; if only full name is present, use its first token; avoid email fallback
  const displayName = userData?.FirstName || (userData?.name ? userData.name.split(" ")[0] : "Admin");
  const roleLabel = { 1: "Employee", 2: "Manager", 3: "Admin" }[userData?.role] || "Admin";

  const [activeTab, setActiveTab] = useState("logs");
  const [dateFilter, setDateFilter] = useState("today");
  const [customDate, setCustomDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [selectedCorrection, setSelectedCorrection] = useState(null);
  
  const [generatedReport, setGeneratedReport] = useState(null);
  const [reportType, setReportType] = useState(null);

  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [weeklySummary, setWeeklySummary] = useState({ mostLate: "-", mostAbsent: "-" });
  const [monthlySummary, setMonthlySummary] = useState({ mostLate: "-", mostAbsent: "-" });
  const [dashboardStats, setDashboardStats] = useState({
    totalEmployees: 0,
    present: 0,
    late: 0,
    absent: 0
  });
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const todayStr = new Date().toISOString().split("T")[0];
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [reportDailyDate, setReportDailyDate] = useState(todayStr);
  const [reportWeeklyDate, setReportWeeklyDate] = useState(todayStr);
  const [reportMonthlyDate, setReportMonthlyDate] = useState(currentMonthStr);

  // Prefer backend-provided employeeId; accept strings and fall back to hash from _id/ids
  const getEmployeeId = (user) => {
    if (!user) return "EMP000";
    if (typeof user === "string") return `EMP-${user.slice(-4).toUpperCase()}`;
    if (user.employeeId) return user.employeeId;
    if (user.userid) return user.userid;
    if (user._id) return `EMP-${String(user._id).slice(-4).toUpperCase()}`;
    return "EMP000";
  };

  // Get employee name from backend-populated user data
  const getEmployeeName = (user) => {
    if (!user) return "Unknown";
    // If FirstName and LastName exist, use them
    if (user.FirstName && user.LastName) {
      return `${user.FirstName} ${user.LastName}`;
    }
    // Fallback to name field
    if (user.name) return user.name;
    // Fallback to email prefix
    if (user.email) return user.email.split("@")[0];
    return "Unknown";
  };

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/attendance/dashboard-stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      if (response.data.success) {
        setDashboardStats(response.data.stats);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  const fetchAttendanceLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      let viewType, dateParam;
      
      if (dateFilter === "custom") {
        viewType = "daily";
        dateParam = customDate;
      } else {
        viewType = dateFilter === "today" ? "daily" : dateFilter === "week" ? "week" : "month";
        dateParam = undefined;
      }
      
      const params = { viewType };
      if (dateParam) {
        params.date = dateParam;
      }
      
      const response = await axios.get(`${API_BASE_URL}/attendance/getAttendent`, {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      if (response.data.success) {
        setAttendanceLogs(response.data.attendance);
      }
    } catch (error) {
      console.error("Error fetching attendance logs:", error);
      alert(error.response?.data?.message || "Failed to fetch attendance logs");
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCorrections = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/attendance/pending-corrections`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      if (response.data.success) {
        setCorrections(response.data.requests);
      }
    } catch (error) {
      console.error("Error fetching corrections:", error);
      alert(error.response?.data?.message || "Failed to fetch corrections");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchReportSummaries = async () => {
    try {
      const token = localStorage.getItem("token");
      const [weekRes, monthRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/attendance/analytics-report`, {
          params: { type: "week" },
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }),
        axios.get(`${API_BASE_URL}/attendance/analytics-report`, {
          params: { type: "month" },
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }),
      ]);

      if (weekRes.data?.success) {
        setWeeklySummary({
          mostLate: weekRes.data.summary?.mostLate || "-",
          mostAbsent: weekRes.data.summary?.mostAbsent || "-",
        });
      }

      if (monthRes.data?.success) {
        setMonthlySummary({
          mostLate: monthRes.data.summary?.mostLate || "-",
          mostAbsent: monthRes.data.summary?.mostAbsent || "-",
        });
      }
    } catch (error) {
      console.error("Error fetching report summaries:", error);
    }
  };

  useEffect(() => {
    if (activeTab === "logs") {
      fetchAttendanceLogs();
    } else if (activeTab === "corrections") {
      fetchPendingCorrections();
    } else if (activeTab === "reports") {
      fetchReportSummaries();
    }
  }, [activeTab, dateFilter, customDate]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateFilter, customDate, searchTerm, selectedEmployee]);

  const handleApproveCorrection = async (correction) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/attendance/approve-correction`,
        {
          attendanceId: correction._id,
          action: "Approve"
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
        fetchPendingCorrections();
      }
    } catch (error) {
      console.error("Error approving correction:", error);
      alert(error.response?.data?.message || "Failed to approve correction");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectCorrection = async (correction) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/attendance/approve-correction`,
        {
          attendanceId: correction._id,
          action: "Reject"
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
        fetchPendingCorrections();
      }
    } catch (error) {
      console.error("Error rejecting correction:", error);
      alert(error.response?.data?.message || "Failed to reject correction");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (type, targetDate) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await axios.get(`${API_BASE_URL}/attendance/analytics-report`, {
        params: { type: type === 'daily' ? 'week' : type, date: targetDate },
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      if (response.data.success) {
        const formattedReport = formatReportData(type, response.data, targetDate);
        setReportType(type);
        setGeneratedReport(formattedReport);
      }
    } catch (error) {
      console.error("Error generating report:", error);
      alert(error.response?.data?.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const formatReportData = (type, data, targetDate) => {
    const baseDate = targetDate ? new Date(targetDate) : new Date();
    
    if (type === 'daily') {
      const todayStr = baseDate.toISOString().split('T')[0];
      
      return {
        title: "Daily Attendance Report",
        date: baseDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
        stats: {
          allEmployees: dashboardStats.totalEmployees,
          present: dashboardStats.present,
          late: dashboardStats.late,
          absent: dashboardStats.absent
        },
        tableData: attendanceLogs.map(log => ({
          id: getEmployeeId(log.userId || log.userID || log.userid),
          name: log.userId?.name || "Unknown",
          date: log.date,
          checkIn: formatTime(log.inTime),
          checkOut: formatTime(log.outTime),
          hours: log.hoursWorked || "-",
          status: log.status
        }))
      };
    } else if (type === 'weekly' || type === 'monthly') {
      let startDate = new Date();
      let endDate = new Date();
      
      if (type === 'weekly') {
        // Get selected week: Monday to Sunday based on target
        const currentDate = new Date(baseDate);
        const day = currentDate.getDay();
        const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
        startDate = new Date(currentDate.setDate(diff));
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6); // Add 6 days to get Sunday
      } else {
        // Get selected month: 1st to last day
        startDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
        endDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
      }

      // Calculate working days (Monday to Friday only)
      let workingDaysCount = 0;
      let loopDate = new Date(startDate);
      while (loopDate <= endDate) {
        const dayOfWeek = loopDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) workingDaysCount++; // Exclude Sunday (0) and Saturday (6)
        loopDate.setDate(loopDate.getDate() + 1);
      }

      return {
        title: type === 'weekly' ? "Weekly Attendance Report" : "Monthly Attendance Report",
        date: type === 'weekly' 
          ? `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
          : endDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        stats: {
          allEmployees: data.summary.totalEmployees,
          workingDays: workingDaysCount,
          mostLate: data.summary.mostLate,
          mostAbsent: data.summary.mostAbsent
        },
        tableData: data.report.map(emp => ({
          id: getEmployeeId(emp.employeeId || emp.userid || emp._id || emp.id),
          name: emp.name,
          daysPresent: emp.daysPresent,
          daysAbsent: emp.daysAbsent,
          lateCount: emp.lateCount,
          hours: emp.totalHours
        }))
      };
    }
  };

  const getWorkingDaysForPeriod = (type) => {
    const today = new Date();
    let startDate = new Date();
    let endDate = new Date();

    if (type === 'week') {
      const currentDate = new Date();
      const day = currentDate.getDay();
      const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), diff);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
    } else {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }

    let workingDays = 0;
    const loopDate = new Date(startDate);
    while (loopDate <= endDate) {
      const dayOfWeek = loopDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) workingDays++;
      loopDate.setDate(loopDate.getDate() + 1);
    }

    return workingDays;
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

  const handleBackToReports = () => {
    setGeneratedReport(null);
    setReportType(null);
  };

  const handleExport = async (format) => {
    try {
      const token = localStorage.getItem("token");
      const viewType = reportType === 'daily' ? 'daily' : reportType === 'weekly' ? 'week' : 'month';
      
      const response = await axios.get(
        `${API_BASE_URL}/attendance/attendanceReport`,
        {
          params: { 
            type: format.toLowerCase(),
            viewType: viewType
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Attendance_Report.${format.toLowerCase() === 'pdf' ? 'pdf' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
    } catch (error) {
      console.error("Error exporting report:", error);
      alert("Failed to export report");
    }
  };

  const filteredLogs = attendanceLogs.filter(log => {
    const matchesSearch = (log.userId?.name || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
      getEmployeeId(log.userId || log.userID || log.userid)
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesStatus = selectedEmployee === "all" || log.status.toLowerCase() === selectedEmployee.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, endIndex);

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

  const weeklyWorkingDays = getWorkingDaysForPeriod('week');
  const monthlyWorkingDays = getWorkingDaysForPeriod('month');

  if (generatedReport) {
    return (
      <div className="min-h-screen bg-white flex">
        <div className="flex-shrink-0">
          <Sidebar role="admin" activeItem="attendance" />
        </div>

        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          
          <div className="flex-1 overflow-auto p-6">
            <button
              onClick={handleBackToReports}
              className="flex items-center gap-2 text-[#087990] hover:text-[#065a70] mb-4"
            >
              <ChevronLeft size={20} />
              Back to Reports
            </button>

            <div className="border border-gray-300 rounded-lg px-6 py-3 text-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">{generatedReport.title}</h2>
              <p className="text-base font-semibold text-gray-700 mt-1">{generatedReport.date}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {reportType === 'daily' && (
                <>
                  <div className="flex items-center gap-4 bg-gray-100 rounded-lg p-4">
                    <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                      <Users size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-900">{generatedReport.stats.allEmployees}</p>
                      <p className="text-sm text-gray-700">All Employees</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 bg-gray-100 rounded-lg p-4">
                    <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                      <CheckCircle size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-900">{generatedReport.stats.present}</p>
                      <p className="text-sm text-gray-700">Present</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 bg-gray-100 rounded-lg p-4">
                    <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                      <Clock size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-900">{generatedReport.stats.late}</p>
                      <p className="text-sm text-gray-700">Late</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 bg-gray-100 rounded-lg p-4">
                    <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                      <XCircle size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-900">{generatedReport.stats.absent}</p>
                      <p className="text-sm text-gray-700">Absent</p>
                    </div>
                  </div>
                </>
              )}

              {(reportType === 'weekly' || reportType === 'monthly') && (
                <>
                  <div className="flex items-center gap-4 bg-gray-100 rounded-lg p-4">
                    <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                      <Users size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-900">{generatedReport.stats.allEmployees}</p>
                      <p className="text-sm text-gray-700">All Employees</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 bg-gray-100 rounded-lg p-4">
                    <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                      <Calendar size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-900">{generatedReport.stats.workingDays}</p>
                      <p className="text-sm text-gray-700">Working Days</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 bg-gray-100 rounded-lg p-4">
                    <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                      <Clock size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-900">{generatedReport.stats.mostLate}</p>
                      <p className="text-sm text-gray-700">Most Late</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 bg-gray-100 rounded-lg p-4">
                    <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                      <XCircle size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-900">{generatedReport.stats.mostAbsent}</p>
                      <p className="text-sm text-gray-700">Most Absent</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#087990] text-white">
                      {reportType === 'daily' && (
                        <>
                          <th className="text-left py-3 px-4 text-sm font-semibold border-r border-white">Attendee ID</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold border-r border-white">Name</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold border-r border-white">Date</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold border-r border-white">Check IN</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold border-r border-white">Check Out</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold border-r border-white">Hours</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold">Status</th>
                        </>
                      )}
                      {(reportType === 'weekly' || reportType === 'monthly') && (
                        <>
                          <th className="text-left py-3 px-4 text-sm font-semibold border-r border-white">Attendee ID</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold border-r border-white">Name</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold border-r border-white">Days Present</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold border-r border-white">Days Absent</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold border-r border-white">Late Count</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold">Hours</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {generatedReport.tableData && generatedReport.tableData.length > 0 ? (
                      generatedReport.tableData.map((row, index) => (
                        <tr key={index} className="border-b border-white bg-gray-100">
                          <td className="py-3 px-4 text-sm text-gray-800 border-r border-white">{row.id}</td>
                          <td className="py-3 px-4 text-sm font-medium text-gray-800 border-r border-white">{row.name}</td>
                          
                          {reportType === 'daily' && (
                            <>
                              <td className="py-3 px-4 text-sm text-gray-600 border-r border-white">{row.date}</td>
                              <td className="py-3 px-4 text-sm text-gray-800 border-r border-white">{row.checkIn}</td>
                              <td className="py-3 px-4 text-sm text-gray-800 border-r border-white">{row.checkOut}</td>
                              <td className="py-3 px-4 text-sm text-gray-800 border-r border-white">{row.hours}</td>
                              <td className="py-3 px-4 text-sm text-gray-800">
                                <span className={`px-3 py-1 text-xs font-medium ${
                                  row.status === 'Present' ? 'text-green-600' :
                                  row.status === 'Absent' ? 'text-red-600' :
                                  row.status === 'Late' ? 'text-yellow-600' :
                                  'text-blue-600'
                                }`}>
                                  {row.status}
                                </span>
                              </td>
                            </>
                          )}

                          {(reportType === 'weekly' || reportType === 'monthly') && (
                            <>
                              <td className="py-3 px-4 text-sm text-gray-800 border-r border-white">{row.daysPresent}</td>
                              <td className="py-3 px-4 text-sm text-gray-800 border-r border-white">{row.daysAbsent}</td>
                              <td className="py-3 px-4 text-sm text-gray-800 border-r border-white">{row.lateCount}</td>
                              <td className="py-3 px-4 text-sm text-gray-800">{row.hours}</td>
                            </>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-gray-600">
                          No data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3 p-4 bg-gray-100 border-t border-gray-200">
                <button
                  onClick={() => handleExport('PDF')}
                  disabled={loading}
                  className="px-6 py-2.5 border border-[#087990] text-[#087990] rounded-lg hover:bg-[#087990] hover:text-white transition disabled:opacity-50"
                >
                  {loading ? "Exporting..." : "Export PDF"}
                </button>
                <button
                  onClick={() => handleExport('Excel')}
                  disabled={loading}
                  className="px-6 py-2.5 border border-[#087990] text-[#087990] rounded-lg hover:bg-[#087990] hover:text-white transition disabled:opacity-50"
                >
                  {loading ? "Exporting..." : "Export Excel"}
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
        <Sidebar role="admin" activeItem="attendance" />

      <div className="flex-1 flex flex-col">
        <DashboardHeader />

        <div className="flex-1 overflow-auto">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-800">
              Attendance Management
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Monitor and manage employee attendance
            </p>
          </div>

          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-100 p-5 rounded-lg shadow-sm border border-gray-200 relative">
                <div className="absolute top-4 left-4">
                  <Users size={24} className="text-gray-800" />
                </div>
                <div className="text-center pt-1">
                  <p className="text-2xl font-bold text-gray-800">{dashboardStats.totalEmployees}</p>
                  <p className="text-sm text-gray-600 mt-1">All Employees</p>
                </div>
              </div>

              <div className="bg-gray-100 p-5 rounded-lg shadow-sm border border-gray-200 relative">
                <div className="absolute top-4 left-4">
                  <CheckCircle size={24} className="text-gray-800" />
                </div>
                <div className="text-center pt-1">
                  <p className="text-2xl font-bold text-gray-800">{dashboardStats.present}</p>
                  <p className="text-sm text-gray-600 mt-1">Present</p>
                </div>
              </div>

              <div className="bg-gray-100 p-5 rounded-lg shadow-sm border border-gray-200 relative">
                <div className="absolute top-4 left-4">
                  <Clock size={24} className="text-gray-800" />
                </div>
                <div className="text-center pt-1">
                  <p className="text-2xl font-bold text-gray-800">{dashboardStats.late}</p>
                  <p className="text-sm text-gray-600 mt-1">Late</p>
                </div>
              </div>

              <div className="bg-gray-100 p-5 rounded-lg shadow-sm border border-gray-200 relative">
                <div className="absolute top-4 left-4">
                  <XCircle size={24} className="text-gray-800" />
                </div>
                <div className="text-center pt-1">
                  <p className="text-2xl font-bold text-gray-800">{dashboardStats.absent}</p>
                  <p className="text-sm text-gray-600 mt-1">Absent</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-100 rounded-lg shadow-sm border border-gray-200">
              <div className="bg-white border-b border-gray-200">
                <div className="flex gap-1 p-2">
                  <button
                    onClick={() => setActiveTab("logs")}
                    className={`px-4 py-2 rounded-md transition ${
                      activeTab === "logs"
                        ? "text-white"
                        : "text-gray-600 border border-[#087990] hover:bg-gray-200"
                    }`}
                    style={
                      activeTab === "logs" ? { backgroundColor: "#087990" } : {}
                    }
                  >
                    Attendance Logs
                  </button>
                  <button
                    onClick={() => setActiveTab("corrections")}
                    className={`px-4 py-2 rounded-md transition flex items-center gap-2 ${
                      activeTab === "corrections"
                        ? "text-white"
                        : "text-gray-600 border border-[#087990] hover:bg-gray-200"
                    }`}
                    style={
                      activeTab === "corrections"
                        ? { backgroundColor: "#087990" }
                        : {}
                    }
                  >
                    Correction Approvals
                    {corrections.length > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {corrections.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("reports")}
                    className={`px-4 py-2 rounded-md transition ${
                      activeTab === "reports"
                        ? "text-white"
                        : "text-gray-600 border border-[#087990] hover:bg-gray-200"
                    }`}
                    style={
                      activeTab === "reports"
                        ? { backgroundColor: "#087990" }
                        : {}
                    }
                  >
                    Attendance Reports
                  </button>
                </div>
              </div>

              {activeTab === "logs" && (
                <div className="p-6">
                  <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex-1 min-w-[200px]">
                      <div className="relative">
                        <Search
                          size={18}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#087990]"
                        />
                        <input
                          type="text"
                          placeholder="Search"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 placeholder:text-[#087990] bg-white"
                          style={{ focusRingColor: "#087990" }}
                        />
                      </div>
                    </div>

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
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
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
                      value={selectedEmployee}
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 bg-white"
                      style={{ focusRingColor: "#087990" }}
                    >
                      <option value="all">All Employees</option>
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="late">Late</option>
                      <option value="working">Working</option>
                    </select>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Attendance Logs
                  </h3>

                  {loading ? (
                    <div className="text-center py-8 text-gray-600">
                      Loading attendance logs...
                    </div>
                  ) : filteredLogs.length === 0 ? (
                    <div className="text-center py-8 text-gray-600">
                      No attendance logs found
                    </div>
                  ) : (
                    <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 bg-[#087990]">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-white border-r border-white">
                              Attendee ID
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-white border-r border-white">
                              Name
                            </th>
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
                            <th className="text-left py-3 px-4 text-sm font-semibold text-white">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentLogs.map((log, index) => (
                            <tr key={log._id || index} className="border-b border-white bg-gray-100">
                              <td className="py-3 px-4 text-sm text-gray-800 border-r border-white">
                                {getEmployeeId(log.userId || log.userID || log.userid)}
                              </td>
                              <td className="py-3 px-4 text-sm font-medium text-gray-800 border-r border-white">
                                {log.userId?.name || "Unknown"}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600 border-r border-white">
                                {log.date}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-800 border-r border-white">
                                {formatTime(log.inTime)}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-800 border-r border-white">
                                {formatTime(log.outTime)}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-800 border-r border-white">
                                {log.hoursWorked || "-"}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-800">
                                <span className={`px-3 py-1 text-xs font-medium ${
                                  log.status === 'Present' ? 'text-green-600' :
                                  log.status === 'Absent' ? 'text-red-600' :
                                  log.status === 'Late' ? 'text-yellow-600' :
                                  'text-blue-600'
                                }`}>
                                  {log.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex justify-between items-center p-4 bg-gray-100 border-t border-gray-200">
                          <div className="text-sm text-gray-600">
                            Showing {startIndex + 1} to {Math.min(endIndex, filteredLogs.length)} of {filteredLogs.length} entries
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
              )}

              {activeTab === "corrections" && (
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Pending Attendance Corrections
                  </h3>

                  {loading ? (
                    <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                      <p className="text-gray-600">Loading corrections...</p>
                    </div>
                  ) : corrections.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                      <CheckCircle
                        size={48}
                        className="mx-auto text-gray-400 mb-3"
                      />
                      <p className="text-gray-600">No pending corrections</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {corrections.map((correction) => (
                        <div
                          key={correction._id}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                        >
                          <div className="flex justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold text-gray-800">
                                  {getEmployeeName(correction.userId)}
                                </h4>
                                <span className="text-sm text-gray-600">
                                  ({getEmployeeId(correction.userId || correction.userID || correction.userid)})
                                </span>
                                <span className="text-sm text-gray-500">
                                  • {correction.date}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-4 mb-3">
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">
                                    Original Time
                                  </p>
                                  <p className="text-sm text-gray-800">
                                    {correction.correction.requestType === "CheckIn"
                                      ? formatTime(correction.inTime)
                                      : formatTime(correction.outTime)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">
                                    Requested Time
                                  </p>
                                  <p className="text-sm font-medium text-gray-800">
                                    {formatTime(correction.correction.requestedTime)}
                                  </p>
                                </div>
                              </div>

                              <div className="bg-gray-50 rounded p-3 mt-3 w-fit">
                                <div className="flex items-start gap-2">
                                  <p className="text-sm text-gray-500 whitespace-nowrap">
                                    Reason:
                                  </p>
                                  <p className="text-sm text-gray-700">
                                    {correction.correction.reason}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 ml-6 justify-center">
                              <button
                                onClick={() => handleApproveCorrection(correction)}
                                disabled={loading}
                                className="px-6 py-2.5 text-white rounded-lg hover:opacity-90 transition w-32 disabled:opacity-50"
                                style={{ backgroundColor: "#087990" }}
                              >
                                {loading ? "..." : "Approve"}
                              </button>
                              <button
                                onClick={() => handleRejectCorrection(correction)}
                                disabled={loading}
                                className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition w-32 disabled:opacity-50"
                              >
                                {loading ? "..." : "Reject"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "reports" && (
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-6">
                    Attendance Reports
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition">
                      <div className="p-4" style={{ backgroundColor: "#087990" }}>
                        <div className="flex items-center justify-center gap-2">
                          <FileText size={20} className="text-black" />
                          <h4 className="font-semibold text-black text-base">
                            Daily Report
                          </h4>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-1xl text-black font-semibold text-left">
                          Attendance for today
                        </p>
                      </div>

                      <div className="p-6">
                        <div className="space-y-4 mb-6">
                          <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-800">Present</p>
                            <p className="text-xl font-semibold text-gray-800">
                              {dashboardStats.present}
                            </p>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-800">Late</p>
                            <p className="text-xl font-semibold text-gray-800">
                              {dashboardStats.late}
                            </p>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-800">Absent</p>
                            <p className="text-xl font-semibold text-gray-800">
                              {dashboardStats.absent}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleGenerateReport('daily')}
                          disabled={loading}
                          className="w-full py-2.5 text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
                          style={{ backgroundColor: "#087990" }}
                        >
                          {loading ? "Generating..." : "Generate Report"}
                        </button>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition">
                      <div className="p-4" style={{ backgroundColor: "#087990" }}>
                        <div className="flex items-center justify-center gap-2">
                          <FileText size={20} className="text-black" />
                          <h4 className="font-semibold text-black text-base">
                            Weekly Report
                          </h4>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-1xl text-black font-semibold text-left">
                          Attendance for this week
                        </p>
                      </div>

                      <div className="p-6">
                        <div className="space-y-4 mb-6">
                          <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-800">Working Days</p>
                            <p className="text-xl font-semibold text-gray-800">
                              {weeklyWorkingDays}
                            </p>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-800">Most Late</p>
                            <p className="text-base font-semibold text-gray-800">
                              {weeklySummary.mostLate}
                            </p>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-800">Most Absent</p>
                            <p className="text-base font-semibold text-gray-800">
                              {weeklySummary.mostAbsent}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleGenerateReport('weekly')}
                          disabled={loading}
                          className="w-full py-2.5 text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
                          style={{ backgroundColor: "#087990" }}
                        >
                          {loading ? "Generating..." : "Generate Report"}
                        </button>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition">
                      <div className="p-4" style={{ backgroundColor: "#087990" }}>
                        <div className="flex items-center justify-center gap-2">
                          <FileText size={20} className="text-black" />
                          <h4 className="font-semibold text-black text-base">
                            Monthly Report
                          </h4>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-1xl text-black font-semibold text-left">
                          Attendance for this month
                        </p>
                      </div>

                      <div className="p-6">
                        <div className="space-y-4 mb-6">
                          <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-800">Working Days</p>
                            <p className="text-xl font-semibold text-gray-800">
                              {monthlyWorkingDays}
                            </p>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-800">Most Late</p>
                            <p className="text-base font-semibold text-gray-800">
                              {monthlySummary.mostLate}
                            </p>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-800">Most Absent</p>
                            <p className="text-base font-semibold text-gray-800">
                              {monthlySummary.mostAbsent}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleGenerateReport('monthly')}
                          disabled={loading}
                          className="w-full py-2.5 text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
                          style={{ backgroundColor: "#087990" }}
                        >
                          {loading ? "Generating..." : "Generate Report"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAttendance;
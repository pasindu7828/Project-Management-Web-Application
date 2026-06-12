import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import Sidebar from "../../components/sidebar/Sidebar";
import { 
  Users, 
  ClipboardList, 
  Briefcase, 
  FileText, 
  Building2, 
  Megaphone, 
  CalendarClock,
  Bell,
  UserPlus,
  ListChecks,
  FolderPlus,
  FileBarChart,
  UserCog,
  Settings,
  Building,
} from 'lucide-react';
import axios from "axios";
import DashboardHeader from "../../components/DashboardHeader";

const StatCard = ({ icon: Icon, label, value, action, bgColor, iconColor, link }) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  
  return (
    <div 
      className="bg-white rounded-lg p-4 transition-all duration-300 cursor-pointer border border-gray-100"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovered 
          ? '0 2px 8px rgba(8, 121, 144, 0.3), 0 4px 16px rgba(8, 121, 144, 0.2)' 
          : '0 2px 8px rgba(8, 121, 144, 0.15)',
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className={`${bgColor} p-2 rounded-lg`}>
          <Icon className={iconColor} size={20} />
        </div>
      </div>
      <div className="text-gray-600 text-xs mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-800 mb-1">{value}</div>
      <button
        onClick={() => link ? navigate(link) : null}
        className="text-[#087990] text-xs font-medium hover:underline flex items-center gap-1"
        role="link"
        tabIndex={0}
      >
        {action} →
      </button>
    </div>
  );
};

const ActivityItem = ({ title, description, time }) => (
  <div className="py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 px-2 rounded transition-colors">
    <div className="font-medium text-gray-800 text-sm mb-1">{title}</div>
    <div className="text-xs text-gray-500">{description} • {time}</div>
  </div>
);

const QuickActionButton = ({ icon: Icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className="text-white rounded-lg p-4 flex flex-col items-center justify-center gap-2 transition-all duration-300 hover:shadow-md hover:opacity-90"
    style={{
      background: 'linear-gradient(135deg, #087990 0%, #D9D9D9 100%)'
    }}
  >
    <Icon size={20} />
    <span className="text-xs font-medium">{label}</span>
  </button>
);

const AdminDashboard = () => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, title: '', content: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    departmentCode: "",
    departmentHead: "",
    capacity: "",
    status: "Active",
    location: "",
    email: "",
    number: "",
    description: "",
  });
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [totalEmployees, setTotalEmployees] = useState('...');
  const [presentToday, setPresentToday] = useState('...');
  const [activeTasks, setActiveTasks] = useState('...');
  const [activeProjects, setActiveProjects] = useState('...');
  const [pendingLeaves, setPendingLeaves] = useState('...');
  const [announcementsCount, setAnnouncementsCount] = useState('...');
  const [overdueTasks, setOverdueTasks] = useState('...');
  const [attendanceTrends, setAttendanceTrends] = useState([]);
  const [attendanceTrendsLoading, setAttendanceTrendsLoading] = useState(true);
  const [taskDistribution, setTaskDistribution] = useState({completed: 0, inProgress: 0, pending: 0, overdue: 0});
  const [taskDistributionLoading, setTaskDistributionLoading] = useState(true);
  const [userName, setUserName] = useState(true);
  const [userLoading, setUserLoading] = useState(true);

  // API Base URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const showTooltip = (e, title, content) => {
    // update position on mouse move
    const x = e.clientX;
    const y = e.clientY;
    setTooltip({ visible: true, x, y, title, content });
  };

  const hideTooltip = () => setTooltip({ ...tooltip, visible: false });

  useEffect(() => {
     // Fetch logged-in user data
  const fetchUserData = async () => {
  setUserLoading(true);
  try {
    // get stored user from localStorage
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      console.warn("No user found in localStorage");
      navigate("/login");
      return;
    }

    const user = JSON.parse(storedUser);
    const userId = user.userid;

    // get token from cookie
    const getToken = () =>
      document.cookie
        .split(";")
        .find((c) => c.trim().startsWith("access_token="))
        ?.split("=")[1] || null;

    const token = getToken();

    // fetch user data using the ID
    const response = await axios.get(
      `${API_BASE_URL}/api/v1/employee/getSingleEmployeeByID/${userId}`,
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.success && response.data.user) {
      const userData = response.data.user;
      setUserName(
        `${userData.FirstName ? `${userData.FirstName[0]}.` : ""} ${
          userData.LastName || ""
        }`.trim() || "User"
      );
    } else {
      console.warn("User data fetch failed:", response.data);
    }
  } catch (err) {
    console.error("Fetch user data error:", err);
    if (err.response?.status === 401) {
      navigate("/login");
    }
  } finally {
    setUserLoading(false);
  }
};

    const fetchDepartments = async () => {
      setDepartmentsLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/v1/department/getAllDepartments`, {
          withCredentials: true,
        });
        if (response.data.success) {
          setDepartments(response.data.data);
        }
      } catch (err) {
        console.error("Fetch departments error:", err);
      } finally {
        setDepartmentsLoading(false);
      }
    };

    const fetchDashboardStats = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/v1/attendance/dashboard-stats`, {
          withCredentials: true,
        });
        if (response.data.success) {
          setTotalEmployees(response.data.stats.totalEmployees.toString());
          setPresentToday((response.data.stats.present + response.data.stats.late).toString());
        }
      } catch (err) {
        console.error("Fetch dashboard stats error:", err);
        setTotalEmployees('0');
        setPresentToday('0');
      }
    };

    const fetchActiveProjects = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/v1/projects/getAllProjects`, {
          withCredentials: true,
        });
        const projects = response.data.data || [];
        const active = projects.filter(p => p.status?.toLowerCase() === 'active').length;
        setActiveProjects(active.toString());
      } catch (err) {
        console.error("Fetch projects error:", err);
        setActiveProjects('0');
      }
    };

    const fetchPendingLeaves = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/v1/leave-request/getAllLeaves`, {
          withCredentials: true,
        });
        const leaves = response.data.data || [];
        const pending = leaves.filter((l) => l.sts === "pending").length;
        setPendingLeaves(pending.toString());
      } catch (err) {
        console.error("Fetch leaves error:", err);
        setPendingLeaves('0');
      }
    };

    const fetchAnnouncements = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/v1/announcement/getActiveAnnouncements`, {
          withCredentials: true,
        });
        setAnnouncementsCount((response.data.data || []).length.toString());
      } catch (err) {
        console.error("Fetch announcements error:", err);
        setAnnouncementsCount('0');
      }
    };

    const fetchTasks = async () => {
      setTaskDistributionLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/v1/task/getAllTasks`, {
          withCredentials: true,
        });
        const tasks = response.data.data || [];
        let completed = 0, inProgress = 0, pending = 0, overdue = 0;
        const now = new Date();
        tasks.forEach(t => {
          const status = t.status ? t.status.toLowerCase() : '';
          const isOverdue = new Date(t.dueDate) < now && status !== 'completed';
          if (status === 'completed') {
            completed++;
          } else if (isOverdue) {
            overdue++;
          } else if (status === 'in progress') {
            inProgress++;
          } else {
            pending++;
          }
        });
        setTaskDistribution({completed, inProgress, pending, overdue});
        setActiveTasks((inProgress + pending + overdue).toString());
        setOverdueTasks(overdue.toString());
      } catch (err) {
        console.error("Fetch tasks error:", err);
        setActiveTasks('0');
        setOverdueTasks('0');
      } finally {
        setTaskDistributionLoading(false);
      }
    };

    const fetchAttendanceTrends = async () => {
      setAttendanceTrendsLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/v1/attendance/getAttendent?viewType=week`, {
          withCredentials: true,
        });
        if (response.data.success) {
          const attendance = response.data.attendance || [];
          const now = new Date();
          const currentDay = now.getDay();
          let diff = currentDay - 1;
          if (currentDay === 0) diff = 6;
          const monday = new Date(now);
          monday.setDate(monday.getDate() - diff);
          const days = [];
          for (let i = 0; i < 7; i++) {
            const dayDate = new Date(monday);
            dayDate.setDate(monday.getDate() + i);
            const dayName = dayDate.toLocaleString('en-US', { weekday: 'short' });
            const dayStr = dayDate.toISOString().slice(0, 10);
            days.push({ day: dayName, present: 0, absent: 0, date: dayStr });
          }
          attendance.forEach(rec => {
            const status = rec.status?.toLowerCase() || '';
            const dayIndex = days.findIndex(d => d.date === rec.date);
            if (dayIndex !== -1 && (status === 'present' || status === 'late')) {
              days[dayIndex].present++;
            }
          });
          const total = parseInt(totalEmployees) || 0;
          days.forEach(day => {
            day.absent = total - day.present;
          });
          setAttendanceTrends(days);
        }
      } catch (err) {
        console.error("Fetch attendance trends error:", err);
      } finally {
        setAttendanceTrendsLoading(false);
      }
    };

    fetchUserData();
    fetchDepartments();
    fetchDashboardStats();
    fetchActiveProjects();
    fetchPendingLeaves();
    fetchAnnouncements();
    fetchTasks();
    fetchAttendanceTrends();
  }, []);

  const stats = [
    { icon: Users, label: 'Total Employees', value: totalEmployees, action: 'Manage Employees', link: '/admin/Approve', bgColor: 'bg-blue-100', iconColor: 'text-blue-600' },
    { icon: UserCog, label: 'Present Today', value: presentToday, action: 'View Attendance', link: '/admin/attendance', bgColor: 'bg-green-100', iconColor: 'text-green-600' },
    { icon: ClipboardList, label: 'Active Tasks', value: activeTasks, action: 'Manage Tasks', link: '/admin/assign-task', bgColor: 'bg-orange-100', iconColor: 'text-orange-600' },
    { icon: Briefcase, label: 'Active Projects', value: activeProjects, action: 'View Projects', link: '/admin/projects', bgColor: 'bg-purple-100', iconColor: 'text-purple-600' },
    { icon: FileText, label: 'Pending Leaves', value: pendingLeaves, action: 'Review Requests', link: '/admin/manage-leaves', bgColor: 'bg-red-100', iconColor: 'text-red-600' },
    { icon: Building2, label: 'Departments', value: departmentsLoading ? '...' : departments.length.toString(), action: 'Manage Departments', link: '/admin/departments', bgColor: 'bg-teal-100', iconColor: 'text-teal-600' },
    { icon: Megaphone, label: 'Announcements', value: announcementsCount, action: 'View All', link: '/admin/announcements', bgColor: 'bg-pink-100', iconColor: 'text-pink-600' },
    { icon: CalendarClock, label: 'Overdue Tasks', value: overdueTasks, action: 'View Details', link: '/admin/assign-task', bgColor: 'bg-blue-100', iconColor: 'text-blue-600' },
  ];

  const activities = [
    { title: 'New Employee Added', description: 'Sarah Johnson joined the Development Team', time: '2 hours ago' },
    { title: 'Project Milestone Completed', description: 'Website Redesign Phase 1 completed by Design team', time: '4 hours ago' },
    { title: 'Leave Request Approved', description: "Mike Chen's vacation leave approved for Dec 15-20", time: '5 hours ago' },
    { title: 'Task Assignment', description: '15 new tasks assigned to Marketing team', time: 'Yesterday' },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const validateForm = () => {
    if (!formData.name?.trim()) {
      setError("Department name is required");
      return false;
    }
    if (!formData.departmentCode?.trim()) {
      setError("Department code is required");
      return false;
    }
    if (
      !formData.capacity ||
      formData.capacity < 1 ||
      formData.capacity > 1000
    ) {
      setError("Capacity must be between 1 and 1000");
      return false;
    }
    if (!formData.location?.trim()) {
      setError("Location is required");
      return false;
    }
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      setError("Valid email is required");
      return false;
    }
    const phoneRegex =
      /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    if (!formData.number || !phoneRegex.test(formData.number)) {
      setError("Valid contact number is required");
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError("");
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/department/createDepartment`,
        formData,
        { withCredentials: true }
      );

      if (response.data.success) {
        setSuccess("Department created successfully!");
        setShowCreateModal(false);
        resetForm();
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Create error:", err);
      if (err.response?.status === 401) {
        setError("Unauthorized. Please login again.");
        setTimeout(() => navigate("/login"), 2000);
      } else if (err.response?.status === 403) {
        setError("Access denied. Admin role required.");
      } else {
        setError(err.response?.data?.message || "Failed to create department");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      departmentCode: "",
      departmentHead: "",
      capacity: "",
      status: "Active",
      location: "",
      email: "",
      number: "",
      description: "",
    });
    setError("");
  };

  const handleCancel = () => {
    setShowCreateModal(false);
    resetForm();
  };

  const departmentWiseData = departmentsLoading ? [] : departments.map(dept => ({
    dept: dept.name,
    count: dept.capacity || 0,
    color: `bg-${['blue', 'purple', 'orange', 'teal', 'red', 'pink', 'indigo', 'green'][departments.indexOf(dept) % 8]}-500`
  })).sort((a, b) => b.count - a.count);

  const circumference = 2 * Math.PI * 40;
  const totalTasks = taskDistribution.completed + taskDistribution.inProgress + taskDistribution.pending + taskDistribution.overdue;
  const percentCompleted = totalTasks > 0 ? (taskDistribution.completed / totalTasks) * 100 : 0;
  const percentInProgress = totalTasks > 0 ? (taskDistribution.inProgress / totalTasks) * 100 : 0;
  const percentPending = totalTasks > 0 ? (taskDistribution.pending / totalTasks) * 100 : 0;
  const percentOverdue = totalTasks > 0 ? (taskDistribution.overdue / totalTasks) * 100 : 0;

  const segments = [
    { color: '#22c55e', percent: percentCompleted, label: 'Completed' },
    { color: '#f59e0b', percent: percentInProgress, label: 'In Progress' },
    { color: '#3b82f6', percent: percentPending, label: 'Pending' },
    { color: '#ef4444', percent: percentOverdue, label: 'Overdue' },
  ];

  const maxAttendance = parseInt(totalEmployees) || 200;

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen">
      <Sidebar />
      
      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TOP BAR */}
       <DashboardHeader/>
        

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-auto p-5">
          {/* WELCOME */}
          <div className="mb-5">
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Welcome back, {userName}!</h1>
            <p className="text-sm text-gray-600">Here's what's happening with your organization today</p>
          </div>

          {/* STAT CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            {stats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>

          {/* CHARTS ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
            {/* ATTENDANCE TRENDS */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800">Attendance Trends<br /><span className="text-xs font-normal text-gray-500">(Last 7 Days)</span></h3>
                <button onClick={() => navigate("/admin/attendance")} className="text-[#087990] text-xs font-medium hover:underline">View Report</button>
              </div>
              {attendanceTrendsLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#087990]"></div>
                  <p className="mt-4 text-gray-600">Loading attendance trends...</p>
                </div>
              ) : attendanceTrends.length === 0 ? (
                <div className="text-center py-12 text-gray-600">No attendance data</div>
              ) : (
                <div className="h-40 flex items-end justify-between gap-2">
                  {attendanceTrends.map((data, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex flex-col gap-1">
                        <div
                          className="bg-green-500 rounded-t hover:bg-green-600 transition-colors cursor-pointer"
                          style={{ height: `${(data.present / maxAttendance) * 120}px` }}
                          onMouseEnter={(e) => showTooltip(e, `${data.day} — Present`, `${data.present} employees present`)}
                          onMouseMove={(e) => showTooltip(e, `${data.day} — Present`, `${data.present} employees present`)}
                          onMouseLeave={hideTooltip}
                        ></div>
                        <div
                          className="bg-red-500 rounded-b hover:bg-red-600 transition-colors cursor-pointer"
                          style={{ height: `${(data.absent / maxAttendance) * 120}px` }}
                          onMouseEnter={(e) => showTooltip(e, `${data.day} — Absent`, `${data.absent} employees absent`)}
                          onMouseMove={(e) => showTooltip(e, `${data.day} — Absent`, `${data.absent} employees absent`)}
                          onMouseLeave={hideTooltip}
                        ></div>
                      </div>
                      <span className="text-[10px] text-gray-600 mt-1">{data.day}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-center gap-4 mt-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-[10px] text-gray-600">Present</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-[10px] text-gray-600">Absent</span>
                </div>
              </div>
            </div>

            {/* TASK STATUS DISTRIBUTION */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800">Task Status Distribution</h3>
                <button onClick={() => navigate("/admin/assign-task")} className="text-[#087990] text-xs font-medium hover:underline">View All Tasks</button>
              </div>
              {taskDistributionLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#087990]"></div>
                  <p className="mt-4 text-gray-600">Loading task distribution...</p>
                </div>
              ) : totalTasks === 0 ? (
                <div className="text-center py-12 text-gray-600">No tasks data</div>
              ) : (
                <div className="flex items-center justify-center h-40">
                  <div className="relative w-32 h-32">
                    <svg viewBox="0 0 100 100" className="transform -rotate-90">
                      {segments.map((seg, i) => {
                        const dash = (seg.percent / 100) * circumference;
                        let offset = 0;
                        for (let j = 0; j < i; j++) {
                          offset += (segments[j].percent / 100) * circumference;
                        }
                        return (
                          <circle
                            key={i}
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke={seg.color}
                            strokeWidth="20"
                            strokeDasharray={`${dash} ${circumference}`}
                            strokeDashoffset={-offset}
                            className="hover:opacity-80 transition-opacity cursor-pointer"
                            onMouseEnter={(e) => showTooltip(e, seg.label, `${seg.label}: ${seg.percent.toFixed(1)}%`)}
                            onMouseMove={(e) => showTooltip(e, seg.label, `${seg.label}: ${seg.percent.toFixed(1)}%`)}
                            onMouseLeave={hideTooltip}
                          />
                        );
                      })}
                    </svg>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 mt-3">
                {segments.map((seg, i) => (
                  <div key={i} className="flex items-center gap-2" onMouseEnter={(e)=>showTooltip(e, seg.label, `${seg.label}: ${seg.percent.toFixed(1)}%`)} onMouseMove={(e)=>showTooltip(e, seg.label, `${seg.label}: ${seg.percent.toFixed(1)}%`)} onMouseLeave={hideTooltip}>
                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: seg.color}}></div>
                    <span className="text-[10px] text-gray-600">{seg.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* DEPARTMENT-WISE EMPLOYEES */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800">Department-wise<br />Capacity</h3>
                <button onClick={() => navigate("/admin/departments")} className="text-[#087990] text-xs font-medium hover:underline">Manage Departments</button>
              </div>
              <div className="h-40 flex items-end justify-between gap-2">
                {departmentsLoading ? (
                  <div className="flex items-center justify-center w-full h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#087990]"></div>
                  </div>
                ) : departmentWiseData.map((data, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="text-[10px] font-medium text-gray-700">{data.count}</span>
                    <div className={`w-full ${data.color} rounded-t group-hover:opacity-80 transition-opacity`} style={{ height: `${(data.count / Math.max(...departmentWiseData.map(d => d.count), 1)) * 120}px` }}></div>
                    <span className="text-[10px] text-gray-600 mt-1 transform -rotate-45 origin-top-left whitespace-nowrap">{data.dept}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* BOTTOM SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* RECENT ACTIVITIES */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800">Recent Activities</h3>
                <button className="text-[#087990] text-xs font-medium hover:underline">View All</button>
              </div>
              <div className="space-y-1">
                {activities.map((activity, index) => (
                  <ActivityItem key={index} {...activity} />
                ))}
              </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <QuickActionButton icon={UserPlus} label="Add Employee" />
                <QuickActionButton icon={ListChecks} label="Create Task" />
                <QuickActionButton icon={FolderPlus} label="New Project" />
                <QuickActionButton icon={Megaphone} label="Announcement" />
                <QuickActionButton icon={Building2} label="Add New Department" onClick={() => setShowCreateModal(true)} />
                <QuickActionButton icon={FileText} label="Export Report" />
                <QuickActionButton icon={UserCog} label="Edit Profiles" />
                <QuickActionButton icon={Settings} label="Settings" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Department Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="bg-[#E5E7EB] rounded-2xl shadow-2xl w-full max-w-2xl h-auto max-h-[120vh] overflow-y-auto border-4 relative"
            style={{ boxShadow: "4px 4px rgba(8, 121, 144, 0.2)" }}
          >
            <button
              onClick={handleCancel}
              className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors text-3xl font-bold leading-none"
            >
              ×
            </button>
            <div className="text-center pt-8 pb-6 px-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Create The Department
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Create your new department details...
              </p>
            </div>
            {error && (
              <div className="mx-6 mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mx-6 mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
                {success}
              </div>
            )}
            <div className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Software Engineering"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087990] focus:border-transparent text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department Code *
                  </label>
                  <input
                    type="text"
                    name="departmentCode"
                    value={formData.departmentCode}
                    onChange={handleInputChange}
                    placeholder="SE-001"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087990] focus:border-transparent text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department Head *
                  </label>
                  <input
                    type="text"
                    name="departmentHead"
                    value={formData.departmentHead}
                    onChange={handleInputChange}
                    placeholder="Employee ID"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087990] focus:border-transparent text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacity *
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    placeholder="50"
                    min="1"
                    max="1000"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087990] focus:border-transparent text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087990] focus:border-transparent appearance-none text-sm text-gray-700"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 0.75rem center",
                      backgroundSize: "1.25rem",
                    }}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Building A, Floor 3"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087990] focus:border-transparent text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="dept@worksync.com"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087990] focus:border-transparent text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number *
                  </label>
                  <input
                    type="tel"
                    name="number"
                    value={formData.number}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087990] focus:border-transparent text-sm"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter description (max 500 characters)"
                    rows="4"
                    maxLength="500"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087990] focus:border-transparent resize-none text-sm"
                  ></textarea>
                </div>
              </div>
              <div className="flex items-center justify-center gap-4 mt-6 pb-4">
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="px-6 py-2 text-sm font-semibold text-white bg-[#087990] rounded-lg hover:bg-[#076a7d] transition-colors shadow-md disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Create"}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="px-6 py-2 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
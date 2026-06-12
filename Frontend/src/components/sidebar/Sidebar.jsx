import {
  Building,
  ChartNoAxesCombined,
  GraduationCap,
  HouseIcon,
  LogOut,
  Megaphone,
  MessageCircleQuestionMark,
  Network,
  PanelRight,
  Settings,
  SquareChartGantt,
  User,
  UserCheck,
  UserCircle,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";

const sidebarContent = {
  admin: {
    main: [
      {
        key: "dashboard",
        label: "Dashboard",
        icon: HouseIcon,
        path: "/admin/dashboard",
      },
      {
        key: "assign-task",
        label: "Assign Task",
        icon: GraduationCap,
        path: "/admin/assign-task",
      },
      {
        key: "users",
        label: "Users",
        icon: User,
        path: "/admin/users",
      },
      {
        key: "manage-leaves",
        label: "Manage Leaves",
        icon: SquareChartGantt,
        path: "/admin/manage-leaves",
      },
      {
        key: "reports",
        label: "Reports & Analytics",
        icon: ChartNoAxesCombined,
        path: "/admin/reports",
      },
      {
        key: "announcements",
        label: "Announcements",
        icon: Megaphone,
        path: "/admin/announcements",
      },
      {
        key: "departments",
        label: "Departments",
        icon: Building,
        path: "/admin/departments",
      },
      {
        key: "projects",
        label: "Projects",
        icon: Network,
        path: "/admin/projects",
      },
      {
        key: "attendance",
        label: "Attendance",
        icon: UserCheck,
        path: "/admin/attendance",
      },
    ],
    footer: [
      {
        key: "system-settings",
        label: "System Settings",
        icon: Settings,
        path: "/admin/system-settings",
      },
      {
        key: "support",
        label: "Feedback & Support",
        icon: MessageCircleQuestionMark,
        path: "/admin/support",
      },
    ],
  },
  employee: {
    main: [
      {
        key: "dashboard",
        label: "Dashboard",
        icon: HouseIcon,
        path: "/user/dashboard",
      },
      {
        key: "project-team",
        label: "Project Team",
        icon: User,
        path: "/user/project-team",
      },
      {
        key: "task",
        label: "Task",
        icon: GraduationCap,
        path: "/user/task",
      },
      {
        key: "attendance",
        label: "Attendance",
        icon: UserCheck,
        path: "/user/attendance",
      },
      {
        key: "reports",
        label: "Reports & Analytics",
        icon: ChartNoAxesCombined,
        path: "/user/reports",
      },
      {
        key: "announcements",
        label: "Announcements",
        icon: Megaphone,
        path: "/user/announcements",
      },
      {
        key: "leave-request",
        label: "Leave Request",
        icon: SquareChartGantt,
        path: "/user/leave-request",
      },
      {
        key: "profile",
        label: "Profile",
        icon: UserCircle,
        path: "/user/profile",
      },
    ],
    footer: [
      {
        key: "system-settings",
        label: "System Settings",
        icon: Settings,
        path: "/user/system-settings",
      },
      {
        key: "support",
        label: "Support",
        icon: MessageCircleQuestionMark,
        path: "/user/support",
      },
    ],
  },
  manager: {
    main: [
      {
        key: "dashboard",
        label: "Dashboard",
        icon: HouseIcon,
        path: "/manager/dashboard",
      },
    ],
  },
};

function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const [role, setRole] = useState(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);

        // Role mapping: 3-admin, 2-manager, 1-employee
        const roleMap = {
          3: "admin",
          2: "manager",
          1: "employee",
        };

        setRole(roleMap[user.role] || null);
      }
    } catch (error) {
      console.error("Failed to parse user data:", error);
      setRole(null);
    }
  }, []);

  const menumainItems = sidebarContent[role]?.main || [];
  const menufooterItems = sidebarContent[role]?.footer || [];

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleLogout = async () => {
    try {
      await axios.post(
        "http://localhost:8090/api/v1/employee/Signout",
        {},
        { withCredentials: true }
      );

      localStorage.clear();

      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);

      localStorage.clear();
      navigate("/login");
    }
  };

  return (
    <aside
      className={`flex flex-col min-h-full bg-gray-200 shadow-lg transition-all duration-300 ${
        isCollapsed ? "w-15" : "w-72"
      }`}
    >
      {/* Header */}
      <header className="flex items-center gap-3 px-6 py-4 border-b border-[#087990]">
        {!isCollapsed && (
          <>
            <div className="border-2 border-gray-300 rounded-full p-1">
              <img className="h-8 w-8" src="/Logo.png" alt="WorkSync Logo" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-[#087990]">
                WorkSync
              </span>
            </div>
          </>
        )}
        <div className={`${isCollapsed ? "mx-auto" : "ml-auto"}`}>
          <div className="w-6 h-6 rounded">
            <button
              onClick={toggleSidebar}
              className="hover:bg-gray-300 p-1 rounded transition-colors"
            >
              <PanelRight
                className={`w-5 h-5 text-[#087990] transition-transform duration-300 ${
                  isCollapsed ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 mt-7">
        {menumainItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-4 ${
                  isCollapsed ? "justify-center" : ""
                } px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#087990] text-white shadow-md"
                    : "text-[#087990] hover:bg-gray-300 hover:text-teal-800"
                }`
              }
              title={isCollapsed ? item.label : ""}
            >
              <IconComponent size={20} />
              {!isCollapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Section */}
      <div className="border-t border-gray-300 px-4 py-4 space-y-1 mb-7">
        {menufooterItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-4 ${
                  isCollapsed ? "justify-center" : ""
                } px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#087990] text-white shadow-md"
                    : "text-[#087990] hover:bg-gray-300 hover:text-teal-800"
                }`
              }
              title={isCollapsed ? item.label : ""}
            >
              <IconComponent size={20} />
              {!isCollapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className={`flex items-center gap-4 ${
            isCollapsed ? "justify-center" : ""
          } px-4 py-3 w-full rounded-lg text-sm font-medium text-[#087990] hover:bg-gray-300 hover:text-teal-800 transition-colors`}
          title={isCollapsed ? "Logout" : ""}
        >
          <LogOut size={20} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;

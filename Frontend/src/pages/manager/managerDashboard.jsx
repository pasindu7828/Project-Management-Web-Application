import {
  AlertTriangle,
  Bell,
  ChevronDown,
  Eye,
  FolderOpen,
  ListTodo,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import Sidebar from "../../components/sidebar/Sidebar";
import DashboardHeader from "../../components/DashboardHeader";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const ManagerDashboard = () => {
  const [timeRange, setTimeRange] = useState("Last 7 days");
  const [selectedTeam, setSelectedTeam] = useState("All Teams");
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);

  const timeRanges = [
    "Last 7 days",
    "Last 14 days",
    "Last 30 days",
    "Last 90 days",
  ];
  const teams = ["All Teams", "Development", "Design", "Marketing", "Sales"];

  const teamPerformance = [
    { name: "Sarah Chen", value: 35 },
    { name: "Mike Johnson", value: 88 },
    { name: "Alex Rivera", value: 62 },
    { name: "Emma Wilson", value: 90 },
    { name: "David Brown", value: 73 },
    { name: "Lisa Park", value: 89 },
    { name: "Tom Smith", value: 94 },
  ];

  const tasks = [
    {
      name: "API Integration",
      assignee: "Sarah Chen",
      priority: "High",
      dueDate: "Dec 15",
      status: "In Progress",
    },
    {
      name: "UI Design Review",
      assignee: "Mike Johnson",
      priority: "Medium",
      dueDate: "Dec 12",
      status: "Blocked",
    },
    {
      name: "Database Migration",
      assignee: "Alex Rivera",
      priority: "Low",
      dueDate: "Dec 20",
      status: "Completed",
    },
  ];

  const projects = [
    {
      name: "Mobile App Redesign",
      phase: "Phase 2: User Testing",
      progress: 75,
      dueDate: "Due: Jan 15",
    },
    {
      name: "E-commerce Platform",
      phase: "Phase 1: Backend Development",
      progress: 45,
      dueDate: "Due: Feb 28",
    },
    {
      name: "CRM Integration",
      phase: "Phase 3: Testing & Deployment",
      progress: 90,
      dueDate: "Due: Dec 30",
    },
  ];

  const leaves = [
    {
      name: "Emma Wilson",
      type: "Sick Leave",
      dates: "Dec 9-11",
      avatar: "",
    },
    {
      name: "David Brown",
      type: "Vacation",
      dates: "Dec 20-25",
      avatar: "",
    },
  ];

  const leavesOnLeaveToday = 3;
  const upcomingLeaves = 5;
  const availableNow = 19;
  const margin = {
    top: 20,
    right: 30,
    left: 20,
    bottom: 5,
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-700";
      case "Medium":
        return "bg-yellow-100 text-yellow-700";
      case "Low":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "In Progress":
        return "bg-yellow-100 text-yellow-700";
      case "Blocked":
        return "bg-red-100 text-red-700";
      case "Completed":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const statsData = [
    {
      title: "Total Team Members",
      value: "24",
      icon: Users,
      color: "text-teal-600",
    },
    {
      title: "Active Tasks",
      value: "47",
      icon: ListTodo,
      color: "text-blue-600",
    },
    {
      title: "Overdue Tasks",
      value: "8",
      icon: AlertTriangle,
      color: "text-red-600",
    },
    {
      title: "Ongoing Projects",
      value: "12",
      icon: FolderOpen,
      color: "text-purple-600",
    },
    {
      title: "Team Utilization",
      value: "87%",
      icon: TrendingUp,
      color: "text-green-600",
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <DashboardHeader />

        {/* Main Content */}
        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {statsData.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-lg p-6 shadow-sm border"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                    </div>
                    <IconComponent className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Team Performance Overview */}
          <div className="bg-white rounded-lg p-6 shadow-sm border mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Team Performance Overview
              </h2>
              <div className="flex gap-3">
                {/* Time Range Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowTimeDropdown(!showTimeDropdown)}
                    className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
                  >
                    {timeRange} <ChevronDown className="w-4 h-4" />
                  </button>
                  {showTimeDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-10">
                      {timeRanges.map((range) => (
                        <button
                          key={range}
                          onClick={() => {
                            setTimeRange(range);
                            setShowTimeDropdown(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Team Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowTeamDropdown(!showTeamDropdown)}
                    className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
                  >
                    {selectedTeam} <ChevronDown className="w-4 h-4" />
                  </button>
                  {showTeamDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-10">
                      {teams.map((team) => (
                        <button
                          key={team}
                          onClick={() => {
                            setSelectedTeam(team);
                            setShowTeamDropdown(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                        >
                          {team}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div>
              <BarChart
                width={"100%"}
                height={350}
                data={teamPerformance}
                margin={margin}
              >
                <XAxis dataKey="name" stroke="#0d9488" />
                <YAxis />
                <Tooltip
                  wrapperStyle={{ width: 100, backgroundColor: "#ccc" }}
                />

                <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                <Bar dataKey="value" fill="#0d9488" barSize={80} />
              </BarChart>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Task Assignment & Status */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Task Assignment & Status
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">
                        Task
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">
                        Assignee
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">
                        Priority
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">
                        Due Date
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">
                        Status
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task, index) => (
                      <tr key={index} className="border-b last:border-b-0">
                        <td className="py-3 px-2 text-sm">{task.name}</td>
                        <td className="py-3 px-2 text-sm">{task.assignee}</td>
                        <td className="py-3 px-2">
                          <span
                            className={`text-xs px-2 py-1 rounded ${getPriorityColor(
                              task.priority
                            )}`}
                          >
                            {task.priority}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-sm">{task.dueDate}</td>
                        <td className="py-3 px-2">
                          <span
                            className={`text-xs px-3 py-1 rounded ${getStatusColor(
                              task.status
                            )}`}
                          >
                            {task.status}
                          </span>
                        </td>
                        <td className="flex gap-2 py-3 px-2">
                          <button className="text-white bg-teal-600 hover:bg-teal-700 text-xs px-3 py-1 rounded">
                            reassign
                          </button>
                          <button className="bg-white border border-gray-400 text-gray-600 hover:bg-gray-200 text-xs px-3 py-1 rounded">
                            view
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Project Monitoring */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Project Monitoring
              </h2>
              <div className="space-y-4">
                {projects.map((project, index) => (
                  <div key={index} className="border-b last:border-b-0 pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {project.name}
                        </h3>
                        <p className="text-sm text-gray-600">{project.phase}</p>
                      </div>
                      <span className="text-sm text-gray-500">
                        {project.dueDate}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-teal-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-teal-600">
                        {project.progress}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Leave & Availability */}
          <div className="bg-white rounded-lg p-6 shadow-sm border mt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Leave & Availability
            </h2>
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-teal-600">
                  {leavesOnLeaveToday}
                </p>
                <p className="text-sm text-gray-600">On Leave Today</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-600">
                  {upcomingLeaves}
                </p>
                <p className="text-sm text-gray-600">Upcoming Leaves</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {availableNow}
                </p>
                <p className="text-sm text-gray-600">Available Now</p>
              </div>
            </div>
            <div className="space-y-3">
              {leaves.map((leave, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <img
                    src={
                      leave.avatar ||
                      "https://img.freepik.com/premium-vector/vector-flat-illustration-grayscale-avatar-user-profile-person-icon-gender-neutral-silhouette-profile-picture-suitable-social-media-profiles-icons-screensavers-as-templatex9xa_719432-2205.jpg"
                    }
                    alt={leave.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{leave.name}</p>
                    <p className="text-sm text-gray-600">
                      {leave.type} • {leave.dates}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManagerDashboard;

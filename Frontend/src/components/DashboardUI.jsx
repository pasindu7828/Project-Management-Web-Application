import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import officeImg from "../assets/office.jpg";
import Sidebar from "./sidebar/Sidebar";
import { CheckSquare, Users, FolderKanban } from "lucide-react";
import DashboardHeader from "./DashboardHeader";
import {
  employeeApi,
  getCurrentUserInfo,
  projectApi,
  taskApi,
} from "../services/taskApi";

/*
  Consolidated dashboard UI components:
  - TopBar
  - WelcomeCard
  - ProfileCard (with Progress SVGs)
  - StatCard
  - RecentActivities
  - CompleteProfileCard

  Export: default DashboardUI
*/

const API_URL = `${
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8090"
}${import.meta.env.VITE_API_VERSION || "/api/v1"}`;

const getToken = () => {
  const cookie = document.cookie
    .split(";")
    .find((c) => c.trim().startsWith("access_token="));
  return cookie ? cookie.split("=")[1] : null;
};

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

const StatCard = ({ icon, number, label }) => (
  <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-[12px] bg-card p-6 text-center shadow-md">
    <div className="rounded-full bg-[#F1F5F9] p-3 text-primary">{icon}</div>
    <div className="text-2xl font-semibold text-text-primary">{number}</div>
    <div className="text-sm text-text-secondary">{label}</div>
  </div>
);

const WelcomeCard = ({ userName, upcomingTask }) => (
  <div
    className="relative col-span-2 overflow-hidden rounded-[12px] shadow-md"
    style={{ minHeight: "160px" }}
  >
    <img
      src={officeImg}
      alt="Team workspace"
      className="absolute inset-0 h-full w-full object-cover"
    />
    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/35 to-black/15" />

    <div className="relative flex items-center gap-6 px-6 py-6 text-white">
      <div className="flex-1">
        <h2 className="text-2xl font-semibold drop-shadow">Dashboard</h2>
        <p className="mt-1 text-sm text-white/90">
          Welcome, {userName || "User"}
        </p>
        <p className="mt-4 text-sm text-white/80">
          {upcomingTask
            ? `Next due: ${upcomingTask.title} on ${upcomingTask.date}`
            : "No upcoming tasks"}
        </p>
      </div>
      <div className="hidden h-28 w-36 shrink-0 rounded-lg border border-white/15 bg-white/5 backdrop-blur-sm lg:block" />
    </div>
  </div>
);

const ProfileCard = ({ profile, recentActivities }) => {
  const Progress = ({ color, percent }) => {
    const r = 18;
    const c = 2 * Math.PI * r;
    const offset = c - (percent / 100) * c;
    return (
      <svg width="44" height="44" viewBox="0 0 44 44" className="rounded-full">
        <circle
          cx="22"
          cy="22"
          r={r}
          stroke="#F3F4F6"
          strokeWidth="6"
          fill="none"
        />
        <circle
          cx="22"
          cy="22"
          r={r}
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform="rotate(-90 22 22)"
        />
      </svg>
    );
  };

  return (
    <div className="rounded-[12px] bg-card p-4 shadow-md">
      <div className="flex items-center gap-4">
        <img
          src={
            profile?.avatar ||
            "https://img.freepik.com/premium-vector/vector-flat-illustration-grayscale-avatar-user-profile-person-icon-gender-neutral-silhouette-profile-picture-suitable-social-media-profiles-icons-screensavers-as-templatex9xa_719432-2205.jpg"
          }
          alt={profile?.name || "User"}
          className="h-20 w-20 rounded-full"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold text-text-primary">
                {profile?.name || "User"}
              </div>
              <div className="text-[13px] text-text-secondary">
                {profile?.role || "Employee"}
              </div>
            </div>
            <div className="flex gap-2">
              <Progress color="#8B5CF6" percent={profile?.completion || 0} />
              <Progress color="#FB7185" percent={profile?.completion || 0} />
              <Progress color="#0E8A8A" percent={profile?.completion || 0} />
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm font-semibold text-text-primary">
              Last Activities
            </div>
            <ul className="mt-2 space-y-2 text-sm text-text-secondary">
              {(recentActivities || []).slice(0, 3).map((item) => (
                <li key={item.id} className="flex items-start gap-2">
                  <span className="text-[#3B82F6]">●</span>
                  <span>{item.text}</span>
                </li>
              ))}
              <li className="text-sm mt-2">
                <a className="text-info hover:underline" href="#">
                  See All
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function DashboardUI() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    assignedTasks: 0,
    employees: 0,
    activeProjects: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [profile, setProfile] = useState({
    name: "",
    role: "",
    avatar: "",
    completion: 0,
  });
  const [upcomingTask, setUpcomingTask] = useState(null);

  const roleMap = useMemo(
    () => ({ 1: "Employee", 2: "Manager", 3: "Admin" }),
    []
  );

  const computeProfileCompletion = (userData) => {
    if (!userData) return 0;
    const fields = [
      userData.FirstName || userData.firstName,
      userData.LastName || userData.lastName,
      userData.email,
      userData.ContactNumber,
      userData.departmentID,
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  };

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const currentUser = await getCurrentUserInfo();

        const [tasksRes, employeesRes, projectsRes, profileRes] =
          await Promise.all([
            apiClient.get("/task/getAllUserTasks").catch(() => ({ data: { data: [] } })),
            employeeApi.getEmployeesByRole().catch(() => null),
            projectApi.getAllProjects().catch(() => null),
            apiClient.get("/employee/getSingleEmployee").catch(() => null),
          ]);

        const tasks = Array.isArray(tasksRes?.data?.data) ? tasksRes.data.data : [];

        const employeesList =
          employeesRes?.data?.data || employeesRes?.data || employeesRes || [];
        const projectsList =
          projectsRes?.data?.data || projectsRes?.data || projectsRes || [];
        const userData = profileRes?.data?.user || null;

        const activeProjects = Array.isArray(projectsList)
          ? projectsList.filter(
              (p) => (p.status || "").toLowerCase() === "active"
            ).length
          : 0;

        const sortedTasks = [...tasks].sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt || 0) -
            new Date(a.updatedAt || a.createdAt || 0)
        );

        setRecentActivities(
          sortedTasks.slice(0, 6).map((task) => ({
            id: task._id || task.id,
            text: `${task.title || "Task"} is ${
              (task.status || "pending").toLowerCase()
            }`,
            updatedAt: task.updatedAt || task.createdAt || task.dueDate,
          }))
        );

        const upcoming = tasks
          .filter((t) => t.dueDate && new Date(t.dueDate) > new Date())
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        setUpcomingTask(
          upcoming[0]
            ? {
                title: upcoming[0].title || "Task",
                date: new Date(upcoming[0].dueDate).toLocaleDateString(),
              }
            : null
        );

        const completion = computeProfileCompletion(userData);

        setProfile({
          name:
            `${userData?.FirstName || ""} ${userData?.LastName || ""}`.trim() ||
            currentUser?.name ||
            "User",
          role: roleMap[userData?.role] || roleMap[currentUser?.role] || "Employee",
          avatar: userData?.image || "",
          completion,
        });

        setStats({
          assignedTasks: tasks.length,
          employees: Array.isArray(employeesList) ? employeesList.length : 0,
          activeProjects,
        });
      } catch (err) {
        setError("Failed to load dashboard data");
        console.error("Dashboard load error", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [roleMap]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#087990] mx-auto" />
          <p className="mt-4 text-gray-600">Preparing your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-red-600 font-semibold mb-2">{error}</p>
          <p className="text-gray-600">Please refresh to retry.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col gap-6 p-6 bg-gray-50 overflow-y-auto">
        <DashboardHeader />

        <section className="grid grid-cols-3 gap-6">
          <WelcomeCard userName={profile.name} upcomingTask={upcomingTask} />

          <div className="col-span-1 flex flex-col gap-4">
            <ProfileCard profile={profile} recentActivities={recentActivities} />
          </div>
        </section>

        <section className="grid grid-cols-3 gap-4">
          <StatCard
            icon={<CheckSquare className="w-6 h-6 text-[#087990]" />}
            number={stats.assignedTasks}
            label="Assigned Tasks"
          />
          <StatCard
            icon={<Users className="w-6 h-6 text-[#6366F1]" />}
            number={stats.employees}
            label="Employees"
          />
          <StatCard
            icon={<FolderKanban className="w-6 h-6 text-[#F59E0B]" />}
            number={stats.activeProjects}
            label="Active Projects"
          />
        </section>

        <section>
          <div className="rounded-[12px] bg-card p-4 shadow-md">
            <h3 className="text-lg font-semibold text-text-primary">
              Recent Activities
            </h3>
            <ul className="mt-3 space-y-3 text-text-secondary">
              {recentActivities.map((it) => (
                <li key={it.id} className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-[#0E8A8A]/80" />
                  <div className="text-sm">{it.text}</div>
                </li>
              ))}
              {recentActivities.length === 0 && (
                <li className="text-sm text-gray-500">No recent updates</li>
              )}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}

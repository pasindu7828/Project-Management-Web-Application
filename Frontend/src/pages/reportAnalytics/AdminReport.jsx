import { useEffect, useState } from "react";
import KpiCards from "../../components/reportAnalytics/kpi/KpiCards";
import AttendanceBarChart from "../../components/reportAnalytics/charts/AttendanceBarChart";
import LeaveDonutChart from "../../components/reportAnalytics/charts/LeaveDonutChart";
import TaskDonutChart from "../../components/reportAnalytics/charts/TaskDonutChart";

import AttendanceTable from "../../components/reportAnalytics/tables/AttendanceTable";
import TaskTable from "../../components/reportAnalytics/tables/TaskTable";
import ProjectTable from "../../components/reportAnalytics/tables/ProjectTable";
import DashboardHeader from "../../components/DashboardHeader";
import Sidebar from "../../components/sidebar/Sidebar";
import {
  getAttendance,
  getAttendanceReport,
  getAllLeaves,
  getTaskReport,
  getAllTasks,
  getAllProjects,
  getAllUsers,
  getAllEmployee,
} from "../../services/adminReportsApi";

export default function AdminReport() {
  // KPI State
  const [kpis, setKpis] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    pendingLeaves: 0,
  });

  // Chart Data State
  const [chartData, setChartData] = useState({
    attendance: [],
    leaves: [],
    tasks: [],
  });

  // Tables State
  const [attendanceData, setAttendanceData] = useState([]);
  const [taskData, setTaskData] = useState([]);
  const [projectData, setProjectData] = useState([]);

  // --- Load KPI Data ---
  useEffect(() => {
    const loadKpis = async () => {
      try {
        const [attendanceRes, leaveRes, totEmp] = await Promise.all([
          getAttendance(),
          getAllLeaves(),
          getAllEmployee(),
        ]);
        console.log(leaveRes);
        const attendance = attendanceRes?.data?.attendance || [];

        const leaves = leaveRes.data.data || [];

        const today = new Date().toISOString().split("T")[0];

        const todayAttendance = attendance.filter((a) => a.date === today);

        setKpis((prev) => ({
          ...prev,
          totalEmployees: totEmp.data.Employees.filter(
            (user) => user.role === 1
          ).length,

          presentToday: todayAttendance.filter((a) => a.status === "Present")
            .length,

          absentToday: todayAttendance.filter((a) => a.status === "Absent")
            .length,

          pendingLeaves: leaves.filter((leave) => leave.sts === "pending")
            .length,
        }));
      } catch (error) {
        console.error(" Error loading KPI data:", error);
      }
    };

    loadKpis();
  }, []);

  // --- Load Chart Data ---
  useEffect(() => {
    const loadCharts = async () => {
      try {
        const [attendanceRes, leavesRes, taskReportRes] = await Promise.all([
          getAttendance(),
          getAllLeaves(),
          getAllTasks(),
        ]);

        const attendance = attendanceRes?.data?.attendance || [];

        const leaves = leavesRes.data.data;

        const tasks = Array.isArray(taskReportRes?.data?.data)
          ? taskReportRes.data.data
          : [];

        setChartData({
          attendance,
          leaves,
          tasks,
        });
      } catch (error) {
        console.error("❌ Error loading chart data:", error);
      }
    };

    loadCharts();
  }, []);

  // --- Load Tables Data ---
  useEffect(() => {
    const loadTables = async () => {
      try {
        const [attendanceRes, projectsRes, tasksRes] = await Promise.all([
          getAttendance(),

          getAllProjects(),
          getAllTasks(),
        ]);
        console.log(projectsRes);
        const attendance = attendanceRes?.data?.attendance || [];

        const tasks = Array.isArray(tasksRes?.data?.data)
          ? tasksRes.data.data
          : [];

        const projects = projectsRes?.data?.data || [];

        setAttendanceData(attendance);
        setTaskData(tasks);
        setProjectData(projects);
      } catch (error) {
        console.error("❌ Error loading tables:", error);
      }
    };

    loadTables();
  }, []);

  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-0">
        <DashboardHeader />
        <main className="flex-1 p-6 bg-gray-100 overflow-y-auto min-h-0">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Admin Report & Analytics{" "}
          </h1>
          <div className="flex-1 p-6 overflow-y-auto space-y-8 p-">
            {/* KPI GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCards title="Total Employees" value={kpis.totalEmployees} />
              <KpiCards title="Present Today" value={kpis.presentToday} />
              <KpiCards title="Absent Today" value={kpis.absentToday} />
              <KpiCards title="Pending Leaves" value={kpis.pendingLeaves} />
            </div>

            {/* CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="min-w-0 min-h-0">
                <AttendanceBarChart data={chartData.attendance} />
              </div>

              <div className="min-w-0 min-h-0">
                <LeaveDonutChart data={chartData.leaves} />
              </div>

              <div className="min-w-0 min-h-0">
                <TaskDonutChart data={chartData.tasks} />
              </div>
            </div>

            {/* TABLES */}
            <AttendanceTable data={attendanceData} />
            <TaskTable data={taskData} />
            <ProjectTable data={projectData} />
          </div>
        </main>
      </div>
    </div>
  );
}

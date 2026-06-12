import { useEffect, useState } from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import KpiCards from "../../components/reportAnalytics/kpi/KpiCards";
import AttendanceBarChart from "../../components/reportAnalytics/charts/AttendanceBarChart";
import TaskDonutChart from "../../components/reportAnalytics/charts/TaskDonutChart";
import AttendanceTable from "../../components/reportAnalytics/tables/AttendanceTable";
import TaskTable from "../../components/reportAnalytics/tables/TaskTable";
import LeaveTable from "../../components/reportAnalytics/tables/LeaveTable";
import DashboardHeader from "../../components/DashboardHeader";

// Backend API imports
import {
  getSingleUserAttendance,
  getLeavesByUser,
  getAllUserTasks,
  getTaskReport,
  getAttendance,
} from "../../services/adminReportsApi";

export default function UserReports() {
  const stored = localStorage.getItem("user");
  const data = stored ? JSON.parse(stored) : null;

  const userId = data?.id;

  const [kpis, setKpis] = useState({
    totalAttendance: 0,
    totalTasks: 0,
    totalLeaves: 0,
  });

  const [chartData, setChartData] = useState({
    attendance: [],
    tasks: [],
  });

  const [attendanceData, setAttendanceData] = useState([]);
  const [taskData, setTaskData] = useState([]);
  const [leaveData, setLeaveData] = useState([]);

  // --- Load User Tables & KPI ---
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // --- Attendance ---
        const attendanceRes = await getAttendance(userId);

        const attendance = attendanceRes?.data?.attendance || [];
        console.log(attendance);
        // --- Tasks ---
        // const tasksRes = await getAllUserTasks();
        const tasksRes = await getAllUserTasks(userId);

        const tasks = tasksRes?.data?.data || [];

        // --- Leaves ---
        const leavesRes = await getLeavesByUser(userId);

        const leaves = leavesRes.data.data || [];

        // --- KPI ---
        setKpis({
          totalAttendance: attendance.length,
          totalTasks: tasks.length,
          totalLeaves: leaves.length,
        });

        // --- Tables ---
        setAttendanceData(attendance);
        setTaskData(tasks);
        setLeaveData(leaves);
      } catch (err) {
        console.error("Error loading user data:", err);
      }
    };

    if (userId) loadUserData();
  }, []);

  // --- Load Charts ---
  useEffect(() => {
    const loadUserCharts = async () => {
      try {
        const attendanceRes = await getAttendance(userId);

        const attendance = attendanceRes.data.attendance || [];

        const attendanceChartData = [
          // {
          //   label: "Present",
          //   value: attendance.filter((a) => a.status === "Present").length,
          // },
          // {
          //   label: "Absent",
          //   value: attendance.filter((a) => a.status === "Absent").length,
          // },
        ];

        const taskRes = await getAllUserTasks();

        const taskChartData = taskRes?.data?.data || [];
        //const taskChartData = [
        //{
        //   label: "Completed",
        //   value: tasks.filter((t) => t.status === "Completed").length,
        // },
        // {
        //   label: "Pending",
        //   value: tasks.filter((t) => t.status !== "Completed").length,
        // },
        // ];

        setChartData({
          attendance: attendance,
          tasks: taskChartData,
        });
      } catch (err) {
        console.error("Error loading user charts:", err);
      }
    };

    loadUserCharts();
  }, []);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0">
        <DashboardHeader />
        <main className="flex-1 p-6 bg-gray-100 overflow-y-auto min-h-0">
          <h1 className="text-2xl font-bold mb-6 text-[#087990]">
            User Report & analytics
          </h1>

          {/* KPI GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <KpiCards title="Total Attendance" value={kpis.totalAttendance} />
            <KpiCards title="Total Tasks" value={kpis.totalTasks} />
            <KpiCards title="Total Leaves" value={kpis.totalLeaves} />
          </div>

          {/* CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <AttendanceBarChart data={chartData.attendance} />

            <TaskDonutChart data={chartData.tasks} />
          </div>

          {/* TABLES */}
          <AttendanceTable data={attendanceData} />
          <TaskTable data={taskData} />
          <LeaveTable data={leaveData} />
        </main>
      </div>
    </div>
  );
}

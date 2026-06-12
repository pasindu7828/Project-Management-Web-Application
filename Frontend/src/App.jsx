// src/App.js

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Admin imports

import AdminAttendance from "./pages/admin/AdminAttendance";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AssignTask from "./pages/admin/AssignTask";
import Users from "./pages/admin/Users";
import ManageLeaves from "./pages/admin/ManageLeaves";
import AdminReports from "./pages/admin/AdminReports";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";

import ProjectsDashboard from "./pages/admin/ProjectsDashboard";
import Departments from "./pages/admin/Department/Departments";
import Projects from "./pages/admin/Projects";
import AdminReport from "./pages/reportAnalytics/AdminReport";
import EmployeeList from "./pages/admin/EmployeeList";

// Employee imports
import UserAttendance from "./pages/employee/UserAttendance";
import UserDashboard from "./pages/employee/UserDashboard";
import ProjectTeam from "./pages/employee/ProjectTeam";
import Task from "./pages/employee/Task";
import UserReports from "./pages/employee/UserReports";
import LeaveRequest from "./pages/employee/LeaveRequest";
import UserAnnouncements from "./pages/employee/UserAnnouncements";
import CreateTaskForm from "./pages/TeamLeader/CreateTaskForm";
import TaskHistory from "./pages/TeamLeader/TaskHistory";
import Login from "./pages/Login";
import TaskDetail from "./pages/employee/TaskDetail";

import { Navigate } from "react-router-dom";
//import AdminReport from "./pages/reportAnalytics/AdminReport";

//import EmployeeList from './pages/admin/EmployeeList';
import EditEmployee from "./pages/admin/EditEmployee";
import ProtectedRoute from "./auth/ProtectedRoute";
import ApproveUser from "./pages/admin/ApproveUser";
import Sidebar from "./components/sidebar/Sidebar";
import DashboardUI from "./components/DashboardUI";
import ProjectDetails from "./pages/employee/ProjectDetails";
import DepartmentDetails from "./pages/admin/Department/ViewDepartment";
import SystemSettings from "./pages/systemSetting/SystemSettings";
import CompanyInfoSettings from "./pages/systemSetting/CompanyInfoSettings";
import ProfileSettings from "./pages/systemSetting/ProfileSettings";
import RolesAttendanceSettings from "./pages/systemSetting/RolesAttendanceSettings";
import WorkingHoursSettings from "./pages/systemSetting/WorkingHoursSettings";

import ProjectDetailsAdmin from "./pages/admin/ProjectDetaisAdmin";
import ManagerDashboard from "./pages/manager/managerDashboard";
import SignUp from "./pages/Signup";
import UserProfile from "./pages/employee/UserProfile";
import UserProfileEdit from "./pages/employee/UserProfileEdit";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import AnnouncementsManagement from './pages/AnnouncementsManagement';
import AnnouncementDetail from './pages/admin/AnnouncementDetail';

function App() {
  return (
    <Router>
      <Routes>
        {/* Default route - redirect to login */}
        {/* <Route path="/" element={<Navigate to="/login" replace />} /> */}

        {/* Authentication routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        <Route path="*" element={<Navigate to="/login" replace />} />

        {/* System Settings (Tabs)*/}
        <Route path="/admin/system-settings" element={
          <ProtectedRoute allowedRoles={[3]}>
            <SystemSettings />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="profile" replace />} />
          <Route path="company-info" element={<CompanyInfoSettings />} />
          <Route path="profile" element={<ProfileSettings />} />
          <Route
            path="roles-attendance"
            element={<RolesAttendanceSettings />}
          />
          <Route path="working-hours" element={<WorkingHoursSettings />} />
        </Route>

        {/* Admin Routes - Only accessible by role 3 */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <EmployeeList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/edit-employee/:id"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <EditEmployee />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/assign-task"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <AssignTask />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/manage-leaves"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <ManageLeaves />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <AdminReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/announcements"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <AdminAnnouncements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/departments"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <Departments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/projects"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <ProjectsDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/projects/:id"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <ProjectDetailsAdmin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/attendance"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <AdminAttendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/Approve"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <ApproveUser />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/D-details/:id"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <DepartmentDetails />
            </ProtectedRoute>
          }
        />

        {/* Employee Routes - Only accessible by role 1 */}
        <Route
          path="/user/dashboard"
          element={
            <ProtectedRoute allowedRoles={[1]}>
              <DashboardUI />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/project-team"
          element={
            <ProtectedRoute allowedRoles={[1]}>
              <ProjectTeam />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/task"
          element={
            <ProtectedRoute allowedRoles={[1]}>
              <Task />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/attendance"
          element={
            <ProtectedRoute allowedRoles={[1]}>
              <UserAttendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/reports"
          element={
            <ProtectedRoute allowedRoles={[1]}>
              <UserReports />
            </ProtectedRoute>
          }
        />
        {/* <Route
          path="/user/announcements"
          element={
            <ProtectedRoute allowedRoles={[1]}>
              <UserAnnouncements />
            </ProtectedRoute>
          }
        /> */}
        <Route
          path="/user/leave-request"
          element={
            <ProtectedRoute allowedRoles={[1]}>
              <LeaveRequest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/user-dashboard"
          element={
            <ProtectedRoute allowedRoles={[1]}>
              <DashboardUI />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/project-team/:id"
          element={
            <ProtectedRoute allowedRoles={[1]}>
              <ProjectDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/profile"
          element={
            <ProtectedRoute allowedRoles={[1]}>
              <UserProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/profile/edit"
          element={
            <ProtectedRoute allowedRoles={[1]}>
              <UserProfileEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/task-details/:id"
          element={
            <ProtectedRoute allowedRoles={[1,3]}>
              <TaskDetail />
            </ProtectedRoute>
          }
        />

        {/* Team Leader - Employee Routes */}
        <Route
          path="/create-task"
          element={
            <ProtectedRoute allowedRoles={[1]}>
              <CreateTaskForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-task/:taskId"
          element={
            <ProtectedRoute allowedRoles={[1]}>
              <CreateTaskForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/task-history"
          element={
            <ProtectedRoute allowedRoles={[1,3]}>
              <TaskHistory />
            </ProtectedRoute>
          }
        />

        {/* Manager Routes - Only accessible by role 2 */}
        <Route
          path="/manager/dashboard"
          element={
            <ProtectedRoute allowedRoles={[2]}>
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />

        {/* New Route for AnnouncementsPage */}
        <Route
          path="/announcements"
          element={
            <ProtectedRoute allowedRoles={[1, 2, 3]}>
              <AnnouncementsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/user/announcements" element={<AnnouncementsManagement />} />
         <Route path="/announcement-detail/:id" element={<AnnouncementDetail />} />
      </Routes>
    </Router>
  );
}

export default App;

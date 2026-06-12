import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/sidebar/Sidebar";
import { Search, Bell } from "lucide-react";
import axios from "axios";

const EMPLOYEE_API = import.meta.env.VITE_API_BASE_URL;
const DEPARTMENT_API_BASE = import.meta.env.VITE_API_BASE_URL; // /:id

const UserProfile = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchDepartmentName = async (deptId) => {
      if (!deptId || deptId === "N/A") return null;

      try {
        const depRes = await axios.get(`${DEPARTMENT_API_BASE}/api/v1/department/getDepartment/${deptId}`, {
          withCredentials: true,
          signal: controller.signal,
        });

        // Supports multiple possible backend response shapes safely
        const depObj =
          depRes.data?.department ||
          depRes.data?.data ||
          depRes.data?.result ||
          depRes.data?.Department ||
          null;

        const depName =
          depObj?.name ||
          depObj?.DepartmentName ||
          depObj?.departmentName ||
          depRes.data?.name ||
          depRes.data?.DepartmentName ||
          null;

        return depName || null;
      } catch {
        // If department fetch fails, keep UI working and show N/A
        return null;
      }
    };

    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(`${EMPLOYEE_API}/api/v1/employee/getSingleEmployee`, {
          withCredentials: true,
          signal: controller.signal,
        });

        if (response.data?.success && response.data?.user) {
          const user = response.data.user;
          const roleMap = { 1: "Employee", 2: "Manager", 3: "Admin" };

          // departmentID can be either populated object or plain string id
          const deptId = user.departmentID?._id || user.departmentID || "N/A";

          // If populated, name is already available here
          let deptName =
            user.departmentID?.name ||
            user.departmentID?.DepartmentName ||
            user.departmentID?.departmentName ||
            null;

          // If not populated, fetch department name from department API
          if (!deptName && deptId && deptId !== "N/A") {
            deptName = await fetchDepartmentName(deptId);
          }

          const builtProfile = {
            userId: user.EmployeeID || user._id,
            name: `${user.FirstName || ""} ${user.LastName || ""}`.trim(),
            NIC: user.NIC || "N/A",
            role: roleMap[user.role] || "Employee",
            departmentId: deptId,
            departmentName: deptName || "N/A",
            email: user.email || "",
            password: "********",
            status: user.status || "Active",
            avatar:
              "https://icon-library.com/images/male-avatar-icon/male-avatar-icon-8.jpg",
          };

          if (isMounted) setProfile(builtProfile);
        } else {
          if (isMounted) setError("Failed to load profile");
        }
      } catch (err) {
        if (!isMounted) return;
        if (err?.name === "CanceledError") return;

        console.error("Error fetching user profile:", err);
        setError(err?.response?.data?.message || "Failed to fetch profile");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUserProfile();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const handleDeleteClick = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      try {
        if (!profile?.userId) {
          alert("Cannot delete account. User ID not found.");
          return;
        }

        const response = await axios.delete(
          `${EMPLOYEE_API}/api/v1/employee/RemoveEmployee/${profile.userId}`,
          { withCredentials: true }
        );

        if (response.data?.success) {
          alert("Account deleted successfully");
          localStorage.clear();
          navigate("/login");
        } else {
          alert(response.data?.message || "Failed to delete account");
        }
      } catch (error) {
        console.error("Error deleting account:", error);
        alert(
          error?.response?.data?.message ||
            "Failed to delete account. Please try again."
        );
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Search Bar */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087990]"
                />
              </div>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-6 h-6 text-[#087990]" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800">
                    {profile?.name || "User"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {profile?.role || "Employee"}
                  </p>
                </div>
                <img
                  src={
                    profile?.avatar ||
                    "https://icon-library.com/images/male-avatar-icon/male-avatar-icon-8.jpg"
                  }
                  alt="User Avatar"
                  className="w-10 h-10 rounded-full border-2 border-[#087990] object-cover"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Profile Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Profile</h1>

            {loading && (
              <div className="flex justify-center items-center h-64">
                <p className="text-gray-600">Loading profile...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {!loading && !error && profile && (
              <div className="flex gap-8">
                {/* Left Profile Card */}
                <div className="w-80 h-[600px] rounded-3xl bg-gradient-to-br from-[#0a7d91] to-[#0b9fb8] text-white flex flex-col items-center justify-center shadow-2xl relative overflow-hidden">
                  {/* Decorative circles */}
                  <div className="absolute top-10 right-10 w-32 h-32 bg-white opacity-10 rounded-full"></div>
                  <div className="absolute bottom-20 left-5 w-20 h-20 bg-white opacity-10 rounded-full"></div>

                  <div className="relative z-10 flex flex-col items-center">
                    <div className="relative">
                      <img
                        src={profile.avatar}
                        alt="Profile"
                        className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-lg"
                      />
                      <div className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
                        <span className="text-2xl">📷</span>
                      </div>
                    </div>

                    <h2 className="mt-6 text-2xl font-bold">{profile.name}</h2>
                    <p className="text-base opacity-90 mt-1">{profile.role}</p>
                  </div>
                </div>

                {/* Right Details Card */}
                <div className="flex-1 rounded-3xl bg-white p-8 shadow-lg">
                  <div className="space-y-5">
                    {/* User ID */}
                    <div className="flex flex-col">
                      <label className="text-sm text-gray-500 mb-2 font-medium">
                        User ID
                      </label>
                      <input
                        type="text"
                        value={profile.userId}
                        disabled
                        className="rounded-xl border border-gray-300 bg-gray-50 px-5 py-3 text-gray-700 font-medium text-lg focus:outline-none cursor-not-allowed"
                      />
                    </div>

                    {/* Department Name */}
                    <div className="flex flex-col">
                      <label className="text-sm text-gray-500 mb-2 font-medium">
                        Department Name
                      </label>
                      <input
                        type="text"
                        value={profile.departmentName}
                        disabled
                        className="rounded-xl border border-gray-300 bg-gray-50 px-5 py-3 text-gray-700 font-medium text-lg focus:outline-none cursor-not-allowed"
                      />
                    </div>

                        {/* NIC */}
                    <div className="flex flex-col">
                      <label className="text-sm text-gray-500 mb-2 font-medium">
                        NIC
                      </label>
                      <input
                        type="text"
                        value={profile.NIC}
                        disabled
                        className="rounded-xl border border-gray-300 bg-gray-50 px-5 py-3 text-gray-700 font-medium text-lg focus:outline-none cursor-not-allowed"
                      />
                    </div>

                    {/* Email */}
                    <div className="flex flex-col">
                      <label className="text-sm text-gray-500 mb-2 font-medium">
                        Email
                      </label>
                      <input
                        type="email"
                        value={profile.email}
                        disabled
                        className="rounded-xl border border-gray-300 bg-gray-50 px-5 py-3 text-gray-700 font-medium text-lg focus:outline-none cursor-not-allowed"
                      />
                    </div>

                    {/* Status */}
                    <div className="flex flex-col">
                      <label className="text-sm text-gray-500 mb-2 font-medium">
                        Status
                      </label>
                      <input
                        type="text"
                        value={profile.status}
                        disabled
                        className="rounded-xl border border-gray-300 bg-gray-50 px-5 py-3 text-gray-700 font-medium text-lg focus:outline-none cursor-not-allowed"
                      />
                    </div>

                    {/* Delete button (optional) */}
                    {/* 
                    <button
                      onClick={handleDeleteClick}
                      className="mt-4 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700"
                    >
                      Delete Account
                    </button> 
                    */}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserProfile;

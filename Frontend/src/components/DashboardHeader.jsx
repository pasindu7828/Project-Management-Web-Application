import { useEffect, useState } from "react";
import { Search, Bell } from "lucide-react";

const DashboardHeader = () => {
  const [role, setRole] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const API_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const userId = user.id;

        const getToken = () =>
          document.cookie
            .split(";")
            .find((c) => c.trim().startsWith("access_token="))
            ?.split("=")[1] || null;

        const token = getToken();

        const fun = async () => {
          const response = await fetch(
            `${API_URL}/api/v1/employee/getSingleEmployeeByID/${userId}`,
            {
              credentials: "include",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          const result = await response.json();
          console.log("Single user data:", result.user);
          setUserProfile(result.user);
        };

        fun();

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

  return (
    <header className="bg-white shadow-sm border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search"
            className="pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087990] w-80"
          />
        </div>

        <div className="flex items-center gap-6">
          <div className="relative cursor-pointer">
            <Bell className="w-5 h-5 text-[#087990]" />
            <div className="absolute -top-0.5 right-0 w-2.5 h-2.5 rounded-full bg-[#087990]" />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-gray-700">
              {userProfile?.FirstName || ""} {userProfile?.LastName || ""}
            </span>
            <span className="text-xs text-gray-500">{role || ""}</span>
          </div>
          <div className="w-9 h-9  rounded-full">
            <img
              src={
                userProfile?.image ||
                "https://img.freepik.com/premium-vector/vector-flat-illustration-grayscale-avatar-user-profile-person-icon-gender-neutral-silhouette-profile-picture-suitable-social-media-profiles-icons-screensavers-as-templatex9xa_719432-2205.jpg"
              }
              alt={`${userProfile?.FirstName?.charAt(0) || ""}`}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;

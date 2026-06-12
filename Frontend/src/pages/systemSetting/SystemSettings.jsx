import { NavLink, Outlet } from "react-router-dom";
import Sidebar from "../../components/sidebar/Sidebar";
import DashboardHeader from "../../components/DashboardHeader";
const SystemSettings = () => {
  return (
    <>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0">
          <DashboardHeader />
          <main className="flex-1 p-4 bg-gray-100 overflow-y-auto min-h-0">
            <div className="flex flex-col h-full p-6">
              <h1 className="text-2xl font-semibold mb-6">System Settings</h1>

              {/* Tabs */}
              <div className="flex justify-center gap-10 mb-10">
                <NavLink
                  to="profile"
                  className={({ isActive }) =>
                    `px-6 py-2 rounded-md font-medium border transition-all duration-200 ${
                      isActive
                        ? "bg-[#087990] text-white border-[#087990]"
                        : "bg-white text-[#087990] border-[#087990] hover:bg-[#087990]/10"
                    }`
                  }
                >
                  Profile
                </NavLink>

                <NavLink
                  to="company-info"
                  className={({ isActive }) =>
                    `px-6 py-2 rounded-md font-medium border transition-all duration-200 ${
                      isActive
                        ? "bg-[#087990] text-white border-[#087990]"
                        : "bg-white text-[#087990] border-[#087990] hover:bg-[#087990]/10"
                    }`
                  }
                >
                  Company Info
                </NavLink>

                <NavLink
                  to="roles-attendance"
                  className={({ isActive }) =>
                    `px-6 py-2 rounded-md font-medium border transition-all duration-200 ${
                      isActive
                        ? "bg-[#087990] text-white border-[#087990]"
                        : "bg-white text-[#087990] border-[#087990] hover:bg-[#087990]/10"
                    }`
                  }
                >
                  Roles & Attendance
                </NavLink>

                <NavLink
                  to="working-hours"
                  className={({ isActive }) =>
                    `px-6 py-2 rounded-md font-medium border transition-all duration-200 ${
                      isActive
                        ? "bg-[#087990] text-white border-[#087990]"
                        : "bg-white text-[#087990] border-[#087990] hover:bg-[#087990]/10"
                    }`
                  }
                >
                  Working Hours
                </NavLink>
              </div>

              {/* Active tab renders here */}
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default SystemSettings;

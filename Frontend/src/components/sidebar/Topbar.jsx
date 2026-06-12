import { useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TopBar = ({ userName = "K. Perera", role = "Admin" }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      {/* SEARCH */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#087990]"
          />
          <svg
            className="w-4 h-4 text-gray-400 absolute left-3 top-2.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* RIGHT ACTIONS */}
      <div className="flex items-center gap-3">
        {/* NOTIFICATIONS */}
        <div className="relative">
          <button
            className="p-2 hover:bg-gray-100 rounded-lg relative"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={18} className="text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800">Notifications</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <div className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-800">
                    New leave request
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    John Doe requested leave for tomorrow
                  </p>
                </div>
                <div className="p-4 hover:bg-gray-50 cursor-pointer">
                  <p className="text-sm font-medium text-gray-800">
                    Task overdue
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    3 tasks are past their deadline
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PROFILE */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 hover:bg-gray-100 px-2 py-1 rounded-lg"
          >
            <div className="text-right">
              <div className="text-xs font-medium text-gray-800">
                {userName}
              </div>
              <div className="text-[10px] text-gray-500">{role}</div>
            </div>
            <img
              src="https://i.pravatar.cc/40"
              alt="profile"
              className="w-8 h-8 rounded-full"
            />
          </button>

          {showProfileMenu && (
            <div className="fixed right-6 top-16 w-40 bg-white shadow-lg rounded-md border border-gray-200 z-50 text-sm">
              <button
                onClick={() => {
                  navigate("/profile");
                  setShowProfileMenu(false);
                }}
                className="block w-full px-4 py-2 hover:bg-gray-100 text-left"
              >
                Profile
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  navigate("/login");
                }}
                className="block w-full px-4 py-2 hover:bg-gray-100 text-left"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopBar;

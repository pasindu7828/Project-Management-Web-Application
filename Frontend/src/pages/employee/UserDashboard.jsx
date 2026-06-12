import React from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import DashboardHeader from "../../components/DashboardHeader";

const UserDashboard = () => {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6 bg-gray-100 overflow-y-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            User Dashboard
          </h1>
          <div className="bg-white rounded-lg shadow p-6">
            <p>Welcome to the user dashboard!</p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;

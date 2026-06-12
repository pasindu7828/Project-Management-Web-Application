import React, { useEffect } from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import { useNavigate } from "react-router-dom";

const AssignTask = () => {
  const navigate = useNavigate();

  // Automatically redirect to task-history
  useEffect(() => {
    navigate("/task-history");
  }, [navigate]);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-6 bg-gray-100 ml-64">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Assign Task</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Redirecting to Task History...</p>
          <div className="mt-4 flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading task history...</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AssignTask;
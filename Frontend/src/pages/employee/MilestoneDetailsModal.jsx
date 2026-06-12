import axios from "axios";
import { useState } from "react";
import Toast from "../../components/Toast";

const statusColors = {
  "In Progress": "text-blue-600",
  "Complete": "text-green-600",
  "Pending": "text-yellow-600"
}

const MilestoneDetailsModal = ({ milestone, onClose, onUpdate }) => {
  const [status, setStatus] = useState(milestone.status);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const URL_API = import.meta.env.VITE_API_BASE_URL;

  const handleStatusChange = async (e)=>{
    const newStatus = e.target.value;
    setStatus(newStatus);
    setLoading(true);

    try {
      const res = await axios.patch(
        `${URL_API}/api/v1/millestone/updateMilestoneStatus/${milestone.id}`,
        {Status: newStatus},
        {withCredentials: true}
      );
      if (onUpdate) onUpdate(res.data.data);

    } catch (error) {
      console.error("Failed to update status", error);
      setToast({ message: "Failed to update milestone status", type: "error" });
      setStatus(milestone.status);
    } finally {
      setLoading(false);
    }
  };

    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-md shadow-xl w-full max-w-3xl">
          <div className="border-b px-6 py-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-center flex-1">
              Milestone Details
            </h2>
            <button
              onClick={onClose}
              className="text-2xl leading-none px-1 text-gray-600 hover:text-black"
            >
              &times;
            </button>
          </div>
          {toast && (
                <Toast
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(null)}
                />
            )}
  
          <div className="px-8 py-6 text-sm text-gray-800 space-y-4">
            <div>
              <p className="font-semibold mb-1">{milestone.title}</p>
            </div>
  
            <div className="space-y-1">
              <p>
                <span className="font-medium">Status:</span>{" "}
                <select
                  value={status}
                  onChange={handleStatusChange}
                  disabled={loading}
                  className={`border rounded px-2 py-1 ml-2 ${statusColors[status]}`}
                  >
                    <option>Pending</option>
                    <option>In Progress</option>
                    <option>Complete</option>
                  </select>
              </p>
              <p>
                <span className="font-medium">Start Date:</span>{" "}
                {new Date(milestone.startDate).toLocaleDateString()}
              </p>
              <p>
                <span className="font-medium">End Date:</span>{" "}
                {new Date(milestone.endDate).toLocaleDateString()}
              </p>
            </div>
  
            <div>
              <p className="font-medium mb-1">Description</p>
              <p>{milestone.description}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default MilestoneDetailsModal;
  
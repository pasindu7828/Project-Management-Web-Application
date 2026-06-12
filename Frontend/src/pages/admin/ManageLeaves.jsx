import { useEffect, useState } from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import api from "../../api/axios";
import { AiOutlineCheckCircle, AiOutlineCloseCircle } from "react-icons/ai";
import { X } from "lucide-react";
import DashboardHeader from "../../components/DashboardHeader";

// -------------------- Custom Alert --------------------
const CustomAlert = ({ message, type, onClose }) => {
  const colors = {
    success: {
      border: "border-[#087990]",
      bg: "bg-[#E6F4F6]",
      icon: <AiOutlineCheckCircle className="w-12 h-12 text-[#087990]" />,
      text: "text-[#087990]",
    },
    error: {
      border: "border-red-500",
      bg: "bg-red-50",
      icon: <AiOutlineCloseCircle className="w-12 h-12 text-red-500" />,
      text: "text-red-800",
    },
  };

  const color = colors[type] || colors.error;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div
        className={`relative p-6 rounded-2xl w-full max-w-md text-center shadow-2xl border-l-4 ${color.border} ${color.bg}`}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        <div className="mb-4 flex justify-center">{color.icon}</div>
        <p className={`mb-6 text-lg font-medium ${color.text}`}>{message}</p>

        <button
          onClick={onClose}
          className="bg-[#087990] hover:bg-[#06657a] text-white px-6 py-2 rounded-xl"
        >
          OK
        </button>
      </div>
    </div>
  );
};

// -------------------- Manage Leaves --------------------
const ManageLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [actionType, setActionType] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  const API_URL = import.meta.env.VITE_API_BASE_URL;

  const [alert, setAlert] = useState({
    open: false,
    message: "",
    type: "success",
  });

  const fetchLeaves = async () => {
    try {
      const res = await api.get(`${API_URL}/api/v1/leave-request/getAllLeaves`, { withCredentials: true });
      setLeaves(res.data.data);
    } catch (err) {
      setAlert({
        open: true,
        message: "Failed to fetch leaves",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
    const interval = setInterval(fetchLeaves, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = async () => {
    if (!selectedLeave) return;

    try {
      await api.patch(`${API_URL}/api/v1/leave-request/updateLeaveStatus/${selectedLeave._id}`, {
        sts: actionType,
        message: emailMessage,
      });

      setShowModal(false);
      setSelectedLeave(null);
      setEmailMessage("");
      fetchLeaves();

      setAlert({
        open: true,
        message: `Leave ${actionType} successfully and email sent`,
        type: "success",
      });
    } catch (err) {
      setAlert({
        open: true,
        message: "Action failed",
        type: "error",
      });
    }
  };

  const total = leaves.length;
  const pending = leaves.filter((l) => l.sts === "pending").length;
  const approved = leaves.filter((l) => l.sts === "approved").length;
  const rejected = leaves.filter((l) => l.sts === "rejected").length;

  return (
    <div className="flex h-screen">
      <Sidebar />
      

      <div className="flex-1 bg-gray-50 overflow-auto space-y-6">
        <DashboardHeader />   
        <div className="flex-1 p-6 space-y-6">
          
        <h1 className="text-2xl font-semibold text-gray-800">
          Leave Management
        </h1>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card title="Total Requests" value={total} />
          <Card title="Pending" value={pending} />
          <Card title="Approved" value={approved} />
          <Card title="Rejected" value={rejected} />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow p-4 overflow-auto">
          {loading ? (
            <p className="text-center py-10">Loading...</p>
          ) : (
            <table className="w-full min-w-[1000px] text-sm border border-gray-300">
              <thead className="bg-[#087990] text-white">
                <tr>
                  <th className="border px-2 py-3">User ID</th>
                  <th className="border px-2 py-3">User Name</th>
                  <th className="border">Leave Type</th>
                  <th className="border">Start Date</th>
                  <th className="border">End Date</th>
                  <th className="border">Reason</th>
                  <th className="border">Status</th>
                  <th className="border">Action</th>
                </tr>
              </thead>

              <tbody className="bg-gray-100">
                {leaves.map((l) => (
                  <tr key={l._id} className="text-center hover:bg-gray-200">
                    <td className="border px-2 py-2 text-xs text-gray-600">
                      {l.requestedBy?._id?.slice(-6) || "N/A"}
                    </td>
                    <td className="border px-2 py-2">
                        {l.requestedBy
                        ? `${l.requestedBy.FirstName || ""} ${l.requestedBy.LastName || ""}`.trim() || l.requestedBy.email
                        : "No User"}
                    </td>
                    <td className="border">{l.leaveType}</td>
                    <td className="border">{l.startDate?.slice(0, 10)}</td>
                    <td className="border">{l.endDate?.slice(0, 10)}</td>
                    <td className="border px-2">{l.reason || "-"}</td>
                    <td className="border">
                      <StatusBadge status={l.sts} />
                    </td>
                    <td className="border">
                      {l.sts === "pending" ? (
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => {
                              setSelectedLeave(l);
                              setActionType("approved");
                              setShowModal(true);
                            }}
                            className="w-9 h-9 rounded-full bg-green-100 text-green-600 hover:bg-green-500 hover:text-white"
                          >
                            ✓
                          </button>

                          <button
                            onClick={() => {
                              setSelectedLeave(l);
                              setActionType("rejected");
                              setShowModal(true);
                            }}
                            className="w-9 h-9 rounded-full bg-red-100 text-red-600 hover:bg-red-500 hover:text-white"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        </div>
      </div>

      {/* MODAL */}
      {showModal && selectedLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-2">
              {actionType === "approved"
                ? "Approve Leave Request"
                : "Reject Leave Request"}
            </h2>

            <div className="bg-gray-50 border rounded-lg p-3 mb-4 text-sm space-y-1">
              <p>
                <b>Employee:</b> {selectedLeave.requestedBy?.fullName}
              </p>
              <p>
                <b>Email:</b> {selectedLeave.requestedBy?.email}
              </p>
              <p>
                <b>Leave Type:</b> {selectedLeave.leaveType}
              </p>
            </div>

            <textarea
              rows="4"
              value={emailMessage}
              onChange={(e) => setEmailMessage(e.target.value)}
              placeholder="Type email message..."
              className="w-full border rounded-lg p-3 text-sm"
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                className={`px-4 py-2 rounded text-white ${
                  actionType === "approved"
                    ? "bg-green-600"
                    : "bg-red-600"
                }`}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ALERT */}
      {alert.open && (
        <CustomAlert
          message={alert.message}
          type={alert.type}
          onClose={() =>
            setAlert({ open: false, message: "", type: "success" })
          }
        />
      )}
    </div>
  );
};

// -------------------- Components --------------------
const Card = ({ title, value }) => (
  <div className="bg-white p-4 rounded-3xl border shadow text-center">
    <p className="font-bold text-gray-700">{title}</p>
    <h2 className="bg-[#087990] w-12 h-12 mx-auto rounded-xl text-2xl font-bold text-white flex items-center justify-center mt-2">
      {value}
    </h2>
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
};

export default ManageLeaves;

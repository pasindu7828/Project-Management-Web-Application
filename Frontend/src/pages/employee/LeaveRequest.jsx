import React, { useState, useEffect } from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import { Edit2, Trash2, X } from "lucide-react";
import { AiOutlineCheckCircle, AiOutlineCloseCircle } from "react-icons/ai";
import api from "../../api/axios";
import DashboardHeader from "../../components/DashboardHeader";

// -------------------- Custom Alert Modal --------------------
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
        className={`relative p-6 rounded-2xl w-full max-w-md text-center shadow-2xl border-l-4 transform transition-all duration-300 scale-100 ${color.border} ${color.bg}`}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>
        <div className="mb-4 flex items-center justify-center gap-3">{color.icon}</div>
        <p className={`mb-6 text-lg font-medium ${color.text}`}>{message}</p>
        <button
          onClick={onClose}
          className="bg-[#087990] hover:bg-[#06657a] text-white px-6 py-2 rounded-xl transition-colors duration-200 font-medium"
        >
          OK
        </button>
      </div>
    </div>
  );
};

// -------------------- Delete Confirm Modal --------------------
const ConfirmModal = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
    <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onCancel}></div>
    <div className="relative bg-red-50 p-6 rounded-2xl w-full max-w-md text-center shadow-2xl border-l-4 border-red-500 transform transition-all duration-300 scale-100">
      <button
        onClick={onCancel}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X size={20} />
      </button>
      <div className="mb-4 flex items-center justify-center gap-3">
        <AiOutlineCloseCircle className="w-12 h-12 text-red-500" />
      </div>
      <p className="mb-6 text-lg font-medium text-red-800">{message}</p>
      <div className="flex justify-center gap-4">
        <button
          onClick={onConfirm}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl transition-colors duration-200 font-medium"
        >
          Confirm
        </button>
        <button
          onClick={onCancel}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-xl transition-colors duration-200 font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
);

// -------------------- Main Component --------------------
const LeaveRequest = () => {
  const [formData, setFormData] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const [leaveHistory, setLeaveHistory] = useState([]);
  const [editingLeaveId, setEditingLeaveId] = useState(null);

  // leaveBalance will store: { used: {annual, casual, sick}, policy: {..}, usageStrings: {...} }
  const [leaveBalance, setLeaveBalance] = useState(null);

  // counts derived from leaveHistory
  const [statusCounts, setStatusCounts] = useState({ approved: 0, pending: 0, rejected: 0 });

  // Modal State
  const [alert, setAlert] = useState({ open: false, message: "", type: "success" });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, leaveId: null });

  const API_URL = import.meta.env.VITE_API_BASE_URL;

  // -------------------- Form change --------------------
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // -------------------- Fetch leave history --------------------
  const fetchLeaveHistory = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?._id;
      if (!userId) {
        console.warn("User ID not found in localStorage");
        setLeaveHistory([]);
        setStatusCounts({ approved: 0, pending: 0, rejected: 0 });
        return;
      }

      const res = await api.get(`${API_URL}/api/v1/leave-request/getLeave/${userId}`);
      const leaves = res.data?.data || [];
      setLeaveHistory(leaves);
      // compute counts
      const counts = leaves.reduce(
        (acc, l) => {
          const s = l.sts || "pending";
          if (s === "approved") acc.approved += 1;
          else if (s === "rejected") acc.rejected += 1;
          else acc.pending += 1;
          return acc;
        },
        { approved: 0, pending: 0, rejected: 0 }
      );
      setStatusCounts(counts);
    } catch (error) {
      console.error("fetchLeaveHistory error:", error);
      setAlert({
        open: true,
        message: error.response?.data?.message || "Leave history load karanna bari una",
        type: "error",
      });
    }
  };

  // -------------------- Fetch leave balance --------------------
  const fetchLeaveBalance = async () => {
    try {
      const res = await api.get(`${API_URL}/api/v1/leave-request/leave-balance`);
      const payload = res.data || {};

      // payload.used expected: { sick: 0, annual: 1, casual: 1 }
      // payload.policy expected: { sick:10, annual:10, casual:5 }
      const usedObj = payload.used || { sick: 0, annual: 0, casual: 0 };
      const policy = payload.policy || { sick: 10, annual: 10, casual: 5 };

      // build usage strings reliably
      const usageStrings = {
        annual: `${Number(usedObj.annual || 0)}/${Number(policy.annual || 1)}`,
        casual: `${Number(usedObj.casual || 0)}/${Number(policy.casual || 1)}`,
        sick: `${Number(usedObj.sick || 0)}/${Number(policy.sick || 1)}`,
      };

      setLeaveBalance({
        used: {
          annual: Number(usedObj.annual || 0),
          casual: Number(usedObj.casual || 0),
          sick: Number(usedObj.sick || 0),
        },
        policy,
        usageStrings,
      });
    } catch (err) {
      console.error("fetchLeaveBalance error:", err);
      setAlert({ open: true, message: "Leave balance load karanna bari una", type: "error" });
    }
  };

  useEffect(() => {
    fetchLeaveHistory();
    fetchLeaveBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------- Submit / Update --------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.leaveType || !formData.startDate || !formData.endDate || !formData.reason) {
      setAlert({ open: true, message: "All fields are required", type: "error" });
      return;
    }

    try {
      if (editingLeaveId) {
        const res = await api.put(`${API_URL}/api/v1/leave-request/updateLeave/${editingLeaveId}`, formData);
        setAlert({ open: true, message: res.data?.message || "Leave updated successfully", type: "success" });
        setEditingLeaveId(null);
      } else {
        const res = await api.post(`${API_URL}/api/v1/leave-request/addLeave`, formData);
        setAlert({ open: true, message: res.data?.message || "Leave request submitted successfully", type: "success" });
      }

      setFormData({
        leaveType: "",
        startDate: "",
        endDate: "",
        reason: "",
      });

      // refresh data (overwrite states)
      await fetchLeaveHistory();
      await fetchLeaveBalance();
    } catch (error) {
      console.error("handleSubmit error:", error);
      setAlert({
        open: true,
        message: error.response?.data?.message || "Something went wrong",
        type: "error",
      });
    }
  };

  // -------------------- Edit --------------------
  const handleEdit = (leave) => {
    setEditingLeaveId(leave._id);
    setFormData({
      leaveType: leave.leaveType || "",
      startDate: leave.startDate ? leave.startDate.split("T")[0] : "",
      endDate: leave.endDate ? leave.endDate.split("T")[0] : "",
      reason: leave.reason || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // -------------------- Delete --------------------
  const handleDeleteClick = (leaveId) => {
    setConfirmDelete({ open: true, leaveId });
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`${API_URL}/api/v1/leave-request/deleteLeave/${confirmDelete.leaveId}`);
      // optimistic UI update
      setLeaveHistory((prev) => prev.filter((l) => l._id !== confirmDelete.leaveId));
      setAlert({ open: true, message: "Leave deleted successfully", type: "success" });
      await fetchLeaveHistory();
      await fetchLeaveBalance();
    } catch (error) {
      console.error("handleDeleteConfirm error:", error);
      setAlert({ open: true, message: "Failed to delete leave", type: "error" });
    } finally {
      setConfirmDelete({ open: false, leaveId: null });
    }
  };

  // -------------------- UI --------------------
  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex-1 border bg-white overflow-y-auto">
        <DashboardHeader/>

        <div className="flex-1 p-6 space-y-6 bg-white overflow-y-auto">
        
        {/* Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leave Request Form */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow p-4 border border-gray-200">
            <h2 className="text-lg font-medium mb-4">
              {editingLeaveId ? "Update Leave" : "Leave Request Form"}
            </h2>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="text-gray-600 text text-sm">Leave Type</label>
                  <select
                    name="leaveType"
                    value={formData.leaveType}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2 mt-2 text-sm"
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="annual">Annual Leave</option>
                    <option value="casual">Casual Leave</option>
                    <option value="sick">Sick Leave</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-600 text text-sm">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2 mt-2 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="text-gray-600 text text-sm">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2 mt-2 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-gray-600 text text-sm">Reason</label>
                  <textarea
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    rows="4"
                    className="w-full h-32 border rounded-lg p-2 mt-2 text-sm resize-none"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    className="bg-[#087990] hover:bg-[#06657a] text-white px-4 py-2 w-40 rounded-lg transition-colors duration-200"
                  >
                    {editingLeaveId ? "Update" : "Submit"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingLeaveId(null);
                      setFormData({
                        leaveType: "",
                        startDate: "",
                        endDate: "",
                        reason: "",
                      });
                    }}
                    className="border-2 border-[#087990] hover:bg-[#E6F4F6] text-[#087990] px-4 py-2 w-40 rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Leave Balance UI */}
          {leaveBalance && (
            <div className="bg-white rounded-2xl shadow p-4 border border-gray-200 max-w-md">
              <h2 className="text-lg font-medium mb-4">Leave Balance</h2>

              {["annual", "casual", "sick"].map((type, idx) => {
              const used = leaveBalance.used?.[type] ?? 0;
              const total = Number(leaveBalance.policy?.[type] ?? 0); // Default 0 set karanna
              
              // 100% walata wada yanna nodi thaba ganeema
              const ratio = total > 0 ? used / total : 0;
              const percentNum = Math.min(100, Math.round(ratio * 100)); 
              const percent = `${percentNum}%`;
              
              const display = `${used}/${total}`;

              const color =
                type === "annual" ? "bg-blue-600" : type === "casual" ? "bg-green-600" : "bg-purple-600";

              return (
                <div key={idx} className="mb-6">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">
                      {type.charAt(0).toUpperCase() + type.slice(1)} Leave
                    </span>
                    <span className="font-semibold">{display}</span>
                  </div>
                  <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                    <div
                      className={`${color} h-4 rounded-full transition-all duration-500 ease-out`}
                      style={{ width: percent }}
                    ></div>
                  </div>
                </div>
              );
            })}

              <hr className="border-gray-200 mb-6" />

              <div className="flex justify-around text-center">
                <div className="flex flex-col items-center">
                  <span className="px-3 py-1 bg-[#E6F4F6] text-[#087990] rounded-full font-semibold">
                    {statusCounts.approved ?? 0}
                  </span>
                  <span className="text-gray-500 text-sm mt-1">Approved</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full font-semibold">
                    {statusCounts.pending ?? 0}
                  </span>
                  <span className="text-gray-500 text-sm mt-1">Pending</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full font-semibold">
                    {statusCounts.rejected ?? 0}
                  </span>
                  <span className="text-gray-500 text-sm mt-1">Rejected</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Leave History Table */}
        <div className="bg-white rounded-xl shadow p-4 overflow-y-auto max-h-[350px]">
          <h2 className="text-lg font-medium mb-4">Leave History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead className="bg-[#087990] text-white">
                <tr>
                  <th className="py-3 px-2 text-center border-r border-white whitespace-nowrap">Leave ID</th>
                  <th className="text-center border-r border-white whitespace-nowrap">Leave Type</th>
                  <th className="text-center border-r border-white whitespace-nowrap">Start Date</th>
                  <th className="text-center border-r border-white whitespace-nowrap">End Date</th>
                  <th className="text-center border-r border-white whitespace-nowrap">Reason</th>
                  <th className="text-center border-r border-white whitespace-nowrap">Status</th>
                  <th className="text-center border-r border-white whitespace-nowrap">Approved By</th>
                  <th className="text-center border-r border-white whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-[#E5E7EB] divide-y divide-x divide-white">
                {leaveHistory.length > 0 ? (
                  leaveHistory.map((leave) => (
                    <tr key={leave._id} className="hover:bg-gray-200 transition-colors duration-150 text-sm">
                      <td className="py-3 px-2 text-center border-r border-white whitespace-nowrap">{leave.leaveId || leave._id}</td>
                      <td className="text-center border-r border-white whitespace-nowrap">{leave.leaveType}</td>
                      <td className="text-center border-r border-white whitespace-nowrap">
                        {leave.startDate ? new Date(leave.startDate).toLocaleDateString() : "-"}
                      </td>
                      <td className="text-center border-r border-white whitespace-nowrap">
                        {leave.endDate ? new Date(leave.endDate).toLocaleDateString() : "-"}
                      </td>
                      <td className="text-center border-r border-white whitespace-nowrap px-2">{leave.reason || "-"}</td>
                      <td className="text-center border-r border-white whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            leave.sts === "approved"
                              ? "bg-[#E6F4F6] text-[#087990]"
                              : leave.sts === "rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {leave.sts ? leave.sts.charAt(0).toUpperCase() + leave.sts.slice(1) : "-"}
                        </span>
                      </td>
                      <td className="text-center border-r border-white whitespace-nowrap">{leave.approvedBy?.fullName || "-"}</td>
                      <td className="text-center border-r border-white flex justify-center gap-2 items-center py-3 whitespace-nowrap">
                        <button
                          onClick={() => handleEdit(leave)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors duration-150"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(leave._id)}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors duration-150"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-gray-500">No leave history found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </div>

      {/* ---------------- Modals ---------------- */}
      {alert.open && (
        <CustomAlert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert({ open: false, message: "", type: "success" })}
        />
      )}

      {confirmDelete.open && (
        <ConfirmModal
          message="Are you sure you want to delete this leave request? This action cannot be undone."
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmDelete({ open: false, leaveId: null })}
        />
      )}
    </div>
  );
};

export default LeaveRequest;

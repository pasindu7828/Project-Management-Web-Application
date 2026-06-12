import React, { useState, useEffect } from "react";
import {
  Building2,
  Users,
  UserCog,
  BarChart3,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Search,
} from "lucide-react";
import Sidebar from "../../../components/sidebar/Sidebar";
import TopBar from "../../../components/sidebar/Topbar";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import DashboardHeader from "../../../components/DashboardHeader";

const Departments = () => {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [departments, setDepartments] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    departmentCode: "",
    departmentHead: "",
    capacity: "",
    status: "Active",
    location: "",
    email: "",
    number: "",
    description: "",
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // API Base URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Fetch departments on component mount
  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setFetchLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/department/getAllDepartments`, {
        withCredentials: true,
      });

      if (response.data.success) {
        setDepartments(response.data.data);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to fetch departments");
      setTimeout(() => setError(""), 3000);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const validateForm = () => {
    if (!formData.name?.trim()) {
      setError("Department name is required");
      return false;
    }
    if (!formData.departmentCode?.trim()) {
      setError("Department code is required");
      return false;
    }
    if (
      !formData.capacity ||
      formData.capacity < 1 ||
      formData.capacity > 1000
    ) {
      setError("Capacity must be between 1 and 1000");
      return false;
    }
    if (!formData.location?.trim()) {
      setError("Location is required");
      return false;
    }
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      setError("Valid email is required");
      return false;
    }
    const phoneRegex =
      /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    if (!formData.number || !phoneRegex.test(formData.number)) {
      setError("Valid contact number is required");
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError("");
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/department/createDepartment`,
        formData,
        { withCredentials: true }
      );

      if (response.data.success) {
        setSuccess("Department created successfully!");
        setShowCreateModal(false);
        resetForm();
        fetchDepartments();
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Create error:", err);
      if (err.response?.status === 401) {
        setError("Unauthorized. Please login again.");
        setTimeout(() => navigate("/login"), 2000);
      } else if (err.response?.status === 403) {
        setError("Access denied. Admin role required.");
      } else {
        setError(err.response?.data?.message || "Failed to create department");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (dept) => {
    setEditingId(dept._id);
    setFormData({
      name: dept.name || "",
      departmentCode: dept.departmentCode || "",
      departmentHead: dept.departmentHead?.name || "",
      capacity: dept.capacity?.toString() || "",
      status: dept.status || "Active",
      location: dept.location || "",
      email: dept.email || "",
      number: dept.conactNumber || "",
      description: dept.description || "",
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError("");
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/v1/department/updateDepartment/${editingId}`,
        formData,
        { withCredentials: true }
      );

      if (response.data.success) {
        setSuccess("Department updated successfully!");
        setShowEditModal(false);
        resetForm();
        fetchDepartments();
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Update error:", err);
      if (err.response?.status === 401) {
        setError("Unauthorized. Please login again.");
        setTimeout(() => navigate("/login"), 2000);
      } else if (err.response?.status === 403) {
        setError("Access denied. Admin role required.");
      } else {
        setError(err.response?.data?.message || "Failed to update department");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this department? This action cannot be undone."
      )
    )
      return;

    setLoading(true);
    setError("");
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/v1/department/deleteDepartment/${id}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setSuccess("Department deleted successfully!");
        fetchDepartments();
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Delete error:", err);
      if (err.response?.status === 401) {
        setError("Unauthorized. Please login again.");
        setTimeout(() => navigate("/login"), 2000);
      } else if (err.response?.status === 403) {
        setError("Access denied. Admin role required.");
      } else {
        setError(err.response?.data?.message || "Failed to delete department");
      }
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/v1/department/changeStatus/${id}`,
        {},
        { withCredentials: true }
      );

      if (response.data.success) {
        setSuccess("Status changed successfully!");
        fetchDepartments();
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Status change error:", err);
      if (err.response?.status === 401) {
        setError("Unauthorized. Please login again.");
        setTimeout(() => navigate("/login"), 2000);
      } else if (err.response?.status === 403) {
        setError("Access denied. Admin role required.");
      } else {
        setError(err.response?.data?.message || "Failed to change status");
      }
      setTimeout(() => setError(""), 3000);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      departmentCode: "",
      departmentHead: "",
      capacity: "",
      status: "Active",
      location: "",
      email: "",
      number: "",
      description: "",
    });
    setEditingId(null);
    setError("");
  };

  const handleCancel = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    resetForm();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Helper function to get department icon based on name
  const getDepartmentIcon = (name) => {
    if (!name) return "📁";

    const iconMap = {
      software: "💻",
      engineering: "⚙️",
      human: "👤",
      hr: "👥",
      sales: "📊",
      marketing: "📢",
      finance: "💰",
      quality: "🎯",
      qa: "✓",
      design: "🎨",
      ui: "🖌️",
      ux: "📱",
      it: "💻",
      support: "🛠️",
      operations: "⚡",
      legal: "⚖️",
      admin: "📋",
    };

    const lowerName = name.toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
      if (lowerName.includes(key)) return icon;
    }
    return "📁";
  };

  // Helper function to get icon background color
  const getIconBg = (name) => {
    if (!name) return "bg-gray-100";

    const colorMap = {
      software: "bg-blue-100",
      engineering: "bg-indigo-100",
      human: "bg-purple-100",
      hr: "bg-purple-100",
      sales: "bg-green-100",
      marketing: "bg-orange-100",
      finance: "bg-red-100",
      quality: "bg-teal-100",
      qa: "bg-teal-100",
      design: "bg-pink-100",
      ui: "bg-pink-100",
      ux: "bg-pink-100",
      it: "bg-blue-100",
      support: "bg-yellow-100",
      operations: "bg-cyan-100",
      legal: "bg-gray-100",
      admin: "bg-slate-100",
    };

    const lowerName = name.toLowerCase();
    for (const [key, color] of Object.entries(colorMap)) {
      if (lowerName.includes(key)) return color;
    }
    return "bg-gray-100";
  };

  // Function to get the largest department by capacity with name
  const getLargestDepartmentSize = () => {
    if (!departments || departments.length === 0) {
      return { size: 0, name: "N/A" };
    }

    let largest = departments[0];

    departments.forEach((dept) => {
      if ((dept.capacity || 0) > (largest.capacity || 0)) {
        largest = dept;
      }
    });

    return {
      size: largest.capacity || 0,
      name: largest.name || "N/A",
    };
  };

const handleExport = () => {
  const doc = new jsPDF();
  autoTable(doc, {
    head: [['Department Name', 'Code', 'Capacity', 'Department Head', 'Status', 'Created Date']],
    body: departments.map(dept => [
      dept.name,
      dept.departmentCode,
      dept.capacity || 0,
      dept.departmentHead?.name || 'N/A',
      dept.status,
      formatDate(dept.createdAt)
    ]),
  });
  doc.save(`departments_report_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`);
};

  // Calculate statistics
  const totalCapacity = departments.reduce(
    (sum, d) => sum + (d.capacity || 0),
    0
  );
  const largestDepartmentData = getLargestDepartmentSize();
  const averageDepartmentSize =
    departments.length > 0 ? Math.round(totalCapacity / departments.length) : 0;

  const filteredDepartments = departments.filter(dept => 
    dept.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (filter === 'all' || dept.status.toLowerCase() === filter)
  );

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
      <DashboardHeader/>

        {/* Success/Error Messages */}
        {(success || error) && (
          <div
            className={`mx-6 mt-4 p-4 rounded-lg ${
              success
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {success || error}
          </div>
        )}

        <div className="mb-6 mt-3 flex items-center justify-between">
          <div>
            <h1 className="text-2xl ml-3 font-bold text-gray-800 mb-1">
              Department Management
            </h1>
            <p className="text-sm ml-3 text-gray-500">
              Manage departments with clarity and ease
            </p>
          </div>
          <div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 mr-9 py-4 text-base md:text-base text-white bg-[#087990] rounded-lg hover:bg-[#076a7d] transition-colors shadow-md"
            >
              + Add Department
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div
              className="bg-white rounded-xl p-5 border border-gray-200"
              style={{ boxShadow: "4px 4px rgba(8, 121, 144, 0.2)" }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Building2 className="text-blue-600" size={20} />
                </div>
                <div>
                  <div className="text-xs text-gray-600">Total Departments</div>
                  <div className="text-2xl font-bold text-gray-800">
                    {fetchLoading ? "..." : departments.length}
                  </div>
                </div>
              </div>
            </div>
            <div
              className="bg-white rounded-xl p-5 border border-gray-200"
              style={{ boxShadow: "4px 4px rgba(8, 121, 144, 0.2)" }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Users className="text-green-600" size={20} />
                </div>
                <div>
                  <div className="text-xs text-gray-600">Total Capacity</div>
                  <div className="text-2xl font-bold text-gray-800">
                    {fetchLoading ? "..." : totalCapacity}
                  </div>
                </div>
              </div>
            </div>
            <div
              className="bg-white rounded-xl p-5 border border-gray-200"
              style={{ boxShadow: "4px 4px rgba(8, 121, 144, 0.2)" }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <BarChart3 className="text-orange-600" size={20} />
                </div>
                <div>
                  <div className="text-sm text-gray-600">
                    Largest Department
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {fetchLoading ? "..." : largestDepartmentData.size}
                  </div>
                  {!fetchLoading && largestDepartmentData.size > 0 && (
                    <div
                      className="text-xs text-gray-500 mt-1 truncate"
                      title={largestDepartmentData.name}
                    >
                      {largestDepartmentData.name}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div
              className="bg-white rounded-xl p-5 border border-gray-200"
              style={{ boxShadow: "4px 4px rgba(8, 121, 144, 0.2)" }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <UserCog className="text-purple-600" size={20} />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Average Capacity</div>
                  <div className="text-2xl font-bold text-gray-800">
                    {fetchLoading ? "..." : averageDepartmentSize}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Departments Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">
                All Departments
              </h2>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#087990] w-64"
                  />
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Filter size={16} />
                    Filter
                  </button>
                  {showFilterMenu && (
                    <div className="absolute top-full right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 divide-y divide-gray-100 z-10">
                      <button
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
                        onClick={() => { setFilter('all'); setShowFilterMenu(false); }}
                      >
                        All
                      </button>
                      <button
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
                        onClick={() => { setFilter('active'); setShowFilterMenu(false); }}
                      >
                        Active
                      </button>
                      <button
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
                        onClick={() => { setFilter('inactive'); setShowFilterMenu(false); }}
                      >
                        Inactive
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={fetchLoading}
                >
                  <Download size={16} />
                  Export
                </button>
              </div>
            </div>

            {fetchLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#087990]"></div>
                <p className="mt-4 text-gray-600">Loading departments...</p>
              </div>
            ) : filteredDepartments.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-gray-600">No departments found</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 px-4 py-2 bg-[#087990] text-white rounded-lg hover:bg-[#076a7d] transition-colors"
                >
                  Create First Department
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#E0F2F1] border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">
                        Department Name
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">
                        Capacity
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">
                        Department Head
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">
                        Created Date
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDepartments.map((dept) => (
                      <tr
                        key={dept._id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`${getIconBg(
                                dept.name
                              )} w-10 h-10 rounded-lg flex items-center justify-center text-xl`}
                            >
                              {getDepartmentIcon(dept.name)}
                            </div>
                            <span className="font-medium text-gray-800 text-sm">
                              {dept.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-4 flex items-center justify-start">
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                            <Users className="text-[#087990]" size={16} />
                            <span className="text-sm font-medium text-[#087990]">
                              {dept.capacity || 0}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-700">
                            {dept.departmentHead?.name || "N/A"}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-700">
                            {formatDate(dept.createdAt)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                navigate(`/admin/D-details/${dept._id}`)
                              }
                              className="bg-blue-100 text-blue-600 p-2 rounded-lg hover:bg-blue-200 transition-colors"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleEdit(dept)}
                              className="bg-orange-100 text-orange-600 p-2 rounded-lg hover:bg-orange-200 transition-colors"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(dept._id)}
                              className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200 transition-colors"
                              disabled={loading}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Department Modal - ORIGINAL STYLES PRESERVED */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="bg-[#E5E7EB] rounded-2xl shadow-2xl w-full max-w-2xl h-auto max-h-[120vh] overflow-y-auto border-4 relative"
            style={{ boxShadow: "4px 4px rgba(8, 121, 144, 0.2)" }}
          >
            <button
              onClick={handleCancel}
              className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors text-3xl font-bold leading-none"
            >
              ×
            </button>
            <div className="text-center pt-8 pb-6 px-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {showEditModal ? "Edit" : "Create"} The Department
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {showEditModal ? "Update" : "Create your new"} department
                details...
              </p>
            </div>
            {error && (
              <div className="mx-6 mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
            <div className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Software Engineering"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087990] focus:border-transparent text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department Code *
                  </label>
                  <input
                    type="text"
                    name="departmentCode"
                    value={formData.departmentCode}
                    onChange={handleInputChange}
                    placeholder="SE-001"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087990] focus:border-transparent text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department Head *
                  </label>
                  <input
                    type="text"
                    name="departmentHead"
                    value={formData.departmentHead}
                    onChange={handleInputChange}
                    placeholder="Employee ID"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087990] focus:border-transparent text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacity *
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    placeholder="50"
                    min="1"
                    max="1000"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087990] focus:border-transparent text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087990] focus:border-transparent appearance-none text-sm text-gray-700"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 0.75rem center",
                      backgroundSize: "1.25rem",
                    }}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Building A, Floor 3"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087990] focus:border-transparent text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="dept@worksync.com"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087990] focus:border-transparent text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number *
                  </label>
                  <input
                    type="tel"
                    name="number"
                    value={formData.number}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087990] focus:border-transparent text-sm"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter description (max 500 characters)"
                    rows="4"
                    maxLength="500"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087990] focus:border-transparent resize-none text-sm"
                  ></textarea>
                </div>
              </div>
              <div className="flex items-center justify-center gap-4 mt-6 pb-4">
                <button
                  onClick={showEditModal ? handleUpdate : handleCreate}
                  disabled={loading}
                  className="px-6 py-2 text-sm font-semibold text-white bg-[#087990] rounded-lg hover:bg-[#076a7d] transition-colors shadow-md disabled:opacity-50"
                >
                  {loading
                    ? "Processing..."
                    : showEditModal
                    ? "Update"
                    : "Create"}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="px-6 py-2 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
 
export default Departments;
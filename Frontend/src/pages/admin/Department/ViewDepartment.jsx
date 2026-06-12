import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  Trash2,
  Users,
  ListChecks,
  TrendingUp,
  CheckSquare
} from 'lucide-react';
import Sidebar from '../../../components/sidebar/Sidebar';
import TopBar from '../../../components/sidebar/Topbar';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardHeader from '../../../components/DashboardHeader';

const DepartmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [departmentData, setDepartmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const colors = [
    'bg-purple-500', 'bg-green-600', 'bg-orange-500', 'bg-red-500',
    'bg-teal-600', 'bg-purple-600', 'bg-pink-500', 'bg-blue-500',
    'bg-indigo-600'
  ];

  useEffect(() => {
    const fetchDepartment = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get(`${API_BASE_URL}/api/v1/department/getDepartment/${id}`, {
          withCredentials: true
        });
        
        if (response.data.success) {
          setDepartmentData(response.data.data);
        } else {
          setError(response.data.message || 'Failed to fetch department details');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.response?.data?.message || 'Failed to fetch department details');
      } finally {
        setLoading(false);
      }
    };

    fetchDepartment();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this department?')) {
      return;
    }

    try {
      const response = await axios.delete(`${API_BASE_URL}/api/v1/department/deleteDepartment/${id}`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        navigate('/admin/departments');
      } else {
        setError(response.data.message || 'Failed to delete department');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.response?.data?.message || 'Failed to delete department');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getAvatar = (name) => {
    if (!name) return '??';
    return name.split(' ').map(w => w[0].toUpperCase()).join('');
  };

  if (loading) {
    return (
      <div className="flex bg-[#F8FAFC] min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
           <DashboardHeader/>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#087990]"></div>
              <p className="mt-4 text-gray-600">Loading department details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !departmentData) {
    return (
      <div className="flex bg-[#F8FAFC] min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader/>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-12">
              <p className="text-red-600">{error || 'Department not found'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { 
    name, 
    departmentCode, 
    departmentHead, 
    employeeCount, 
    capacity, 
    location, 
    email, 
    conactNumber, 
    status, 
    createdAt, 
    description, 
    employees 
  } = departmentData;

  const availableSlots = capacity - employeeCount;
  const utilization = Math.round((employeeCount / capacity || 0) * 100);

  const stats = [
    { label: 'Total Employees', value: employeeCount, icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { label: 'Capacity', value: capacity, icon: ListChecks, color: 'text-green-600', bgColor: 'bg-green-50' },
    { label: 'Available Slots', value: availableSlots >= 0 ? availableSlots : 0, icon: TrendingUp, color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { label: 'Utilization', value: `${utilization}%`, icon: CheckSquare, color: 'text-purple-600', bgColor: 'bg-purple-50' }
  ];

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen">
      <Sidebar/>

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar/>

        <div className="flex-1 overflow-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/admin/departments')}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-1">Department Details</h1>
                <p className="text-sm text-gray-500">View and manage department information</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
            {/* Department Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-purple-600 p-4 rounded-xl">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{name}</h2>
                <span className="inline-block mt-2 px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                  {departmentCode}
                </span>
              </div>
            </div>

            {/* Department Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Department Head</label>
                  <p className="text-sm text-gray-900 font-medium mt-1">{departmentHead?.name || 'None'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Employees</label>
                  <p className="text-sm text-gray-900 font-medium mt-1">{employeeCount} Employees</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</label>
                  <p className="text-sm text-gray-900 font-medium mt-1">{location}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</label>
                  <p className="text-sm text-blue-600 font-medium mt-1">{email}</p>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Department Code</label>
                  <p className="text-sm text-gray-900 font-medium mt-1">{departmentCode}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</label>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="text-sm text-gray-900 font-medium">{status}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact Number</label>
                  <p className="text-sm text-gray-900 font-medium mt-1">{conactNumber}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Created Date</label>
                  <p className="text-sm text-gray-900 font-medium mt-1">{formatDate(createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Department Description */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Department Description</label>
              <p className="text-sm text-gray-700 leading-relaxed mt-2">
                {description || 'No description available.'}
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 ">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow" style={{ boxShadow: "4px  4px rgba(8, 121, 144, 0.2)" }}>
                <div className={`${stat.bgColor} w-12 h-12 rounded-lg flex items-center justify-center mb-3`}>
                  <stat.icon className={stat.color} size={24} />
                </div>
                <p className="text-xs text-gray-500 font-medium mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Department Employees */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Department Employees</h3>
              <button className="text-sm text-[#087990] font-medium hover:underline">
                View All Employees →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {employees.map((employee, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`${colors[index % colors.length]} w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}>
                    {getAvatar(employee.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{employee.name}</p>
                    <p className="text-xs text-gray-500 truncate">{employee.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
  
export default DepartmentDetails;
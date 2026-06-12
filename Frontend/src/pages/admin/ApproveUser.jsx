import React, { useState, useEffect } from 'react';
import { Users, Shield, UserCog, Filter, Download, Check, Trash2, X, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Sidebar from '../../components/sidebar/Sidebar';
import axios from 'axios';
import DashboardHeader from '../../components/DashboardHeader';

const UserRolesPage = () => {
  const [users, setUsers] = useState([]);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/api/v1/userAuth/getAllUsers?limit=100`, { withCredentials: true });
      const data = response.data;
      if (data.success) {
        const mappedUsers = data.data.map(user => ({
          id: user._id,
          firstName: user.FirstName,
          lastName: user.LastName,
          contactNumber: user.ContactNumber,
          email: user.email,
          gender: user.Gender,
          document: user.attachments[0] || '',
          role: user.role,
          status: user.status,
        }));
        setUsers(mappedUsers);
      } else {
        setError(data.message || 'Failed to fetch users');
      }
    } catch (error) {
      setError(error.message || 'Error fetching users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

const handleApprove = async (Id) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/v1/employee/RejisterEmployee/${Id}`,
      {}, // 👈 no body needed
      {
        withCredentials: true, // 👈 MUST be here
      }
    );

    const data = response.data;

    if (data.success) {
      setUsers(users.map(user => {
        if (user.id === Id) {
          showNotification(
            'success',
            `${user.firstName} ${user.lastName} has been approved successfully!`
          );
          return { ...user, status: 'Approved' };
        }
        return user;
      }));
    }
  } catch (error) {
    console.error('Error approving user:', error);
    showNotification('error', 'Unauthorized or failed to approve user');
  }
};

  const handleReject = async (Id) => {
    try {
      const response = await axios.delete(`${API_URL}/api/v1/userAuth/removeResume/${Id}`, { withCredentials: true });
      const data = response.data;
      if (data.success) {
        setUsers(users.map(user => {
          if (user.id === Id) {
            showNotification('error', `${user.firstName} ${user.lastName} has been rejected.`);
            return {
              ...user,
              status: 'Rejected',
            };
          }
          return user;
        }));
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      showNotification('error', 'Failed to reject user');
    }
  };

  const isApproveDisabled = (status) => {
    return status === 'Approved' || status === 'Rejected';
  };

  const isRejectDisabled = (status) => {
    return status === 'Rejected';
  };

  const totalEmployees = users.length;
  const activeEmployees = users.filter(u => u.status === 'Approved').length;
  const administrators = users.filter(u => u.role === 3).length;
  const managers = users.filter(u => u.role === 2).length;

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
       <DashboardHeader/>

        {/* Notification Popup */}
        {notification && (
          <div className="fixed top-4 right-4 z-50 animate-slide-in">
            <div className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg ${
              notification.type === 'success' 
                ? 'bg-green-50 border-l-4 border-green-500' 
                : notification.type === 'error'
                ? 'bg-red-50 border-l-4 border-red-500'
                : 'bg-yellow-50 border-l-4 border-yellow-500'
            }`}>
              {notification.type === 'success' && <CheckCircle className="text-green-600" size={24} />}
              {notification.type === 'error' && <XCircle className="text-red-600" size={24} />}
              {notification.type === 'warning' && <AlertCircle className="text-yellow-600" size={24} />}
              
              <span className={`text-sm font-medium ${
                notification.type === 'success' 
                  ? 'text-green-800' 
                  : notification.type === 'error'
                  ? 'text-red-800'
                  : 'text-yellow-800'
              }`}>
                {notification.message}
              </span>
              
              <button 
                onClick={() => setNotification(null)}
                className="ml-4 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto p-6">
          {/* Breadcrumb */}
          <div className="text-sm text-gray-500 mb-6">
            Employees &gt; Manage Employees &gt; Roles
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Employees */}
            <div className="bg-white rounded-xl p-5" style={{ boxShadow: '4px  4px rgba(8, 121, 144, 0.2)' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Users className="text-blue-600" size={24} />
                </div>
              </div>
              <div className="text-gray-600 text-xs mb-1">Total Employees</div>
              <div className="text-3xl font-bold text-gray-800">{totalEmployees}</div>
            </div>

            {/* Active Employees */}
            <div className="bg-white rounded-xl p-5" style={{ boxShadow: '4px  4px rgba(8, 121, 144, 0.2)' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-green-100 p-2 rounded-lg">
                  <UserCog className="text-green-600" size={24} />
                </div>
              </div>
              <div className="text-gray-600 text-xs mb-1">Active Employees</div>
              <div className="text-3xl font-bold text-gray-800">{activeEmployees}</div>
            </div>

            {/* Administrators */}
            <div className="bg-white rounded-xl p-5" style={{ boxShadow: '4px  4px rgba(8, 121, 144, 0.2)' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <Shield className="text-orange-600" size={24} />
                </div>
              </div>
              <div className="text-gray-600 text-xs mb-1">Administrators</div>
              <div className="text-3xl font-bold text-gray-800">{administrators}</div>
            </div>

            {/* Managers */}
            <div className="bg-white rounded-xl p-5" style={{ boxShadow: '4px  4px rgba(8, 121, 144, 0.2)' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Users className="text-purple-600" size={24} />
                </div>
              </div>
              <div className="text-gray-600 text-xs mb-1">Managers</div>
              <div className="text-3xl font-bold text-gray-800">{managers}</div>
            </div>
          </div>

          {/* Grant User Roles Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Grant User Roles</h2>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Filter size={16} />
                  Filter
                </button>
                <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Download size={16} />
                  Export
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="text-center py-4">Loading users...</div>
              ) : error ? (
                <div className="text-center py-4 text-red-600">{error}</div>
              ) : users.length === 0 ? (
                <div className="text-center py-4">No users found</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Employee First Name</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Employee Last Name</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Contact Number</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Email</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Gender</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Document</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4 text-sm text-gray-700">{user.firstName}</td>
                        <td className="py-4 px-4 text-sm text-gray-700">{user.lastName}</td>
                        <td className="py-4 px-4 text-sm text-gray-700">{user.contactNumber}</td>
                        <td className="py-4 px-4 text-sm text-gray-700">{user.email}</td>
                        <td className="py-4 px-4 text-sm text-gray-700">{user.gender}</td>
                        <td className="py-4 px-4 text-sm text-gray-700">
                          {user.document ? (
                            <a href={`/${user.document}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Document</a>
                          ) : (
                            'No Document'
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleApprove(user.id)}
                              disabled={isApproveDisabled(user.status)}
                              className={`p-2 rounded-lg transition-colors ${
                                isApproveDisabled(user.status)
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-green-100 text-green-600 hover:bg-green-200'
                              }`}
                            >
                              <Check size={16} />
                            </button>
                            <button 
                              onClick={() => handleReject(user.id)}
                              disabled={isRejectDisabled(user.status)}
                              className={`p-2 rounded-lg transition-colors ${
                                isRejectDisabled(user.status)
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-red-100 text-red-600 hover:bg-red-200'
                              }`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default UserRolesPage;
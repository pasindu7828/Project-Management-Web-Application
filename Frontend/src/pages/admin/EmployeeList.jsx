import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/sidebar/Sidebar';
import EmployeeTable from '../../components/EmployeeTable';
import { getAllEmployees } from '../../services/employeeService';
import { CloudCog } from 'lucide-react';

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllEmployees();
      console.log('Fetched employees:', response);
      if (response.success) {
        const data = response.data || [];
        setEmployees(response.Employees);
        console.log('Employee data set:', response.Employees);
        // Calculate stats
        const total = response.Employees.length;
        const active = response.Employees.filter(emp => emp.status === 'Active').length;
        const inactive = total - active;
        setStats({ total, active, inactive });
      } else {
        setError(response.message || 'Failed to load employees');
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError(err?.response?.data?.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeDeleted = () => {
    fetchEmployees();
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 overflow-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2" style={{ color: '#0E7C86' }}>
                Employee Directory
              </h1>
              <p className="text-gray-600 text-sm font-medium">
                Manage and view all employees in your organization
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Stats Cards - Optional */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-4" style={{ borderColor: '#E0F2FE' }}>
            <p className="text-gray-600 text-xs font-semibold mb-1">Total Employees</p>
            <p className="text-2xl font-bold" style={{ color: '#0E7C86' }}>{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-4" style={{ borderColor: '#E0F2FE' }}>
            <p className="text-gray-600 text-xs font-semibold mb-1">Active</p>
            <p className="text-2xl font-bold" style={{ color: '#0E7C86' }}>{stats.active}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-4" style={{ borderColor: '#E0F2FE' }}>
            <p className="text-gray-600 text-xs font-semibold mb-1">Inactive</p>
            <p className="text-2xl font-bold" style={{ color: '#E53E3E' }}>{stats.inactive}</p>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-xl shadow-lg border-0 overflow-hidden hover:shadow-xl transition-shadow duration-300">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">Loading employees...</p>
            </div>
          ) : (
            <EmployeeTable employees={employees} onEmployeeDeleted={handleEmployeeDeleted} />
          )}
        </div>
      </main>
    </div>
  );
};

export default EmployeeList;

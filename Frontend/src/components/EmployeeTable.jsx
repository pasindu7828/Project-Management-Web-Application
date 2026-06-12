import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit2, Trash2 } from 'lucide-react';
import { removeEmployee } from '../services/employeeService';

const EmployeeTable = ({ employees = [], onEmployeeDeleted }) => {
  const navigate = useNavigate();

  const getRoleName = (role) => {
    const roleMap = { 1: 'Employee', 2: 'Manager', 3: 'Admin' };
    return roleMap[role] || 'Unknown';
  };

  const getStatusColor = (status) => {
    return status === 'Active' ? '#00C853' : '#A0AEC0';
  };

  const handleDeleteEmployee = async (employee) => {
    if (!window.confirm(`Are you sure you want to delete ${employee.FirstName} ${employee.LastName}?`)) {
      return;
    }
    
    try {
      const response = await removeEmployee(employee._id);
      if (response.success) {
        alert('Employee deleted successfully!');
        onEmployeeDeleted?.();
      } else {
        alert('Failed to delete employee');
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Error deleting employee');
    }
  };

  return (
    <div className="relative">
      {/* Table Container */}
      <div
        className="bg-white rounded-lg border shadow-sm overflow-hidden"
        style={{
          borderColor: '#D9E2EC',
          padding: '24px',
        }}
      >
        {/* Empty State */}
        {employees.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No employees found</p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr
                className="border-b"
                style={{
                  borderColor: '#D9E2EC',
                }}
              >
                <th
                  className="text-left py-4 px-4 font-semibold text-sm"
                  style={{ color: '#2D3748' }}
                >
                  Name
                </th>
                <th
                  className="text-left py-4 px-4 font-semibold text-sm"
                  style={{ color: '#2D3748' }}
                >
                  Employee ID
                </th>
                <th
                  className="text-left py-4 px-4 font-semibold text-sm"
                  style={{ color: '#2D3748' }}
                >
                  Role
                </th>
                <th
                  className="text-left py-4 px-4 font-semibold text-sm"
                  style={{ color: '#2D3748' }}
                >
                  Department
                </th>
                <th
                  className="text-left py-4 px-4 font-semibold text-sm"
                  style={{ color: '#2D3748' }}
                >
                  Status
                </th>
                <th
                  className="text-right py-4 px-4 font-semibold text-sm"
                  style={{ color: '#2D3748' }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr
                  key={employee._id}
                  className="border-b hover:bg-gray-50 transition-colors"
                  style={{
                    borderColor: '#D9E2EC',
                    height: '60px',
                  }}
                >
                  <td
                    className="py-4 px-4 font-medium text-sm"
                    style={{ color: '#2D3748' }}
                  >
                    {employee.FirstName} {employee.LastName}
                  </td>
                  <td
                    className="py-4 px-4 text-sm"
                    style={{ color: '#718096' }}
                  >
                    {employee.EmployeeID}
                  </td>
                  <td
                    className="py-4 px-4 text-sm"
                    style={{ color: '#718096' }}
                  >
                    {getRoleName(employee.role)}
                  </td>
                  <td
                    className="py-4 px-4 text-sm"
                    style={{ color: '#718096' }}
                  >
                    {employee.department?.DepartmentName || 'N/A'}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className="text-sm font-medium"
                      style={{ color: getStatusColor(employee.status) }}
                    >
                      {employee.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex justify-end gap-2">
                      {/* View Button */}
                      <button
                        onClick={() => navigate(`/admin/view-employee/${employee._id}`)}
                        className="p-2 rounded-full hover:bg-blue-50 transition-all duration-200 cursor-pointer"
                        style={{ color: '#0E7C86' }}
                        title="View"
                      >
                        <Eye size={18} />
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => navigate(`/admin/edit-employee/${employee._id}`)}
                        className="p-2 rounded-full hover:bg-blue-50 transition-all duration-200 cursor-pointer"
                        style={{ color: '#0E7C86' }}
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteEmployee(employee)}
                        className="p-2 rounded-full hover:bg-red-50 transition-all duration-200 cursor-pointer"
                        style={{ color: '#E53E3E' }}
                        title="Delete"
                      >
                        <Trash2 size={18} />
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
  );
};

export default EmployeeTable;

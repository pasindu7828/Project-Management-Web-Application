import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import DashboardSidebar from '../../components/sidebar/DashboardSidebar';
import DashboardHeader from '../../components/DashboardHeader';
import EditEmployeeImg from '../../assets/Editemployee.png';
import axios from 'axios';

const EditEmployee = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    role: '',
    department: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const API_URL = import.meta.env.VITE_API_BASE_URL;

  // Roles and Departments
  const roles = [
    { value: '1', label: 'Employee' },
    { value: '2', label: 'Manager' },
    { value: '3', label: 'Admin' },
  ];
  const [departments, setDepartments] = useState([]);

  // Fetch employee and departments
  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetching(true);
        // Employee details
        const empRes = await axios.get(`${API_URL}/api/v1/employee/getSingleEmployeeByID/${id}`, { withCredentials: true });
        if (empRes.data?.success && empRes.data?.user) {
          const user = empRes.data.user;
          const departmentID = user.departmentID ? String(user.departmentID) : '';

          setFormData({
            name: `${user.FirstName || ''} ${user.LastName || ''}`.trim(),
            employeeId: user.EmployeeID || '',
            role: String(user.role ?? ''),
            department: departmentID,
          });
        } else {
          setErrors({ submit: empRes.data?.message || 'Failed to load employee data' });
        }

        // Departments list
        const deptRes = await axios.get(`${API_URL}/api/v1/department/getAllDepartments`, { withCredentials: true });
        const list =
          deptRes.data?.data ||
          deptRes.data?.Departments ||
          deptRes.data?.departments ||
          deptRes.data?.department ||
          [];
        setDepartments(list);
      } catch (error) {
        console.error('Error fetching employee/departments:', error);
        setErrors({ submit: 'An error occurred while loading data' });
      } finally {
        setFetching(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.employeeId.trim()) {
      newErrors.employeeId = 'Employee ID is required';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    if (!formData.department) {
      newErrors.department = 'Department is required';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        EmployeeID: formData.employeeId,
        role: Number(formData.role),
        departmentID: formData.department || null,
      };

      const res = await axios.patch(
        `${API_URL}/api/v1/employee/updateEmployee/${id}`,
        payload,
        { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
      );

      if (res.data?.success) {
        alert('Employee updated successfully!');
        navigate('/admin/users');
      } else {
        setErrors({ submit: res.data?.message || 'Failed to update employee' });
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      const msg = error?.response?.data?.message || 'An error occurred. Please try again.';
      setErrors({ submit: msg });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex">
        <DashboardSidebar activeItem="User" />
        <div className="flex-1 ml-60">
          <DashboardHeader />
          <main className="pt-24 pb-32 px-8 flex items-center justify-center" style={{ backgroundColor: '#FFFFFF' }}>
            <p style={{ color: '#718096' }}>Loading employee data...</p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      {/* Sidebar */}
      <DashboardSidebar activeItem="User" />

      {/* Main Content */}
      <div className="flex-1 ml-60">
        {/* Header */}
        <DashboardHeader />

        {/* Content Area */}
        <main className="pt-24 pb-32 px-8" style={{ backgroundColor: '#F8FAFC' }}>
          {/* Back Button */}
          <button
            onClick={() => navigate('/admin/users')}
            className="flex items-center gap-2 mb-8 text-sm font-medium transition-all hover:gap-3"
            style={{ color: '#0E7C86' }}
          >
            <ArrowLeft size={18} />
            Back to Employee List
          </button>

          {/* Page Title with Gradient Background */}
          <div className="mb-10 p-6 rounded-xl" style={{ backgroundColor: '#E8F5F7' }}>
            <h1
              className="text-4xl font-bold mb-2"
              style={{ color: '#0E7C86' }}
            >
              Edit Employee
            </h1>
            <p style={{ color: '#0E7C86', opacity: 0.7 }} className="text-sm font-medium">
              Update the employee information below
            </p>
          </div>

          {/* Form Container */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-2">
              <div
                className="bg-white rounded-xl shadow-lg border-0 p-8 hover:shadow-xl transition-shadow duration-300"
                style={{ backgroundColor: '#FFFFFF' }}
              >
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name Field - Read Only */}
                  <div>
                    <label
                      className="block text-sm font-semibold mb-2"
                      style={{ color: '#2D3748' }}
                    >
                      Name
                    </label>
                    <div
                      className="w-full px-4 py-4 rounded-lg border font-semibold text-lg"
                      style={{
                        borderColor: '#D9E2EC',
                        backgroundColor: '#F8FAFC',
                        color: '#0E7C86',
                        boxShadow: '0 6px 18px rgba(14, 124, 134, 0.08)',
                      }}
                    >
                      {formData.name || 'N/A'}
                    </div>
                  </div>

                  {/* Employee ID Field */}
                  <div>
                    <label
                      htmlFor="employeeId"
                      className="block text-sm font-semibold mb-3"
                      style={{ color: '#2D3748' }}
                    >
                      Employee ID <span style={{ color: '#E53E3E' }}>*</span>
                    </label>
                    <input
                      type="text"
                      id="employeeId"
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleChange}
                      placeholder="Enter employee ID"
                      className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all text-sm"
                      style={{
                        borderColor: errors.employeeId ? '#E53E3E' : '#D9E2EC',
                        backgroundColor: '#FFFFFF',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = errors.employeeId
                          ? '#E53E3E'
                          : '#0E7C86';
                        e.target.style.boxShadow = errors.employeeId
                          ? '0 0 0 4px rgba(229, 62, 62, 0.15)'
                          : '0 0 0 4px rgba(14, 124, 134, 0.15)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = errors.employeeId
                          ? '#E53E3E'
                          : '#D9E2EC';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    {errors.employeeId && (
                      <p
                        className="text-xs mt-2 font-medium"
                        style={{ color: '#E53E3E' }}
                      >
                        {errors.employeeId}
                      </p>
                    )}
                  </div>

                  {/* Role Field */}
                  <div>
                    <label
                      htmlFor="role"
                      className="block text-sm font-semibold mb-3"
                      style={{ color: '#2D3748' }}
                    >
                      Role <span style={{ color: '#E53E3E' }}>*</span>
                    </label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all appearance-none bg-white cursor-pointer text-sm"
                      style={{
                        borderColor: errors.role ? '#E53E3E' : '#D9E2EC',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%230E7C86' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 1rem center',
                        paddingRight: '2.5rem',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = errors.role
                          ? '#E53E3E'
                          : '#0E7C86';
                        e.target.style.boxShadow = errors.role
                          ? '0 0 0 4px rgba(229, 62, 62, 0.15)'
                          : '0 0 0 4px rgba(14, 124, 134, 0.15)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = errors.role
                          ? '#E53E3E'
                          : '#D9E2EC';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      <option value="">Select Role</option>
                      {roles.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                    {errors.role && (
                      <p
                        className="text-xs mt-2 font-medium"
                        style={{ color: '#E53E3E' }}
                      >
                        {errors.role}
                      </p>
                    )}
                  </div>

                  {/* Department Field */}
                  <div>
                    <label
                      htmlFor="department"
                      className="block text-sm font-semibold mb-3"
                      style={{ color: '#2D3748' }}
                    >
                      Department <span style={{ color: '#E53E3E' }}>*</span>
                    </label>
                    <select
                      id="department"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all appearance-none bg-white cursor-pointer text-sm"
                      style={{
                        borderColor: errors.department
                          ? '#E53E3E'
                          : '#D9E2EC',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%230E7C86' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 1rem center',
                        paddingRight: '2.5rem',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = errors.department
                          ? '#E53E3E'
                          : '#0E7C86';
                        e.target.style.boxShadow = errors.department
                          ? '0 0 0 4px rgba(229, 62, 62, 0.15)'
                          : '0 0 0 4px rgba(14, 124, 134, 0.15)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = errors.department
                          ? '#E53E3E'
                          : '#D9E2EC';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept._id || dept.id} value={dept._id || dept.id}>
                          {dept.DepartmentName || dept.name || dept.departmentName || 'Department'}
                        </option>
                      ))}
                    </select>
                    {errors.department && (
                      <p
                        className="text-xs mt-2 font-medium"
                        style={{ color: '#E53E3E' }}
                      >
                        {errors.department}
                      </p>
                    )}
                  </div>

                  {/* Submit Error Message */}
                  {errors.submit && (
                    <div
                      className="p-4 rounded-lg text-sm font-medium border-l-4"
                      style={{
                        backgroundColor: 'rgba(229, 62, 62, 0.1)',
                        color: '#E53E3E',
                        borderColor: '#E53E3E',
                      }}
                    >
                      {errors.submit}
                    </div>
                  )}

                  {/* Form Buttons */}
                  <div className="flex gap-4 pt-6 border-t" style={{ borderColor: '#E2E8F0' }}>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-6 py-3 rounded-lg text-white font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 shadow-md hover:shadow-lg transform hover:scale-105"
                      style={{ backgroundColor: '#0E7C86' }}
                      onMouseEnter={(e) => {
                        if (!loading)
                          e.currentTarget.style.backgroundColor = '#0A5C65';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#0E7C86';
                      }}
                    >
                      {loading ? 'Updating Employee...' : 'Update Employee'}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/admin/users')}
                      className="flex-1 px-6 py-3 rounded-lg font-semibold border transition-all duration-200 cursor-pointer hover:shadow-md"
                      style={{
                        borderColor: '#D9E2EC',
                        color: '#2D3748',
                        backgroundColor: '#FFFFFF',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F1F5F9';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#FFFFFF';
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Illustration Section */}
            <div className="lg:col-span-1 hidden lg:flex items-center justify-center">
              <div className="w-full flex items-center justify-center p-6 bg-white rounded-xl shadow-lg">
                <img
                  src={EditEmployeeImg}
                  alt="Edit Employee"
                  className="w-full h-auto max-w-md"
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EditEmployee;

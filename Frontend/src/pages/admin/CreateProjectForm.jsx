import { useState, useEffect } from 'react';
import { createProject,getAllEmployee,getAllUsers } from '../../services/ProjectService';

const CreateProjectModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'active',
    teamLeaderId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch users when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await getAllUsers();
      console.log(response.Employees);
      if (response.success) {
        setUsers(response.Employees || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoadingUsers(false);
    }
  };
    
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name || !formData.description || !formData.startDate || !formData.teamLeaderId) {
      setError('Please fill in all required fields');
      return;
    }

    // Date validation
    if (formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      setError('End date cannot be before start date');
      return;
    }

    setLoading(true);
    try {
      const response = await createProject({
        name: formData.name,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        status: formData.status,
        teamLeaderId: formData.teamLeaderId,
      });

      if (response.success) {
        // Reset form
        setFormData({
          name: '',
          description: '',
          startDate: '',
          endDate: '',
          status: 'active',
          teamLeaderId: '',
        });
        onSuccess?.();
        onClose();
      } else {
        setError(response.message || 'Failed to create project');
      }
    } catch (err) {
      console.error('Error creating project:', err);
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      status: 'active',
      teamLeaderId: '',
    });
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-[20px] font-bold text-gray-800">Create New Project</h2>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-[16px]">
              {error}
            </div>
          )}

          {/* Project Name */}
          <div>
            <label className="block text-[16px] font-medium text-gray-700 mb-2">
              Project Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Text Input"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-[16px] focus:outline-none focus:ring-2 focus:ring-[#087990] focus:border-transparent"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[16px] font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Text Input..."
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-[16px] focus:outline-none focus:ring-2 focus:ring-[#087990] focus:border-transparent resize-none"
              required
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[16px] font-medium text-gray-700 mb-2">
              Start Date:
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-[16px] focus:outline-none focus:ring-2 focus:ring-[#087990] focus:border-transparent"
              required
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[16px] font-medium text-gray-700 mb-2">
              End Date:
            </label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-[16px] focus:outline-none focus:ring-2 focus:ring-[#087990] focus:border-transparent"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-[16px] font-medium text-gray-700 mb-3">
              Status
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={formData.status === 'active'}
                  onChange={handleChange}
                  className="w-4 h-4 text-[#087990] focus:ring-[#087990]"
                />
                <span className="text-[16px] text-gray-700">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="on-hold"
                  checked={formData.status === 'on-hold'}
                  onChange={handleChange}
                  className="w-4 h-4 text-[#087990] focus:ring-[#087990]"
                />
                <span className="text-[16px] text-gray-700">On-Hold</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="completed"
                  checked={formData.status === 'completed'}
                  onChange={handleChange}
                  className="w-4 h-4 text-[#087990] focus:ring-[#087990]"
                />
                <span className="text-[16px] text-gray-700">Complete</span>
              </label>
            </div>
          </div>

          {/* Team Leader */}
          <div>
            <label className="block text-[16px] font-medium text-gray-700 mb-2">
              Team Leader
            </label>
            <select
              name="teamLeaderId"
              value={formData.teamLeaderId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-[16px] focus:outline-none focus:ring-2 focus:ring-[#087990] focus:border-transparent bg-white"
              required
              disabled={loadingUsers}
            >
              <option value="">{loadingUsers ? 'Loading users...' : 'Select Team Leader'}</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
            {users.length === 0 && !loadingUsers && (
              <p className="text-sm text-gray-500 mt-1">No users available</p>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 bg-[#E5E7EB] hover:bg-gray-300 text-gray-700 rounded-lg text-[16px] font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#087990] hover:bg-[#066a7a] text-white rounded-lg text-[16px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
import { useState, useEffect } from 'react';
import { updateProject, getAllEmployee,getAllUsers } from '../../services/ProjectService';

const ProjectCardAdminEdit = ({ project, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: project.name || '',
    description: project.description || '',
    startDate: project.startDate ? project.startDate.slice(0, 10) : '',
    endDate: project.endDate ? project.endDate.slice(0, 10) : '',
    status: project.status || 'active',
    teamLeaderId: project.teamLeader?._id || project.teamLeader || '',
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, []);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await getAllUsers();
      if (response.Employees) {
        setUsers(response.Employees || []);
      }
    } catch (err) {
      setError('Failed to load users.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.name || !formData.description || !formData.startDate || !formData.teamLeaderId) {
      setError('Please fill in all required fields');
      return;
    }
    if (formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      setError('End date cannot be before start date');
      return;
    }
    setLoading(true);
    try {
      const response = await updateProject(project._id, {
        name: formData.name,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        status: formData.status,
        teamLeaderId: formData.teamLeaderId,
      });
      if (response.success) {
        onUpdate?.();
        onClose();
      } else {
        setError(response.message || 'Failed to update project');
      }
    } catch (err) {
      setError(err.message || 'Failed to update project');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-[20px] font-bold text-gray-800">Edit Project</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-[16px]">
              {error}
            </div>
          )}
          <div>
            <label className="block text-[16px] font-medium text-gray-700 mb-2">Project Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-[16px] focus:outline-none focus:ring-2 focus:ring-[#087990] focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-[16px] font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-[16px] focus:outline-none focus:ring-2 focus:ring-[#087990] focus:border-transparent resize-none"
              required
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-[16px] font-medium text-gray-700 mb-2">Start Date:</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-[16px] focus:outline-none focus:ring-2 focus:ring-[#087990] focus:border-transparent"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-[16px] font-medium text-gray-700 mb-2">End Date:</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-[16px] focus:outline-none focus:ring-2 focus:ring-[#087990] focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-[16px] font-medium text-gray-700 mb-3">Status</label>
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
          <div>
            <label className="block text-[16px] font-medium text-gray-700 mb-2">Team Leader</label>
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
              {loading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectCardAdminEdit;

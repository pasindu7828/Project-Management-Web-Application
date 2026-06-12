
import { useState,useEffect } from 'react';
import axios from 'axios';
import ProjectCardAdminEdit from './ProjectCardAdminEdit';
import { getAllEmployee } from '../../services/ProjectService';

const ProjectCardAdmin = ({ project, onView, onRemove }) => {
  const [isRemoving, setIsRemoving] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [employees, setEmployees] = useState([]);

useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await getAllEmployee();
        setEmployees(res.Employees);
      } catch (error) {
        console.error("Failed to fetch employees", error);
      }
    };

    fetchEmployees();
  }, []);

  let teamLeaderName = "-";

  if (project.teamLeader?.email) {
    const leader = Array.isArray(employees)
      ? employees.find((emp) => emp.email === project.teamLeader.email)
      : null;

    if (leader) {
      teamLeaderName = `${leader.FirstName} ${leader.LastName}`;
    } else if (project.teamLeader.email === "admin@example.com") {
      teamLeaderName = "Admin";
    } else {
      teamLeaderName = project.teamLeader.email;
    }
  }


console.log("TEAM LEADER NAME 👉", project?.teamLeaderName);
  // Calculate progress percentage (mock calculation )
  const calculateProgress = () => {
    if (!project.startDate || !project.endDate) return 0;
    
    const start = new Date(project.startDate);
    const end = new Date(project.endDate);
    const now = new Date();
    
    if (now >= end) return 100;
    if (now <= start) return 0;
    
    const total = end - start;
    const elapsed = now - start;
    return Math.round((elapsed / total) * 100);
  };

  const progress = calculateProgress();

  // Format date to DD/MM/YYYY
  const formatDate = (dateString) => {
    if (!dateString) return 'DD/MM/YYYY';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-500';
      case 'on-hold':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-blue-500';
      default:
        return 'bg-green-500';
    }
  };

  const URL_API = import.meta.env.VITE_API_BASE_URL;

  const handleViewDetails = (projectId) => {
    if (onView) {
      onView(projectId);
    } else {
      // Fallback: construct URL and navigate (if in a routing context)
      window.location.href = `/admin/projects/${projectId}`;
    }
  };

  const handleRemove = async () => {
    if (window.confirm('Are you sure you want to remove this project?')) {
      setIsRemoving(true);
      try {
        if (onRemove) {
          await onRemove(project._id);
        } else {
          await axios.delete(`${URL_API}/api/v1/project/deleteProject/${project._id}`, { withCredentials: true });
          alert('Project removed');
        }
      } catch (err) {
        console.error('Failed to remove project', err);
        alert('Failed to remove project');
      } finally {
        setIsRemoving(false);
      }
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6 flex flex-col gap-4">


      {/* Project Name Bar */}
      <div className="bg-[#087990] text-white px-4 py-2 rounded">
        <p className="text-[16px] font-semibold">{project.name || 'Name'}</p>
      </div>


      {/* PROJECT DETAILS */}
      <div className="flex flex-col gap-3">
        {/* Team Leader */}
        {teamLeaderName && (
          <div className="flex items-center justify-between">
            <span className="text-[16px] text-gray-700 font-semibold">
              Team Leader:
            </span>
            <span className="text-[16px] text-gray-800 font-medium">
              {teamLeaderName}
            </span>
          </div>
        )}

        {/* Progress */}
        <div className="flex items-center justify-between">
          <span className="text-[16px] text-gray-700 font-semibold">Progress :</span>
          <div className="flex items-center gap-2">
            <span className="text-[16px] font-medium text-gray-800">{progress}%</span>
            <div className="relative w-6 h-6">
              <svg className="w-6 h-6 transform -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="2"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="#087990"
                  strokeWidth="2"
                  strokeDasharray={`${progress}, 100`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Deadline */}
        <div className="flex items-center justify-between">
          <span className="text-[16px] text-gray-700 font-semibold">Deadline :</span>
          <span className="text-[16px] text-gray-800 font-medium">{formatDate(project.endDate)}</span>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-[16px] text-gray-700 font-semibold">Status :</span>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${getStatusColor(project.status)}`}></span>
            <span className="text-[16px] text-gray-800 font-medium capitalize">
              {project.status || 'Active'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-auto pt-2">
        <button
          onClick={handleRemove}
          disabled={isRemoving}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-[16px] font-medium transition-colors disabled:opacity-50"
        >
          {isRemoving ? 'Removing...' : 'Remove'}
        </button>
        <button
          onClick={() => handleViewDetails(project._id)}
          className="flex-1 bg-[#087990] hover:bg-[#066a7a] text-white px-4 py-2 rounded text-[16px] font-medium transition-colors"
        >
          View
        </button>
        <button
          onClick={() => setShowEdit(true)}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded text-[16px] font-medium transition-colors"
        >
          Edit
        </button>
      </div>
    </div>
      {showEdit && (
        <ProjectCardAdminEdit
          project={project}
          onClose={() => setShowEdit(false)}
          onUpdate={() => {
            setShowEdit(false);
            if (typeof window !== 'undefined') window.location.reload(); // or trigger parent refresh
          }}
        />
      )}
    </>
  );
}

export default ProjectCardAdmin;
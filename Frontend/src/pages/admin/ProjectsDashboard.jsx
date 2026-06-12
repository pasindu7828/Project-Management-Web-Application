import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectCard from './ProjectCardAdmin';
import CreateProjectModal from './CreateProjectForm';
import { getAllProjects, deleteProject } from '../../services/ProjectService';
import Sidebar from '../../components/sidebar/Sidebar';
import DashboardHeader from '../../components/DashboardHeader';

const ProjectsDashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllProjects();
      console.log(response)
      if (response.success) {
        setProjects(response.data || []);
      } else {
        setError('Failed to fetch projects');
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (projectId) => {
    try {
      const response = await deleteProject(projectId);
      if (response.success) {
        // Remove project from local state
        setProjects(projects.filter(p => p._id !== projectId));
      } else {
        alert('Failed to delete project');
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      alert(err.message || 'Failed to delete project');
    }
  };

  const handleView = (projectId) => {
    // Navigate to admin project details page
    navigate(`/admin/projects/${projectId}`);
  };

  const handleNewProject = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleProjectCreated = () => {
    // Refresh projects list after creating a new project
    fetchProjects();
  };

  return (
    <div className="flex min-h-screen bg-[#E5E7EB]">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader/>

      <div className="flex-1 p-6">
        {/* Main Content */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-[20px] font-bold text-gray-800">Projects Dashboard</h1>
          </div>
          <button
            onClick={handleNewProject}
            className="bg-[#087990] hover:bg-[#066a7a] text-white px-6 py-2 rounded-lg text-[16px] font-medium transition-colors mb-6 flex items-center gap-2"
          >
            <span>+</span>
            <span>New Project</span>
          </button>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-[16px] text-gray-600">Loading projects...</p>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-[16px] text-red-600">Error: {error}</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-[16px] text-gray-600">No projects available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project._id}
                project={project}
                onView={handleView}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}

        {/* Create Project Modal */}
        <CreateProjectModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSuccess={handleProjectCreated}
        />
      </div>
    </div>
    </div>
  );
};

export default ProjectsDashboard;
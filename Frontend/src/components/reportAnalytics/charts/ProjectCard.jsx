import { useNavigate } from "react-router-dom";

const statusStyles = {
  active: {
    badge: "bg-green-200 text-green-700",
    bar: "bg-green-500",
  },
  "on-hold": {
    badge: "bg-orange-100 text-green-700",
    bar: "bg-orange-500",
  },
  complete: {
    badge: "bg-blue-100 text-green-700",
    bar: "bg-blue-500",
  },
};

const ProjectCard = ({ project }) => {
  const navigate = useNavigate();

  const handleView = () => {
    navigate(`/user/project-team/${project.id}`, {state: {project}});
  };

  const status = statusStyles[project.status] || statusStyles.active;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex justify-between items-start bg-[#087990] text-white px-5 py-4 rounded-t-lg">
        <div>
          <h2 className="font-semibold text-lg">{project.name}</h2>
          <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded bg-white/20">
            Role: {project.role}
            </span>
        </div>
        <span className={`px-2 py-1 text-xs rounded ${status.badge}`}>
          {project.status}
        </span>
      </div>

      {/* Body */}
      <div className="px-5 py-4 text-sm text-gray-700 space-y-4">
        {/* Progress */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="font-medium">Progress</span>
            <span className="text-xs">{project.progress}%</span>

          </div>
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
            <div
              className={`h-2 ${status.bar}`}
              style={{ width: `${project.progress}%` }}
            />
          </div>
          {project.dueSoon > 0 && (
            <p className="text-xs text-orange-600 mt-4">
              Milestones due soon: {project.dueSoon}
            </p>
          )}

        </div>

        {/* Deadline */}
        <p>
          Deadline:{" "} 
          <span className="font-medium text-gray-900">
            {new Date(project.deadline).toLocaleDateString()}
          </span>
        </p>

        <div className="flex justify-end pt-2">
          {/* <span
            className={`w-4 h-4 rounded-full ${[project.status]}`}
            aria-label={project.status}
          ></span> */}
          <button
            onClick={handleView}
            className="px-4 py-2 rounded-md bg-[#087990] text-white text-sm hover:bg-teal-900"
          >
            View
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;

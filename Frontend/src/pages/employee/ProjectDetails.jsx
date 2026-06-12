import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import axios from "axios";
import Sidebar from "../../components/sidebar/Sidebar";
import TeamTab from "./TeamTab";
import OverviewTab from "./OverviewTab";
import DocumentsTab from "./DocumentsTab";
import MilestonesTab from "./MilestonesTab";
import useIsTeamLeader from "../../hooks/useIsTeamLeader";
import DashboardHeader from "../../components/DashboardHeader";

const TABS = ["overview", "team", "milestones", "documents"];

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [projectData, setProjectData] = useState(location.state?.project || null);
  const [pageLoading, setPageLoading] = useState(!projectData);
  const [milestones, setMilestones] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const projectId = projectData?._id || id;
  const {isTeamLeader, loading, currentUserId} = useIsTeamLeader(projectId);

  const URL_API = import.meta.env.VITE_API_BASE_URL;

  // dummy data – replace with real project data (fetched by id)
  useEffect(()=>{
    if (!projectData && id) {
      const fetchProject = async ()=>{
        try {
          const res = await axios.get(`${URL_API}/api/v1/project-team/getProject/${id}`, {
            withCredentials: true,
          });
          setProjectData(res.data.data);
        } catch (error) {
          console.error("Error fetching project details:", error);
          setProjectData(null);
        } finally {
          setPageLoading(false);
        }
      };
      fetchProject();
    }
    
  },[projectData, id]);

  const fetchMilestones = async ()=>{
    const res = await axios.get(
      `${URL_API}/api/v1/millestone/getAllMilestones/${projectId}`,
      { withCredentials: true }
    );

    const formatted = res.data.data.map(m => ({
      id: m._id,
      title: m.milestoneName,
      status: m.Status,
      endDate: m.End_Date,
    }));

    setMilestones(formatted);
  };

  const fetchTeamMembers = async () => {
    const res = await axios.get(
      `${URL_API}/api/v1/project-team/getMembers/${projectId}`,
      { withCredentials: true }
    );
  
    setTeamMembers(res.data.data);
  };

  useEffect(()=>{
    if (projectId) {
      fetchMilestones();
      fetchTeamMembers();
    }
  }, [projectId]);

  const handleDownloadReport = async () => {
    try {
      const res = await axios.get(
        `${URL_API}/api/v1/projects/projectReport/${projectId}`, // Need to change with real API
        {
          withCredentials: true,
          responseType: "blob", // IMPORTANT for file download
        }
      );
  
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
  
      const link = document.createElement("a");
      link.href = url;
      link.download = `${projectData.name}_Project_Report.pdf`;
      link.click();
  
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download report", error);
    }
  };
  


  const goBack = () => navigate("/user/project-team"); // back to projects page

  const statusColor = {
    active: "bg-green-500",
    "on-hold": "bg-orange-500",
    complete: "bg-red-500",
  };


  if (pageLoading) return <p className="p-6 text-center">Loading project details...</p>;
  if (!projectData) return <p className="p-6 text-center">Project data not found.</p>;
  if (loading) {
    return <p className="p-6 text-center">Checking permissions...</p>;
  }
  

  return (
    <div className="flex h-screen">
      {/* side bar */}
      <Sidebar/>
      <main className="flex-1 p-6 bg-gray-100">
        <DashboardHeader/>
        <div className="flex items-center justify-between m-4">
          <button
            onClick={goBack}
            className="px-6 py-2 border border-[#087990] text-[#087990] rounded-md hover:bg-[#087990]/50"
          >
            Back
          </button>

          <div className="text-center">
            <h1 className="text-xl font-semibold">{projectData.name}</h1>
          </div>

          <div className="text-right text-sm">
            <p>
              Role : <span className="font-medium">{projectData.role || projectData.assignedRole || "-"}</span>
            </p>
            <p>
              Deadline: <span className="font-medium">{new Date(projectData.deadline).toLocaleDateString() || "-"}</span>
            </p>

            {isTeamLeader && (
              <button
              onClick={handleDownloadReport}
              className="mt-4 px-4 py-1 gap-2 inline-flex border border-[#087990] text-[#087990] rounded-md hover:bg-[#087990]/50"
              >
                <Download size={14} />
                 Project Report
              </button>
            )}
          </div>
        </div>

      {/* Status row */}
        <div className="flex items-center justify-between border-b pb-3 mb-4 ml-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium">Status :</span>
            <span className={`w-3 h-3 rounded-full ${statusColor[projectData.status || "active"]}`}></span>
            <span className="capitalize">{projectData.status?.replace("-"," ")}</span>
          </div>
        </div>

      {/* Tabs */}
        <div className="mb-4 flex gap-4">
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            const label =
              tab.charAt(0).toUpperCase() + tab.slice(1).replace("-", " ");
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-full text-sm font-medium border ${
                  isActive
                    ? "bg-[#087990] text-white border-[#087990]"
                    : "bg-white text-[#087990] border-[#087990]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {activeTab === "overview" && (
          <OverviewTab 
          projectId={projectId}  
          projectData={projectData}
          milestones={milestones}
          teamMembers={teamMembers} 
          />
        )}

        {activeTab === "team" && (
          <TeamTab projectId={projectData._id || projectData.id} projectData={projectData} />
        )}

        {activeTab === "milestones" && (
          <MilestonesTab projectId={projectData._id || projectData.id} projectData={projectData} />
        )}

        {activeTab === "documents" && (
          <DocumentsTab projectId={projectData._id || projectData.id} projectData={projectData}/>
        )}
      </main>
    </div>
  );
};

export default ProjectDetails;

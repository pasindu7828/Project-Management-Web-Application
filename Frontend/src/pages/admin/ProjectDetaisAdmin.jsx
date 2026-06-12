import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../../components/sidebar/Sidebar";
import { getProject } from "../../services/ProjectService";
import { getAllMilestones } from "../../services/ProjectService";
import DashboardHeader from "../../components/DashboardHeader";

const ProjectDetailsAdmin = () => {
    // For description see more/less
    const [showFullDescription, setShowFullDescription] = useState(false);
    const DESCRIPTION_LIMIT = 10;
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("Overview");
    const [projectData, setProjectData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Milestone progress calculation (must be after projectData is defined)
    let completedMilestones = 0;
    let totalMilestones = 0;
    let milestoneProgress = 0;
    if (projectData && Array.isArray(projectData.milestones)) {
        totalMilestones = projectData.milestones.length;
        completedMilestones = projectData.milestones.filter(m => (m.Status || m.status || '').toLowerCase() === 'complete').length;
        milestoneProgress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
    }
    const [statusChanging, setStatusChanging] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [downloadingReport, setDownloadingReport] = useState(false);

    const URL_API = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
    let isMounted = true;

    const fetchAllData = async () => {
      setLoading(true);
      try {
        let project = null;

        // Fetch project
        try {
          const response = await getProject(id);
          project = response?.data || response;
        } catch {
          const res = await axios.get(
            `${URL_API}/api/v1/projects/getProject/${id}`,
            { withCredentials: true }
          );
          project = res?.data?.data;
        }

        if (!project) throw new Error("Project not found");

        // Fetch team
        let team = [];
        try {
          const res = await axios.get(
            `${URL_API}/api/v1/project-team/getMembers/${id}`,
            { withCredentials: true }
          );
          team = res?.data?.data || [];
        } catch (err) {
          console.warn("Team fetch failed", err);
        }

        // Fetch milestones
        let milestones = [];
        try {
          const res = await getAllMilestones(id);
          const allMilestones = res?.data?.data || res?.data || [];
          milestones = allMilestones.filter(
            (milestone) =>
              Array.isArray(milestone.projectID) &&
              milestone.projectID.some((pid) => String(pid) === String(id))
          );
        } catch (err) {
          console.warn("Milestone fetch failed", err);
        }

        // Fetch files
        let files = [];
        try {
          const res = await axios.get(
            `${URL_API}/api/v1/projects/${id}/attachments`,
            { withCredentials: true }
          );
          files = res?.data?.data || [];
        } catch (err) {
          console.warn("File fetch failed", err);
        }

        if (isMounted) {
          setProjectData({
            ...project,
            team,
            milestones,
            files,
          });
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setProjectData(null);
          setLoading(false);
        }
      }
    };

    fetchAllData();
    return () => (isMounted = false);
  }, [id]);


    const goBack = () => navigate("/admin/projects");

    const handleDeleteFile = async (attachmentId) => {
        if (!attachmentId) return;
        if (!window.confirm('Are you sure you want to delete this file?')) return;
        try {
            await axios.delete(`${URL_API}/api/v1/projects/${id}/attachments/${attachmentId}`, {
                withCredentials: true
            });
            // Refresh files list
            const res = await axios.get(`${URL_API}/api/v1/projects/${id}/attachments`, {
                withCredentials: true
            });
            const files = res?.data?.data || [];
            setProjectData(prev => ({ ...(prev || {}), files }));
            alert('File deleted successfully');
        } catch (err) {
            console.error('Failed to delete file:', err);
            alert('Failed to delete file');
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (!memberId) return;
        if (!window.confirm('Remove this member from project?')) return;
        try {
            await axios.delete(`${URL_API}/api/v1/project-team/removeMember`, 
                { 
                    data: { projectId: id, userId: memberId },
                    withCredentials: true 
                }
            );
            // refresh team
            const res = await axios.get(`${URL_API}/api/v1/project-team/getMembers/${id}`, { withCredentials: true });
            
            setProjectData(prev => ({ ...(prev || {}), team: res?.data?.data || [] }));
            
        } catch (err) {
            console.error('Failed to remove member:', err);
            alert('Failed to remove member');
        }
    };

    const handleUploadFile = () => {
        setShowUploadModal(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadFile(file);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files?.[0];
        if (file) {
            setUploadFile(file);
        }
    };

    const handleConfirmUpload = async () => {
        if (!uploadFile) {
            alert('Please select a file');
            return;
        }

        const validExtensions = ['pdf', 'docx', 'ppt', 'jpg', 'jpeg', 'png', 'zip'];
        const fileExtension = uploadFile.name.split('.').pop().toLowerCase();
        
        if (!validExtensions.includes(fileExtension)) {
            alert('Invalid file type. Allowed: PDF, DOCX, PPT, JPG, PNG, ZIP');
            return;
        }

        if (uploadFile.size > 10 * 1024 * 1024) { // 10MB
            alert('File size must be less than 10MB');
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('attachments', uploadFile);

            // Correct backend endpoint: /api/v1/projects/:projectId/attachments
            await axios.post(`${URL_API}/api/v1/projects/${id}/attachments`, formData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            alert('File uploaded successfully');
            setShowUploadModal(false);
            setUploadFile(null);
            
            // Refresh files list
            const res = await axios.get(`${URL_API}/api/v1/projects/${id}/attachments`, {
                withCredentials: true
            });
            const files = res?.data?.data || [];
            setProjectData(prev => ({ ...(prev || {}), files }));
        } catch (err) {
            console.error('Upload failed:', err);
            const errorMsg = err.response?.data?.message || 'Failed to upload file';
            alert(errorMsg);
        } finally {
            setUploading(false);
        }
    };

    const handleCancelUpload = () => {
        setShowUploadModal(false);
        setUploadFile(null);
    };

    const handleStatusChange = async (newStatus) => {
        if (!projectData._id) return;
        setStatusChanging(true);
        try {
            await axios.patch(`${URL_API}/api/v1/projects/updateProjectStatus/${projectData._id}`, 
                { status: newStatus }, 
                { withCredentials: true }
            );
            setProjectData(prev => ({ ...(prev || {}), status: newStatus }));
        } catch (err) {
            console.error('Failed to update project status:', err);
            alert('Failed to update project status');
        } finally {
            setStatusChanging(false);
        }
    };

    const handleDownloadReport = async () => {
        if (!projectData?._id) {
            alert('Project ID not found');
            return;
        }

        setDownloadingReport(true);
        try {
            const response = await axios.get(
                `${URL_API}/api/v1/projects/projectReport/${projectData._id}`,
                {
                    withCredentials: true,
                    responseType: 'blob'
                }
            );

            // Create a blob URL and trigger download
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `project-report-${projectData.name || projectData._id}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error('Failed to download report:', err);
            alert('Failed to download project report');
        } finally {
            setDownloadingReport(false);
        }
    };

    if (loading) return <p className="p-6 text-center">Loading project details...</p>;
    if (!projectData) return (
        <div className="p-6 text-center">
            <p className="text-red-600 font-semibold">Failed to load project details.</p>
            <button
                onClick={() => navigate("/admin/projects")}
                className="mt-4 px-4 py-2 bg-[#087990] text-white rounded-md hover:bg-[#066a7a]"
            >
                Back to Projects
            </button>
        </div>
    );

    const TABS = ["Overview", "Team", "Milestones", "Files"];

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />

            <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader/>

            <main className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto p-6">
                    {/* Header Section */}
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={goBack}
                            className="px-2 py-1 border-2 border-[#087990] text-[#087990] rounded-md hover:bg-[#087990] hover:text-white transition-colors font-medium"
                        >
                            Back
                        </button>

                        <h1 className="text-2xl font-bold text-gray-800">{projectData?.name || 'Project'}</h1>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleDownloadReport}
                                disabled={downloadingReport}
                                className="flex items-center gap-2 px-4 py-2 bg-[#087990] text-white rounded-md hover:bg-[#066a7a] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                {downloadingReport ? 'Downloading...' : 'Project Report'}
                            </button>
                            <div className="text-right text-sm">
                                <p className="text-gray-600">
                                    Deadline: <span className="font-semibold text-gray-800">{projectData?.endDate ? new Date(projectData.endDate).toLocaleDateString() : 'N/A'}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Status Row */}
                                        <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                                                <span className="font-medium text-gray-700 text-[18px]">Status :</span>
                                                <span className={`w-3 h-3 rounded-full inline-block mr-2 ${
                                                    projectData?.status?.toLowerCase() === 'active' ? 'bg-green-500' :
                                                    projectData?.status?.toLowerCase() === 'on-hold' ? 'bg-yellow-500' :
                                                    projectData?.status?.toLowerCase() === 'completed' ? 'bg-blue-500' :
                                                    'bg-gray-400'
                                                }`}></span>
                                                <span className="font-semibold text-gray-700 text-[18px] capitalize">
                                                    {projectData?.status ? projectData.status : 'Active'}
                                                </span>
                                        </div>

                    {/* Tabs */}
                    <div className="flex gap-3 mb-6 border-b pb-2">
                        {TABS.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-2 py-0.5 rounded-[20px] font-medium transition-all ${
                                    activeTab === tab
                                        ? "bg-[#087990] text-white shadow-md scale-105"
                                        : "bg-white text-[#087990] hover:bg-gray-100 "
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content - Only Active Tab Displayed */}
                    <div>
                        {/* Overview Tab */}
                        {activeTab === "Overview" && (
                            <section className="bg-white rounded-lg shadow-sm p-6">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-[#087990] inline-block">
                                    Overview
                                </h2>

                                {/* Progress Bar */}
                                <div className="mb-6 mt-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-sm font-medium text-gray-700">Progress:</span>
                                        <span className="text-sm font-semibold text-gray-800">
                                            {milestoneProgress}%
                                            {totalMilestones > 0 && (
                                                <span className="ml-2 text-xs text-gray-500">({completedMilestones} of {totalMilestones} milestones completed)</span>
                                            )}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 h-4 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#087990] transition-all duration-300"
                                            style={{ width: `${milestoneProgress}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Two Column Layout */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                    {/* Projects Summary */}
                                    <div className="border-l-4 border-[#087990] pl-4">
                                        <h3 className="font-semibold text-gray-800 mb-3">Projects Summary</h3>
                                        <div className="space-y-2 text-sm text-gray-700">
                                            <p><span className="font-medium">Project Name:</span> {projectData.name || 'N/A'}</p>
                                            <p>
                                                <span className="font-medium">Description:</span> {
                                                    projectData.description
                                                        ? (
                                                            projectData.description.length > DESCRIPTION_LIMIT && !showFullDescription
                                                                ? <>
                                                                    {projectData.description.slice(0, DESCRIPTION_LIMIT)}...
                                                                    <button
                                                                        className="ml-2 text-blue-600 underline cursor-pointer text-xs"
                                                                        onClick={() => setShowFullDescription(true)}
                                                                    >See more</button>
                                                                </>
                                                                : <>
                                                                    {projectData.description}
                                                                    {projectData.description.length > DESCRIPTION_LIMIT && (
                                                                        <button
                                                                            className="ml-2 text-blue-600 underline cursor-pointer text-xs"
                                                                            onClick={() => setShowFullDescription(false)}
                                                                        >See less</button>
                                                                    )}
                                                                </>
                                                        )
                                                        : 'N/A'
                                                }
                                            </p>
                                            <p><span className="font-medium">Start Date:</span> {projectData.startDate ? new Date(projectData.startDate).toLocaleDateString() : 'N/A'}</p>
                                            <p><span className="font-medium">End Date:</span> {projectData.endDate ? new Date(projectData.endDate).toLocaleDateString() : 'N/A'}</p>
                                        </div>
                                    </div>

                                    {/* Completed Milestones */}
                                    <div className="border-l-4 border-[#087990] pl-4">
                                        <h3 className="font-semibold text-gray-800 mb-3">Completed Milestones</h3>
                                        <div className="space-y-2 text-sm text-gray-700">
                                            {Array.isArray(projectData.milestones) && projectData.milestones.length > 0 ? (
                                                projectData.milestones
                                                    .filter(milestone => {
                                                        const status = (milestone.Status || milestone.status || '').toLowerCase();
                                                        return status === 'complete';
                                                    })
                                                    .map((milestone, idx) => (
                                                        <div key={idx} className="font-semibold text-black">
                                                            <span>{milestone.milestoneName || milestone.title || milestone.name}</span>
                                                            {milestone.End_Date || milestone.endDate ? (
                                                                <span> — <span className="text-green-700">Completed</span>: {new Date(milestone.End_Date || milestone.endDate).toLocaleDateString()}</span>
                                                            ) : null}
                                                            {/* Show who completed if available */}
                                                            {milestone.completedBy ? (
                                                                <span> — By: {Array.isArray(milestone.completedBy)
                                                                    ? milestone.completedBy.map((user, i) => `${user.FirstName || user.name || ''} ${user.LastName || ''}`).join(', ')
                                                                    : (milestone.completedBy.FirstName || milestone.completedBy.name || '') + ' ' + (milestone.completedBy.LastName || '')}
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    ))
                                            ) : (
                                                <p className="text-gray-500 italic">No completed milestones found.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Activity (Active Members) */}
                                <div className="border-l-4 border-[#087990] pl-4 mt-6">
                                    <h3 className="font-semibold text-gray-800 mb-3">Active Members</h3>
                                    <div className="space-y-2 text-sm text-gray-700">
                                        {Array.isArray(projectData.team) && projectData.team.length > 0 ? (
                                            projectData.team.map((member, idx) => (
                                                <p key={member._id || idx}>
                                                    {member.userId
                                                        ? `${member.userId.FirstName || ""} ${member.userId.LastName || ""}`.trim()
                                                        : "N/A"}
                                                    {member.assignedRole ? ` (${member.assignedRole})` : ""}
                                                </p>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 italic">No active members found.</p>
                                        )}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Team Tab */}
                        {activeTab === "Team" && (
                            <section className="bg-white rounded-lg shadow-sm p-6">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-[#087990] inline-block">
                                    Team
                                </h2>

                                {/* Team Leader */}
                                {projectData.teamLeaderId && (
                                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                                        <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Team Leader</h3>
                                        <p className="text-gray-700 mt-1 text-lg">{projectData.teamLeaderName || projectData.teamLeaderId}</p>
                                    </div>
                                )}

                                <div className="mt-6">
                                    <h3 className="font-semibold text-gray-800 mb-4">Project Team Members</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b-2 border-gray-200">
                                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                                                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {projectData.team?.map((member, idx) => (
                                                    <tr key={member._id || idx} className="border-b border-gray-100 hover:bg-gray-50">
                                                        <td className="py-3 px-4 text-gray-800">{member.userId
                                ? `${member.userId.FirstName || ""} ${
                                    member.userId.LastName || ""
                                  }`.trim()
                                : "N/A"}</td>
                                                        <td className="py-3 px-4 text-gray-700">{member.assignedRole || 'N/A'}</td>
                                                        <td className="py-3 px-4 text-right">
                                                            <button
                                                                onClick={() => handleRemoveMember(member.userId?._id || member._id)}
                                                                className="px-4 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm font-medium"
                                                            >
                                                                Remove
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </section>
                        )}

                         {/* Milestones Tab */}
            {activeTab === "Milestones" && (
              <section className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-2 border-b-2 border-[#087990] inline-block">
                  Milestones
                </h2>

                <div className="mt-6 space-y-4">
                  {Array.isArray(projectData.milestones) &&
                  projectData.milestones.length > 0 ? (
                    projectData.milestones.map((milestone) => {
                      // If you want to check assigned user, implement logic here
                      // const currentUserId = "actualUserIdHere";
                      // const assignedToYou = milestone.assignedTo?.some(u => u._id === currentUserId);

                      return (
                        <div
                          key={milestone._id}
                          className="border-2 border-[#087990] rounded-lg p-5 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-800 mb-3 text-lg">
                                {milestone.milestoneName || "Unnamed Milestone"}
                              </h3>

                                {/* Description */}
                                <p className="text-sm text-gray-600 mb-3">
                                  <span className="font-medium">
                                    Description:
                                  </span>{" "}
                                  {milestone.Description ||
                                    "No description provided"}
                                </p>

                              <div className="space-y-1.5 text-sm text-gray-700">
                                <p>
                                  <span className="font-medium">
                                    Start Date:
                                  </span>{" "}
                                  {milestone.Start_Date
                                    ? new Date(
                                        milestone.Start_Date
                                      ).toLocaleDateString()
                                    : "N/A"}
                                </p>
                                <p>
                                  <span className="font-medium">End Date:</span>{" "}
                                  {milestone.End_Date
                                    ? new Date(
                                        milestone.End_Date
                                      ).toLocaleDateString()
                                    : "N/A"}
                                </p>
                                <p>
                                  <span className="font-medium">
                                    Assigned To You:
                                  </span>{" "}
                                  {/* assignedToYou ? "Yes" : "No" */ "—"}
                                </p>

                                {/* Status */}
                                <p>
                                  <span className="font-medium">Status:</span>{" "}
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-semibold
                ${
                  milestone.Status === "Complete"
                    ? "bg-green-100 text-green-700"
                    : milestone.Status === "In Progress"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-700"
                }`}
                                  >
                                    {milestone.Status || "Unknown"}
                                  </span>
                                </p>
                              </div>
                            </div>
                            
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 italic">
                      No milestones found for this project.
                    </p>
                  )}
                </div>
              </section>
            )}

                        {/* Files Tab */}
                        {activeTab === "Files" && (
                            <section className="bg-white rounded-lg shadow-sm p-6">
                                <div className="flex items-center justify-between mb-4 pb-2 border-b">
                                    <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-[#087990] inline-block pb-2">
                                        Files
                                    </h2>
                                    <button
                                        onClick={handleUploadFile}
                                        className="px-4 py-2 bg-[#087990] text-white rounded-md hover:bg-[#076a7a] transition-colors text-sm font-medium"
                                    >
                                        Upload File
                                    </button>
                                </div>

                                <div className="mt-6 overflow-x-auto">
                                    {!projectData.files || projectData.files.length === 0 ? (
                                        <p className="text-center text-gray-500 py-8">No files uploaded yet</p>
                                    ) : (
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b-2 border-gray-200">
                                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">File Name</th>
                                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Size</th>
                                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                                                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {projectData.files.map((file) => (
                                                    <tr key={file._id} className="border-b border-gray-100 hover:bg-gray-50">
                                                        <td className="py-3 px-4 text-gray-800 font-medium">{file.originalName || file.filename}</td>
                                                        <td className="py-3 px-4 text-gray-700">{(file.fileSize / 1024 / 1024).toFixed(2)} MB</td>
                                                        <td className="py-3 px-4 text-gray-700">{new Date(file.createdAt).toLocaleDateString()}</td>
                                                        <td className="py-3 px-4 text-right">
                                                            <div className="flex gap-2 justify-end">
                                                                <a
                                                                    href={`${URL_API}/api/v1/projects/${id}/attachments/file/${file._id}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="px-3 py-1.5 bg-[#087990] text-white rounded-md hover:bg-[#076a7a] transition-colors text-sm font-medium"
                                                                >
                                                                    View
                                                                </a>
                                                                <button
                                                                    onClick={() => handleDeleteFile(file._id)}
                                                                    className="px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm font-medium"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </main>

            {/* Upload File Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">Upload Files</h2>
                        <p className="text-gray-600 text-sm mb-6">Add project-related documents and files</p>

                        {/* Drag and Drop Area */}
                        <div
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                            <div className="flex flex-col items-center">
                                <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                </svg>
                                <p className="text-gray-700 font-medium mb-1">Drag & drop files here</p>
                                <p className="text-gray-500 text-sm mb-4">or</p>
                                <label className="px-4 py-2 bg-[#087990] text-white rounded-md hover:bg-[#076a7a] transition-colors text-sm font-medium cursor-pointer">
                                    Browse File
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        accept=".pdf,.docx,.ppt,.jpg,.jpeg,.png,.zip"
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Selected File Info */}
                        {uploadFile && (
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                                <p className="text-sm text-gray-700">
                                    <span className="font-medium">Selected:</span> {uploadFile.name}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                    Size: {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        )}

                        {/* File Requirements */}
                        <p className="text-xs text-gray-600 text-center mb-6">
                            Max size: 10MB | Allowed: PDF, DOCX, PPT, JPG, PNG, ZIP
                        </p>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleCancelUpload}
                                disabled={uploading}
                                className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmUpload}
                                disabled={uploading || !uploadFile}
                                className="flex-1 px-4 py-2 bg-[#087990] text-white rounded-md hover:bg-[#076a7a] transition-colors font-medium disabled:opacity-50"
                            >
                                {uploading ? 'Uploading...' : 'Upload'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
        </div>
    );
};

export default ProjectDetailsAdmin;

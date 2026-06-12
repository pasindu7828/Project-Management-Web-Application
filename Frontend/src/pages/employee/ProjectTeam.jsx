import { useEffect, useState } from "react";
import axios from "axios";
import React from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import jwtDecode from "jwt-decode";
import ProjectCard from "../../components/reportAnalytics/charts/ProjectCard";
import DashboardHeader from "../../components/DashboardHeader";

const calculateProjectSummary = (milestones) => {
  const today = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(today.getDate() + 7);

  const total = milestones.length;
  const completed = milestones.filter(m => m.Status === "Complete").length;

  const progress = total === 0 ? 0 : Math.round ((completed/total) * 100);

  const dueSoon = milestones.filter(m => {
    if (!m.End_Date || m.Status === "Complete") return false;
    const deadline = new Date(m.End_Date);
    return deadline >= today && deadline <= sevenDaysFromNow;
  }).length;

  return { progress, dueSoon };
};

const ProjectTeam = () => {

    const [projects, setProjects] = useState([]);
    const [statusFilter, setStatusFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    

    const URL_API = import.meta.env.VITE_API_BASE_URL;

    useEffect(()=>{

      const token = localStorage.getItem("token");
      console.log(token);
      if (!token){
        console.warn("No token found, cannot fetch projects.");
        setLoading(false);
        return;
      }

      let userId;
      try{
        const decoded = jwtDecode(token);
        userId = decoded.userid;
        console.log(decoded);
      } catch(err){
        console.warn("Failed to decode JWT:", err);
        setLoading(false);
        return;
      }


      if (!userId){
        console.warn("User ID missing in token.");
        setLoading(false);
        return;
      }
        
      //fetch projects
      fetchProjects(userId);

    },[]);

   
    const fetchProjects = async(userId) =>{
      //Fetch projects
      try {
        const res = await axios.get(  
          `${URL_API}/api/v1/project-team/getProjects/${userId}`,
          {
            withCredentials:true
          } ) ;

          const rawProjects = Array.isArray(res.data.data)
            ? res.data.data
                .filter((p)=> p.projectId)
                : [];

          const enrichedProjects = await Promise.all(
            rawProjects.map(async (p)=> {
              try {
                const milestoneRes = await axios.get(
                  `${URL_API}/api/v1/millestone/getAllMilestones/${p.projectId._id}`,
                  { withCredentials: true }
                );

                const milestones = milestoneRes.data.data || [];
                const summary = calculateProjectSummary(milestones);

                return {
                  id: p.projectId._id,
                  name: p.projectId.name,
                  role: p.assignedRole,
                  description: p.projectId.description,
                  deadline: p.projectId.endDate || "-",
                  status: p.projectId.status || "active",
                  progress: summary.progress,
                  dueSoon: summary.dueSoon,
                };

              } catch (error) {
                console.warn("Failed to fetch milestones for project:", p.projectId._id);
                return {
                  id: p.projectId._id,
                  name: p.projectId.name,
                  role: p.assignedRole,
                  description: p.projectId.description,
                  status: p.projectId.status || "active",
                  progress: 0,
                  dueSoon: 0,
                };
              }
            })
          );
      
        // console.log("Full response:", res.data);
        setProjects(enrichedProjects);
        // console.log("Mapped projects:", enrichedProjects);

      } catch (error) {
        console.error("Error fetching projects:", error.response?.data || error);
        setProjects([]);       
      } finally {
        setLoading(false);
      }
    }

    const filteredProjects = Array.isArray(projects)
  ? projects.filter((project) => {
      // example: filter by assignedRole
      return statusFilter === "all" || project.status === statusFilter;
    })
  : [];

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-6 bg-gray-100">
        <DashboardHeader/>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Project Team</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p>Welcome to the project team page!</p>
        </div>
        <div className="flex flex-wrap justify-start gap-4 mb-6 ml-8 mx-auto">

           

        {/* Status Dropdown */}
        <div className="relative w-34 m-6">
            <select
            value={statusFilter}
            onChange={(e)=> setStatusFilter(e.target.value)}
             className="w-full px-3 py-2 border rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#087990]">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="on-hold">On Hold</option>
            <option value="completed">Completed</option>
            </select>
        </div>
      </div>

      
        {/* Display Project cards*/}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-16 max-w-3xl mx-auto">
        {loading ? (
          <p className="text-center col-span-2">Loading projects...</p>
        ): filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))
        ): (<p className="text-center text-gray-500 col-span-2">No projects found.</p>)}
        
      </div>

      </main>
    </div>
  );
};

export default ProjectTeam;

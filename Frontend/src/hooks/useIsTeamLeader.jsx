import { useEffect, useState } from "react";
import axios from "axios";
import jwtDecode from "jwt-decode";

const URL_API = import.meta.env.VITE_API_BASE_URL;

// const getToken = () =>
//   document.cookie
//     .split(";")
//     .find(c => c.trim().startsWith("access_token="))
//     ?.split("=")[1] || null;

const useIsTeamLeader = (projectId) => {
  const [isTeamLeader, setIsTeamLeader] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const checkTeamLeader = async () => {
      try {
        if (!projectId) {
          setLoading(false);
          return;
        } 

        const token = localStorage.getItem("token");
        if (!token) {
          setLoading(false);
          return;
        } 

        const payload = jwtDecode(token);
        const userId = payload.userid;
        setCurrentUserId(userId);
        

        const res = await axios.get(
          `${URL_API}/api/v1/projects/getProject/${projectId}`,
          { withCredentials: true }
        );
        
        const teamLeaderId = res.data?.data?.teamLeader?._id;

        setIsTeamLeader(
          teamLeaderId && teamLeaderId.toString() === userId.toString()
        );
        if (!projectId || !token){
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error("useIsTeamLeader error:", error);
        setIsTeamLeader(false);
      } finally {
        setLoading(false);
      }
      
    };
    

    checkTeamLeader();
  }, [projectId]);

  return { isTeamLeader, loading, currentUserId };
};

export default useIsTeamLeader;

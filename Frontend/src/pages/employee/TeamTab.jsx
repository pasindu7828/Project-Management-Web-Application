import { useEffect, useState } from "react";
import AddMemberModal from "./AddMemberModal";
import axios from "axios";
import Toast from "../../components/Toast";
import useIsTeamLeader from "../../hooks/useIsTeamLeader";
import { Trash2 } from "lucide-react";




const URL_API = import.meta.env.VITE_API_BASE_URL;

const TeamTab = ({projectId, projectData}) => {
    const projectRole = projectData?.role || projectData?.assignedRole;
  const [team, setTeam] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState([]);  // All user for Dropdown
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [toast, setToast] = useState(null);
  const { isTeamLeader, loading, currentUserId } = useIsTeamLeader(projectId);

  const roleStyles = {
    "Team Leader": "bg-blue-100 text-blue-700",
    "Team Lead": "bg-blue-100 text-blue-700",
    "Member": "bg-gray-100 text-gray-700",
  };


  // Fetch current team members
  const fetchMembers = async ()=>{
    try {
      const res = await axios.get(`${URL_API}/api/v1/project-team/getMembers/${projectId}`,{
        withCredentials: true,
      });
      setTeam(res.data.data || []);
      // console.log("Members: ", res);
    } catch (error) {
      console.error("Failed to fetch team members:", error);
    }
  };

  useEffect(()=>{
    fetchMembers();
  },[projectId]);



  // Fetech all users for AddMemberModel
  useEffect(()=>{
    const fetchUser = async ()=>{
      try {
        const res = await axios.get(`${URL_API}/api/v1/project-team/all`,{withCredentials: true});
        setUsers(res.data.data || []);
        
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };
    fetchUser();
  },[]);

  //Add Member
  const handleAddMember = async (member) => {
    try {
      await axios.post(
        `${URL_API}/api/v1/project-team/addMember`,
        {projectId, userId:member.id, assignedRole: member.role},
        { withCredentials: true}
      );
      fetchMembers();
      setToast({ message: "Member added successfully", type: "success" });
      setIsModalOpen(false);
    } catch (error) {
      setToast({ message: "Failed to add member", type: "error" });
      console.error("Failed to add member:", error);
    }
    
  };

  // Remove member
  const handleConfirmRemove = async (id) => {
    try {
      await axios.delete(`${URL_API}/api/v1/project-team/removeMember`,{
        data: {projectId, userId:id},
        withCredentials: true,
      });
      setToast({ message: "Member removed successfully", type: "success" });
      fetchMembers();
    } catch (error) {
      setToast({ message: "Failed to remove member", type: "error" });
      console.error("Failed to remove member:", error);
    } finally {
      setConfirmRemove(null);
    }
    
  };
  
  if (loading) {
    return <p className="p-6 text-center">Checking permissions...</p>;
  }
  

  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <h2 className="text-lg font-semibold ml-6">Project Team</h2>

        {isTeamLeader && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-md bg-[#087990] text-white text-sm hover:bg-teal-900"
          >
            + Add Members
          </button>
        )}
      </div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="bg-white border rounded-md shadow-sm max-w-4xl m-6">
        <div className="px-6 py-3 border-b font-semibold text-sm grid grid-cols-3 text-center">
            <span>Name</span>
            <span>Role</span>
            <span>Actions</span>
        </div>
        
        {team.length === 0 && (
          <p className="px-6 py-6 text-center text-gray-500 text-sm">
            No team members added yet.
          </p>
        )}
        {team.map((member) => (
          <div
            key={member._id}
            className="grid grid-cols-3 items-center px-6 py-3 border-t text-sm hover:bg-gray-50 transition"
          >
            <span className="font-medium text-center">
                {member.userId
                  ?`${member.userId.FirstName} ${member.userId.LastName}`: "Unknown"}
            </span>
            <span 
            className={`px-3 py-1 rounded-full text-center text-xs font-medium ${
              roleStyles[member.assignedRole] || "bg-gray-100 text-gray-700"
            }`}
            >
              {member.assignedRole}
            </span>

            <div className="flex justify-center">
              {isTeamLeader && (
                <button
                  onClick={() => setConfirmRemove({
                    id: member.userId._id,
                    name: `${member.userId.FirstName} ${member.userId.LastName}`,
                  })}
                  className="p-2 rounded hover:bg-gray-100 hover:text-red-500 text-[#087990]"
                  title="Remove"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <AddMemberModal
          onClose={() => setIsModalOpen(false)}
          onSave={handleAddMember}
          
        />
      )}

      {confirmRemove && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white rounded-md shadow-xl w-96 p-6">
            <h3 className="text-lg font-semibold mb-4">
              Remove Member
            </h3>
            <p className="mb-6">
              Are you sure you want to remove <span className="font-medium">{confirmRemove.name}</span> from the project?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setConfirmRemove(null)}
                className="px-4 py-2 rounded-md border text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmRemove(confirmRemove.id)}
                className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TeamTab;

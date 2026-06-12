import axios from "axios";
import { useEffect, useState } from "react";


const roles = ["Developer", "Design", "QA", "Manager"];

const AddMemberModal = ({ onClose, onSave }) => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("Developer");

  const URL_API = import.meta.env.VITE_API_BASE_URL;


  useEffect(()=>{
    const fetchUser = async ()=>{
      try {
        const res = await axios.get(`${URL_API}/api/v1/project-team/all`,{withCredentials: true});
        setUsers(res.data.data || []);
        // console.log("Users: ", res);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };
    fetchUser();
  },[]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const user = users.find((u) => u._id === selectedUserId);
    if (!user) return;


    onSave({
      id: user._id,
      role: selectedRole,
    });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-md shadow-xl w-full max-w-xl">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-center">
            Assign Team Members
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 text-sm">
          {/* Username & email */}
          <div className="mb-5">
            <label className="block mb-1 font-medium">
              Username &amp; E-mail
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-1/2 border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-[#087990]"
              required
            >
              <option value="">Select User</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.FirstName} {user.LastName} ({user.email})
                </option>
              ))}
            </select>
          </div>

          {/* Role */}
          <div className="mb-8">
            <label className="block mb-1 font-medium">Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-1/2 border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-[#087990]"
            >
              {roles.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-4 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-md border border-gray-300 text-gray-700 text-sm bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-md bg-[#087990] text-white text-sm hover:bg-teal-900"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMemberModal;

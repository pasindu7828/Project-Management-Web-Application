import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/sidebar/Sidebar";
import { Search, Bell, Edit2 } from "lucide-react";
import axios from "axios";

const UserProfileEdit = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [originalProfile, setOriginalProfile] = useState(null);
  const [profile, setProfile] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/v1/employee/getSingleEmployee`, { withCredentials: true });
        
        if (response.data?.success && response.data?.user) {
          const user = response.data.user;
          const roleMap = { 1: 'Employee', 2: 'Manager', 3: 'Admin' };
          
          const profileData = {
            _id: user._id,
            userId: user.EmployeeID || user._id,
            firstName: user.FirstName || '',
            lastName: user.LastName || '',
            name: `${user.FirstName || ''} ${user.LastName || ''}`.trim(),
            role: roleMap[user.role] || 'Employee',
            roleValue: user.role,
            departmentId: user.departmentID?._id || user.departmentID || '',
            departmentName: user.departmentID?.name || user.departmentID?.DepartmentName || 'N/A',
            email: user.email || '',
            contactNumber: user.ContactNumber || '',
            nic: user.NIC || '',
            gender: user.Gender || '',
            status: user.status || 'Active',
            avatar: "https://icon-library.com/images/male-avatar-icon/male-avatar-icon-8.jpg"
          };
          
          setProfile(profileData);
          setOriginalProfile(profileData);
        } else {
          setError('Failed to load profile');
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setError(error?.response?.data?.message || 'Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setProfile((prev) => ({ ...prev, avatar: previewUrl }));
    setEditingField(null);
  };

  const handleInputChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditClick = (field) => {
    setEditingField(field);
  };

  const handleSaveChanges = async () => {
    if (!profile?._id) {
      alert('Cannot update profile. User ID not found.');
      return;
    }

    try {
      setSaving(true);
      
      // Prepare update payload - only send fields that can be updated
      const payload = {
        ContactNumber: profile.contactNumber || originalProfile.contactNumber,
        email: profile.email
      };

      const response = await axios.patch(
        `${API_URL}/api/v1/employee/updateEmployee/${profile._id}`,
        payload,
        { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
      );
      
      if (response.data?.success) {
        alert("Profile updated successfully!");
        navigate("/user/profile");
      } else {
        alert(response.data?.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert(error?.response?.data?.message || "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setProfile(originalProfile);
    setEditingField(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Search Bar */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087990]"
                />
              </div>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-6 h-6 text-[#087990]" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800">{profile?.name || 'User'}</p>
                  <p className="text-xs text-gray-500">{profile?.role || 'Employee'}</p>
                </div>
                <img
                  src={profile?.avatar || "https://icon-library.com/images/male-avatar-icon/male-avatar-icon-8.jpg"}
                  alt="User Avatar"
                  className="w-10 h-10 rounded-full border-2 border-[#087990] object-cover"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Profile Edit Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Profile Edit</h1>
            
            {loading && (
              <div className="flex justify-center items-center h-64">
                <p className="text-gray-600">Loading profile...</p>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-700">{error}</p>
              </div>
            )}
            
            {!loading && !error && profile && (
            
            <div className="flex gap-8">
              {/* Left Profile Card */}
              <div className="w-80 h-[600px] rounded-3xl bg-gradient-to-br from-[#0a7d91] to-[#0b9fb8] text-white flex flex-col items-center justify-center shadow-2xl relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute top-10 right-10 w-32 h-32 bg-white opacity-10 rounded-full"></div>
                <div className="absolute bottom-20 left-5 w-20 h-20 bg-white opacity-10 rounded-full"></div>
                
                <div className="relative z-10 flex flex-col items-center">
                  <div className="relative">
                    <img
                      src={profile.avatar}
                      alt="Profile"
                      className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={handleAvatarClick}
                      className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md cursor-pointer hover:bg-gray-100 transition-colors"
                      aria-label="Upload profile picture"
                    >
                      <span className="text-2xl">📷</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>
                  
                  <h2 className="mt-6 text-2xl font-bold">{profile.name}</h2>
                  <p className="text-base opacity-90 mt-1">{profile.role}</p>
                </div>
              </div>

              {/* Right Edit Form Card */}
              <div className="flex-1 rounded-3xl bg-white p-8 shadow-lg">
                <div className="space-y-5">
                  {/* Employee ID - Read Only */}
                  <div className="flex flex-col">
                    <label className="text-sm text-gray-500 mb-2 font-medium">

                      Employee ID
                    </label>
                    <input
                      type="text"
                      value={profile.userId}
                      disabled
                      className="w-full rounded-xl border border-gray-300 px-5 py-3 bg-gray-50 text-gray-700 font-medium text-lg focus:outline-none cursor-not-allowed"
                    />
                  </div>

                  {/* Name - Read Only */}
                  <div className="flex flex-col">
                    <label className="text-sm text-gray-500 mb-2 font-medium">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profile.name}
                      disabled
                      className="w-full rounded-xl border border-gray-300 px-5 py-3 bg-gray-50 text-gray-700 font-medium text-lg focus:outline-none cursor-not-allowed"
                    />
                  </div>

                  {/* Role - Read Only */}
                  <div className="flex flex-col">
                    <label className="text-sm text-gray-500 mb-2 font-medium">
                      Role
                    </label>
                    <input
                      type="text"
                      value={profile.role}
                      disabled
                      className="w-full rounded-xl border border-gray-300 px-5 py-3 bg-gray-50 text-gray-700 font-medium text-lg focus:outline-none cursor-not-allowed"
                    />
                  </div>

                  {/* Department - Read Only */}
                  <div className="flex flex-col">
                    <label className="text-sm text-gray-500 mb-2 font-medium">
                      Department
                    </label>
                    <input
                      type="text"
                      value={profile.departmentName}
                      disabled
                      className="w-full rounded-xl border border-gray-300 px-5 py-3 bg-gray-50 text-gray-700 font-medium text-lg focus:outline-none cursor-not-allowed"
                    />
                  </div>

                  {/* Email - Always Editable */}
                  <div className="flex flex-col">
                    <label className="text-sm text-gray-500 mb-2 font-medium">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      //onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-5 py-3 text-gray-700 font-medium text-lg focus:outline-none focus:ring-2 focus:ring-[#087990] bg-white"
                    />
                  </div>

                  {/* Contact Number - Editable */}
                  <div className="flex flex-col">
                    <label className="text-sm text-gray-500 mb-2 font-medium">
                      Contact Number

                    </label>
                    <input
                      type="text"
                      value={profile.userId}
                      disabled
                      className="w-full rounded-xl border border-gray-300 px-5 py-3 bg-gray-50 text-gray-700 font-medium text-lg focus:outline-none cursor-not-allowed"
                    />
                  </div>

                  {/* Name - Read Only */}
                  <div className="flex flex-col">
                    <label className="text-sm text-gray-500 mb-2 font-medium">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profile.name}
                      disabled
                      className="w-full rounded-xl border border-gray-300 px-5 py-3 bg-gray-50 text-gray-700 font-medium text-lg focus:outline-none cursor-not-allowed"
                    />
                  </div>

                  {/* Role - Read Only */}
                  <div className="flex flex-col">
                    <label className="text-sm text-gray-500 mb-2 font-medium">
                      Role
                    </label>
                    <input
                      type="text"
                      value={profile.role}
                      disabled
                      className="w-full rounded-xl border border-gray-300 px-5 py-3 bg-gray-50 text-gray-700 font-medium text-lg focus:outline-none cursor-not-allowed"
                    />
                  </div>

                  {/* Department - Read Only */}
                  <div className="flex flex-col">
                    <label className="text-sm text-gray-500 mb-2 font-medium">
                      Department
                    </label>
                    <input
                      type="text"
                      value={profile.departmentName}
                      disabled
                      className="w-full rounded-xl border border-gray-300 px-5 py-3 bg-gray-50 text-gray-700 font-medium text-lg focus:outline-none cursor-not-allowed"
                    />
                  </div>

                  {/* Email - Always Editable */}
                  <div className="flex flex-col">
                    <label className="text-sm text-gray-500 mb-2 font-medium">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-5 py-3 text-gray-700 font-medium text-lg focus:outline-none focus:ring-2 focus:ring-[#087990] bg-white"
                    />
                  </div>

                  {/* Contact Number - Editable */}
                  <div className="flex flex-col">
                    <label className="text-sm text-gray-500 mb-2 font-medium">
                      Contact Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={profile.contactNumber}
                        onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                        disabled={editingField !== 'contactNumber'}
                        className={`w-full rounded-xl border border-gray-300 px-5 py-3 pr-12 text-gray-700 font-medium text-lg focus:outline-none focus:ring-2 focus:ring-[#087990] ${
                          editingField !== 'contactNumber' ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => handleEditClick('contactNumber')}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#087990] transition-colors"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={handleSaveChanges}
                      disabled={saving}
                      className="flex-1 rounded-xl bg-[#0a7d91] px-6 py-3 font-semibold text-white hover:bg-[#096b7d] transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Saving...' : 'Save All Changes'}
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-8 rounded-xl border-2 border-[#0a7d91] text-[#0a7d91] px-6 py-3 font-semibold hover:bg-[#0a7d91] hover:text-white transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserProfileEdit;

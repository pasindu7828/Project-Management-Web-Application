import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Search,
  Megaphone,
  Plus,
  List,
  Check,
  Share,
  Paperclip,
  Calendar,
  ChevronDown,
  Pin,
} from "lucide-react";

import Sidebar from "../components/sidebar/Sidebar";
import api from "../api/axios";

const PRIMARY = "#087990";
const DELETE_COLOR = "#E53E3E";

const AnnouncementsManagement = () => {
  const navigate = useNavigate();

  const [showAll, setShowAll] = useState(false);
  const [selectedAll, setSelectedAll] = useState("All");
  const [selectedDate, setSelectedDate] = useState("");
  const [pinnedAnnouncements, setPinnedAnnouncements] = useState([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);

  // NEW: logged in user role
  const [isAdmin, setIsAdmin] = useState(false);

  // Use env base URL (Vite)
  const base = import.meta.env.VITE_API_BASE_URL;

  // ================= FETCH LOGGED USER =================
  const fetchLoggedUser = async () => {
    try {
      // This endpoint should return logged-in user info (same one you used in profile)
      const res = await api.get(`${base}/api/v1/employee/getSingleEmployee`, {
        withCredentials: true,
      });

      const user = res.data?.user;
      const role = user?.role;

      setIsAdmin(Number(role) === 3); // role 3 => admin
    } catch (err) {
      console.error("Failed to fetch logged user:", err);
      setIsAdmin(false);
    }
  };

  // ================= FETCH ANNOUNCEMENTS =================
  const fetchAnnouncements = async () => {
    try {
      setLoading(true);

      const res = await api.get(`${base}/api/v1/announcement/getAnnouncements`, {
        withCredentials: true,
      });

      const data = res.data?.data || [];
      setPinnedAnnouncements(data.filter((a) => a.isPinned));
      setRecentAnnouncements(data.filter((a) => !a.isPinned));
    } catch (err) {
      console.error("Failed to fetch announcements:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoggedUser();
    fetchAnnouncements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ================= ACTIONS =================
  const handleDelete = async (id) => {
    if (!isAdmin) {
      alert("Only admins can delete announcements.");
      return;
    }

    if (!window.confirm("Delete this announcement?")) return;

    try {
      await api.delete(`${base}/api/v1/announcement/deleteAnnouncement/${id}`, {
        withCredentials: true,
      });
      fetchAnnouncements();
    } catch (err) {
      console.error("Delete failed:", err);
      alert(err?.response?.data?.message || "Failed to delete announcement");
    }
  };

  const handleLike = async (id) => {
    try {
      await api.put(`${base}/api/v1/announcement/like/${id}`, null, {
        withCredentials: true,
      });
      fetchAnnouncements();
    } catch (err) {
      console.error("Like failed:", err);
    }
  };

  const handleShare = (title) => {
    navigator.clipboard.writeText(title);
    alert("Announcement copied to clipboard");
  };

  const handleMarkRead = () => {
    alert("Mark as Read handled via notifications");
  };

  const handleViewDetails = (id) => {
    navigate(`/announcement-detail/${id}`);
  };

  // ================= UI =================
  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        {/* HEADER ... keep same */}

        <main className="p-6 flex-1 overflow-auto">
          {/* PINNED */}
          <div className="flex items-center gap-2 mb-4">
            <Pin size={18} />
            <h2 className="text-lg font-semibold">Pinned Announcements</h2>
          </div>

          {pinnedAnnouncements.map((item) => (
            <div
              key={item.announcementId}
              className="bg-white border rounded-xl p-6 mb-4"
            >
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-sm mb-3">{item.message}</p>

              <div className="flex gap-4 text-sm text-gray-500 mb-4">
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Paperclip size={14} />
                  {item.attachments?.length || 0}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <button
                  onClick={() => handleViewDetails(item.announcementId)}
                  className="flex items-center gap-2 px-4 py-2 border rounded-lg"
                  style={{ borderColor: PRIMARY, color: PRIMARY }}
                >
                  View Details
                </button>

                <button
                  onClick={handleMarkRead}
                  className="flex items-center gap-2 px-4 py-2 border rounded-lg"
                  style={{ borderColor: PRIMARY, color: PRIMARY }}
                >
                  <Check size={16} /> Mark as Read
                </button>

                <button
                  onClick={() => handleShare(item.title)}
                  className="flex items-center gap-2 px-5 py-2 text-white rounded-lg"
                  style={{ backgroundColor: PRIMARY }}
                >
                  <Share size={16} /> Share
                </button>

                {/* OPTIONAL: show delete on pinned too (admin only) */}
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(item.announcementId)}
                    className="flex items-center gap-2 px-5 py-2 border rounded-lg"
                    style={{ borderColor: DELETE_COLOR, color: DELETE_COLOR }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* RECENT */}
          <h2 className="text-lg font-semibold mb-4">Recent Announcements</h2>

          <div className="grid grid-cols-2 gap-4">
            {recentAnnouncements.map((item) => (
              <div
                key={item.announcementId}
                className="bg-white border rounded-xl p-5"
              >
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm mb-3">{item.message}</p>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewDetails(item.announcementId)}
                    className="w-full px-4 py-2 border rounded-lg"
                    style={{ borderColor: PRIMARY, color: PRIMARY }}
                  >
                    View Details
                  </button>

                  <button
                    onClick={() => handleLike(item.announcementId)}
                    className="w-full px-4 py-2 border rounded-lg"
                    style={{ borderColor: PRIMARY, color: PRIMARY }}
                  >
                    👍 Like ({item.likesCount || 0})
                  </button>

                  {/* Delete button only for admin */}
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(item.announcementId)}
                      className="px-4 py-2 border rounded-lg"
                      style={{ borderColor: DELETE_COLOR, color: DELETE_COLOR }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AnnouncementsManagement;

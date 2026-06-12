import React, { useEffect, useState } from "react";
import Sidebar from "../components/sidebar/Sidebar";
import api from "../api/axios";

const MESSAGE_LIMIT = 80;

interface Announcement {
  announcementId?: string;
  _id?: string;
  title?: string;
  message?: string;
  isPinned?: boolean;
  isRead?: boolean;
}

interface Notification {
  _id?: string;
  title?: string;
  message?: string;
  isRead?: boolean;
}

const AnnouncementsPage = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_BASE_URL;

  const [openNotification, setOpenNotification] = useState<Notification | null>(
    null
  );

  // ================= SAFE HELPERS =================
  const normalizeText = (text: string | undefined): string =>
    typeof text === "string" ? text.trim() : "";

  const shouldShowReadMore = (text: string | undefined): boolean =>
    normalizeText(text).length > MESSAGE_LIMIT;

  const getShortMessage = (text: string | undefined): string => {
    const clean = normalizeText(text);
    return clean.length > MESSAGE_LIMIT
      ? clean.slice(0, MESSAGE_LIMIT) + "..."
      : clean;
  };

  // ================= FETCH ANNOUNCEMENTS =================
  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.get(
        `${API_URL}/api/v1/announcement/getEmployeeAnnouncements`
      );
      setAnnouncements(res?.data?.data || []);
    } catch (err) {
      console.error("Fetch announcements failed", err);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  // ================= FETCH NOTIFICATIONS =================
  const fetchNotifications = async () => {
    try {
      const res = await api.get(
        `${API_URL}/api/v1/announcement/my-notifications`
      );
      setNotifications(res?.data?.data || []);
    } catch (err) {
      console.error("Fetch notifications failed", err);
      setNotifications([]);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    fetchNotifications();
  }, []);

  // ================= FILTER ANNOUNCEMENTS =================
  const filteredAnnouncements = announcements.filter((a) => {
    const isPinned = Boolean(a?.isPinned);
    const isRead = Boolean(a?.isRead);

    if (activeTab === "pinned") return isPinned;
    if (activeTab === "unread") return !isRead;
    return true;
  });

  // ================= MARK NOTIFICATION READ =================
  const handleMarkNotificationRead = async (id: string) => {
    try {
      await api.put(
        `${API_URL}/api/v1/announcement/markAsRead/${id}`
      );
      fetchNotifications();
    } catch (err) {
      console.error("Mark as read failed", err);
    }
  };

  // ================= UI =================
  return (
    <div className="min-h-screen bg-[#F7F9FB] text-[#1F2937]">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex flex-1 flex-col overflow-hidden">
          {/* HEADER */}
          <header className="flex items-center justify-between border-b bg-white px-8 py-4">
            <input
              className="w-full max-w-xl rounded-full border px-10 py-2.5 text-sm"
              placeholder="Search"
            />
          </header>

          <div className="flex flex-1">
            {/* ANNOUNCEMENTS */}
            <main className="flex-1 overflow-y-auto px-8 py-6">
              <div className="mb-6 flex gap-2">
                {["all", "pinned", "unread"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-md text-sm ${
                      activeTab === tab
                        ? "bg-[#0A7C86] text-white"
                        : "text-gray-500"
                    }`}
                  >
                    {tab.toUpperCase()}
                  </button>
                ))}
              </div>

              {loading && <p>Loading announcements...</p>}

              {!loading && filteredAnnouncements.length === 0 && (
                <p className="text-gray-500">No announcements available.</p>
              )}

              {filteredAnnouncements.map((a) => (
                <div
                  key={a?.announcementId || a?._id}
                  className="mb-6 rounded-lg border bg-white p-6"
                >
                  <h3 className="text-lg font-bold">
                    {normalizeText(a?.title)}
                  </h3>
                  <p className="mt-4 text-gray-600">
                    {normalizeText(a?.message)}
                  </p>
                </div>
              ))}
            </main>

            {/* NOTIFICATIONS */}
            <aside className="w-96 border-l bg-white p-6">
              <h2 className="mb-6 text-xl font-bold">Notifications</h2>

              {notifications.length === 0 && (
                <p className="text-gray-500 text-sm">
                  No notifications available.
                </p>
              )}

              {notifications.map((n) => (
                <div key={n?._id} className="border-b pb-4 mb-4">
                  <p className="font-semibold">{normalizeText(n?.title)}</p>

                  <p className="mt-2 text-sm text-gray-600">
                    {getShortMessage(n?.message)}
                  </p>

                  <div className="flex gap-3 mt-2">
                    {shouldShowReadMore(n?.message) && (
                      <button
                        onClick={() => setOpenNotification(n)}
                        className="text-sm text-[#0A7C86] font-medium"
                      >
                        Read more →
                      </button>
                    )}

                    {!n?.isRead && (
                      <button
                        onClick={() =>
                          handleMarkNotificationRead(n?._id || "")
                        }
                        className="text-sm text-gray-500"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </aside>
          </div>
        </div>
      </div>

      {/* READ MORE MODAL */}
      {openNotification && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="font-semibold mb-3">
              {normalizeText(openNotification.title)}
            </h3>
            <p className="text-gray-700 whitespace-pre-wrap">
              {normalizeText(openNotification.message)}
            </p>
            <button
              onClick={() => setOpenNotification(null)}
              className="mt-4 px-4 py-2 bg-[#0A7C86] text-white rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPage;

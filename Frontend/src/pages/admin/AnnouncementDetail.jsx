import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Bell,
  Calendar,
  Clock,
  MapPin,
  Eye,
  Pin,
  FileText,
  Download,
  FileImage,
  Share2,
  BellRing,
  ArrowLeft,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/sidebar/Sidebar";
import api from "../../api/axios";

const API_ORIGIN = import.meta.env.VITE_API_BASE_URL; // change if needed

const AnnouncementDetail = () => {
  const { id } = useParams();
  console.log("id",id)
  const navigate = useNavigate();

  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const safeDate = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString();
  };

  const safeDateTime = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString();
  };

  const normalizeAttachmentUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    // if backend returns "/uploads/..." this makes it absolute
    return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const createdByText = useMemo(() => {
    const cb = announcement?.createdBy;

    // createdBy can be string OR object (user)
    if (!cb) return "Management";
    if (typeof cb === "string") return cb;

    // common user fields
    const name =
      cb.name ||
      `${cb.FirstName || ""} ${cb.LastName || ""}`.trim() ||
      cb.username ||
      cb.email;

    return name || "Management";
  }, [announcement]);

  const fetchAnnouncement = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const res = await api.get(
        `${API_ORIGIN}/api/v1/announcement/getAnnouncement/${id}`
      );

      setAnnouncement(res?.data?.data || null);
    } catch (err) {
      console.error("Failed to fetch announcement", err);
      setAnnouncement(null);
      setErrorMsg("Failed to load announcement.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchAnnouncement();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F8FA]">
        <div className="text-sm text-gray-600">Loading announcement...</div>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F8FA]">
        <div className="text-center">
          <p className="text-sm text-gray-700">
            {errorMsg || "Announcement not found."}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 border rounded-lg"
          >
            <ArrowLeft size={16} /> Go back
          </button>
        </div>
      </div>
    );
  }

  const {
    title,
    message,
    createdAt,
    expireAt,
    viewsCount,
    isPinned,
    priority,
    eventDate,
    eventTime,
    location,
    attachments = [],
  } = announcement;

  return (
    <div className="flex min-h-screen bg-[#F6F8FA]">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        {/* HEADER */}
        <header className="h-16 bg-white border-b px-6 flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]"
            />
            <input
              placeholder="Search"
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
            />
          </div>

          <div className="flex items-center gap-4">
            <Bell size={20} className="text-[#6B7280]" />
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#0B7285] text-white flex items-center justify-center">
                S
              </div>
              <div>
                <p className="text-sm font-semibold">Sachi</p>
                <p className="text-xs text-gray-500">Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 overflow-auto p-6">
          {/* TOP ACTION BAR */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg bg-white"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <div className="flex gap-3">
              <button
                className="px-4 py-2 bg-[#0B7285] text-white rounded flex items-center gap-2"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Link copied!");
                }}
              >
                <Share2 size={16} /> Share
              </button>

              <button
                className="px-4 py-2 border border-[#0B7285] text-[#0B7285] rounded flex items-center gap-2 bg-white"
                onClick={() => alert("You will be notified")}
              >
                <BellRing size={16} /> Notify Me
              </button>
            </div>
          </div>

          {/* STATUS */}
          <div className="flex gap-4 mb-4">
            {priority === "HIGH" && (
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-red-600 rounded-full" />
                <span className="text-sm font-medium">High Priority</span>
              </div>
            )}
            {isPinned && (
              <div className="flex items-center gap-2">
                <Pin size={16} />
                <span className="text-sm font-medium">Pinned</span>
              </div>
            )}
          </div>

          {/* META */}
          <h2 className="text-2xl font-semibold mb-3">{title || "—"}</h2>

          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
            <span className="flex items-center gap-1">
              <Calendar size={16} />
              Published: {safeDate(createdAt) || "—"}
            </span>

            {expireAt && (
              <span className="flex items-center gap-1">
                <Calendar size={16} />
                Expires: {safeDate(expireAt) || "—"}
              </span>
            )}

            <span>From: {createdByText}</span>

            <span className="flex items-center gap-1">
              <Eye size={16} />
              {viewsCount || 0} views
            </span>
          </div>

          {/* MESSAGE */}
          <div className="bg-[#F1F3F5] p-6 rounded-lg mb-6">
            <p className="whitespace-pre-wrap">{message || "—"}</p>

            {(eventDate || eventTime || location) && (
              <div className="grid md:grid-cols-3 gap-4 mt-6">
                {eventDate && (
                  <div className="flex gap-3">
                    <Calendar />
                    <div>
                      <p className="text-xs text-gray-600">Date</p>
                      <p className="font-medium">
                        {safeDate(eventDate) || eventDate}
                      </p>
                    </div>
                  </div>
                )}

                {eventTime && (
                  <div className="flex gap-3">
                    <Clock />
                    <div>
                      <p className="text-xs text-gray-600">Time</p>
                      <p className="font-medium">{eventTime}</p>
                    </div>
                  </div>
                )}

                {location && (
                  <div className="flex gap-3">
                    <MapPin />
                    <div>
                      <p className="text-xs text-gray-600">Location</p>
                      <p className="font-medium">{location}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ATTACHMENTS */}
          {Array.isArray(attachments) && attachments.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Attachments</h3>

              {attachments.map((file, index) => {
                const name =
                  file?.name ||
                  file?.originalname ||
                  file?.filename ||
                  `Attachment ${index + 1}`;

                const type =
                  file?.type || file?.mimeType || file?.mimetype || "";

                const url = normalizeAttachmentUrl(file?.url || file?.path);

                const isImage = type.includes("image");

                return (
                  <div
                    key={file?._id || file?.id || index}
                    className="bg-white border p-4 rounded-lg flex justify-between items-center mb-3"
                  >
                    <div className="flex gap-3 items-center">
                      {isImage ? <FileImage /> : <FileText />}
                      <div>
                        <p className="font-medium">{name}</p>
                        <p className="text-xs text-gray-500">
                          {file?.size || file?.sizeLabel || "—"}{" "}
                          {type ? `• ${type}` : ""}
                        </p>
                      </div>
                    </div>

                    <button
                      disabled={!url}
                      onClick={() => url && window.open(url, "_blank", "noopener")}
                      className="flex items-center gap-2 px-4 py-2 bg-[#0B7285] text-white rounded disabled:opacity-50"
                    >
                      <Download size={16} />
                      Download
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* FOOTER SMALL INFO */}
          <div className="text-xs text-gray-500">
            Loaded at: {safeDateTime(new Date())}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AnnouncementDetail;

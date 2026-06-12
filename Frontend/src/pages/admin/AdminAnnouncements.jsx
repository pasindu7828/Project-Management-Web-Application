import React, { useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  CheckSquare2,
  ChevronDown,
  ListChecks,
  Megaphone,
  Paperclip,
  Pin,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";

import Sidebar from "../../components/sidebar/Sidebar";
import api from "../../api/axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;

// must match multer field name in backend
const FILE_FIELD = "files";

// notifyRoles allowed values (1,2,3)
const ROLE_OPTIONS = [
  { label: "Employee", value: 1 },
  { label: "Manager", value: 2 },
  { label: "Admin", value: 3 },
];

// audience values (0 = All)
const AUDIENCE_OPTIONS = [
  { label: "All", value: 0 },
  { label: "Employee", value: 1 },
  { label: "Manager", value: 2 },
  { label: "Admin", value: 3 },
];

// priority enum in your model
const PRIORITY_OPTIONS = ["Low", "Medium", "High"];

const LabeledField = ({ label, children }) => (
  <div className="space-y-2">
    <p className="text-sm font-semibold text-[#1F2937]">{label}</p>
    {children}
  </div>
);

const SelectField = ({ icon: Icon, value, onChange, options }) => (
  <div className="relative">
    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#0A7C86]">
      <Icon size={18} />
    </div>

    <select
      value={value}
      onChange={onChange}
      className="w-full appearance-none rounded-lg border border-[#C9CED6] bg-white py-3 pl-10 pr-10 text-sm font-medium text-[#1F2937] shadow-sm focus:border-[#0A7C86] focus:outline-none focus:ring-2 focus:ring-[#0A7C86]/20"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>

    <ChevronDown
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280]"
      size={16}
    />
  </div>
);

const ToggleCard = ({ icon: Icon, label, checked, onChange }) => (
  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#C9CED6] bg-white px-4 py-3 text-sm font-medium text-[#1F2937] shadow-[0_8px_24px_rgba(10,124,134,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(10,124,134,0.12)]">
    <input
      type="checkbox"
      className="hidden"
      checked={checked}
      onChange={onChange}
    />
    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#E5F6F7] text-[#0A7C86]">
      <Icon size={18} />
    </span>
    {label}
  </label>
);

const PillButton = ({ variant = "solid", children, ...props }) => {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed";
  const styles = {
    solid: "bg-[#0A7C86] text-white hover:bg-[#0E8F9E]",
    ghost: "border border-[#0A7C86] text-[#0A7C86] bg-white hover:bg-[#E5F6F7]",
    danger: "bg-[#E84545] text-white hover:bg-[#c93838]",
  };
  return (
    <button className={`${base} ${styles[variant]}`} {...props}>
      {children}
    </button>
  );
};

const NotifyRolesPicker = ({ selected, setSelected }) => {
  const toggleRole = (value) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
    );
  };

  return (
    <LabeledField label="Notify Roles (notifyRoles)">
      <div className="rounded-lg border border-[#C9CED6] bg-white p-4 space-y-3">
        <div className="grid gap-2 md:grid-cols-3">
          {ROLE_OPTIONS.map((o) => (
            <label
              key={o.value}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer ${
                selected.includes(o.value)
                  ? "border-[#0A7C86] bg-[#E5F6F7]"
                  : "border-[#E5E7EB] bg-white"
              }`}
            >
              <input
                type="checkbox"
                checked={selected.includes(o.value)}
                onChange={() => toggleRole(o.value)}
                className="accent-[#0A7C86]"
              />
              {o.label}
            </label>
          ))}
        </div>

        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {selected.map((val) => {
              const name =
                ROLE_OPTIONS.find((o) => o.value === val)?.label || val;
              return (
                <span
                  key={val}
                  className="inline-flex items-center gap-2 rounded-full bg-[#E5F6F7] px-3 py-1 text-xs font-semibold text-[#0A7C86]"
                >
                  {name}
                  <button
                    type="button"
                    onClick={() => toggleRole(val)}
                    className="hover:opacity-80"
                  >
                    <X size={14} />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>
    </LabeledField>
  );
};

const AdminAnnouncements = () => {
  const [form, setForm] = useState({
    title: "",
    message: "",
    priority: "Medium",
    startDate: "",
    endDate: "",
    neverExpire: false,
    isPinned: false,
    audience: 0, // UI selection only
  });

  const [notifyRoles, setNotifyRoles] = useState([]);
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const charsCount = useMemo(() => form.message.length, [form.message]);

  const update = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const toggle = (key) => (e) => {
    const checked = e.target.checked;

    if (key === "neverExpire") {
      setForm((prev) => ({
        ...prev,
        neverExpire: checked,
        endDate: checked ? "" : prev.endDate,
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [key]: checked }));
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    const tooBig = selected.find((f) => f.size > 10 * 1024 * 1024);
    if (tooBig) {
      alert(`File too large: ${tooBig.name} (Max 10MB)`);
      e.target.value = "";
      return;
    }

    setFiles((prev) => [...prev, ...selected]);
    e.target.value = "";
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setForm({
      title: "",
      message: "",
      priority: "Medium",
      startDate: "",
      endDate: "",
      neverExpire: false,
      isPinned: false,
      audience: 0,
    });
    setNotifyRoles([]);
    setFiles([]);
  };

  const handleSubmit = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    if (!form.title.trim()) return setErrorMsg("Title is required.");
    if (!form.message.trim()) return setErrorMsg("Message is required.");
    if (!form.startDate) return setErrorMsg("Start date is required.");

    if (!form.neverExpire && !form.endDate) {
      return setErrorMsg("Expiry date is required (or select Never Expire).");
    }

    if (!form.neverExpire && form.endDate < form.startDate) {
      return setErrorMsg("Expiry date cannot be earlier than Publish date.");
    }

    // ✅ FRONTEND-ONLY SAFETY:
    // Backend expects audience as Number for saving,
    // but later uses audience.map(...) as if it is an array -> server crash.
    // To prevent crash without changing backend, we DO NOT SEND audience at all.
    // Mongo will use default audience=0 (All).
    if (form.audience !== 0) {
      return setErrorMsg(
        "Backend bug: audience is saved as Number but controller uses audience.map() like an array. " +
          "Without changing backend, only Audience = All works safely."
      );
    }

    try {
      setSubmitting(true);

      const fd = new FormData();

      fd.append("title", form.title.trim());
      fd.append("message", form.message.trim());
      fd.append("startDate", form.startDate);
      fd.append("endDate", form.neverExpire ? "" : form.endDate);

      fd.append("priority", form.priority); // Low/Medium/High
      fd.append("isPinned", String(form.isPinned));
      fd.append("neverExpire", String(form.neverExpire));

      // ✅ DO NOT send "audience" to avoid both:
      // 1) Cast error when sent as array
      // 2) audience.map crash when sent as string
      // DB default will set audience=0 (All)

      // notifyRoles is fine as array
      // Use bracket format so backend consistently receives an array
      notifyRoles.forEach((r, idx) => {
        fd.append(`notifyRoles[${idx}]`, String(r));
      });

      files.forEach((file) => fd.append(FILE_FIELD, file));

      const res = await api.post(`${API_URL}/api/v1/announcement/createAnnouncement`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccessMsg(res?.data?.message || "Announcement created successfully!");
      resetForm();
    } catch (err) {
      console.error(err);
      setErrorMsg(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to create announcement."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8] text-[#1F2937]">
      <div className="flex h-full min-h-screen">
        <Sidebar />

        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex items-center justify-between border-b border-[#C9CED6]/80 bg-white px-8 py-4">
            <div className="relative w-full max-w-xl">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]"
              />
              <input
                className="w-full rounded-full border border-[#C9CED6] bg-white py-2.5 pl-10 pr-4 text-sm text-[#1F2937] placeholder:text-[#6B7280] focus:border-[#0A7C86] focus:outline-none focus:ring-2 focus:ring-[#0A7C86]/20"
                placeholder="Search"
              />
            </div>

            <div className="flex items-center gap-4">
              <button className="flex h-10 w-10 items-center justify-center rounded-full border border-[#C9CED6] bg-white text-[#0A7C86] hover:bg-[#E5F6F7]">
                <Bell size={18} />
              </button>

              <div className="flex items-center gap-3 rounded-full border border-[#C9CED6] bg-white px-3 py-2 shadow-sm">
                <div className="h-10 w-10 rounded-full bg-[url('https://i.pravatar.cc/80?img=48')] bg-cover bg-center" />
                <div className="leading-tight">
                  <p className="text-sm font-semibold">Sachi</p>
                  <p className="text-xs text-[#6B7280]">Admin</p>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-8 py-6">
            <p className="text-sm text-[#6B7280]">
              Create / Edit Announcement & Detail / Engagement
            </p>

            <div className="mt-2 flex items-center justify-between">
              <h1 className="text-2xl font-semibold">
                Create and Edit Announcement Form
              </h1>
              <div className="flex items-center gap-3 text-[#0A7C86]">
                <button
                  onClick={resetForm}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#C9CED6] bg-white shadow-sm hover:bg-[#E5F6F7]"
                  title="Reset form"
                >
                  <Plus size={18} />
                </button>
                <a href="/user/announcements" title="View all">
                  <button
                    // onClick={() => alert("View All Announcements clicked!")}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-[#C9CED6] bg-white shadow-sm hover:bg-[#E5F6F7]"
                    title="View all"
                    >
                    <ListChecks size={18} />
                  </button>
                  </a>
              </div>
            </div>

            <section className="mt-6 space-y-6">
              <div className="rounded-2xl border border-[#C9CED6] bg-[#E9ECEF] shadow-[0_12px_36px_rgba(17,94,104,0.08)]">
                <div className="space-y-5 p-6">
                  {errorMsg && (
                    <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {errorMsg}
                    </div>
                  )}
                  {successMsg && (
                    <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      {successMsg}
                    </div>
                  )}

                  <LabeledField label="Title :">
                    <input
                      value={form.title}
                      onChange={update("title")}
                      className="w-full rounded-lg border border-[#C9CED6] bg-white px-4 py-3 text-sm"
                      placeholder="Title :"
                    />
                  </LabeledField>

                  <LabeledField label={`Message (${charsCount}/2000 chars)`}>
                    <textarea
                      rows={6}
                      value={form.message}
                      onChange={update("message")}
                      maxLength={2000}
                      className="w-full rounded-lg border border-[#C9CED6] bg-white px-4 py-3 text-sm"
                      placeholder="Type your announcement here......"
                    />
                  </LabeledField>

                  <div className="grid gap-4 lg:grid-cols-3">
                    <LabeledField label="Priority">
                      <SelectField
                        icon={Megaphone}
                        value={form.priority}
                        onChange={update("priority")}
                        options={PRIORITY_OPTIONS}
                      />
                    </LabeledField>

                    <LabeledField label="Audience (frontend-only)">
                      <div className="relative">
                        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#0A7C86]">
                          <Users size={18} />
                        </div>

                        <select
                          value={form.audience}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              audience: Number(e.target.value),
                            }))
                          }
                          className="w-full appearance-none rounded-lg border border-[#C9CED6] bg-white py-3 pl-10 pr-10 text-sm font-medium"
                        >
                          {AUDIENCE_OPTIONS.map((a) => (
                            <option key={a.value} value={a.value}>
                              {a.label}
                            </option>
                          ))}
                        </select>

                        <ChevronDown
                          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280]"
                          size={16}
                        />
                      </div>

                      <p className="text-xs text-[#6B7280]">
                        Note: Backend bug prevents saving non-All audiences without error.
                      </p>
                    </LabeledField>

                    <LabeledField label="Pin">
                      <div className="h-[46px] flex items-center">
                        <ToggleCard
                          icon={Pin}
                          label="Pin to top"
                          checked={form.isPinned}
                          onChange={toggle("isPinned")}
                        />
                      </div>
                    </LabeledField>
                  </div>

                  <NotifyRolesPicker
                    selected={notifyRoles}
                    setSelected={setNotifyRoles}
                  />

                  <div className="grid gap-4 lg:grid-cols-3">
                    <LabeledField label="Publish (startDate)">
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0A7C86]">
                          <CalendarDays size={18} />
                        </div>
                        <input
                          type="date"
                          value={form.startDate}
                          onChange={update("startDate")}
                          className="w-full rounded-lg border border-[#C9CED6] bg-white px-4 py-3 pl-10 text-sm"
                        />
                      </div>
                    </LabeledField>

                    <LabeledField label="Expiry (endDate)">
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0A7C86]">
                          <CalendarDays size={18} />
                        </div>
                        <input
                          type="date"
                          value={form.endDate}
                          min={form.startDate || undefined}
                          onChange={update("endDate")}
                          disabled={form.neverExpire}
                          className="w-full rounded-lg border border-[#C9CED6] bg-white px-4 py-3 pl-10 text-sm disabled:opacity-50"
                        />
                      </div>
                    </LabeledField>

                    <div className="flex items-end">
                      <label className="flex w-full items-center justify-between rounded-lg border border-[#C9CED6] bg-white px-4 py-3 text-sm font-medium shadow-sm">
                        <div className="flex items-center gap-3">
                          <CheckSquare2 className="text-[#0A7C86]" size={18} />
                          <span>Never Expire</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={form.neverExpire}
                          onChange={toggle("neverExpire")}
                          className="h-5 w-5 accent-[#0A7C86]"
                        />
                      </label>
                    </div>
                  </div>

                  <LabeledField label="Attachments">
                    <div className="flex flex-col gap-3 rounded-lg border border-[#C9CED6] bg-white px-4 py-3 shadow-sm">
                      <button
                        type="button"
                        className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-[#0A7C86] bg-[#E5F6F7] px-4 py-2 text-sm font-semibold text-[#0A7C86]"
                        onClick={() =>
                          document.getElementById("fileInput")?.click()
                        }
                      >
                        <Paperclip size={16} /> Add Files
                      </button>

                      <input
                        id="fileInput"
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        className="hidden"
                        onChange={handleFileChange}
                      />

                      {files.length > 0 && (
                        <div className="space-y-2">
                          {files.map((f, i) => (
                            <div
                              key={`${f.name}-${i}`}
                              className="flex items-center justify-between rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-sm"
                            >
                              <span className="truncate">{f.name}</span>
                              <button
                                type="button"
                                onClick={() => removeFile(i)}
                                className="text-xs font-semibold text-red-600 hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </LabeledField>
                </div>
              </div>

              <div className="flex flex-col items-center justify-end gap-3 md:flex-row">
                <PillButton
                  variant="danger"
                  type="button"
                  onClick={() => {
                    setErrorMsg("");
                    setSuccessMsg("");
                    resetForm();
                  }}
                  disabled={submitting}
                >
                  Cancel
                </PillButton>

                <PillButton
                  variant="solid"
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? "Publishing..." : "Publish Announcement"}
                </PillButton>

                <PillButton
                  variant="solid"
                  type="button"
                  onClick={() => alert("Go to list page and open details")}
                  disabled={submitting}
                >
                  <ListChecks size={16} /> Announcement Detail
                </PillButton>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminAnnouncements;

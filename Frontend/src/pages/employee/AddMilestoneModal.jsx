import { useState } from "react";

const AddMilestoneModal = ({ onClose, onCreate }) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    status: "In Progress",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(form);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-md shadow-xl w-full max-w-3xl">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-center">Add Milestone</h2>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 text-sm">
          {/* Milestone name */}
          <div className="mb-4">
            <label className="block mb-1 font-medium">Milestone Name</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-[#087990]"
              placeholder="Text Input"
              required
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block mb-1 font-medium">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-[#087990] h-24 resize-none"
              placeholder="Text Input..."
            />
          </div>

          {/* Dates */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <label className="block mb-1 font-medium">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                placeholder="DD/MM/YYYY"
                className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-[#087990]"
              />
            </div>
            <div className="flex-1">
              <label className="block mb-1 font-medium">End Date</label>
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
                placeholder="DD/MM/YYYY"
                className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-[#087990]"
              />
            </div>
          </div>

          {/* Status */}
          <div className="mb-6">
            <label className="block mb-1 font-medium">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-48 border rounded-md px-3 py-2 outline-none focus:ring-2 focus:[#087990]"
            >
              <option>In Progress</option>
              <option>Complete</option>
              <option>Pending</option>
            </select>
          </div>

          {/* footer buttons */}
          <div className="flex justify-end gap-4 pt-2 pb-2">
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
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMilestoneModal;

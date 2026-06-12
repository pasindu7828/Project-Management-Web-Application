import { useState, useEffect } from "react";

const EditMilestoneModal = ({ milestone, onClose, onUpdate }) => {
  const [form, setForm] = useState({
    milestoneName: "",
    Description: "",
    Start_Date: "",
    End_Date: "",
  });

  useEffect(() => {
    if (milestone) {
      setForm({
        milestoneName: milestone.title || "",
        Description: milestone.description || "",
        Start_Date: milestone.startDate?.slice(0, 10) || "",
        End_Date: milestone.endDate?.slice(0, 10) || "",
      });
    }
  }, [milestone]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    onUpdate({
      id: milestone.id,
      ...form,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-md shadow-xl w-full max-w-3xl">
        <div className="border-b px-6 py-4 flex justify-between">
          <h2 className="text-lg font-semibold">Edit Milestone</h2>
          <button onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 text-sm space-y-4">
          <div>
            <label className="block font-medium mb-1">Milestone Name</label>
            <input
              type="text"
              name="milestoneName"
              value={form.milestoneName}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-[#087990]"
              required
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Description</label>
            <textarea
              name="Description"
              value={form.Description}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-[#087990] h-24 resize-none"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block font-medium mb-1">Start Date</label>
              <input
                type="date"
                name="Start_Date"
                value={form.Start_Date}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-[#087990]"
              />
            </div>

            <div className="flex-1">
              <label className="block font-medium mb-1">End Date</label>
              <input
                type="date"
                name="End_Date"
                value={form.End_Date}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-[#087990]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#087990] text-white rounded-md"
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMilestoneModal;

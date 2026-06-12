import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function TaskTable({ data }) {
  // Export PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Tasks Report", 14, 20);

    const rows = data.map((task) => [
      task.title,
      task.createdAt ? new Date(task.createdAt).toLocaleDateString() : "-",
      task.priority,
      task.deadline ? new Date(task.deadline).toLocaleDateString() : "-",
      task.status,
    ]);

    autoTable(doc, {
      head: [["Task Name", "Created At", "Priority", "Deadline", "Status"]],
      body: rows,
      startY: 30,
    });

    doc.save("tasks_report.pdf");
  };

  // Export Excel
  const handleExportExcel = () => {
    const worksheetData = data.map((task) => ({
      "Task Name": task.title,
      "Created At": task.createdAt
        ? new Date(task.createdAt).toLocaleDateString()
        : "-",
      Priority: task.priority,
      Deadline: task.deadline
        ? new Date(task.deadline).toLocaleDateString()
        : "-",
      Status: task.status,
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tasks Report");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "tasks_report.xlsx");
  };

  /*export default function TaskTable({ data }) {
  const handleExport = (type) => {
    window.open(`/api/v1/tasks/export?type=${type}`, "_blank"); // make sure backend route exists
  };*/

  return (
    <div className="bg-white p-4 text-center rounded-xl border-2 border-[#087990] shadow-lg mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-700">Tasks Report</h2>
        <div>
          <button
            //onClick={() => handleExport("pdf")}
            onClick={handleExportPDF}
            className="bg-[#087990] text-white px-4 py-2 rounded mr-2  hover:text-[#087990]  hover:bg-gray-200 transition"
          >
            Export PDF
          </button>
          <button
            //onClick={() => handleExport("excel")}
            onClick={handleExportExcel}
            className="bg-white text-[#087990] px-4 py-2 rounded border border-gray-400 hover:bg-[#087990]  hover:text-white hover:border-gray-300 transition"
          >
            Export Excel
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse rounded-xl overflow-hidden">
          <thead className="bg-[#087990] text-white">
            <tr>
              <th className="px-4 py-2 border text-left">Task Name</th>
              <th className="px-4 py-2 border text-left">createdAt</th>
              <th className="px-4 py-2 border text-left">Priority</th>
              <th className="px-4 py-2 border text-left">Deadline</th>
              <th className="px-4 py-2 border text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((task, i) => (
              <tr
                key={i}
                className={`text-center ${
                  i % 2 === 0 ? "bg-blue-50" : "bg-blue-100"
                }`}
              >
                <td className="px-4 py-2 border">{task.title}</td>
                <td className="px-4 py-2 border">
                  {task.createdAt
                    ? new Date(task.createdAt).toLocaleDateString()
                    : "-"}
                </td>
                <td className="px-4 py-2 border">{task.priority}</td>
                <td className="px-4 py-2 border">
                  {task.deadline
                    ? new Date(task.deadline).toLocaleDateString()
                    : "-"}
                </td>
                <td className="px-4 py-2 border">{task.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

export default function AttendanceBar({ data = [] }) {
  const present = data.filter((a) => a.status === "Present").length;
  const absent = data.filter((a) => a.status === "Absent").length;
  const working = data.filter((a) => a.status === "Working").length;

  const chartData = [
    { name: "Present", value: present },
    { name: "Absent", value: absent },
    { name: "Working", value: working },
  ];

  return (
    <div className="bg-white p-4 text-center rounded-xl border-2 border-[#087990] shadow-lg">
      <h3 className="font-semibold mb-4">Attendance Overview</h3>

      <div className="w-full">
        <ResponsiveContainer width="100%" height={213}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#087990" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

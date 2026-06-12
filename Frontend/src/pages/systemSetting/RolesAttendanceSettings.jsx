const RolesAttendanceSettings = () => {
  return (
    //<main className="flex-1 p-2 bg-gray-100">
    <div className="flex-1 p-2 overflow-y-auto space-y-8">
      {/* Page Heading */}
      <h2 className="text-heading font-semibold mb-2">Roles</h2>

      {/* Roles Table */}
      <table className="w-full border mb-8  bg-gray-100 rounded-xl shadow overflow-hidden">
        <thead className="bg-[#0b7c8f]">
          <tr>
            <th className="text-white border p-2 font-semibold">ROLE Name</th>
            <th className="text-white border p-2 font-semibold">Description</th>
          </tr>
        </thead>
        <tbody>
          <tr className="bg-gray-100">
            <td className="border p-2 text-center font-semibold">ADMIN</td>
            <td className="border p-2">Full system access</td>
          </tr>
          <tr className="bg-gray-100">
            <td className="border p-2 text-center font-semibold">HR</td>
            <td className="border p-2">
              Employee, leave & attendance management
            </td>
          </tr>
          <tr className="bg-gray-100">
            <td className="border p-2 text-center font-semibold">MANAGER</td>
            <td className="border p-2">Project, task & team management</td>
          </tr>
          <tr className="bg-gray-100">
            <td className="border p-2 text-center font-semibold">EMPLOYEE</td>
            <td className="border p-2">
              Basic access for attendance, tasks & requests
            </td>
          </tr>
        </tbody>
      </table>

      {/* Section Heading */}
      <h2 className="text-heading font-semibold mb-4">Attendance Rules</h2>

      {/* Rules Content */}
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="font-semibold mb-2">1. Working Hours</h3>
          <ul className="list-disc ml-5 space-y-1">
            <li>Standard working hours: 9:00 AM – 5:00 PM</li>
            <li>Total required working hours per day: 8 hours</li>
            <li>Lunch break: 1 hour</li>
            <li>Employees must log in/out using the system</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-2">2. Attendance Marking</h3>
          <ul className="list-disc ml-5 space-y-1">
            <li>Web portal</li>
            <li>Mobile app</li>
            <li>Biometric (if used)</li>
            <li>Check-in within 15 minutes</li>
            <li>Checkout before leaving</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-2">3. Late Arrival Policy</h3>
          <ul className="list-disc ml-5 space-y-1">
            <li>Late after 9:15 AM</li>
            <li>Allowed late days per month: 3</li>
            <li>4th → Warning</li>
            <li>5th → Half-day deduction</li>
            <li>6th+ → Salary deduction</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-2">4. Early Checkout Policy</h3>
          <ul className="list-disc ml-5 space-y-1">
            <li>Leaving before 5:00 PM</li>
            <li>3 early checkouts → penalty</li>
            <li>Salary deduction may apply</li>
          </ul>
        </div>
      </div>
    </div>
    // </main>
  );
};

export default RolesAttendanceSettings;

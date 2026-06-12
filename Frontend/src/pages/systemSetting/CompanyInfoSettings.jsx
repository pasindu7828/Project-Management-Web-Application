import workSyncLogo from "../../assets/Logo.png";

const CompanyInfoSettings = () => {
  const company = {
    name: "WorkSync",
    address: "123 Main Street, Colombo, Sri Lanka",
    email: "WorksYnc@worksync.com",
    contact: "07XXXXXXXX",
    website: "www.worksync.com",
  };

  const InputField = ({ label, value }) => (
    <div className="flex justify-between items-center bg-white rounded-md p-3 shadow-sm">
      <label className="font-medium text-gray-600">{label}</label>
      <span className="text-gray-800">{value}</span>
    </div>
  );

  return (
    <main className="flex-1 p-6 overflow-y-auto bg-gray-100">
      <h2 className="text-heading font-semibold mb-6">Company Information</h2>

      <div className="flex gap-8">
        {/* Left Logo Card */}
        <div className="w-72 rounded-2xl bg-[#0b7c8f] text-white flex flex-col items-center justify-center py-10 shadow-lg">
          {/* Gray circle wrapping only the logo */}
          <div className="bg-gray-300 rounded-full p-4 flex items-center justify-center mb-4">
            <img
              src={workSyncLogo}
              alt="Company Logo"
              className="h-24 w-24 object-contain"
            />
          </div>

          {/* Company name outside the circle */}
          <h3 className="text-xl font-semibold">{company.name}</h3>
        </div>

        {/* Right Details Card */}
        <div className="flex-1 rounded-2xl bg-gray-100 p-6 border-2 border-[#087990] shadow-lg">
          <div className="space-y-4">
            <InputField label="Company Name" value={company.name} />
            <InputField label="Address" value={company.address} />
            <InputField label="Email" value={company.email} />
            <InputField label="Contact Number" value={company.contact} />
            <div className="flex justify-between items-center bg-white rounded-md p-3 shadow-sm">
              <label className="font-medium text-gray-600">Website</label>
              <a
                href="http://localhost:5173/admin/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {company.website}
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CompanyInfoSettings;

const KpiCards = ({ title, value }) => {
  return (
    <div className="bg-white p-4 text-center rounded-xl border-2 border-[#087990] shadow-lg">
      <p className="text-gray-500 font-medium">{title}</p>
      <h2 className="text-2xl font-bold">{value}</h2>
    </div>
  );
};

export default KpiCards;

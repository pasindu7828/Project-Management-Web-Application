import React from 'react';

const LatestAnnouncementCard = () => {
  return (
    <div className="flex items-center justify-between rounded-lg border-l-4 border-[#0A7C86] bg-white p-4 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-[#1F2937]">Latest: New Remote Work Policy Updates</h2>
        <p className="text-sm text-[#6B7280]">Important changes to remote work guidelines effective immediately...</p>
      </div>
      <button className="rounded-full bg-[#0A7C86] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#0E8F9E]">
        View Details
      </button>
    </div>
  );
};

export default LatestAnnouncementCard;
import React from 'react';

const AnnouncementCard = () => {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Q4 Company All-Hands Meeting</h2>
        <span className="rounded-full bg-[#E0F2FE] px-3 py-1 text-sm text-[#0369A1]">Events</span>
      </div>

      <div className="mt-2 flex items-center text-sm text-[#6B7280]">
        <span>Posted by Sarah Johnson</span>
        <span className="mx-2">•</span>
        <span>2 hours ago</span>
        <span className="mx-2">•</span>
        <span>All Employees</span>
      </div>

      <p className="mt-4 text-sm text-[#4B5563] line-clamp-2">
        Join us for our quarterly all-hands meeting where we’ll discuss company performance, upcoming initiatives, and celebrate team achievements. The meeting will be held in the main conference room…
      </p>

      <div className="mt-4 flex items-center justify-between">
        <a href="#" className="text-sm font-medium text-[#0A7C86] hover:underline">
          Read more
        </a>
        <div className="flex items-center gap-3 text-[#6B7280]">
          <button className="hover:text-[#0A7C86]">
            <svg width="20" height="20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 5L19 12L12 19" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="hover:text-[#0A7C86]">
            <svg width="20" height="20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 6H16" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 10H16" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 14H16" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="hover:text-[#0A7C86]">
            <svg width="20" height="20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 8L12 17L21 8" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <span className="rounded-full bg-[#D1FAE5] px-3 py-1 text-xs text-[#065F46]">New</span>
        <span className="rounded-full bg-[#FEF3C7] px-3 py-1 text-xs text-[#9A6A3A]">Important</span>
      </div>
    </div>
  );
};

export default AnnouncementCard;
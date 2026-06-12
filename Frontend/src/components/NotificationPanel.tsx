import React from 'react';

const NotificationPanel = () => {
  return (
    <aside className="w-80 bg-white p-4 rounded-xl shadow-sm">
      <h2 className="text-lg font-semibold">Notifications</h2>

      <div className="mt-4 flex items-center gap-3">
        <button className="rounded-full bg-[#0A7C86] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#0E8F9E]">
          All
        </button>
        <button className="rounded-full bg-[#F3F4F6] px-4 py-2 text-sm font-medium text-[#374151] shadow-sm hover:bg-[#EDEFF2]">
          Tasks
        </button>
        <button className="rounded-full bg-[#F3F4F6] px-4 py-2 text-sm font-medium text-[#374151] shadow-sm hover:bg-[#EDEFF2]">
          Leaves
        </button>
      </div>

      <div className="mt-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[#E0F2FE] flex items-center justify-center">
            <svg width="20" height="20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19" stroke="#0369A1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 5L19 12L12 19" stroke="#0369A1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-[#1F2937]">New announcement posted</p>
            <p className="text-xs text-[#6B7280]">Q4 Company All-Hands Meeting</p>
            <p className="text-xs text-[#6B7280]">2 hours ago</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[#DCFCE7] flex items-center justify-center">
            <svg width="20" height="20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19" stroke="#166534" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 5L19 12L12 19" stroke="#166534" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-[#1F2937]">Task completed</p>
            <p className="text-xs text-[#6B7280]">Project review submitted</p>
            <p className="text-xs text-[#6B7280]">4 hours ago</p>
            <a href="#" className="text-xs font-medium text-[#0A7C86] hover:underline">View Task</a>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[#FEE2E2] flex items-center justify-center">
            <svg width="20" height="20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19" stroke="#E84545" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 5L19 12L12 19" stroke="#E84545" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-[#1F2937]">Leave request approved</p>
            <p className="text-xs text-[#6B7280]">Dec 23-27 vacation approved</p>
            <p className="text-xs text-[#6B7280]">Yesterday</p>
            <a href="#" className="text-xs font-medium text-[#0A7C86] hover:underline">View Leave</a>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[#F3E8FF] flex items-center justify-center">
            <svg width="20" height="20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19" stroke="#6B21A8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 5L19 12L12 19" stroke="#6B21A8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-[#1F2937]">Policy update</p>
            <p className="text-xs text-[#6B7280]">Remote work guidelines updated</p>
            <p className="text-xs text-[#6B7280]">2 days ago</p>
            <a href="#" className="text-xs font-medium text-[#0A7C86] hover:underline">Open Announcement</a>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default NotificationPanel;
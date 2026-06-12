import React from 'react';

const FilterTabs = () => {
  return (
    <div className="mt-4 flex items-center gap-3">
      <button className="rounded-full bg-[#0A7C86] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#0E8F9E]">
        All
      </button>
      <button className="rounded-full bg-[#F3F4F6] px-4 py-2 text-sm font-medium text-[#374151] shadow-sm hover:bg-[#EDEFF2]">
        Pinned
      </button>
      <button className="rounded-full bg-[#F3F4F6] px-4 py-2 text-sm font-medium text-[#374151] shadow-sm hover:bg-[#EDEFF2]">
        Unread
      </button>
    </div>
  );
};

export default FilterTabs;


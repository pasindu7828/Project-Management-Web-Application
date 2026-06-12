import React, { useState } from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  Calendar,
  BarChart3,
  Bell,
  Building2,
  FolderOpen,
  Clock,
  Settings,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import Logo from '../../assets/Logo.jpg';

const DashboardSidebar = ({ activeItem = 'User' }) => {
  const menuItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'AssignTask', label: 'Assign Task', icon: CheckSquare },
    { id: 'User', label: 'User', icon: Users },
    { id: 'ManageLeaves', label: 'Manage Leaves', icon: Calendar },
    { id: 'Reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'Announcements', label: 'Announcements', icon: Bell },
    { id: 'Departments', label: 'Departments', icon: Building2 },
    { id: 'Projects', label: 'Projects', icon: FolderOpen },
    { id: 'Attendance', label: 'Attendance', icon: Clock },
  ];

  const bottomItems = [
    { id: 'Settings', label: 'System Settings', icon: Settings },
    { id: 'Support', label: 'Support', icon: HelpCircle },
    { id: 'Logout', label: 'Logout', icon: LogOut },
  ];

  return (
    <div className="w-60 bg-gray-100 h-screen fixed left-0 top-0 flex flex-col overflow-hidden"
         style={{ backgroundColor: '#F1F5F7' }}>
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <img 
            src={Logo}
            alt="Company Logo"
            className="w-10 h-10 rounded-lg object-contain"
          />
          <span className="font-semibold text-lg" style={{ color: '#0E7C86' }}>
            WorkSync
          </span>
        </div>
      </div>

      {/* Main Menu Items */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          return (
            <button
              key={item.id}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all duration-200 hover:bg-gray-200 cursor-pointer"
              style={{
                backgroundColor: isActive ? '#0E7C86' : 'transparent',
                color: isActive ? '#FFFFFF' : '#2D3748',
              }}
            >
              <Icon size={20} />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Menu Items */}
      <div className="border-t border-gray-200 p-3">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all duration-200 hover:bg-gray-200 cursor-pointer"
              style={{ color: '#718096' }}
            >
              <Icon size={20} />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardSidebar;

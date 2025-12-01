import React from 'react';
import { View } from '../types';
import { Icons, APP_NAME } from '../constants';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const menuItems = [
    { id: View.DASHBOARD, label: 'Dashboard', icon: Icons.Dashboard },
    { id: View.PROJECTS, label: 'Projects', icon: Icons.Projects },
    { id: View.TIMESHEETS, label: 'Timesheets', icon: Icons.Timesheets },
  ];

  return (
    <div className="flex flex-col w-64 bg-indigo-900 text-white transition-all duration-300">
      <div className="flex items-center justify-center h-20 border-b border-indigo-800">
        <h1 className="text-2xl font-bold tracking-wider">{APP_NAME}</h1>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onViewChange(item.id)}
                className={`flex items-center w-full px-6 py-3 text-sm font-medium transition-colors duration-200 ${
                  currentView === item.id
                    ? 'bg-indigo-800 text-white border-r-4 border-indigo-400'
                    : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
                }`}
              >
                <span className="mr-3">{item.icon()}</span>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="p-4 border-t border-indigo-800">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-indigo-800 bg-opacity-50">
           <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
           <span className="text-xs text-indigo-200">System Online</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
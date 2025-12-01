import React from 'react';
import { User } from '../types';
import { Icons } from '../constants';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  title: string;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, title }) => {
  return (
    <header className="bg-white shadow-sm z-10">
      <div className="flex items-center justify-between px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        
        <div className="flex items-center space-x-4">
          <div className="flex flex-col items-end">
             <span className="text-sm font-medium text-gray-700">{user.name}</span>
             <span className="text-xs text-gray-500 uppercase tracking-wide">{user.role}</span>
          </div>
          <img 
            src={user.avatarUrl || 'https://via.placeholder.com/40'} 
            alt="Profile" 
            className="h-10 w-10 rounded-full border border-gray-200 object-cover"
          />
          <button 
            onClick={onLogout}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            title="Logout"
          >
            <Icons.Logout />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
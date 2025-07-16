import React from 'react';
import { Search, Bell, Moon, User } from 'lucide-react';

const Navbar = () => {
  return (
    <div className="h-16 bg-[#0A0A0A] border-b border-[#1A1A1A] px-6 flex items-center">
      {/* Welcome Text */}
      <h1 className="text-white text-xl font-semibold">Hello, Sam Joe</h1>

      {/* Search Bar */}
      <div className="flex-1 max-w-2xl ml-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 bg-[#1A1A1A] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Right Side Icons */}
      <div className="flex items-center space-x-4 ml-auto">
        <button className="p-2 text-gray-400 hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors">
          <Moon size={20} />
        </button>
        <button className="p-2 text-gray-400 hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full"></span>
        </button>
        <button className="p-2 text-gray-400 hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors">
          <User size={20} />
        </button>
      </div>
    </div>
  );
};

export default Navbar;

import React, { useState } from 'react';
import { Search, Bell, Moon, User, Menu, X } from 'lucide-react';

const Navbar = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <>
      <div className="h-16 bg-[#0A0A0A] border-b border-[#1A1A1A] px-4 md:px-6 flex items-center">
        {/* Mobile Menu Toggle */}
        <div className="md:hidden mr-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Welcome Text */}
        <h1 className="text-white text-lg md:text-xl font-semibold truncate">
          <span className="hidden sm:inline">Hello, Sam Joe</span>
          <span className="sm:hidden">Hi, Sam</span>
        </h1>

        {/* Desktop Search Bar */}
        <div className="hidden md:flex flex-1 max-w-2xl ml-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-[#1A1A1A] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Mobile Search Toggle */}
        <div className="md:hidden flex-1 flex justify-end mr-2">
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors"
          >
            <Search size={20} />
          </button>
        </div>

        {/* Right Side Icons */}
        <div className="flex items-center space-x-1 md:space-x-4 ml-auto">
          {/* Desktop Icons */}
          <div className="hidden md:flex items-center space-x-4">
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

          {/* Mobile Menu Toggle for Actions */}
          <div className="md:hidden">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="p-2 text-gray-400 hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors"
            >
              {isDropdownOpen ? <X size={20} /> : <User size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {isSearchOpen && (
        <div className="md:hidden bg-[#0A0A0A] border-b border-[#1A1A1A] px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-[#1A1A1A] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Mobile Actions Dropdown */}
      {isDropdownOpen && (
        <div className="md:hidden bg-[#0A0A0A] border-b border-[#1A1A1A] px-4 py-3">
          <div className="flex flex-col space-y-3">
            <button className="flex items-center space-x-3 p-2 text-gray-400 hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors">
              <Moon size={20} />
              <span>Dark Mode</span>
            </button>
            <button className="flex items-center space-x-3 p-2 text-gray-400 hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors relative">
              <div className="relative">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full"></span>
              </div>
              <span>Notifications</span>
            </button>
            <button className="flex items-center space-x-3 p-2 text-gray-400 hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors">
              <User size={20} />
              <span>Profile</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;

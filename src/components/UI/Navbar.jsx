import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Moon, User, Menu, X, LogOut, Settings, HelpCircle, RefreshCw } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const { user, logout, isAuthenticated, refreshUserProfile } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const profileRef = useRef(null);
  const searchInputRef = useRef(null);

  // Handle click outside profile dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle refresh profile
  const handleRefreshProfile = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await refreshUserProfile();
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/signin');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (user?.name) return user.name;
    if (user?.email) {
      // Use the part before @ in email if no name is available
      return user.email.split('@')[0];
    }
    return 'Trader';
  };

  // Get user initial for avatar
  const getUserInitial = () => {
    if (user?.name && user.name.length > 0) return user.name.charAt(0).toUpperCase();
    if (user?.email && user.email.length > 0) return user.email.charAt(0).toUpperCase();
    return 'T';
  };

  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Close mobile search if open
    if (isSearchOpen) {
      setIsSearchOpen(false);
    }
    
    // Navigate to search results page with the query
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    
    // Reset search field after navigation
    setSearchQuery('');
  };

  // Focus search input when opened on mobile
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

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
          <span className="hidden sm:inline">Hello, {getUserDisplayName()}</span>
          <span className="sm:hidden">Hi, {getUserDisplayName().split(' ')[0]}</span>
        </h1>

        {/* Desktop Search Bar */}
        <div className="hidden md:flex flex-1 max-w-2xl ml-8">
          <form onSubmit={handleSearch} className="w-full">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search for symbols, strategies, insights..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#1A1A1A] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F00FF]/70 transition-all"
              />
              {searchQuery && (
                <button 
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </form>
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

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 p-1 hover:bg-[#1A1A1A] rounded-lg transition-colors"
              >
                {user?.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full object-cover border-2 border-blue-600"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-[#2F00FF] to-[#1C0099] text-white font-semibold text-sm">
                    {getUserInitial()}
                  </div>
                )}
                <div className="hidden xl:block text-left">
                  <p className="text-sm text-white font-medium leading-tight">
                    {getUserDisplayName()}
                  </p>
                  {/* <p className="text-xs text-gray-400 leading-tight">
                    {user?.id ? `ID: ${user.id.substring(0, 8)}...` : 'Standard Account'}
                  </p> */}
                </div>
                <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-[#1A1A1A] border border-[#222] rounded-lg shadow-lg overflow-hidden z-10">
                  <div className="p-4 border-b border-[#222]">
                    <p className="text-white font-medium">
                      {getUserDisplayName()}
                    </p>
                    <p className="text-sm text-gray-400 truncate flex items-center justify-between">
                      {user?.email || 'user@example.com'}
                      <button 
                        onClick={handleRefreshProfile}
                        className="p-1 text-blue-400 hover:text-blue-300 rounded-full transition-colors"
                        disabled={isRefreshing}
                        title="Refresh profile"
                      >
                        <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                      </button>
                    </p>
                  </div>
                  
                  <div className="py-2">
                    <Link to="/settings" className="flex items-center px-4 py-2 text-gray-200 hover:bg-[#222] transition-colors">
                      <Settings size={16} className="mr-3 text-gray-400" />
                      Account Settings
                    </Link>
                    <Link to="/support" className="flex items-center px-4 py-2 text-gray-200 hover:bg-[#222] transition-colors">
                      <HelpCircle size={16} className="mr-3 text-gray-400" />
                      Help & Support
                    </Link>
                  </div>
                  
                  <div className="border-t border-[#222] py-2">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-red-400 hover:bg-[#222] transition-colors"
                    >
                      <LogOut size={16} className="mr-3" />
                      Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Toggle for Actions */}
          <div className="md:hidden">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="p-1 text-gray-400 hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors flex items-center space-x-1"
            >
              {user?.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt="Profile" 
                  className="w-7 h-7 rounded-full object-cover border-2 border-blue-600"
                />
              ) : (
                <div className="w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-r from-[#2F00FF] to-[#1C0099] text-white font-semibold text-sm">
                  {getUserInitial()}
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {isSearchOpen && (
        <div className="md:hidden bg-[#0A0A0A] border-b border-[#1A1A1A] px-4 py-3">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search for symbols, strategies, insights..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 bg-[#1A1A1A] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F00FF]/70"
                autoFocus
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center">
                {searchQuery && (
                  <button 
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-gray-400 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                )}
                <button 
                  type="submit"
                  className="ml-1 p-1 text-gray-400 hover:text-white"
                >
                  <Search size={16} />
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Mobile Actions Dropdown */}
      {isDropdownOpen && (
        <div className="md:hidden bg-[#0A0A0A] border-b border-[#1A1A1A] px-4 py-3">
          {/* User Profile Info */}
          <div className="flex items-center space-x-3 p-3 bg-[#111] rounded-lg mb-3">
            {user?.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt="Profile" 
                className="w-10 h-10 rounded-full object-cover border-2 border-blue-600"
              />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-r from-[#2F00FF] to-[#1C0099] text-white font-semibold">
                {getUserInitial()}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-white font-medium">{getUserDisplayName()}</p>
                <button 
                  onClick={handleRefreshProfile}
                  className="p-1 text-blue-400 hover:text-blue-300 rounded-full transition-colors"
                  disabled={isRefreshing}
                >
                  <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                </button>
              </div>
              <p className="text-xs text-gray-400">{user?.email || 'user@example.com'}</p>
            </div>
          </div>
          
          <div className="flex flex-col space-y-2">
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
            <Link to="/settings" className="flex items-center space-x-3 p-2 text-gray-400 hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors">
              <Settings size={20} />
              <span>Settings</span>
            </Link>
            <Link to="/support" className="flex items-center space-x-3 p-2 text-gray-400 hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors">
              <HelpCircle size={20} />
              <span>Help & Support</span>
            </Link>
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-3 p-2 text-red-400 hover:text-red-300 hover:bg-[#1A1A1A] rounded-lg transition-colors mt-2 border-t border-[#222] pt-4"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;

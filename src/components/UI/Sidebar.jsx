import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import {
  LayoutDashboard,
  Bot,
  LineChart,
  FlaskConical,
  Layers,
  Users,
  Search,
  BarChart,
  Settings,
  HelpCircle,
  PanelLeft,
  LogOut,
  X
} from 'lucide-react';

const Sidebar = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Check if screen is mobile
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    if (isMobile && setIsMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [location.pathname, isMobile, setIsMobileMenuOpen]);

  // Logout handler
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      // The logout function handles navigation
    } catch (error) {
      console.error('Logout failed:', error);
      // If logout fails, still try to redirect
      window.location.href = '/signin';
    } finally {
      setIsLoggingOut(false);
    }
  };

  const menuItems = [
    { title: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { title: 'AI Assistant', path: '/ai-assistant', icon: Bot },
    { title: 'Analyst Insights', path: '/analyst-insights', icon: LineChart },
    { title: 'Strategy Lab', path: '/strategy-lab', icon: FlaskConical },
    { title: 'Account Aggregation', path: '/account-aggregation', icon: Layers },
    { title: 'Traders Community', path: '/community', icon: Users },
    { title: 'Research', path: '/research', icon: Search },
    { title: 'Analytics', path: '/analytics', icon: BarChart },
    { title: 'Settings', path: '/settings', icon: Settings },
    { title: 'Support', path: '/support', icon: HelpCircle },
  ];

  const toggleSidebar = () => {
    if (isMobile && setIsMobileMenuOpen) {
      setIsMobileMenuOpen(!isMobileMenuOpen);
    } else {
      setIsOpen(!isOpen);
    }
  };

  // Mobile overlay
  if (isMobile) {
    return (
      <>
        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        
        {/* Mobile Sidebar */}
        <div className={`fixed left-0 top-0 h-full bg-[#0A0A0A] text-white p-4 w-64 transform transition-transform z-50 md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="text-2xl font-bold">
              Tradexas
            </Link>
            <button 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="text-gray-400 hover:text-white p-2 rounded-lg transition-all hover:bg-[#1A1A1A]"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center space-x-3 p-3 rounded-lg transition-all
                        ${isActive 
                          ? 'bg-gradient-to-r from-[#2F00FF] to-[#1C0099]text-white shadow-md' 
                          : 'hover:bg-[#1A1A1A] text-gray-400 hover:text-white'
                        }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon size={20} className={isActive ? 'text-white' : 'text-gray-400'} />
                      <span>{item.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-auto pt-8">
            <div className="bg-[#1A1A1A] rounded-lg p-4 mb-4">
              <h3 className="font-semibold mb-2">Join Our Community</h3>
              <p className="text-sm text-gray-400 mb-3">Connect with fellow traders and share insights</p>
              <button className="w-full bg-gradient-to-r from-[#2F00FF] to-[#1C0099] text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Join Now
              </button>
            </div>

                        <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-[#1A1A1A] transition-colors text-gray-400 hover:text-white w-full text-left ${isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <LogOut size={20} />
              <span>{isLoggingOut ? 'Logging out...' : 'Log Out'}</span>
            </button>
          </div>
        </div>
      </>
    );
  }

  // Desktop Sidebar
  return (
    <div className={`hidden md:block h-screen bg-[#0A0A0A] text-white p-4 ${isOpen ? 'w-64' : 'w-20'} transition-all duration-300`}>
      <div className="flex items-center mb-8">
        <button 
          onClick={toggleSidebar} 
          className="text-gray-400 hover:text-white p-2 rounded-lg transition-all hover:bg-[#1A1A1A]"
        >
          <PanelLeft size={20} className={`transform transition-transform ${!isOpen && 'rotate-180'}`} />
        </button>
        {isOpen && (
          <Link to="/" className="ml-3">
            <span className="text-2xl font-bold">Tradexas</span>
          </Link>
        )}
      </div>

      <nav>
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center ${isOpen ? 'space-x-3' : 'justify-center'} p-2 rounded-lg transition-all
                    ${isActive 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md' 
                      : 'hover:bg-[#1A1A1A] text-gray-400 hover:text-white'
                    }`}
                >
                  <item.icon size={20} className={isActive ? 'text-white' : 'text-gray-400'} />
                  {isOpen && <span>{item.title}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto pt-8">
        {isOpen && (
          <div className="bg-[#1A1A1A] rounded-lg p-4 mb-4">
            <h3 className="font-semibold mb-2">Join Our Community</h3>
            <p className="text-sm text-gray-400 mb-3">Connect with fellow traders and share insights</p>
            <button className="w-full bg-gradient-to-r from-[#2F00FF] to-[#1C0099] text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Join Now
            </button>
          </div>
        )}

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`flex items-center ${isOpen ? 'space-x-3' : 'justify-center'} p-2 rounded-lg hover:bg-[#1A1A1A] transition-colors text-gray-400 hover:text-white w-full text-left ${isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <LogOut size={20} />
          {isOpen && <span>{isLoggingOut ? 'Logging out...' : 'Log Out'}</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

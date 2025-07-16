import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
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
  LogOut
} from 'lucide-react';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();

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

  return (
    <div className={`h-screen bg-[#0A0A0A] text-white p-4 ${isOpen ? 'w-64' : 'w-20'} transition-all duration-300`}>
      <div className="flex items-center mb-8">
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="text-gray-400 hover:text-white p-2 rounded-lg transition-all hover:bg-[#1A1A1A]"
        >
          <PanelLeft size={20} className={`transform transition-transform ${!isOpen && 'rotate-180'}`} />
        </button>
        {isOpen && (
          <Link to="/" className="ml-3">
            <span className="text-2xl font-bold">Trader</span>
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
            <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Join Now
            </button>
          </div>
        )}

        <Link
          to="/logout"
          className={`flex items-center ${isOpen ? 'space-x-3' : 'justify-center'} p-2 rounded-lg hover:bg-[#1A1A1A] transition-colors text-gray-400 hover:text-white`}
        >
          <LogOut size={20} />
          {isOpen && <span>Log Out</span>}
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;

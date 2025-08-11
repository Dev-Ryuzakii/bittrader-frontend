import React, { useState, useEffect } from 'react';
import { Bell, User, Shield, ChevronRight, Sliders, LineChart, AlertTriangle, Globe, Monitor, Zap, Lock, LogOut, Loader, RefreshCw } from 'lucide-react';
import { userAPI, tradingAPI } from '../../api/api';
import { auth } from '../../utils/auth';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('account');
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    trades: true,
    news: false,
    marketAlerts: true
  });
  
  // Fetch user profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        const data = await userAPI.getProfile();
        setProfileData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError('Failed to load profile data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfileData();
  }, []);
  
  const handleNotificationChange = (type) => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
    
    // In a real app, you would save this to the backend
    // Example: userAPI.updateNotificationSettings({ [type]: !notifications[type] });
  };
  
  const handleLogout = () => {
    auth.logout();
  };
  
  // Fetch user data on component mount
  useEffect(() => {
    // Check if user is authenticated
    if (!auth.isAuthenticated()) {
      auth.redirectToLogin();
    }
  }, []);
  
  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-10">
          <Loader className="w-8 h-8 text-blue-500 animate-spin mb-4" />
          <p className="text-white">Loading your settings...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-10">
          <AlertTriangle className="w-8 h-8 text-yellow-500 mb-4" />
          <p className="text-white mb-2">{error}</p>
          <button 
            className="px-4 py-2 bg-blue-600 rounded-lg text-white flex items-center"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Try Again
          </button>
        </div>
      );
    }
    
    switch(activeTab) {
      case 'account':
        return <AccountSettings profileData={profileData} />;
      case 'notifications':
        return <NotificationSettings notifications={notifications} handleNotificationChange={handleNotificationChange} />;
      case 'trading':
        return <TradingSettings />;
      case 'security':
        return <SecuritySettings />;
      default:
        return <AccountSettings profileData={profileData} />;
    }
  };
  
  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#0A0A0A] ">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-white flex items-center">
          <Sliders className="mr-2 h-6 w-6" /> Settings
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-[#222222] backdrop-blur-sm rounded-xl border border-white shadow-xl overflow-hidden">
              <div className="p-4 border-b border-white">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                      {profileData ? (
                        profileData.firstName && profileData.lastName 
                          ? profileData.firstName[0] + profileData.lastName[0]
                          : profileData.email?.substring(0, 2).toUpperCase() || 'U'
                      ) : 'U'}
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-green-500 rounded-full border-2 border-gray-800"></div>
                  </div>
                  <div>
                    <h3 className="text-white font-medium">
                      {profileData ? (
                        profileData.firstName && profileData.lastName 
                          ? `${profileData.firstName} ${profileData.lastName}`
                          : profileData.email || 'User'
                      ) : 'Loading...'}
                    </h3>
                    <p className="text-white text-sm">
                      {profileData?.subscription?.tier || 'Standard Account'}
                    </p>
                  </div>
                </div>
              </div>
              
              <nav className="p-2">
                <button 
                  onClick={() => setActiveTab('account')}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${activeTab === 'account' ? 'bg-gray-700/70 text-white' : 'text-white hover:bg-gray-700/40 hover:text-white'}`}
                >
                  <User size={18} />
                  <span>Account</span>
                  {activeTab === 'account' && <ChevronRight className="ml-auto" size={16} />}
                </button>
                
                {/* <button 
                  onClick={() => setActiveTab('notifications')}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${activeTab === 'notifications' ? 'bg-gray-700/70 text-white' : 'text-white hover:bg-gray-700/40 hover:text-white'}`}
                >
                  <Bell size={18} />
                  <span>Notifications</span>
                  {activeTab === 'notifications' && <ChevronRight className="ml-auto" size={16} />}
                </button>
                
                <button 
                  onClick={() => setActiveTab('trading')}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${activeTab === 'trading' ? 'bg-gray-700/70 text-white' : 'text-white hover:bg-gray-700/40 hover:text-white'}`}
                >
                  <LineChart size={18} />
                  <span>Trading Preferences</span>
                  {activeTab === 'trading' && <ChevronRight className="ml-auto" size={16} />}
                </button>
                
                <button 
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${activeTab === 'security' ? 'bg-gray-700/70 text-white' : 'text-white hover:bg-gray-700/40 hover:text-white'}`}
                >
                  <Shield size={18} />
                  <span>Security</span>
                  {activeTab === 'security' && <ChevronRight className="ml-auto" size={16} />}
                </button>
                 */}
                <div className="border-t border-white my-2 pt-2">
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 p-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={18} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </nav>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-[#222222] backdrop-blur-sm rounded-xl border border-white shadow-xl p-5">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AccountSettings = ({ profileData }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  
  useEffect(() => {
    if (profileData) {
      setFormData({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        email: profileData.email || '',
        phone: profileData.phone || ''
      });
    }
  }, [profileData]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await userAPI.updateProfile(formData);
      setIsEditing(false);
      // Ideally you would refresh the profile data here
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6 text-white border-b border-white pb-3">Account Settings</h2>
      
      <div className="space-y-6">
        <div className="bg-gray-700/30 rounded-lg p-4">
          <div className="flex flex-col md:flex-row justify-between md:items-center mb-4">
            <div>
              <h3 className="text-white font-medium text-lg">Profile Information</h3>
              <p className="text-white text-sm">Update your account details</p>
            </div>
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="mt-2 md:mt-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors text-sm"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex space-x-2">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="mt-2 md:mt-0 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white transition-colors text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmit}
                  className="mt-2 md:mt-0 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors text-sm"
                >
                  Save
                </button>
              </div>
            )}
          </div>
          
          {!isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1">First Name</label>
                <div className="bg-gray-800text-white p-3 rounded-lg">{profileData?.firstName || 'Not set'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">Last Name</label>
                <div className="bg-gray-800text-white p-3 rounded-lg">{profileData?.lastName || 'Not set'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">Email Address</label>
                <div className="bg-gray-800text-white p-3 rounded-lg">{profileData?.email || 'Not set'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">Phone Number</label>
                <div className="bg-gray-800text-white p-3 rounded-lg">{profileData?.phone || 'Not set'}</div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="bg-gray-800text-white p-3 rounded-lg w-full border border-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="bg-gray-800text-white p-3 rounded-lg w-full border border-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="bg-gray-800text-white p-3 rounded-lg w-full border border-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="bg-gray-800text-white p-3 rounded-lg w-full border border-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </form>
          )}
        </div>
        
        {/* <div className="bg-gray-700/30 rounded-lg p-4">
          <div className="flex flex-col md:flex-row justify-between md:items-center mb-4">
            <div>
              <h3 className="text-white font-medium text-lg">Account Tier</h3>
              <p className="text-white text-sm">Your current subscription details</p>
            </div>
            <button className="mt-2 md:mt-0 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg text-white transition-colors text-sm">
              Upgrade Plan
            </button>
          </div>
          
          <div className="bg-[#0A0A0A]/80 rounded-lg p-4 border border-purple-500/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-purple-400 font-medium">{profileData?.subscription?.tier || 'Free'}</div>
                <div className="text-white text-xl font-bold">{profileData?.subscription?.price || '$0'} / month</div>
                <div className="text-white text-sm mt-1">
                  {profileData?.subscription?.renewDate 
                    ? `Renews on ${new Date(profileData.subscription.renewDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}` 
                    : 'No active subscription'}
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-3 rounded-full">
                <Zap className="text-white" size={24} />
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {profileData?.subscription?.features?.map((feature, index) => (
                <div key={index} className="flex items-center text-gray-300">
                  <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm">{feature}</span>
                </div>
              )) || (
                <>
                  <div className="flex items-center text-gray-300">
                    <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-sm">Basic Trading Tools</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-sm">Standard Market Data</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div> */}
        
        <div className="bg-gray-700/30 rounded-lg p-4">
          <div className="flex flex-col md:flex-row justify-between md:items-center mb-4">
            <div>
              <h3 className="text-white font-medium text-lg">Connected Accounts</h3>
              <p className="text-white text-sm">Manage your linked broker accounts</p>
            </div>
            <button className="mt-2 md:mt-0 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors text-sm">
              Connect New
            </button>
          </div>
          
          <div className="space-y-3">
            {profileData?.connectedAccounts?.length > 0 ? (
              profileData.connectedAccounts.map((account, index) => (
                <div key={index} className="bg-gray-800rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`bg-${account.color || 'blue'}-500/20 p-2 rounded-lg mr-3`}>
                      <Globe className={`text-${account.color || 'blue'}-400`} size={20} />
                    </div>
                    <div>
                      <div className="text-white font-medium">{account.name}</div>
                      <div className="text-white text-sm">
                        Connected on {new Date(account.connectedDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <button className="text-white hover:text-white">
                    <ChevronRight size={20} />
                  </button>
                </div>
              ))
            ) : (
              <div className="bg-gray-800rounded-lg p-4 text-center">
                <p className="text-white">No accounts connected yet.</p>
                <p className="text-sm text-gray-500 mt-1">Connect your trading accounts to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const NotificationSettings = ({ notifications, handleNotificationChange }) => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6 text-white border-b border-white pb-3">Notification Settings</h2>
      
      <div className="space-y-6">
        <div className="bg-gray-700/30 rounded-lg p-4">
          <h3 className="text-white font-medium text-lg mb-4">Notification Channels</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white">Email Notifications</div>
                <div className="text-white text-sm">Receive updates via email</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={notifications.email}
                  onChange={() => handleNotificationChange('email')}
                />
                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white">Push Notifications</div>
                <div className="text-white text-sm">Receive push notifications on your device</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={notifications.push}
                  onChange={() => handleNotificationChange('push')}
                />
                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-700/30 rounded-lg p-4">
          <h3 className="text-white font-medium text-lg mb-4">Notification Types</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white">Trade Notifications</div>
                <div className="text-white text-sm">Get notified about your trade executions</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={notifications.trades}
                  onChange={() => handleNotificationChange('trades')}
                />
                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white">Market News</div>
                <div className="text-white text-sm">Updates about market news and events</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={notifications.news}
                  onChange={() => handleNotificationChange('news')}
                />
                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white">Price Alerts</div>
                <div className="text-white text-sm">Custom price alerts for your watchlist</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={notifications.marketAlerts}
                  onChange={() => handleNotificationChange('marketAlerts')}
                />
                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-700/30 rounded-lg p-4">
          <h3 className="text-white font-medium text-lg mb-4">Notification Schedule</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">Quiet Hours Start</label>
              <select className="bg-gray-800text-white rounded-lg border border-white px-3 py-2 w-full">
                <option>10:00 PM</option>
                <option>11:00 PM</option>
                <option>12:00 AM</option>
                <option>1:00 AM</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">Quiet Hours End</label>
              <select className="bg-gray-800text-white rounded-lg border border-white px-3 py-2 w-full">
                <option>6:00 AM</option>
                <option>7:00 AM</option>
                <option>8:00 AM</option>
                <option>9:00 AM</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TradingSettings = () => {
  const [tradingPreferences, setTradingPreferences] = useState({
    defaultOrderType: 'Market',
    timeInForce: 'Good Till Cancelled',
    confirmOrders: true,
    maxPositionSize: 10,
    autoStopLoss: true,
    autoTakeProfit: true,
    oneClickTrading: false,
    advancedChartingTools: true,
    strategyAutomation: false
  });
  const [isLoading, setIsLoading] = useState(false);
  
  // In a real app, you would fetch these from the backend
  useEffect(() => {
    const fetchTradingPreferences = async () => {
      try {
        setIsLoading(true);
        // This would be the actual API call in a real app
        // const response = await userAPI.getTradingPreferences();
        // setTradingPreferences(response.data);
        
        // Simulate API delay
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error fetching trading preferences:', error);
        setIsLoading(false);
      }
    };
    
    fetchTradingPreferences();
  }, []);
  
  const handleToggleChange = (setting) => {
    setTradingPreferences(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
    
    // In a real app, you would save this to the backend
    // Example: userAPI.updateTradingPreferences({ [setting]: !tradingPreferences[setting] });
  };
  
  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setTradingPreferences(prev => ({
      ...prev,
      [name]: value
    }));
    
    // In a real app, you would save this to the backend
    // Example: userAPI.updateTradingPreferences({ [name]: value });
  };
  
  const handleRangeChange = (e) => {
    const { name, value } = e.target;
    setTradingPreferences(prev => ({
      ...prev,
      [name]: parseInt(value)
    }));
    
    // In a real app, you would save this to the backend
    // Example: userAPI.updateTradingPreferences({ [name]: parseInt(value) });
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    );
  }
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6 text-white border-b border-white pb-3">Trading Preferences</h2>
      
      <div className="space-y-6">
        <div className="bg-gray-700/30 rounded-lg p-4">
          <h3 className="text-white font-medium text-lg mb-4">Default Order Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">Default Order Type</label>
              <select 
                name="defaultOrderType"
                value={tradingPreferences.defaultOrderType}
                onChange={handleSelectChange}
                className="bg-gray-800text-white rounded-lg border border-white px-3 py-2 w-full"
              >
                <option>Market</option>
                <option>Limit</option>
                <option>Stop</option>
                <option>Stop Limit</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">Time In Force</label>
              <select 
                name="timeInForce"
                value={tradingPreferences.timeInForce}
                onChange={handleSelectChange}
                className="bg-gray-800text-white rounded-lg border border-white px-3 py-2 w-full"
              >
                <option>Good Till Cancelled</option>
                <option>Day Only</option>
                <option>Fill or Kill</option>
                <option>Immediate or Cancel</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <div>
              <div className="text-white">Confirm Orders Before Execution</div>
              <div className="text-white text-sm">Show a confirmation dialog before executing trades</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={tradingPreferences.confirmOrders}
                onChange={() => handleToggleChange('confirmOrders')}
              />
              <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
        
        <div className="bg-gray-700/30 rounded-lg p-4">
          <h3 className="text-white font-medium text-lg mb-4">Risk Management</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Maximum Position Size (% of Account): {tradingPreferences.maxPositionSize}%
              </label>
              <input 
                type="range" 
                name="maxPositionSize"
                min="1" 
                max="100" 
                value={tradingPreferences.maxPositionSize}
                onChange={handleRangeChange}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-white text-sm mt-1">
                <span>1%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white">Auto Stop Loss</div>
                <div className="text-white text-sm">Automatically set stop loss for trades</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={tradingPreferences.autoStopLoss}
                  onChange={() => handleToggleChange('autoStopLoss')}
                />
                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white">Auto Take Profit</div>
                <div className="text-white text-sm">Automatically set take profit for trades</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={tradingPreferences.autoTakeProfit}
                  onChange={() => handleToggleChange('autoTakeProfit')}
                />
                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-700/30 rounded-lg p-4">
          <h3 className="text-white font-medium text-lg mb-4">Advanced Trading Features</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white">One-Click Trading</div>
                <div className="text-white text-sm">Execute trades with a single click</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={tradingPreferences.oneClickTrading}
                  onChange={() => handleToggleChange('oneClickTrading')}
                />
                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white">Advanced Charting Tools</div>
                <div className="text-white text-sm">Use advanced indicators and drawing tools</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={tradingPreferences.advancedChartingTools}
                  onChange={() => handleToggleChange('advancedChartingTools')}
                />
                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white">Strategy Automation</div>
                <div className="text-white text-sm">Enable automated trading strategies</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={tradingPreferences.strategyAutomation}
                  onChange={() => handleToggleChange('strategyAutomation')}
                />
                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SecuritySettings = () => {
  const [securityData, setSecurityData] = useState({
    twoFactorEnabled: true,
    loginHistory: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  
  useEffect(() => {
    const fetchSecurityData = async () => {
      try {
        setIsLoading(true);
        // In a real app, you would fetch security data from the backend
        // const response = await userAPI.getSecuritySettings();
        // setSecurityData(response.data);
        
        // Simulate API call
        setTimeout(() => {
          setSecurityData({
            twoFactorEnabled: true,
            loginHistory: [
              {
                device: 'macOS - Chrome',
                date: new Date(),
                location: 'San Francisco, United States',
                isActive: true
              },
              {
                device: 'iOS - Safari',
                date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                location: 'San Francisco, United States',
                isActive: false
              },
              {
                device: 'Windows - Firefox',
                date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                location: 'New York, United States',
                isActive: false
              }
            ]
          });
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error fetching security settings:', error);
        setIsLoading(false);
      }
    };
    
    fetchSecurityData();
  }, []);
  
  const handleToggle2FA = () => {
    setSecurityData(prev => ({
      ...prev,
      twoFactorEnabled: !prev.twoFactorEnabled
    }));
    
    // In a real app, you would update this in the backend
    // userAPI.updateSecuritySettings({ twoFactorEnabled: !securityData.twoFactorEnabled });
  };
  
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when typing
    if (passwordError) setPasswordError('');
    if (passwordSuccess) setPasswordSuccess('');
  };
  
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }
    
    try {
      // In a real app, you would update the password in the backend
      // await userAPI.updatePassword(passwordForm);
      
      // Simulate success
      setPasswordSuccess('Password updated successfully');
      setTimeout(() => {
        setShowChangePassword(false);
        setPasswordSuccess('');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }, 2000);
    } catch (error) {
      console.error('Error updating password:', error);
      setPasswordError('Failed to update password. Please try again.');
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    );
  }
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6 text-white border-b border-white pb-3">Security Settings</h2>
      
      <div className="space-y-6">
        <div className="bg-gray-700/30 rounded-lg p-4">
          <div className="flex flex-col md:flex-row justify-between md:items-center mb-4">
            <div>
              <h3 className="text-white font-medium text-lg">Password Settings</h3>
              <p className="text-white text-sm">Manage your account password</p>
            </div>
            <button 
              onClick={() => setShowChangePassword(!showChangePassword)}
              className="mt-2 md:mt-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors text-sm"
            >
              {showChangePassword ? 'Cancel' : 'Change Password'}
            </button>
          </div>
          
          {showChangePassword ? (
            <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
              {passwordError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {passwordError}
                </div>
              )}
              
              {passwordSuccess && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                  {passwordSuccess}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-white mb-1">Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  required
                  className="bg-gray-800text-white p-3 rounded-lg w-full border border-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  required
                  className="bg-gray-800text-white p-3 rounded-lg w-full border border-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  className="bg-gray-800text-white p-3 rounded-lg w-full border border-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors text-sm"
              >
                Update Password
              </button>
            </form>
          ) : (
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-start">
              <div className="mr-3 mt-1">
                <Lock className="text-blue-400" size={16} />
              </div>
              <div className="text-sm text-gray-300">
                For security reasons, we recommend changing your password regularly and using a strong password with a mix of letters, numbers, and special characters.
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-gray-700/30 rounded-lg p-4">
          <h3 className="text-white font-medium text-lg mb-4">Two-Factor Authentication</h3>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-white">Enable 2FA</div>
              <div className="text-white text-sm">Add an extra layer of security</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={securityData.twoFactorEnabled}
                onChange={handleToggle2FA}
              />
              <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          {securityData.twoFactorEnabled && (
            <div className="p-4 rounded-lg bg-[#0A0A0A]">
              <div className="flex items-center mb-3">
                <div className="h-10 w-10 bg-green-500/20 rounded-full flex items-center justify-center mr-3">
                  <Shield className="text-green-400" size={20} />
                </div>
                <div>
                  <div className="text-white font-medium">Authenticator App</div>
                  <div className="text-white text-sm">Currently active</div>
                </div>
              </div>
              
              <button className="text-sm text-blue-400 hover:text-blue-300">
                Reconfigure authenticator app
              </button>
            </div>
          )}
        </div>
        
        <div className="bg-gray-700/30 rounded-lg p-4">
          <h3 className="text-white font-medium text-lg mb-4">Login History</h3>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {securityData.loginHistory.map((login, index) => (
              <div key={index} className="bg-gray-800rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-white">{login.isActive ? 'Current Session' : 'Recent Login'}</div>
                    <div className="text-white text-sm">
                      {login.device} • {new Date(login.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  {login.isActive && (
                    <div className="bg-green-500/20 px-2 py-1 rounded text-green-400 text-xs">
                      Active
                    </div>
                  )}
                </div>
                <div className="text-gray-500 text-sm mt-1">{login.location}</div>
              </div>
            ))}
          </div>
          
          <button className="mt-3 text-sm text-blue-400 hover:text-blue-300">
            View full login history
          </button>
        </div>
        
        <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/30">
          <h3 className="text-white font-medium text-lg mb-2">Danger Zone</h3>
          
          <p className="text-gray-300 text-sm mb-4">
            These actions are permanent and cannot be undone. Please proceed with caution.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button className="px-4 py-2 bg-red-600/50 hover:bg-red-600/70 text-white rounded-lg transition-colors text-sm flex items-center justify-center">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Delete Account
            </button>
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm flex items-center justify-center">
              Reset Account Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

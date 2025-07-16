import React, { useState } from 'react';
import { X, Loader2, Eye, EyeOff } from 'lucide-react';
import { connectAccount } from '../../api/broker';

const ConnectionModal = ({ isOpen, onClose, onSubmit, platform }) => {
  const [formData, setFormData] = useState({
    broker_name: '',
    server: '',
    login: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await connectAccount({ ...formData, platform });
      onSubmit(response);
    } catch (error) {
      setError(error.message);
      console.error('Connection error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1A1A1A] rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Connect {platform} Account</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Broker Name
            </label>
            <input
              type="text"
              required
              value={formData.broker_name}
              onChange={(e) => setFormData({ ...formData, broker_name: e.target.value })}
              className="w-full px-3 py-2 bg-[#2A2A2A] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Enter broker name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Server
            </label>
            <input
              type="text"
              required
              value={formData.server}
              onChange={(e) => setFormData({ ...formData, server: e.target.value })}
              className="w-full px-3 py-2 bg-[#2A2A2A] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Enter server address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Login
            </label>
            <input
              type="text"
              required
              value={formData.login}
              onChange={(e) => setFormData({ ...formData, login: e.target.value })}
              className="w-full px-3 py-2 bg-[#2A2A2A] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Enter login ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 bg-[#2A2A2A] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 pr-10"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors mt-6 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin mr-2" />
                Connecting...
              </>
            ) : (
              'Connect Account'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ConnectionModal;

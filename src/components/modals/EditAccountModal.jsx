import React, { useState, useEffect } from 'react';
import { X, Loader2, Eye, EyeOff } from 'lucide-react';

const EditAccountModal = ({ isOpen, onClose, onSubmit, account }) => {
  const [formData, setFormData] = useState({
    account_name: '',
    password: '',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (account && isOpen) {
      setFormData({
        account_name: account.account_name || account.name || '',
        password: '',
        is_active: account.is_active,
      });
    }
  }, [account, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Only send non-empty fields
      const updateData = {};
      if (formData.account_name.trim()) {
        updateData.account_name = formData.account_name.trim();
      }
      if (formData.password.trim()) {
        updateData.password = formData.password.trim();
      }
      updateData.is_active = formData.is_active;

      await onSubmit(updateData);
      
      // Reset form after successful submission
      setFormData({
        account_name: '',
        password: '',
        is_active: true,
      });
    } catch (error) {
      setError(error.message);
      console.error('Update error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !account) return null;

  return (
    <div className="fixed inset-0  bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1A1A1A] rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Edit Account</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}

        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/50 rounded-lg text-blue-400 text-sm">
          <p><strong>Account:</strong> {account.login}</p>
          <p><strong>Platform:</strong> {account.platform}</p>
          <p><strong>Broker:</strong> {account.broker_name}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Account Name
            </label>
            <input
              type="text"
              value={formData.account_name}
              onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
              className="w-full px-3 py-2 bg-[#2A2A2A] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Enter account name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              New Password (leave empty to keep current)
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 bg-[#2A2A2A] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 pr-10"
                placeholder="Enter new password"
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

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-[#2A2A2A] border-white rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="ml-2 text-sm text-gray-200">
              Keep account active
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-[#222222] text-white py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-[#2F00FF] to-[#1C0099] text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                'Update Account'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAccountModal;

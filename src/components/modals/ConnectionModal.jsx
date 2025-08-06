import React, { useState, useEffect } from 'react';
import { X, Loader2, Eye, EyeOff, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { symbolMappingService } from '../../api/symbolMapping';
import { useTradingSymbol } from '../../contexts/TradingSymbolContext';

const ConnectionModal = ({ isOpen, onClose, onSubmit, platform }) => {
  const { refreshAccountSymbols } = useTradingSymbol();
  const [formData, setFormData] = useState({
    account_name: '',
    broker_name: '',
    server: '',
    login: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [connectionStep, setConnectionStep] = useState('form'); // 'form', 'connecting', 'mapping', 'success'
  const [mappingStatus, setMappingStatus] = useState({
    inProgress: false,
    completed: false,
    symbolCount: 0,
    error: null
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setConnectionStep('connecting');

    try {
      const response = await onSubmit({ 
        ...formData, 
        platform,
        // Ensure we're sending the account_name in the correct format expected by backend
        name: formData.account_name // Backend might expect 'name' instead of 'account_name'
      });
      
      // If connection successful, start automatic symbol mapping
      if (response && response.account_id) {
        setConnectionStep('mapping');
        await startSymbolMapping(response.account_id);
      }
      
      // Reset form after successful submission
      setFormData({
        account_name: '',
        broker_name: '',
        server: '',
        login: '',
        password: '',
      });
      
      setConnectionStep('success');
    } catch (error) {
      setError(error.message);
      setConnectionStep('form');
      console.error('Connection error:', error);
    } finally {
      setLoading(false);
    }
  };

  const startSymbolMapping = async (accountId) => {
    setMappingStatus({ inProgress: true, completed: false, symbolCount: 0, error: null });
    
    try {
      // Start automatic symbol mapping
      await refreshAccountSymbols(accountId);
      
      // Poll for completion
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds timeout
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
          const status = await symbolMappingService.getAccountSymbols(accountId);
          
          if (status.success && status.symbols_mapped) {
            setMappingStatus({
              inProgress: false,
              completed: true,
              symbolCount: status.symbols_count || 0,
              error: null
            });
            break;
          }
          
          attempts++;
        } catch (pollError) {
          console.error('Polling error:', pollError);
          attempts++;
        }
      }
      
      if (attempts >= maxAttempts) {
        setMappingStatus({
          inProgress: false,
          completed: false,
          symbolCount: 0,
          error: 'Symbol mapping timed out. It will continue in the background.'
        });
      }
    } catch (mappingError) {
      console.error('Symbol mapping error:', mappingError);
      setMappingStatus({
        inProgress: false,
        completed: false,
        symbolCount: 0,
        error: 'Failed to start symbol mapping. You can try again later.'
      });
    }
  };

  const resetModal = () => {
    setConnectionStep('form');
    setMappingStatus({ inProgress: false, completed: false, symbolCount: 0, error: null });
    setError(null);
    setLoading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0  backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#1A1A1A] rounded-lg p-6 w-full max-w-md border border-[#fff] shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Connect {platform} Account</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-blue-400 transition-colors">
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-600/60 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {connectionStep === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Account Name
              </label>
              <input
                type="text"
                required
                value={formData.account_name}
                onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                className="w-full px-3 py-2 bg-[#222222] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/70 border border-gray-700/80"
                placeholder="Enter a name for this account"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Broker Name
              </label>
              <input
                type="text"
                required
                value={formData.broker_name}
                onChange={(e) => setFormData({ ...formData, broker_name: e.target.value })}
                className="w-full px-3 py-2 bg-[#222222] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/70 border border-gray-700/80"
                placeholder="Enter broker name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Server
              </label>
              <input
                type="text"
                required
                value={formData.server}
                onChange={(e) => setFormData({ ...formData, server: e.target.value })}
                className="w-full px-3 py-2 bg-[#222222] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/70 border border-gray-700/80"
                placeholder="Enter server address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Login
              </label>
              <input
                type="text"
                required
                value={formData.login}
                onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                className="w-full px-3 py-2 bg-[#222222] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/70 border border-gray-700/80"
                placeholder="Enter login ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-[#222222] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/70 pr-10 border border-gray-700/80"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-400 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

           

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#2F00FF] to-[#1C0099] text-white py-2 rounded-lg hover:bg-blue-500 focus:ring-2 focus:ring-blue-400/50 focus:outline-none transition-all mt-6 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
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
        )}

        {connectionStep === 'connecting' && (
          <div className="text-center py-8">
            <Loader2 size={48} className="animate-spin mx-auto text-blue-500 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Connecting Account</h3>
            <p className="text-gray-400">Establishing connection to your trading account...</p>
          </div>
        )}

        {connectionStep === 'mapping' && (
          <div className="text-center py-8">
            {mappingStatus.inProgress ? (
              <>
                <Clock size={48} className="animate-pulse mx-auto text-yellow-500 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Mapping Symbols</h3>
                <p className="text-gray-400">Automatically mapping trading symbols...</p>
                <div className="mt-4 bg-yellow-500/10 border border-yellow-600/60 rounded-lg p-3">
                  <p className="text-yellow-400 text-sm">This may take up to 30 seconds</p>
                </div>
              </>
            ) : mappingStatus.completed ? (
              <>
                <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Symbols Mapped Successfully</h3>
                <p className="text-gray-400">
                  {mappingStatus.symbolCount} symbols are now available for trading
                </p>
              </>
            ) : mappingStatus.error ? (
              <>
                <AlertCircle size={48} className="mx-auto text-yellow-500 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Symbol Mapping</h3>
                <p className="text-yellow-400 text-sm">{mappingStatus.error}</p>
              </>
            ) : null}
          </div>
        )}

        {connectionStep === 'success' && (
          <div className="text-center py-8">
            <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Account Connected!</h3>
            <p className="text-gray-400 mb-4">
              Your trading account has been successfully connected and symbols are ready for use.
            </p>
            <button
              onClick={handleClose}
              className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg transition-all focus:ring-2 focus:ring-green-400/50 focus:outline-none"
            >
              Start Trading
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionModal;

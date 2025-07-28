import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastItem = ({ toast, onClose }) => {
  const icons = {
    success: <CheckCircle size={20} className="text-green-500" />,
    error: <XCircle size={20} className="text-red-500" />,
    warning: <AlertCircle size={20} className="text-yellow-500" />,
    info: <Info size={20} className="text-blue-500" />
  };

  const backgrounds = {
    success: 'bg-green-500/10 border-green-500/20',
    error: 'bg-red-500/10 border-red-500/20',
    warning: 'bg-yellow-500/10 border-yellow-500/20',
    info: 'bg-blue-500/10 border-blue-500/20'
  };

  const textColors = {
    success: 'text-green-400',
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400'
  };

  return (
    <div className={`flex items-start space-x-3 p-4 rounded-lg border backdrop-blur-sm ${backgrounds[toast.type]} transform transition-all duration-300 ease-in-out`}>
      {icons[toast.type]}
      <div className="flex-1">
        {toast.title && (
          <h4 className={`font-medium ${textColors[toast.type]} mb-1`}>
            {toast.title}
          </h4>
        )}
        <p className="text-gray-300 text-sm">{toast.message}</p>
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="text-gray-400 hover:text-white transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const newToast = { id, ...toast };
    
    setToasts(prev => [...prev, newToast]);

    // Auto remove after 5 seconds (or custom duration)
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, toast.duration || 5000);

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback({
    success: (message, options = {}) => addToast({ type: 'success', message, ...options }),
    error: (message, options = {}) => addToast({ type: 'error', message, ...options }),
    warning: (message, options = {}) => addToast({ type: 'warning', message, ...options }),
    info: (message, options = {}) => addToast({ type: 'info', message, ...options }),
  }, [addToast]);

  const value = {
    toast,
    addToast,
    removeToast
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
        {toasts.map(toast => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

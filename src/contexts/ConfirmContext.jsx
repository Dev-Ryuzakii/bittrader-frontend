import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';

const ConfirmContext = createContext();

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'danger' }) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: 'bg-red-600 hover:bg-red-700',
    primary: 'bg-blue-600 hover:bg-blue-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1A1A1A] rounded-lg p-6 w-full max-w-md border border-[#2A2A2A]">
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle className="text-yellow-500" size={24} />
          <h3 className="text-xl font-semibold text-white">{title}</h3>
        </div>
        
        <p className="text-gray-300 mb-6">{message}</p>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-lg transition-colors ${variantStyles[variant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export const ConfirmProvider = ({ children }) => {
  const [dialog, setDialog] = useState(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      const handleConfirm = () => {
        setDialog(null);
        resolve(true);
      };

      const handleCancel = () => {
        setDialog(null);
        resolve(false);
      };

      setDialog({
        ...options,
        onConfirm: handleConfirm,
        onCancel: handleCancel
      });
    });
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {dialog && <ConfirmDialog isOpen={true} {...dialog} />}
    </ConfirmContext.Provider>
  );
};

import React from 'react';
import { X } from 'lucide-react';
import mt4Logo from '../../assets/mt4.jpeg';
import mt5Logo from '../../assets/mt5.jpeg';

const PlatformSelectionModal = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1A1A1A] rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Select Trading Platform</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onSelect('MT4')}
            className="p-4 bg-[#2A2A2A] hover:bg-[#3A3A3A] rounded-lg transition-all flex flex-col items-center"
          >
            <img src={mt4Logo} alt="MT4" className="w-16 h-16 mb-2" />
            <span className="text-white font-medium">MetaTrader 4</span>
          </button>
          
          <button
            onClick={() => onSelect('MT5')}
            className="p-4 bg-[#2A2A2A] hover:bg-[#3A3A3A] rounded-lg transition-all flex flex-col items-center"
          >
            <img src={mt5Logo} alt="MT5" className="w-16 h-16 mb-2" />
            <span className="text-white font-medium">MetaTrader 5</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlatformSelectionModal;

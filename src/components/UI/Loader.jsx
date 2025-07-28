import React from 'react';
import { Loader2 } from 'lucide-react';

const Loader = ({ size = 'md', text = 'Loading...', className = '' }) => {
  const sizes = {
    sm: { spinner: 16, text: 'text-sm' },
    md: { spinner: 24, text: 'text-base' },
    lg: { spinner: 32, text: 'text-lg' },
    xl: { spinner: 40, text: 'text-xl' }
  };

  const currentSize = sizes[size] || sizes.md;

  return (
    <div className={`flex flex-col items-center justify-center space-y-2 text-gray-400 ${className}`}>
      <Loader2 size={currentSize.spinner} className="animate-spin" />
      <span className={currentSize.text}>{text}</span>
    </div>
  );
};

export default Loader;

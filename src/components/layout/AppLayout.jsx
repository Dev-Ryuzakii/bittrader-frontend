import React from 'react';

const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="bg-[#1A1A1A] border-b border-[#2A2A2A] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold">BitTrader</div>
          <div className="flex items-center space-x-4">
            {/* Add navigation items here */}
          </div>
        </div>
      </nav>
      <main className="container mx-auto">{children}</main>
    </div>
  );
};

export default AppLayout;

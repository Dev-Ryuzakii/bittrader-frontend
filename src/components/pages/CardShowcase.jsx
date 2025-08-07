import React from 'react';
import AccountCard from '../UI/AccountCard';

const CardShowcase = () => {
  // Demo data for showcasing all color variants
  const showcaseCards = [
    {
      id: 1,
      accountName: "Gray Variant",
      balance: 15000.00,
      pnl: 2500.00,
      equity: 12500.00,
      colorVariant: 1
    },
    {
      id: 2,
      accountName: "Purple Variant",
      balance: 22000.00,
      pnl: -1200.00,
      equity: 20800.00,
      colorVariant: 2
    },
    {
      id: 3,
      accountName: "Green Variant",
      balance: 18500.00,
      pnl: 3200.00,
      equity: 15300.00,
      colorVariant: 3
    },
    {
      id: 4,
      accountName: "Blue Variant",
      balance: 31000.00,
      pnl: 5500.00,
      equity: 25500.00,
      colorVariant: 4
    },
    {
      id: 5,
      accountName: "Red Variant",
      balance: 12500.00,
      pnl: -800.00,
      equity: 11700.00,
      colorVariant: 5
    },
    {
      id: 6,
      accountName: "Yellow Variant",
      balance: 27500.00,
      pnl: 4100.00,
      equity: 23400.00,
      colorVariant: 6
    },
    {
      id: 7,
      accountName: "Indigo Variant",
      balance: 19800.00,
      pnl: 1800.00,
      equity: 18000.00,
      colorVariant: 7
    },
    {
      id: 8,
      accountName: "Pink Variant",
      balance: 33500.00,
      pnl: 6200.00,
      equity: 27300.00,
      colorVariant: 8
    },
    {
      id: 9,
      accountName: "Teal Variant",
      balance: 16200.00,
      pnl: 2100.00,
      equity: 14100.00,
      colorVariant: 9
    },
    {
      id: 10,
      accountName: "Orange Variant",
      balance: 24800.00,
      pnl: -1500.00,
      equity: 23300.00,
      colorVariant: 10
    },
    {
      id: 11,
      accountName: "Cyan Variant",
      balance: 29900.00,
      pnl: 4800.00,
      equity: 25100.00,
      colorVariant: 11
    }
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Card Color Variants</h1>
        <p className="text-gray-400">Showcase of all 11 available color variants for account cards</p>
      </div>

      {/* All Color Variants */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {showcaseCards.map((card) => (
          <AccountCard
            key={card.id}
            accountName={card.accountName}
            balance={card.balance}
            pnl={card.pnl}
            equity={card.equity}
            colorVariant={card.colorVariant}
            isTotal={false}
          />
        ))}
      </div>

      {/* Color Reference */}
      <div className="mt-12 bg-[#1A1A1A] rounded-xl p-6 border border-[#2A2A2A]">
        <h3 className="text-lg font-semibold text-white mb-4">Color Variant Reference</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-sm text-gray-300">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-600 rounded"></div>
            <span>1. Gray</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-purple-600 rounded"></div>
            <span>2. Purple</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-600 rounded"></div>
            <span>3. Green</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gradient-to-r from-[#2F00FF] to-[#1C0099] rounded"></div>
            <span>4. Blue</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-600 rounded"></div>
            <span>5. Red</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-600 rounded"></div>
            <span>6. Yellow</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-indigo-600 rounded"></div>
            <span>7. Indigo</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-pink-600 rounded"></div>
            <span>8. Pink</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-teal-600 rounded"></div>
            <span>9. Teal</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-orange-600 rounded"></div>
            <span>10. Orange</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-cyan-600 rounded"></div>
            <span>11. Cyan</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardShowcase;

import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';

const AccountCard = ({ 
  accountName = "Account 1", 
  balance = 0, 
  pnl = 0, 
  equity = 0, 
  colorVariant = 1,
  isTotal = false 
}) => {
  // Define 11 color variants with enhanced gradients
  const colorVariants = {
    1: {
      gradient: 'from-slate-800 via-slate-700 to-slate-900',
      accent: 'from-slate-600 to-slate-700',
      border: 'border-slate-600/30',
      glow: 'shadow-slate-500/20'
    },
    2: {
      gradient: 'from-purple-800 via-purple-700 to-indigo-900',
      accent: 'from-purple-600 to-indigo-600',
      border: 'border-purple-500/30',
      glow: 'shadow-purple-500/20'
    },
    3: {
      gradient: 'from-emerald-800 via-green-700 to-teal-900',
      accent: 'from-emerald-600 to-teal-600',
      border: 'border-emerald-500/30',
      glow: 'shadow-emerald-500/20'
    },
    4: {
      gradient: 'from-blue-800 via-blue-700 to-cyan-900',
      accent: 'from-blue-600 to-cyan-600',
      border: 'border-blue-500/30',
      glow: 'shadow-blue-500/20'
    },
    5: {
      gradient: 'from-red-800 via-red-700 to-rose-900',
      accent: 'from-red-600 to-rose-600',
      border: 'border-red-500/30',
      glow: 'shadow-red-500/20'
    },
    6: {
      gradient: 'from-amber-800 via-yellow-700 to-orange-900',
      accent: 'from-amber-600 to-orange-600',
      border: 'border-amber-500/30',
      glow: 'shadow-amber-500/20'
    },
    7: {
      gradient: 'from-indigo-800 via-indigo-700 to-purple-900',
      accent: 'from-indigo-600 to-purple-600',
      border: 'border-indigo-500/30',
      glow: 'shadow-indigo-500/20'
    },
    8: {
      gradient: 'from-pink-800 via-pink-700 to-fuchsia-900',
      accent: 'from-pink-600 to-fuchsia-600',
      border: 'border-pink-500/30',
      glow: 'shadow-pink-500/20'
    },
    9: {
      gradient: 'from-teal-800 via-teal-700 to-cyan-900',
      accent: 'from-teal-600 to-cyan-600',
      border: 'border-teal-500/30',
      glow: 'shadow-teal-500/20'
    },
    10: {
      gradient: 'from-orange-800 via-orange-700 to-red-900',
      accent: 'from-orange-600 to-red-600',
      border: 'border-orange-500/30',
      glow: 'shadow-orange-500/20'
    },
    11: {
      gradient: 'from-cyan-800 via-cyan-700 to-blue-900',
      accent: 'from-cyan-600 to-blue-600',
      border: 'border-cyan-500/30',
      glow: 'shadow-cyan-500/20'
    }
  };

  const currentVariant = colorVariants[colorVariant] || colorVariants[1];
  const isPnlPositive = pnl >= 0;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className={`relative bg-gradient-to-br ${currentVariant.gradient} rounded-lg p-4 border ${currentVariant.border} hover:shadow-lg ${currentVariant.glow} transition-all duration-300 hover:scale-[1.02] min-w-[240px] max-w-[280px] backdrop-blur-sm`}>
      {/* Top Section */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${currentVariant.accent}`}></div>
          <h3 className="text-white font-medium text-sm truncate">
            {isTotal ? "Total Balance" : accountName}
          </h3>
        </div>
        <div className={`p-1.5 rounded-md bg-gradient-to-r ${currentVariant.accent} bg-opacity-20`}>
          {isTotal ? (
            <PieChart size={16} className="text-white" />
          ) : (
            <DollarSign size={16} className="text-white" />
          )}
        </div>
      </div>

      {/* Balance */}
      <div className="mb-4">
        <div className="text-xl font-bold text-white mb-1">
          {formatCurrency(balance)}
        </div>
        <div className="text-gray-300 text-xs">
          {isTotal ? "Portfolio Total" : "Account Balance"}
        </div>
      </div>

      {/* P&L and Equity */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-black/20 backdrop-blur-sm rounded-md p-2">
          <div className="flex items-center space-x-1 mb-1">
            {isPnlPositive ? (
              <TrendingUp size={12} className="text-green-400" />
            ) : (
              <TrendingDown size={12} className="text-red-400" />
            )}
            <span className="text-gray-300 text-xs font-medium">P&L</span>
          </div>
          <div className={`text-sm font-bold ${isPnlPositive ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(pnl)}
          </div>
        </div>

        <div className="bg-black/20 backdrop-blur-sm rounded-md p-2">
          <div className="flex items-center space-x-1 mb-1">
            <DollarSign size={12} className="text-blue-400" />
            <span className="text-gray-300 text-xs font-medium">Equity</span>
          </div>
          <div className="text-sm font-bold text-white">
            {formatCurrency(equity)}
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${currentVariant.accent} rounded-b-lg`}></div>
    </div>
  );
};

export default AccountCard;

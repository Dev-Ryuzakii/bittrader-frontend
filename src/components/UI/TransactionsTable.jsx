import React, { useState } from 'react';
import { MoreHorizontal, FileText, Download } from 'lucide-react';

const TransactionsTable = ({ transactions, isLoading, limit }) => {
  const [activeMenu, setActiveMenu] = useState(null);

  // Function to handle opening/closing the action menu
  const toggleMenu = (transactionId) => {
    if (activeMenu === transactionId) {
      setActiveMenu(null);
    } else {
      setActiveMenu(transactionId);
    }
  };

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })} ${date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })}`;
  };

  // Format currency values
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '---';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  // Render transaction type with appropriate styling
  const renderType = (type) => {
    const styles = {
      'buy': 'text-green-400',
      'sell': 'text-red-400',
      'transfer': 'text-blue-400',
      'deposit': 'text-purple-400',
      'withdrawal': 'text-orange-400'
    };
    
    return <span className={styles[type?.toLowerCase()] || 'text-white'}>{type}</span>;
  };
  
  // Render status with appropriate styling
  const renderStatus = (status) => {
    const styles = {
      'executed': 'text-green-400',
      'pending': 'text-yellow-500',
      'failed': 'text-red-400',
      'cancelled': 'text-gray-400',
      'canceled': 'text-gray-400'
    };
    
    return <span className={styles[status?.toLowerCase()] || 'text-white'}>{status}</span>;
  };

  // Render P/L with appropriate styling
  const renderPL = (pl) => {
    if (pl === null || pl === undefined || pl === '---') {
      return <span className="text-gray-400">---</span>;
    }
    
    const value = parseFloat(pl);
    const isProfit = value > 0;
    
    return (
      <span className={isProfit ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-gray-400'}>
        {formatCurrency(value)}
      </span>
    );
  };

  // Handle view invoice
  const handleViewInvoice = (transaction) => {
    //console.log('View invoice for transaction:', transaction);
    // TODO: Implement invoice viewing logic
    // This could open a modal or navigate to an invoice page
  };

  // Handle download
  const handleDownload = (transaction) => {
    //console.log('Download transaction details:', transaction);
    // TODO: Implement download logic
    // This could generate a PDF or CSV file
  };

  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#131313]">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Account</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Asset</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Strat Source</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Quantity</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Unit Price</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total Value</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Trade P/L</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A2A2A]">
            {isLoading ? (
              <tr>
                <td colSpan="11" className="px-4 py-5 text-sm text-center text-gray-400">
                  Loading transactions...
                </td>
              </tr>
              ) : transactions && transactions.length > 0 ? (
              transactions.slice(0, limit || transactions.length).map((transaction) => (
                <tr key={transaction.id} className="hover:bg-[#1E1E1E]">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-200">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-200">
                    {transaction.account_name || transaction.account_id || 'N/A'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-200">
                    {transaction.asset}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    {renderType(transaction.type)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-200">
                    {transaction.strat_source || transaction.strategy_source || 'Manual'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-200">
                    {transaction.quantity ? `${transaction.quantity} ${transaction.asset?.split('/')[0] || ''}` : '---'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-200">
                    {formatCurrency(transaction.unit_price)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-200">
                    {formatCurrency(transaction.total_value)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    {renderPL(transaction.trade_pl)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    {renderStatus(transaction.status)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-200 relative">
                    <div onClick={(e) => {
                      e.stopPropagation();
                      toggleMenu(transaction.id);
                    }} className="relative inline-block">
                      <button className="text-gray-400 hover:text-white transition-colors">
                        <MoreHorizontal size={16} />
                      </button>
                      
                      {activeMenu === transaction.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-[#1A1A1A] border border-[#2A2A2A] rounded-md shadow-lg z-10">
                          <ul className="py-1">
                            <li>
                              <button
                                onClick={() => handleViewInvoice(transaction)}
                                className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-[#2A2A2A]"
                              >
                                <FileText size={14} className="mr-2" />
                                View Invoice
                              </button>
                            </li>
                            <li>
                              <button
                                onClick={() => handleDownload(transaction)}
                                className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-[#2A2A2A]"
                              >
                                <Download size={14} className="mr-2" />
                                Download
                              </button>
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="11" className="px-4 py-5 text-sm text-center text-gray-400">
                  No transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionsTable;

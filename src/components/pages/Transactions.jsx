import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Search, Filter, RefreshCw } from 'lucide-react';
import TransactionsTable from '../UI/TransactionsTable';
import { getTransactions } from '../../api/transactions';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  // Fetch transactions from API
  useEffect(() => {
    fetchTransactions();
  }, [currentPage, statusFilter, typeFilter, dateRange]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(dateRange.from && { date_from: dateRange.from }),
        ...(dateRange.to && { date_to: dateRange.to }),
        ...(searchTerm && { search: searchTerm }),
      };

      const response = await getTransactions(params);
      if (response.success) {
        setTransactions(response.data);
        setTotalPages(Math.ceil((response.meta?.total || 0) / pageSize));
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    // Trigger search after user stops typing (debounce)
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      setCurrentPage(1);
      fetchTransactions();
    }, 500);
  };

  // Handle date filter
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  // Handle status filter
  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  // Handle type filter
  const handleTypeFilter = (e) => {
    setTypeFilter(e.target.value);
    setCurrentPage(1);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchTransactions();
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setDateRange({ from: '', to: '' });
    setStatusFilter('all');
    setTypeFilter('all');
    setCurrentPage(1);
    // This will trigger useEffect to fetch data with reset filters
  };

  // Download all transactions
  const downloadTransactions = () => {
    // Logic to download transactions as CSV or PDF
    console.log('Downloading transactions');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div className="flex items-center">
          <button 
            onClick={() => window.history.back()}
            className="mr-4 text-gray-400 hover:text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Transactions</h1>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            onClick={downloadTransactions}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Download size={16} />
            <span>Export All</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="relative md:col-span-3 lg:col-span-2">
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full bg-[#131313] border border-[#2A2A2A] rounded-lg px-4 py-2 pl-10 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          
          {/* Date Range */}
          <div className="flex items-center space-x-1 md:col-span-3 lg:col-span-2">
            <input
              type="date"
              name="from"
              value={dateRange.from}
              onChange={handleDateChange}
              className="flex-1 min-w-0 bg-[#131313] border border-[#2A2A2A] rounded-lg px-2 py-2 text-white focus:outline-none focus:border-blue-500 text-xs"
            />
            <span className="text-gray-400 text-xs px-1">to</span>
            <input
              type="date"
              name="to"
              value={dateRange.to}
              onChange={handleDateChange}
              className="flex-1 min-w-0 bg-[#131313] border border-[#2A2A2A] rounded-lg px-2 py-2 text-white focus:outline-none focus:border-blue-500 text-xs"
            />
          </div>
          
          {/* Status Filter */}
          <div className="relative lg:col-span-1">
            <select
              value={statusFilter}
              onChange={handleStatusFilter}
              className="w-full bg-[#131313] border border-[#2A2A2A] rounded-lg px-3 py-2 pr-8 text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="executed">Executed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          
          {/* Type Filter */}
          <div className="relative lg:col-span-1">
            <select
              value={typeFilter}
              onChange={handleTypeFilter}
              className="w-full bg-[#131313] border border-[#2A2A2A] rounded-lg px-3 py-2 pr-8 text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer text-sm"
            >
              <option value="all">All Types</option>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
              <option value="transfer">Transfer</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={resetFilters}
            className="flex items-center space-x-2 text-gray-400 hover:text-white"
          >
            <RefreshCw size={16} />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <TransactionsTable 
        transactions={transactions} 
        loading={isLoading} 
        showActions={true}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4 mt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-[#131313] border border-[#2A2A2A] rounded text-white hover:bg-[#2A2A2A] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {/* Page numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = currentPage <= 3 ? i + 1 : 
                                 currentPage >= totalPages - 2 ? totalPages - 4 + i : 
                                 currentPage - 2 + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 rounded text-sm ${
                        currentPage === pageNum 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-[#131313] border border-[#2A2A2A] text-white hover:bg-[#2A2A2A]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-[#131313] border border-[#2A2A2A] rounded text-white hover:bg-[#2A2A2A] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default Transactions;

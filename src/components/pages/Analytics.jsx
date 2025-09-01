import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  DollarSign, 
  BarChart3,
  Download,
  RefreshCw,
  Calendar,
  Eye,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Globe,
  Filter,
  Search
} from 'lucide-react';
import { getEAAnalysisData, exportAnalysisToExcel, generateMarketOutlook, exportMarketOutlookToExcel } from '../../api/ea';
import { useToast } from '../../contexts/ToastContext';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState(null);
  const [closedTradesData, setClosedTradesData] = useState(null);
  const [marketOutlook, setMarketOutlook] = useState(null);
  const [activeTab, setActiveTab] = useState('positions');
  const [exportLoading, setExportLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { addToast } = useToast();

  // Fetch analytics data
  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch open positions analysis using the correct endpoint
      const openPositions = await getEAAnalysisData('open-positions/all');
      console.log('📊 Raw open positions response:', openPositions);
      setAnalysisData(openPositions.data || openPositions);

      // Fetch closed trades analysis with date range
      const currentYear = new Date().getFullYear();
      const startDate = new Date(currentYear, 0, 1).toISOString();
      const endDate = new Date().toISOString();
      
      const closedTrades = await getEAAnalysisData('closed-trades/all', {
        start_date: startDate,
        end_date: endDate
      });
      console.log('📈 Raw closed trades response:', closedTrades);
      setClosedTradesData(closedTrades.data || closedTrades);

      // Generate market outlook report
      const outlook = await generateMarketOutlook({
        report_name: 'DAILY ANALYTICS REPORT',
        include_ea_data: true
      });
      setMarketOutlook(outlook.data || outlook);

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      addToast('Failed to load analytics data', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Temporary client-side export function as workaround for backend issues
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      addToast('No data to export', 'warning');
      return;
    }

    // Convert data to CSV format
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ].join('\n');

    // Create and download the CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  // Handle data export
  const handleExport = async (type) => {
    try {
      setExportLoading(true);
      
      // Since backend export is failing, use client-side CSV export as fallback
      if (type === 'positions') {
        console.log('Backend export failed, using client-side CSV export...');
        const positions = getAllPositions();
        
        if (positions.length === 0) {
          addToast('No position data to export', 'warning');
          return;
        }

        // Format data for export
        const exportData = positions.map(pos => ({
          'Instrument': pos.instrument,
          'Category': pos.category,
          'Type': pos.position_type,
          'Volume': pos.volume?.toFixed(2) || '0.00',
          'Average Price': pos.average_price?.toFixed(4) || '0.0000',
          'Spot Price': pos.spot_price?.toFixed(4) || '0.0000',
          'Profit': pos.profit?.toFixed(2) || '0.00',
          'MTM P&L': pos.mtm_pnl?.toFixed(2) || '0.00'
        }));

        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
        exportToCSV(exportData, `open_positions_${timestamp}.csv`);
        addToast('Positions data exported to CSV successfully', 'success');
        
      } else if (type === 'trades') {
        console.log('Backend export failed, using client-side CSV export...');
        const trades = getAllClosedTrades();
        
        if (trades.length === 0) {
          addToast('No trade data to export', 'warning');
          return;
        }

        // Format data for export
        const exportData = trades.map(trade => ({
          'Instrument': trade.instrument,
          'Category': trade.category,
          'Platform': trade.platform,
          'Type': trade.trade_type,
          'Volume': trade.volume?.toFixed(2) || '0.00',
          'Open Price': trade.avg_open?.toFixed(4) || '0.0000',
          'Close Price': trade.avg_close?.toFixed(4) || '0.0000',
          'Realized P&L': trade.realized_pl?.toFixed(2) || '0.00',
          'Duration (Hours)': trade.duration_hours?.toFixed(1) || '0.0'
        }));

        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
        exportToCSV(exportData, `closed_trades_YTD_${timestamp}.csv`);
        addToast('Trades data exported to CSV successfully', 'success');
      }
    } catch (error) {
      console.error('Export error:', error);
      addToast(`Export failed: ${error.message}`, 'error');
    } finally {
      setExportLoading(false);
    }
  };

  // Calculate summary metrics
  const calculateSummaryMetrics = () => {
    if (!analysisData || !closedTradesData) return null;
    
    const totalOpenPnL = analysisData.total_profit || 0;
    const totalClosedPnL = closedTradesData.grand_total_realized_pl || 0;
    const totalPositions = analysisData.total_positions || 0;
    const totalTrades = closedTradesData.grand_total_trades || 0;
    const overallWinRate = closedTradesData.overall_win_rate || 0;
    
    return {
      totalOpenPnL,
      totalClosedPnL,
      totalPnL: totalOpenPnL + totalClosedPnL,
      totalPositions,
      totalTrades,
      overallWinRate
    };
  };

  // Get all positions from categories
  const getAllPositions = () => {
    if (!analysisData) return [];
    
    const allPositions = [];
    const categories = ['crypto', 'forex', 'indices', 'commodities'];
    
    categories.forEach(category => {
      const categoryData = analysisData[category];
      if (categoryData) {
        // Add buy positions
        if (categoryData.buy_positions) {
          categoryData.buy_positions.forEach(pos => {
            allPositions.push({
              ...pos,
              category: category.toUpperCase(),
              position_type: 'BUY'
            });
          });
        }
        // Add sell positions
        if (categoryData.sell_positions) {
          categoryData.sell_positions.forEach(pos => {
            allPositions.push({
              ...pos,
              category: category.toUpperCase(),
              position_type: 'SELL'
            });
          });
        }
      }
    });
    
    return allPositions;
  };

  // Get all closed trades
  const getAllClosedTrades = () => {
    if (!closedTradesData) return [];
    
    const allTrades = [];
    const categories = ['forex_analysis', 'crypto_analysis', 'indices_analysis', 'commodities_analysis'];
    
    categories.forEach(categoryKey => {
      const categoryData = closedTradesData[categoryKey];
      if (categoryData) {
        const categoryName = categoryKey.replace('_analysis', '').toUpperCase();
        
        // Get trades from the respective category arrays
        let trades = [];
        if (categoryKey === 'forex_analysis' && categoryData.forex_trades) {
          trades = categoryData.forex_trades;
        } else if (categoryKey === 'crypto_analysis' && categoryData.crypto_trades) {
          trades = categoryData.crypto_trades;
        } else if (categoryKey === 'indices_analysis' && categoryData.indices_trades) {
          trades = categoryData.indices_trades;
        } else if (categoryKey === 'commodities_analysis' && categoryData.commodities_trades) {
          trades = categoryData.commodities_trades;
        }
        
        trades.forEach(trade => {
          allTrades.push({
            ...trade,
            category: categoryName
          });
        });
      }
    });
    
    return allTrades;
  };

  // Filter data based on search and category
  const filterData = (data) => {
    let filtered = data;
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => 
        item.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.instrument?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.platform?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.account?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const metrics = calculateSummaryMetrics();

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-lg text-white">Loading analytics data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl text-white font-bold mb-2">Trading Analytics</h1>
          <p className="text-white">Comprehensive analysis across all EA accounts</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
          <button
            onClick={fetchAnalyticsData}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={() => handleExport(activeTab === 'positions' ? 'positions' : 'trades')}
            disabled={exportLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            title="Export data as CSV file (Excel export temporarily unavailable)"
          >
            <Download className="w-4 h-4" />
            <span>{exportLoading ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total P&L</p>
                <p className={`text-2xl font-bold ${metrics.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${metrics.totalPnL.toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open P&L</p>
                <p className={`text-2xl font-bold ${metrics.totalOpenPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${metrics.totalOpenPnL.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Closed P&L</p>
                <p className={`text-2xl font-bold ${metrics.totalClosedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${metrics.totalClosedPnL.toFixed(2)}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open Positions</p>
                <p className="text-2xl font-bold text-blue-600">{metrics.totalPositions}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Win Rate</p>
                <p className="text-2xl font-bold text-purple-600">{metrics.overallWinRate.toFixed(1)}%</p>
              </div>
              <Target className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('positions')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'positions'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Eye className="w-4 h-4 inline mr-2" />
          Open Positions
        </button>
        <button
          onClick={() => setActiveTab('trades')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'trades'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-2" />
          Closed Trades
        </button>
        <button
          onClick={() => setActiveTab('outlook')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'outlook'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Globe className="w-4 h-4 inline mr-2" />
          Market Outlook
        </button>
      </div>

      {/* Filters */}
      {(activeTab === 'positions' || activeTab === 'trades') && (
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by instrument, platform, or account..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
            </div>
            
            <div className="sm:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="all">All Categories</option>
                <option value="crypto">Crypto</option>
                <option value="forex">Forex</option>
                <option value="indices">Indices</option>
                <option value="commodities">Commodities</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'positions' && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Open Positions Analysis</h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Instrument
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Volume
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Spot Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Profit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      MTM P&L
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filterData(getAllPositions()).map((position, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {position.instrument}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          position.category === 'CRYPTO' ? 'bg-orange-100 text-orange-800' :
                          position.category === 'FOREX' ? 'bg-blue-100 text-blue-800' :
                          position.category === 'INDICES' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {position.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          position.position_type === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {position.position_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {position.volume?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${position.average_price?.toFixed(4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${position.spot_price?.toFixed(4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={position.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ${position.profit?.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={position.mtm_pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ${position.mtm_pnl?.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filterData(getAllPositions()).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No positions found matching your criteria
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'trades' && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Closed Trades Analysis (YTD)</h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Instrument
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Platform
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Volume
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Open Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Close Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Realized P&L
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filterData(getAllClosedTrades()).map((trade, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {trade.instrument}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          trade.category === 'CRYPTO' ? 'bg-orange-100 text-orange-800' :
                          trade.category === 'FOREX' ? 'bg-blue-100 text-blue-800' :
                          trade.category === 'INDICES' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {trade.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {trade.platform}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          trade.trade_type === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {trade.trade_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {trade.volume?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${trade.avg_open?.toFixed(4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${trade.avg_close?.toFixed(4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={trade.realized_pl >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ${trade.realized_pl?.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {trade.duration_hours?.toFixed(1)}h
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filterData(getAllClosedTrades()).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No closed trades found matching your criteria
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'outlook' && marketOutlook && (
        <div className="space-y-6">
          {/* Market Outlook Report */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{marketOutlook.report_name}</h3>
              <div className="text-sm text-gray-500">
                {new Date(marketOutlook.report_date).toLocaleDateString()}
              </div>
            </div>
            
            {/* Market Sentiment */}
            <div className="mb-6">
              <h4 className="font-medium mb-2">Market Sentiment</h4>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                marketOutlook.market_sentiment === 'RISK ON MODE' 
                  ? 'bg-green-100 text-green-800'
                  : marketOutlook.market_sentiment === 'RISK OFF MODE'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {marketOutlook.market_sentiment}
              </div>
            </div>

            {/* Overview */}
            <div className="mb-6">
              <h4 className="font-medium mb-2">Market Overview</h4>
              <p className="text-gray-700 leading-relaxed">{marketOutlook.overview}</p>
            </div>

            {/* Top Headlines */}
            <div className="mb-6">
              <h4 className="font-medium mb-2">Top Headlines</h4>
              <div className="space-y-2">
                {marketOutlook.top_headlines?.map((headline, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="text-blue-500 font-medium">{index + 1}.</span>
                    <span className="text-gray-700">{headline.headline}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Safety Checks */}
            <div className="mb-6">
              <h4 className="font-medium mb-2">Trading Safety Checks</h4>
              <div className="space-y-3">
                {marketOutlook.safety_checks?.map((check, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-gray-900">{check.rule}</div>
                      <div className="text-sm text-gray-600">{check.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trade Sentiment Summary */}
            <div>
              <h4 className="font-medium mb-2">Trade Sentiment Summary</h4>
              <p className="text-gray-700 leading-relaxed">{marketOutlook.trade_sentiment_summary}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;

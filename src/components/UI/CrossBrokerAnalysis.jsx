import React, { useState, useEffect } from 'react';
import { symbolMappingService } from '../../api/symbolMapping';
import { BarChart3, TrendingUp, Activity, Database } from 'lucide-react';

const CrossBrokerAnalysis = ({ accountIds, accounts = [] }) => {
  const [crossMappings, setCrossMappings] = useState({});
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (accountIds && accountIds.length > 1) {
      fetchCrossBrokerData();
    }
  }, [accountIds]);

  const fetchCrossBrokerData = async () => {
    setLoading(true);
    try {
      console.log('CrossBrokerAnalysis: Fetching data for accounts:', accountIds);
      
      // Get cross-broker mappings
      const mappingsResponse = await symbolMappingService.getCrossBrokerMappings(accountIds);
      console.log('Mappings response:', mappingsResponse);

      // Get statistics
      const statsResponse = await symbolMappingService.getSymbolStatistics(accountIds);
      console.log('Statistics response:', statsResponse);

      if (mappingsResponse && mappingsResponse.success) {
        setCrossMappings(mappingsResponse.cross_mappings || mappingsResponse.data?.cross_mappings || {});
      } else {
        console.error('Failed to get mappings:', mappingsResponse);
      }
      
      if (statsResponse && statsResponse.success) {
        setStatistics(statsResponse.statistics || statsResponse.data?.statistics || {});
      } else {
        console.error('Failed to get statistics:', statsResponse);
      }
    } catch (error) {
      console.error('Failed to fetch cross-broker data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (accountIds.length < 2) {
    return (
      <div className="bg-[#1A1A1A] rounded-lg p-6 border border-[#2A2A2A]">
        <div className="text-center">
          <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Cross-Broker Analysis</h3>
          <p className="text-gray-400">Connect at least 2 accounts to view cross-broker symbol analysis</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#1A1A1A] rounded-lg p-6 border border-[#2A2A2A]">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" />
          Cross-Broker Symbol Analysis
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-400">Loading analysis...</span>
          </div>
        ) : (
          <>
            {/* Statistics Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-[#2A2A2A] rounded-lg p-4 text-center border border-[#333]">
                <div className="flex flex-col items-center">
                  <TrendingUp className="h-8 w-8 text-green-400 mb-2" />
                  <span className="text-sm font-medium text-gray-400 mb-1">Common Symbols</span>
                  <span className="text-2xl font-bold text-green-400">
                    {statistics.common_symbols?.length || 0}
                  </span>
                </div>
              </div>

              <div className="bg-[#2A2A2A] rounded-lg p-4 text-center border border-[#333]">
                <div className="flex flex-col items-center">
                  <Activity className="h-8 w-8 text-blue-400 mb-2" />
                  <span className="text-sm font-medium text-gray-400 mb-1">Total Unique</span>
                  <span className="text-2xl font-bold text-blue-400">
                    {statistics.total_unique_symbols || 0}
                  </span>
                </div>
              </div>

              <div className="bg-[#2A2A2A] rounded-lg p-4 text-center border border-[#333]">
                <div className="flex flex-col items-center">
                  <Database className="h-8 w-8 text-purple-400 mb-2" />
                  <span className="text-sm font-medium text-gray-400 mb-1">Coverage</span>
                  <span className="text-2xl font-bold text-purple-400">
                    {statistics.common_symbols?.length && statistics.total_unique_symbols 
                      ? Math.round((statistics.common_symbols.length / statistics.total_unique_symbols) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Symbol Mapping Table */}
            <div className="bg-[#2A2A2A] rounded-lg border border-[#333] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#333]">
                <h4 className="text-lg font-medium text-white">Symbol Mappings Across Accounts</h4>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#333] bg-[#333]">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                        Standard Symbol
                      </th>
                      {accountIds.map(accountId => {
                        const account = accounts.find(acc => {
                          // Try to match using different possible ID fields
                          return acc.metaapi_account_id === accountId || 
                                 acc.metaapiAccountId === accountId ||
                                 acc.meta_api_account_id === accountId ||
                                 acc.account_id === accountId || 
                                 acc.id === accountId ||
                                 acc.login === accountId;
                        });
                        return (
                          <th key={accountId} className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                            {account?.platform || 'Account'} ({accountId.slice(-4)})
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#333]">
                    {Object.keys(crossMappings).length > 0 ? (
                      Object.entries(crossMappings).map(([symbol, mappings]) => (
                        <tr key={symbol} className="hover:bg-[#333]/50">
                          <td className="px-4 py-3">
                            <span className="font-medium text-blue-400">{symbol}</span>
                          </td>
                          {accountIds.map(accountId => (
                            <td key={accountId} className="px-4 py-3">
                              {mappings[accountId] ? (
                                <span className="text-green-400 font-mono text-sm">
                                  {mappings[accountId]}
                                </span>
                              ) : (
                                <span className="text-red-400 text-sm">N/A</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={accountIds.length + 1} className="px-4 py-8 text-center text-gray-400">
                          No symbol mappings found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CrossBrokerAnalysis;

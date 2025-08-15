import React, { useState, useEffect } from 'react';
import { symbolMappingService } from '../../api/symbolMapping';
import { X, Search, Plus, Edit3, Trash2, Check, AlertCircle, RefreshCw } from 'lucide-react';

const SymbolMappingModal = ({ isOpen, onClose, accountId, selectedSymbol = '', onMappingUpdate }) => {
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingMapping, setEditingMapping] = useState(null);
  const [newMapping, setNewMapping] = useState({ standardSymbol: '', brokerSymbol: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (isOpen && accountId) {
      fetchMappings();
      if (selectedSymbol) {
        setSearchTerm(selectedSymbol);
      }
    }
  }, [isOpen, accountId, selectedSymbol]);

  const fetchMappings = async () => {
    setLoading(true);
    try {
      const response = await symbolMappingService.getSymbolMappings(accountId);
      if (response.success) {
        setMappings(response.mappings);
      }
    } catch (error) {
      console.error('Failed to fetch mappings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMapping = async () => {
    if (!newMapping.standardSymbol || !newMapping.brokerSymbol) {
      return;
    }

    try {
      const response = await symbolMappingService.createSymbolMapping(
        accountId,
        newMapping.standardSymbol,
        newMapping.brokerSymbol
      );

      if (response.success) {
        setMappings(prev => [...prev, response.mapping]);
        setNewMapping({ standardSymbol: '', brokerSymbol: '' });
        setShowAddForm(false);
        onMappingUpdate?.(response.mapping);
      }
    } catch (error) {
      console.error('Failed to add mapping:', error);
    }
  };

  const handleUpdateMapping = async (mappingId, updates) => {
    try {
      const response = await symbolMappingService.updateSymbolMapping(mappingId, updates);
      
      if (response.success) {
        setMappings(prev => prev.map(m => 
          m.id === mappingId ? { ...m, ...updates } : m
        ));
        setEditingMapping(null);
        onMappingUpdate?.(response.mapping);
      }
    } catch (error) {
      console.error('Failed to update mapping:', error);
    }
  };

  const handleDeleteMapping = async (mappingId) => {
    try {
      await symbolMappingService.deleteSymbolMapping(mappingId);
      setMappings(prev => prev.filter(m => m.id !== mappingId));
    } catch (error) {
      console.error('Failed to delete mapping:', error);
    }
  };

  const filteredMappings = mappings.filter(mapping =>
    mapping.standard_symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mapping.broker_symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#1A1A1A] rounded-lg border border-[#2A2A2A] w-full max-w-4xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2A2A2A]">
          <h2 className="text-xl font-bold text-white">Symbol Mappings</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchMappings}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Refresh mappings"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Search and Add */}
          <div className="flex items-center justify-between mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search mappings..."
                className="w-full pl-10 pr-4 py-2 bg-[#2A2A2A] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="ml-4 px-4 py-2 bg-gradient-to-r from-[#2F00FF] to-[#1C0099] hover:bg-blue-700 text-white rounded-lg flex items-center transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Mapping
            </button>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="bg-[#2A2A2A] rounded-lg p-4 mb-6 border border-[#333]">
              <h3 className="text-lg font-medium text-white mb-4">Add New Mapping</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={newMapping.standardSymbol}
                  onChange={(e) => setNewMapping(prev => ({ ...prev, standardSymbol: e.target.value }))}
                  placeholder="Standard Symbol (e.g., GBPUSD)"
                  className="px-3 py-2 bg-[#1A1A1A] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={newMapping.brokerSymbol}
                  onChange={(e) => setNewMapping(prev => ({ ...prev, brokerSymbol: e.target.value }))}
                  placeholder="Broker Symbol (e.g., EUR/USD)"
                  className="px-3 py-2 bg-[#1A1A1A] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMapping}
                  disabled={!newMapping.standardSymbol || !newMapping.brokerSymbol}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  Add Mapping
                </button>
              </div>
            </div>
          )}

          {/* Mappings List */}
          <div className="bg-[#2A2A2A] rounded-lg border border-[#333] overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-400">Loading mappings...</span>
              </div>
            ) : filteredMappings.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">
                  {searchTerm ? 'No mappings found matching your search' : 'No symbol mappings found'}
                </p>
              </div>
            ) : (
              <div className="overflow-y-auto max-h-96">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#333] bg-[#333]">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                        Standard Symbol
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                        Broker Symbol
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#333]">
                    {filteredMappings.map((mapping) => (
                      <tr key={mapping.id} className="hover:bg-[#333]/50">
                        <td className="px-4 py-3">
                          {editingMapping === mapping.id ? (
                            <input
                              type="text"
                              defaultValue={mapping.standard_symbol}
                              onBlur={(e) => handleUpdateMapping(mapping.id, { standard_symbol: e.target.value })}
                              className="px-2 py-1 bg-[#1A1A1A] border border-[#333] rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          ) : (
                            <span className="font-mono text-blue-400">{mapping.standard_symbol}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingMapping === mapping.id ? (
                            <input
                              type="text"
                              defaultValue={mapping.broker_symbol}
                              onBlur={(e) => handleUpdateMapping(mapping.id, { broker_symbol: e.target.value })}
                              className="px-2 py-1 bg-[#1A1A1A] border border-[#333] rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          ) : (
                            <span className="font-mono text-green-400">{mapping.broker_symbol}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            mapping.verified 
                              ? 'bg-green-900/20 text-green-400 border border-green-700' 
                              : 'bg-yellow-900/20 text-yellow-400 border border-yellow-700'
                          }`}>
                            {mapping.verified ? (
                              <>
                                <Check className="h-3 w-3 mr-1" />
                                Verified
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Pending
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => setEditingMapping(editingMapping === mapping.id ? null : mapping.id)}
                              className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                              title="Edit mapping"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMapping(mapping.id)}
                              className="p-1 text-red-400 hover:text-red-300 transition-colors"
                              title="Delete mapping"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SymbolMappingModal;

import React, { useState, useEffect } from 'react'
import { profileAPI, directMessagesAPI } from '../../api/community.js'

const StartChatModal = ({ isOpen, onClose, onChatStarted }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      searchUsers()
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const searchUsers = async () => {
    try {
      setLoading(true)
      const response = await profileAPI.searchUsers(searchQuery.trim(), 10)
      setSearchResults(response)
    } catch (error) {
      //console.error('Failed to search users:', error)
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  const startChat = async (user) => {
    try {
      setLoading(true)
      const response = await directMessagesAPI.getChatWithUser(user.username)
      onChatStarted(response)
      handleClose()
    } catch (error) {
      //console.error('Failed to start chat:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSearchQuery('')
    setSearchResults([])
    setSelectedUser(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1A1A1A] rounded-lg w-full max-w-md mx-4 max-h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white">
          <h2 className="text-xl font-bold text-white">Start New Chat</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-white">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by username or name..."
              className="w-full bg-[#222222] border border-white rounded-lg px-4 py-2 pl-10 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              autoFocus
            />
            <svg 
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : searchQuery.trim().length < 2 ? (
            <div className="p-6 text-center">
              <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-gray-400">Type at least 2 characters to search for users</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-400">No users found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {searchResults.map((user) => (
                <div
                  key={user.user_id}
                  onClick={() => startChat(user)}
                  className="p-4 hover:bg-[#222222] cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={user.avatar_url || '/api/placeholder/40/40'}
                      alt={user.display_name || user.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">
                        {user.display_name || user.username}
                      </p>
                      <p className="text-sm text-gray-400 truncate">
                        @{user.username}
                      </p>
                      {user.bio && (
                        <p className="text-xs text-gray-500 truncate mt-1">
                          {user.bio}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      {user.is_following && (
                        <span className="bg-gradient-to-r from-[#2F00FF] to-[#1C0099] text-white px-2 py-1 rounded">
                          Following
                        </span>
                      )}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white">
          <p className="text-xs text-gray-500 text-center">
            Select a user to start a direct conversation
          </p>
        </div>
      </div>
    </div>
  )
}

export default StartChatModal

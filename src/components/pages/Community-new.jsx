import React, { useState, useEffect, useRef } from 'react'
import { groupChatAPI, profileAPI, ChatWebSocket } from '../../api/community.js'
import UserProfile from '../modals/UserProfile.jsx'
import CreateGroupModal from '../modals/CreateGroupModal.jsx'
import StartChatModal from '../modals/StartChatModal.jsx'

const Community = () => {
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [messages, setMessages] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState([])
  const [showMembers, setShowMembers] = useState(false)
  const [ws, setWs] = useState(null)
  
  // Modal states
  const [showUserProfile, setShowUserProfile] = useState(false)
  const [selectedUsername, setSelectedUsername] = useState(null)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showStartChat, setShowStartChat] = useState(false)
  
  const messagesEndRef = useRef(null)
  const messageInputRef = useRef(null)

  // Initialize WebSocket and load data
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Get current user profile
        const profileResponse = await profileAPI.getCurrentProfile()
        setCurrentUser(profileResponse)

        // Initialize WebSocket
        const token = localStorage.getItem('access_token')
        if (token) {
          const websocket = new ChatWebSocket(token)
          await websocket.connect()
          setWs(websocket)

          // Set up WebSocket event listeners
          websocket.on('group_message', handleNewGroupMessage)
          websocket.on('connection_established', (data) => {
            console.log('WebSocket connection established:', data)
          })
          websocket.on('error', (error) => {
            console.error('WebSocket error:', error)
          })
        }

        // Load initial data
        await loadGroups()
        
        setLoading(false)
      } catch (error) {
        console.error('Failed to initialize chat:', error)
        setLoading(false)
      }
    }

    initializeChat()

    return () => {
      if (ws) {
        ws.disconnect()
      }
    }
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadGroups = async () => {
    try {
      const response = await groupChatAPI.getGroups()
      setGroups(response)
    } catch (error) {
      console.error('Failed to load groups:', error)
    }
  }

  const handleGroupSelect = async (group) => {
    setSelectedGroup(group)
    setShowMembers(false)
    
    try {
      const response = await groupChatAPI.getMessages(group.id)
      setMessages(response.reverse()) // Reverse to show oldest first
      
      // Subscribe to group updates
      if (ws) {
        ws.subscribeToGroup(group.id)
      }
      
      // Update group unread count locally (no markAsRead endpoint in backend)
      setGroups(prevGroups => 
        prevGroups.map(g => 
          g.id === group.id ? { ...g, unread_count: 0 } : g
        )
      )

      // Load members
      const membersResponse = await groupChatAPI.getMembers(group.id)
      setMembers(membersResponse)
    } catch (error) {
      console.error('Failed to load group messages:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedGroup) return

    try {
      const messageData = {
        message: newMessage.trim(),
        attachment_url: null
      }

      // Send group message
      const response = await groupChatAPI.sendMessage(selectedGroup.id, messageData)
      const newMsg = response
      
      setMessages(prev => [...prev, newMsg])
      
      // Notify via WebSocket
      if (ws) {
        ws.sendGroupMessage(selectedGroup.id, newMessage.trim())
      }

      setNewMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleNewGroupMessage = (data) => {
    // Handle incoming group message
    if (selectedGroup && data.group_id === selectedGroup.id) {
      // Add the new message to current messages
      const newMessage = {
        id: Date.now(), // Temporary ID
        group_id: data.group_id,
        user_id: data.user_id,
        message: data.message,
        created_at: data.timestamp,
        username: data.username || 'Unknown',
        display_name: data.display_name || 'Unknown User',
        avatar_url: data.avatar_url
      }
      setMessages(prev => [...prev, newMessage])
    } else {
      // Update group list for unread counts
      loadGroups()
    }
  }

  const handleUserProfileClick = (username) => {
    setSelectedUsername(username)
    setShowUserProfile(true)
  }

  const handleGroupCreated = (newGroup) => {
    setGroups(prev => [newGroup, ...prev])
    setSelectedGroup(newGroup)
    handleGroupSelect(newGroup)
  }

  const handleChatStarted = () => {
    // Placeholder for when direct messages are implemented
    console.log('Direct message feature not implemented yet')
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()
    
    if (isToday) {
      return 'Today'
    }
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const isYesterday = date.toDateString() === yesterday.toDateString()
    
    if (isYesterday) {
      return 'Yesterday'
    }
    
    return date.toLocaleDateString()
  }

  const filteredGroups = groups.filter(group => 
    group.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading community...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-[#131313] text-white flex">
      {/* Left Column - Messages Sidebar */}
      <div className="w-80 bg-[#131313] border-r border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Messages</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowStartChat(true)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
                title="Start new chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
              <button
                onClick={() => setShowCreateGroup(true)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
                title="Create group"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black rounded-lg px-4 py-2 pl-10 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
            <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Groups Header */}
        <div className="border-b border-gray-700 p-4">
          <h3 className="text-lg font-semibold text-white">Groups</h3>
        </div>

        {/* Groups List */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-1">
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                onClick={() => handleGroupSelect(group)}
                className={`flex items-center p-3 hover:bg-gray-700 cursor-pointer ${
                  selectedGroup?.id === group.id ? 'bg-gray-700' : ''
                }`}
              >
                <div className="flex-shrink-0">
                  <img
                    src={group.avatar_url || '/api/placeholder/40/40'}
                    alt={group.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white truncate">
                      {group.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {group.member_count} members
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 truncate">
                    {group.description || 'No description'}
                  </p>
                </div>
                {group.unread_count > 0 && (
                  <div className="ml-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {group.unread_count}
                  </div>
                )}
              </div>
            ))}
            {filteredGroups.length === 0 && (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 616 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-gray-400 text-sm mb-3">No groups yet</p>
                <button
                  onClick={() => setShowCreateGroup(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg"
                >
                  Create Group
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Center Column - Main Chat Area */}
      <div className="flex-1 flex flex-col bg-black">
        {selectedGroup ? (
          <>
            {/* Chat Header */}
            <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-lg">#</span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {selectedGroup?.name}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {selectedGroup 
                      ? `${selectedGroup.member_count} members, ${members.filter(m => m.is_admin).length} online`
                      : 'Online'
                    }
                  </p>
                </div>
              </div>
              
              {selectedGroup && (
                <button
                  onClick={() => setShowMembers(!showMembers)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 616 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </button>
              )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    Welcome to #{selectedGroup.name}!
                  </h3>
                  <p className="text-gray-400">
                    This is the beginning of the conversation in this group.
                  </p>
                </div>
              ) : (
                messages.map((message, index) => {
                  const showDate = index === 0 || 
                    formatDate(message.created_at) !== formatDate(messages[index - 1].created_at)
                  
                  return (
                    <div key={message.id}>
                      {showDate && (
                        <div className="flex items-center my-6">
                          <div className="flex-1 h-px bg-gray-700"></div>
                          <span className="px-3 text-xs text-gray-400 bg-gray-900">
                            {formatDate(message.created_at)}
                          </span>
                          <div className="flex-1 h-px bg-gray-700"></div>
                        </div>
                      )}
                      
                      <div className="flex items-start space-x-3 hover:bg-gray-800 hover:bg-opacity-50 px-3 py-2 rounded">
                        <img
                          src={message.avatar_url || '/api/placeholder/40/40'}
                          alt={message.display_name || message.username}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline space-x-2 mb-1">
                            <button
                              onClick={() => handleUserProfileClick(message.username)}
                              className="font-medium text-white hover:underline"
                            >
                              {message.display_name || message.username}
                            </button>
                            <span className="text-xs text-gray-400">
                              {formatTime(message.created_at)}
                              {message.is_edited && ' (edited)'}
                            </span>
                          </div>
                          <p className="text-gray-100 break-words">{message.message}</p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 bg-gray-800 border-t border-gray-700">
              <div className="flex items-center space-x-3 bg-gray-700 rounded-lg p-3">
                <button className="text-gray-400 hover:text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
                
                <input
                  ref={messageInputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder={`Message #${selectedGroup.name}`}
                  className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none"
                />
                
                <div className="flex items-center space-x-2">
                  <button className="text-gray-400 hover:text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  
                  <button className="text-gray-400 hover:text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="text-gray-400 hover:text-white disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Welcome to Traders Community</h3>
              <p className="text-gray-400 mb-4">Select a chat or group to start messaging</p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowStartChat(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Start Chat
                </button>
                <button
                  onClick={() => setShowCreateGroup(true)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                >
                  Create Group
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Column - Members/Online Users */}
      <div className="w-80 bg-[#131313] flex flex-col">
        {selectedGroup ? (
          <>
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Members</h3>
              <p className="text-sm text-gray-400">{selectedGroup.member_count} members</p>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center space-x-3 hover:bg-gray-700 p-2 rounded cursor-pointer">
                    <div className="relative">
                      <img
                        src={member.avatar_url || '/api/placeholder/32/32'}
                        alt={member.display_name || member.username}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-gray-800"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {member.display_name || member.username}
                        {member.is_admin && (
                          <span className="ml-2 text-xs bg-yellow-600 text-white px-1 py-0.5 rounded">
                            Admin
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">@{member.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Community</h3>
            </div>
            
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 616 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-gray-400 text-sm">Select a chat to see user info</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <UserProfile
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        username={selectedUsername}
        currentUser={currentUser}
      />

      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onGroupCreated={handleGroupCreated}
      />

      <StartChatModal
        isOpen={showStartChat}
        onClose={() => setShowStartChat(false)}
        onChatStarted={handleChatStarted}
      />
    </div>
  )
}

export default Community

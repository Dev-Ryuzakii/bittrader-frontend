import api from './api.js';

// Profile API
export const profileAPI = {
  // Get current user's profile
  getCurrentProfile: async () => {
    try {
      const response = await api.get('/community/profile/me');
      return response.data;
    } catch (error) {
      //console.error('Get current profile error:', error);
      throw error;
    }
  },

  // Get profile by username
  getProfileByUsername: async (username) => {
    try {
      const response = await api.get(`/community/profile/${username}`);
      return response.data;
    } catch (error) {
      //console.error('Get profile by username error:', error);
      throw error;
    }
  },

  // Search users
  searchUsers: async (query, limit = 10) => {
    try {
      const response = await api.get(`/community/search/users?q=${encodeURIComponent(query)}&limit=${limit}`);
      return response.data;
    } catch (error) {
      //console.error('Search users error:', error);
      throw error;
    }
  },

  // Update profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/community/profile/me', profileData);
      return response.data;
    } catch (error) {
      //console.error('Update profile error:', error);
      throw error;
    }
  }
};

// Relationships API - Note: These endpoints don't exist in the backend yet
export const relationshipsAPI = {
  // Follow a user - PLACEHOLDER (endpoint doesn't exist)
  followUser: async (userId) => {
    //console.warn('Follow user endpoint not implemented in backend');
    return Promise.resolve({ success: false, message: 'Feature not available' });
  },

  // Unfollow a user - PLACEHOLDER (endpoint doesn't exist)
  unfollowUser: async (userId) => {
    //console.warn('Unfollow user endpoint not implemented in backend');
    return Promise.resolve({ success: false, message: 'Feature not available' });
  },

  // Get user's followers - PLACEHOLDER (endpoint doesn't exist)
  getUserFollowers: async (username) => {
    //console.warn('Get user followers endpoint not implemented in backend');
    return Promise.resolve([]);
  },

  // Get users that a user is following - PLACEHOLDER (endpoint doesn't exist)
  getUserFollowing: async (username) => {
    //console.warn('Get user following endpoint not implemented in backend');
    return Promise.resolve([]);
  },

  // Check if current user is following another user - PLACEHOLDER (endpoint doesn't exist)
  isFollowing: async (userId) => {
    //console.warn('Is following endpoint not implemented in backend');
    return Promise.resolve(false);
  }
};

// Group Chat API
export const groupChatAPI = {
  // Get all group chats
  getGroups: async () => {
    try {
      const response = await api.get('/community/groups');
      return response.data;
    } catch (error) {
      //console.error('Get group chats error:', error);
      throw error;
    }
  },

  // Alternative name for backward compatibility
  getGroupChats: async () => {
    return groupChatAPI.getGroups();
  },

  // Create a new group chat
  createGroup: async (groupData) => {
    try {
      const response = await api.post('/community/groups', groupData);
      return response.data;
    } catch (error) {
      //console.error('Create group chat error:', error);
      throw error;
    }
  },

  // Alternative name for backward compatibility
  createGroupChat: async (groupData) => {
    return groupChatAPI.createGroup(groupData);
  },

  // Update a group
  updateGroup: async (groupId, groupData) => {
    try {
      const response = await api.put(`/community/groups/${groupId}`, groupData);
      return response.data;
    } catch (error) {
      //console.error('Update group error:', error);
      throw error;
    }
  },

  // Delete a group
  deleteGroup: async (groupId) => {
    try {
      const response = await api.delete(`/community/groups/${groupId}`);
      return response.data;
    } catch (error) {
      //console.error('Delete group error:', error);
      throw error;
    }
  },

  // Join a group chat
  joinGroupChat: async (groupId) => {
    try {
      const response = await api.post(`/community/groups/${groupId}/join`);
      return response.data;
    } catch (error) {
      //console.error('Join group chat error:', error);
      throw error;
    }
  },

  // Leave a group chat
  leaveGroupChat: async (groupId) => {
    try {
      const response = await api.delete(`/community/groups/${groupId}/leave`);
      return response.data;
    } catch (error) {
      //console.error('Leave group chat error:', error);
      throw error;
    }
  },

  // Get group chat messages
  getMessages: async (groupId, page = 1, limit = 50) => {
    try {
      const response = await api.get(`/community/groups/${groupId}/messages?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      //console.error('Get group messages error:', error);
      throw error;
    }
  },

  // Alternative name for backward compatibility
  getGroupMessages: async (groupId, page = 1, limit = 50) => {
    return groupChatAPI.getMessages(groupId, page, limit);
  },

  // Send message to group
  sendMessage: async (groupId, messageData) => {
    try {
      const response = await api.post(`/community/groups/${groupId}/messages`, messageData);
      return response.data;
    } catch (error) {
      //console.error('Send group message error:', error);
      throw error;
    }
  },

  // Alternative name for backward compatibility
  sendGroupMessage: async (groupId, message) => {
    return groupChatAPI.sendMessage(groupId, { message });
  },

  // Get group members
  getMembers: async (groupId) => {
    try {
      const response = await api.get(`/community/groups/${groupId}/members`);
      return response.data;
    } catch (error) {
      //console.error('Get group members error:', error);
      throw error;
    }
  }
};

// Direct Messages API - Note: These endpoints don't exist in the backend yet
export const directMessagesAPI = {
  // Get direct message conversations - PLACEHOLDER (endpoint doesn't exist)
  getConversations: async () => {
    //console.warn('Direct messages not implemented in backend');
    return Promise.resolve([]);
  },

  // Get messages in a conversation - PLACEHOLDER (endpoint doesn't exist)
  getMessages: async (conversationId, page = 1, limit = 50) => {
    //console.warn('Direct messages not implemented in backend');
    return Promise.resolve([]);
  },

  // Send direct message - PLACEHOLDER (endpoint doesn't exist)
  sendMessage: async (recipientId, message) => {
    //console.warn('Direct messages not implemented in backend');
    return Promise.resolve({ success: false, message: 'Feature not available' });
  },

  // Start new conversation - PLACEHOLDER (endpoint doesn't exist)
  startConversation: async (recipientId) => {
    //console.warn('Direct messages not implemented in backend');
    return Promise.resolve({ success: false, message: 'Feature not available' });
  },

  // Get or create chat with a specific user - PLACEHOLDER (endpoint doesn't exist)
  getChatWithUser: async (username) => {
    //console.warn('Direct messages not implemented in backend');
    return Promise.resolve({ success: false, message: 'Feature not available' });
  }
};

// WebSocket for real-time chat
export class ChatWebSocket {
  constructor(groupId, onMessage, onError) {
    this.groupId = groupId;
    this.onMessage = onMessage;
    this.onError = onError;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
  }

  connect() {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Use production WebSocket URL instead of localhost
      const wsUrl = `ws://api.tradexas.com/ws/chat/group/${this.groupId}?token=${encodeURIComponent(token)}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        //console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.onMessage(data);
        } catch (error) {
          //console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        //console.log('WebSocket closed:', event.code, event.reason);
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        //console.error('WebSocket error:', error);
        if (this.onError) {
          this.onError(error);
        }
      };
    } catch (error) {
      //console.error('Failed to create WebSocket connection:', error);
      if (this.onError) {
        this.onError(error);
      }
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      //console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay);
      
      // Exponential backoff
      this.reconnectDelay *= 2;
    } else {
      //console.error('Max reconnection attempts reached');
      if (this.onError) {
        this.onError(new Error('Failed to reconnect after maximum attempts'));
      }
    }
  }

  sendMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'message',
        message: message
      }));
    } else {
      //console.error('WebSocket is not connected');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

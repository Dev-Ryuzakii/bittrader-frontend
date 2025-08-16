import React, { useState, useEffect } from 'react'
import { profileAPI, relationshipsAPI } from '../../api/community.js'

const UserProfile = ({ isOpen, onClose, username, currentUser }) => {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])
  const [activeTab, setActiveTab] = useState('profile')

  useEffect(() => {
    if (isOpen && username) {
      loadProfile()
    }
  }, [isOpen, username])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const response = await profileAPI.getProfileByUsername(username)
      setProfile(response)
      setIsFollowing(response.is_following)
      
      // Load followers and following
      const [followersRes, followingRes] = await Promise.all([
        relationshipsAPI.getUserFollowers(username),
        relationshipsAPI.getUserFollowing(username)
      ])
      
      setFollowers(followersRes)
      setFollowing(followingRes)
    } catch (error) {
      //console.error('Failed to load profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await relationshipsAPI.unfollowUser(profile.user_id)
        setIsFollowing(false)
        setProfile(prev => ({
          ...prev,
          follower_count: prev.follower_count - 1
        }))
      } else {
        await relationshipsAPI.followUser(profile.user_id)
        setIsFollowing(true)
        setProfile(prev => ({
          ...prev,
          follower_count: prev.follower_count + 1
        }))
      }
    } catch (error) {
      //console.error('Failed to toggle follow:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white">
          <h2 className="text-xl font-bold text-white">User Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : profile ? (
          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
            {/* Profile Header */}
            <div className="p-6 border-b border-white">
              <div className="flex items-center space-x-4">
                <img
                  src={profile.avatar_url || '/api/placeholder/80/80'}
                  alt={profile.display_name || profile.username}
                  className="w-20 h-20 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white">
                    {profile.display_name || profile.username}
                  </h3>
                  <p className="text-gray-400">@{profile.username}</p>
                  {profile.bio && (
                    <p className="text-gray-300 mt-2">{profile.bio}</p>
                  )}
                  
                  <div className="flex items-center space-x-4 mt-3">
                    <span className="text-sm text-gray-400">
                      <span className="font-semibold text-white">{profile.follower_count}</span> followers
                    </span>
                    <span className="text-sm text-gray-400">
                      <span className="font-semibold text-white">{profile.following_count}</span> following
                    </span>
                  </div>
                </div>
                
                {profile.user_id !== currentUser?.user_id && (
                  <button
                    onClick={handleFollow}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      isFollowing
                        ? 'bg-gray-600 text-white hover:bg-[#222222]'
                        : 'bg-gradient-to-r from-[#2F00FF] to-[#1C0099] text-white hover:bg-blue-700'
                    }`}
                  >
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-white">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'profile'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab('followers')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'followers'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Followers ({profile.follower_count})
                </button>
                <button
                  onClick={() => setActiveTab('following')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'following'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Following ({profile.following_count})
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'profile' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Member since
                    </label>
                    <p className="text-white">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Last active
                    </label>
                    <p className="text-white">
                      {new Date(profile.last_active).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {profile.bio && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Bio
                      </label>
                      <p className="text-white">{profile.bio}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'followers' && (
                <div className="space-y-3">
                  {followers.map((follower) => (
                    <div key={follower.user_id} className="flex items-center space-x-3">
                      <img
                        src={follower.avatar_url || '/api/placeholder/40/40'}
                        alt={follower.display_name || follower.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-white">
                          {follower.display_name || follower.username}
                        </p>
                        <p className="text-sm text-gray-400">@{follower.username}</p>
                      </div>
                      {follower.is_following && (
                        <span className="text-xs bg-gradient-to-r from-[#2F00FF] to-[#1C0099] text-white px-2 py-1 rounded">
                          Following
                        </span>
                      )}
                    </div>
                  ))}
                  {followers.length === 0 && (
                    <p className="text-center text-gray-400 py-4">No followers yet</p>
                  )}
                </div>
              )}

              {activeTab === 'following' && (
                <div className="space-y-3">
                  {following.map((user) => (
                    <div key={user.user_id} className="flex items-center space-x-3">
                      <img
                        src={user.avatar_url || '/api/placeholder/40/40'}
                        alt={user.display_name || user.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-white">
                          {user.display_name || user.username}
                        </p>
                        <p className="text-sm text-gray-400">@{user.username}</p>
                      </div>
                      <span className="text-xs bg-gradient-to-r from-[#2F00FF] to-[#1C0099] text-white px-2 py-1 rounded">
                        Following
                      </span>
                    </div>
                  ))}
                  {following.length === 0 && (
                    <p className="text-center text-gray-400 py-4">Not following anyone yet</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 text-center">
            <p className="text-gray-400">Profile not found</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserProfile

import React, { useState, useEffect } from 'react'
import { groupChatAPI } from '../../api/community.js'
import { useToast } from '../../contexts/ToastContext'

const EditGroupModal = ({ isOpen, onClose, group, onGroupUpdated, onGroupDeleted }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    avatar_url: ''
  })
  const [loading, setLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const { toast } = useToast()
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name || '',
        description: group.description || '',
        avatar_url: group.avatar_url || ''
      })
    }
  }, [group])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim() || !group) return

    setLoading(true)
    try {
      const updatedGroup = await groupChatAPI.updateGroup(group.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        avatar_url: formData.avatar_url.trim() || null
      })
      
      onGroupUpdated(updatedGroup)
      onClose()
    } catch (error) {
      console.error('Failed to update group:', error)
      toast.error('Failed to update group. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!group || !deleteConfirm) return

    setDeleteLoading(true)
    try {
      await groupChatAPI.deleteGroup(group.id)
      onGroupDeleted(group.id)
      onClose()
    } catch (error) {
      console.error('Failed to delete group:', error)
      toast.error('Failed to delete group. Please try again.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Edit Group</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Group Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Group Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="Enter group name"
                required
                maxLength={50}
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                placeholder="Enter group description (optional)"
                maxLength={200}
              />
              <p className="text-xs text-gray-400 mt-1">
                {formData.description.length}/200 characters
              </p>
            </div>

            {/* Avatar URL */}
            <div>
              <label htmlFor="avatar_url" className="block text-sm font-medium text-gray-300 mb-2">
                Avatar URL
              </label>
              <input
                type="url"
                id="avatar_url"
                name="avatar_url"
                value={formData.avatar_url}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            {/* Avatar Preview */}
            {formData.avatar_url && (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-300">Preview:</span>
                <img
                  src={formData.avatar_url}
                  alt="Avatar preview"
                  className="w-10 h-10 rounded-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>

          {/* Update Button */}
          <div className="flex justify-end mt-6">
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium"
            >
              {loading ? 'Updating...' : 'Update Group'}
            </button>
          </div>
        </form>

        {/* Delete Section */}
        <div className="p-6 border-t border-gray-700">
          <h3 className="text-lg font-semibold text-red-400 mb-3">Danger Zone</h3>
          
          {!deleteConfirm ? (
            <div>
              <p className="text-gray-300 text-sm mb-3">
                Delete this group permanently. This action cannot be undone.
              </p>
              <button
                onClick={() => setDeleteConfirm(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Delete Group
              </button>
            </div>
          ) : (
            <div>
              <p className="text-red-400 text-sm mb-3">
                Are you sure you want to delete "{group?.name}"? This will permanently remove the group and all its messages.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium"
                >
                  {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EditGroupModal

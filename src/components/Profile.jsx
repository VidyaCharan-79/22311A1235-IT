import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import Post from './Post'

function Profile() {
  const { userId } = useParams()
  const { user: currentUser, setUser } = useAuth()
  const [profileUser, setProfileUser] = useState(null)
  const [userPosts, setUserPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isFollowing, setIsFollowing] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchUserData()
  }, [userId])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const [userResponse, postsResponse] = await Promise.all([
        api.get(`/users/${userId}`),
        api.get('/posts')
      ])
      setProfileUser(userResponse.data)
      setBio(userResponse.data.bio || '')
      setAvatarPreview(userResponse.data.avatar || null)
      // Filter posts for this user
      const userPosts = postsResponse.data.filter(post => post.user_id === parseInt(userId))
      setUserPosts(userPosts)
      setIsFollowing(false) // Placeholder
    } catch (error) {
      setError('Failed to load user data')
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async () => {
    try {
      await api.post(`/users/${userId}/follow`)
      setIsFollowing(!isFollowing)
      setProfileUser(prev => ({
        ...prev,
        followers: isFollowing ? prev.followers - 1 : prev.followers + 1
      }))
    } catch (error) {
      console.error('Error following user:', error)
    }
  }

  const handleLike = async (postId) => {
    try {
      await api.post(`/posts/${postId}/like`)
      setUserPosts(posts => posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            likes_count: post.is_liked ? post.likes_count - 1 : post.likes_count + 1,
            is_liked: !post.is_liked
          }
        }
        return post
      }))
    } catch (error) {
      console.error('Error liking post:', error)
    }
  }

  const handleComment = async (postId, content) => {
    try {
      await api.post(`/posts/${postId}/comments`, { content })
      const response = await api.get('/posts')
      const userPosts = response.data.filter(post => post.user_id === parseInt(userId))
      setUserPosts(userPosts)
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  // Edit profile handlers
  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAvatar(file)
      const reader = new FileReader()
      reader.onloadend = () => setAvatarPreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('bio', bio)
      if (avatar) formData.append('avatar', avatar)
      const response = await api.post('/users/me', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setProfileUser(response.data)
      setEditMode(false)
      setAvatar(null)
      setAvatarPreview(response.data.avatar)
      if (currentUser.id === response.data.id && typeof setUser === 'function') {
        setUser(response.data)
      }
    } catch (err) {
      alert('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
        <p className="mt-4 text-gray-500">Loading profile...</p>
      </div>
    )
  }

  if (error || !profileUser) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">User not found</h2>
        <p className="text-gray-500">The user you're looking for doesn't exist.</p>
      </div>
    )
  }

  const isOwnProfile = currentUser?.id === profileUser.id

  return (
    <div className="max-w-2xl mx-auto">
      {/* Profile Header */}
      <div className="card p-6 mb-6">
        <div className="flex items-start space-x-6">
          <img
            src={avatarPreview || 'https://via.placeholder.com/96'}
            alt={profileUser.name}
            className="w-24 h-24 rounded-full object-cover"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{profileUser.name}</h1>
                <p className="text-gray-500">@{profileUser.username}</p>
              </div>
              {!isOwnProfile && (
                <button
                  onClick={handleFollow}
                  className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
              {isOwnProfile && !editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="btn btn-secondary ml-2"
                >
                  Edit Profile
                </button>
              )}
            </div>
            {isOwnProfile && editMode ? (
              <form onSubmit={handleProfileSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
                  <input type="file" accept="image/*" onChange={handleAvatarChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                  />
                </div>
                <div className="flex space-x-2">
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setEditMode(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <p className="text-gray-700 mb-4">{profileUser.bio || 'No bio yet.'}</p>
                <div className="flex items-center space-x-6 text-sm">
                  <div>
                    <span className="font-semibold text-gray-900">{userPosts.length}</span>
                    <span className="text-gray-500 ml-1">posts</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">{profileUser.followers || 0}</span>
                    <span className="text-gray-500 ml-1">followers</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">{profileUser.following || 0}</span>
                    <span className="text-gray-500 ml-1">following</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {/* User Posts */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Posts</h2>
        {userPosts.length > 0 ? (
          userPosts.map(post => (
            <Post key={post.id} post={post} onLike={handleLike} onComment={handleComment} />
          ))
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-gray-400 text-2xl">📝</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-500">
              {isOwnProfile
                ? "You haven't shared anything yet. Create your first post!"
                : `${profileUser.name} hasn't shared anything yet.`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile 
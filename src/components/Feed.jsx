import React, { useState, useEffect } from 'react'
import api from '../services/api'
import CreatePost from './CreatePost'
import Post from './Post'

function Feed() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await api.get('/posts')
      setPosts(response.data)
    } catch (error) {
      setError('Failed to load posts')
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const addPost = async (content, image = null) => {
    try {
      const formData = new FormData()
      if (content) formData.append('content', content)
      if (image) formData.append('image', image)

      await api.post('/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      // Refresh posts after creating new one
      fetchPosts()
    } catch (error) {
      console.error('Error creating post:', error)
    }
  }

  const likePost = async (postId) => {
    try {
      await api.post(`/posts/${postId}/like`)
      // Update the post in the list
      setPosts(posts.map(post => {
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

  const addComment = async (postId, content) => {
    try {
      await api.post(`/posts/${postId}/comments`, { content })
      // Refresh posts to get updated comments
      fetchPosts()
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
        <p className="mt-4 text-gray-500">Loading posts...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-red-500">{error}</p>
        <button 
          onClick={fetchPosts}
          className="mt-4 btn btn-primary"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Create Post Section */}
      <CreatePost onPostCreated={addPost} />

      {/* Posts Feed */}
      <div className="space-y-6">
        {posts.map(post => (
          <Post 
            key={post.id} 
            post={post} 
            onLike={likePost}
            onComment={addComment}
          />
        ))}
      </div>

      {/* Empty State */}
      {posts.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-gray-400 text-2xl">📝</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
          <p className="text-gray-500">Be the first to share something amazing!</p>
        </div>
      )}
    </div>
  )
}

export default Feed 
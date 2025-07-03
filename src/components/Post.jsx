import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MessageCircle, Share, MoreHorizontal } from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import Comment from './Comment'

function Post({ post, onLike, onComment }) {
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState([])
  const [loadingComments, setLoadingComments] = useState(false)
  const { user } = useAuth()

  const handleLike = () => {
    onLike(post.id)
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (commentText.trim()) {
      await onComment(post.id, commentText)
      setCommentText('')
      // Refresh comments
      fetchComments()
    }
  }

  const fetchComments = async () => {
    try {
      setLoadingComments(true)
      const response = await api.get(`/posts/${post.id}/comments`)
      setComments(response.data)
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoadingComments(false)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${post.name}'s post`,
        text: post.content,
        url: window.location.href
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(post.content)
      alert('Post content copied to clipboard!')
    }
  }

  const toggleComments = () => {
    if (!showComments && comments.length === 0) {
      fetchComments()
    }
    setShowComments(!showComments)
  }

  return (
    <div className="card p-6 animate-fade-in">
      {/* Post Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Link to={`/profile/${post.user_id}`}>
            <img
              src={post.avatar || 'https://via.placeholder.com/40'}
              alt={post.name}
              className="w-10 h-10 rounded-full object-cover hover:opacity-80 transition-opacity"
            />
          </Link>
          <div>
            <Link 
              to={`/profile/${post.user_id}`}
              className="font-medium text-gray-900 hover:text-primary-500 transition-colors"
            >
              {post.name}
            </Link>
            <p className="text-sm text-gray-500">
              {format(new Date(post.created_at), "PPpp")}
            </p>
          </div>
        </div>
        
        <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
        {post.image && (
          <img
            src={post.image.startsWith('http') ? post.image : `http://localhost:5001${post.image}`}
            alt="Post"
            className="w-full mt-3 rounded-lg object-cover max-h-96"
          />
        )}
      </div>

      {/* Post Stats */}
      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <div className="flex items-center space-x-4">
          <span>{post.likes_count} {post.likes_count === 1 ? 'like' : 'likes'}</span>
          <span>{post.comments_count} {post.comments_count === 1 ? 'comment' : 'comments'}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center border-t border-gray-100 pt-4">
        <button
          onClick={handleLike}
          className={`flex items-center space-x-2 flex-1 py-2 px-3 rounded-lg transition-colors ${
            post.is_liked 
              ? 'text-red-500 hover:bg-red-50' 
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
          <span>Like</span>
        </button>

        <button
          onClick={toggleComments}
          className="flex items-center space-x-2 flex-1 py-2 px-3 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Comment</span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center space-x-2 flex-1 py-2 px-3 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <Share className="w-5 h-5" />
          <span>Share</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          {/* Add Comment */}
          <form onSubmit={handleComment} className="mb-4">
            <div className="flex items-start space-x-3">
              <img
                src={user?.avatar || 'https://via.placeholder.com/32'}
                alt={user?.name}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="input text-sm"
                />
              </div>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-3">
            {loadingComments ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
              </div>
            ) : (
              comments.map(comment => (
                <Comment key={comment.id} comment={comment} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Post 
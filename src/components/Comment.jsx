import React from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'

function Comment({ comment }) {
  return (
    <div className="flex items-start space-x-3">
      <Link to={`/profile/${comment.user_id}`}>
        <img
          src={comment.avatar || 'https://via.placeholder.com/32'}
          alt={comment.name}
          className="w-8 h-8 rounded-full object-cover hover:opacity-80 transition-opacity"
        />
      </Link>
      
      <div className="flex-1">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <Link 
              to={`/profile/${comment.user_id}`}
              className="font-medium text-gray-900 hover:text-primary-500 transition-colors text-sm"
            >
              {comment.name}
            </Link>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
          </div>
          <p className="text-gray-900 text-sm">{comment.content}</p>
        </div>
      </div>
    </div>
  )
}

export default Comment 
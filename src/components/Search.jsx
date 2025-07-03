import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import api from '../services/api'
import Post from './Post'

function useQuery() {
  return new URLSearchParams(useLocation().search)
}

function Search() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const query = useQuery().get('q') || ''

  useEffect(() => {
    if (query) {
      searchPosts()
    } else {
      setResults([])
    }
  }, [query])

  const searchPosts = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await api.get(`/search?q=${encodeURIComponent(query)}`)
      setResults(response.data)
    } catch (error) {
      setError('Failed to search posts')
      console.error('Error searching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (postId) => {
    try {
      await api.post(`/posts/${postId}/like`)
      // Update the post in the list
      setResults(posts => posts.map(post => {
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
      // Refresh search results
      searchPosts()
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Search Results</h2>
      {query && (
        <p className="mb-4 text-gray-500">
          Showing results for <span className="font-semibold text-gray-900">"{query}"</span>
        </p>
      )}
      
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Searching...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
          <button 
            onClick={searchPosts}
            className="mt-4 btn btn-primary"
          >
            Try Again
          </button>
        </div>
      )}

      <div className="space-y-6">
        {!loading && !error && results.length > 0 ? (
          results.map(post => (
            <Post 
              key={post.id} 
              post={post} 
              onLike={handleLike}
              onComment={handleComment}
            />
          ))
        ) : !loading && !error && query ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-gray-400 text-2xl">🔍</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-500">Try searching for something else.</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default Search 
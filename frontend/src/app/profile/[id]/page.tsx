'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '../../../contexts/AuthContext'
import Link from 'next/link'
import { fetchCreatorTracks } from '../../../services/creatorService'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface UserProfile {
  _id: string
  name: string
  avatar?: string
  bio?: string
  followers?: number
  following?: number
  creatorType?: string
  role?: string
  genres?: string[]
  whatsappContact?: string
  createdAt?: string
}

interface Track {
  _id: string
  id?: string
  title: string
  artist: string
  coverURL?: string
  plays?: number
  likes?: number
  creatorId: string
}

export default function UserProfile() {
  const params = useParams()
  const userId = params?.id as string
  const router = useRouter()
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return

      try {
        setLoading(true)
        
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token')

        const response = await fetch(`${API_BASE_URL}/api/public/user/${userId}`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        })
        
        if (!response.ok) {
          if (response.status === 401) {
            setError('Please log in to view user profiles')
            return
          }
          setError('User not found')
          return
        }

        const data = await response.json()
        
        // If user is an artist/creator, redirect to artist profile
        if (data.role === 'creator' || data.creatorType) {
          router.replace(`/artists/${userId}`)
          return
        }
        
        setProfile(data)

        const tracksResponse = await fetch(
          `${API_BASE_URL}/api/tracks?creatorId=${userId}&limit=50`
        )
        if (tracksResponse.ok) {
          const tracksData = await tracksResponse.json()
          setTracks(tracksData.tracks || [])
        }
      } catch (err) {
        console.error('Error fetching user profile:', err)
        setError('Failed to load user profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [userId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FF4D67]"></div>
          <p className="mt-4 text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">User Not Found</h2>
          <p className="text-gray-400 mb-6">{error || 'The user you are looking for does not exist.'}</p>
          <Link href="/" className="inline-block bg-[#FF4D67] hover:bg-[#FF4D67]/80 text-white py-2 px-6 rounded-lg transition-colors">
            Back Home
          </Link>
        </div>
      </div>
    )
  }

  const followerCount = profile.followers || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black">
      {/* Profile Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link href="/community" className="text-[#FF4D67] hover:text-[#FF6B8B] text-sm font-medium mb-6 inline-flex items-center">
            ← Back to Community
          </Link>

          {/* Profile Card */}
          <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 mb-8">
            <div className="flex flex-col sm:flex-row gap-8 items-start">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-[#FF4D67]"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-[#FF4D67] to-[#FF6B8B] flex items-center justify-center border-4 border-[#FF4D67]">
                    <span className="text-5xl font-bold text-white">
                      {profile.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="mb-4">
                  <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{profile.name}</h1>
                  {profile.creatorType && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-gradient-to-r from-[#FF4D67] to-[#FF6B8B] text-white text-xs px-3 py-1 rounded-full font-medium">
                        {profile.creatorType}
                      </span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-[#FF4D67]">{tracks.length}</p>
                    <p className="text-xs text-gray-400 mt-1">Tracks</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-[#FF4D67]">{followerCount}</p>
                    <p className="text-xs text-gray-400 mt-1">Followers</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-[#FF4D67]">{profile.following || 0}</p>
                    <p className="text-xs text-gray-400 mt-1">Following</p>
                  </div>
                </div>

                {/* Bio */}
                {profile.bio && (
                  <p className="text-gray-300 mb-4">{profile.bio}</p>
                )}

                {/* Genres */}
                {profile.genres && profile.genres.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-400 mb-2">GENRES</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.genres.map((genre, idx) => (
                        <span key={idx} className="bg-gray-800 text-gray-300 text-xs px-3 py-1 rounded-full">
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* WhatsApp Contact */}
                {profile.whatsappContact && (
                  <a
                    href={`https://wa.me/${profile.whatsappContact.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    💬 Message on WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Tracks Section */}
          {tracks.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Recent Tracks</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {tracks.map((track) => (
                  <Link
                    key={track._id || track.id}
                    href={`/tracks/${track._id || track.id}`}
                    className="group bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700 hover:border-[#FF4D67] transition-all hover:shadow-lg hover:shadow-[#FF4D67]/20"
                  >
                    <div className="aspect-square relative overflow-hidden">
                      <img
                        src={track.coverURL || '/placeholder-cover.jpg'}
                        alt={track.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/placeholder-cover.jpg'
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-white truncate group-hover:text-[#FF4D67] transition-colors">
                        {track.title}
                      </h3>
                      <p className="text-sm text-gray-400 truncate">{track.artist}</p>
                      <div className="flex justify-between text-xs text-gray-500 mt-3 pt-3 border-t border-gray-700">
                        <span>♫ {track.plays || 0} plays</span>
                        <span>❤️ {track.likes || 0}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {tracks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">No tracks available</p>
              <Link href="/community" className="text-[#FF4D67] hover:text-[#FF6B8B] text-sm font-medium">
                ← Back to Community
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

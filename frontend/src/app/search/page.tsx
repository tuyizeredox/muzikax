'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { followCreator } from '@/services/trackService'
import { useAudioPlayer } from '@/contexts/AudioPlayerContext'

interface SearchTrack {
  id: string
  title: string
  artist: string
  album?: string
  plays: number
  likes: number
  coverImage: string
  duration?: string
  audioURL: string
  paymentType?: 'free' | 'paid'
  price?: number
  type?: 'song' | 'beat' | 'mix'
  creatorId?: string
  creatorWhatsapp?: string
}

interface PlayerTrack {
  id: string;
  title: string;
  artist: string;
  coverImage: string;
  audioUrl: string;
  duration?: number; // in seconds
  creatorId?: string; // Add creator ID for linking to artist profile
  albumId?: string; // Add album ID for album playback logic
  plays?: number; // Add plays property to track play counts
  likes?: number; // Add likes property to track like counts
  type?: 'song' | 'beat' | 'mix'; // Add type field to distinguish beats
  paymentType?: 'free' | 'paid'; // Add payment type for beat pricing
  price?: number; // Add price for paid beats
  creatorWhatsapp?: string; // Add creator's WhatsApp contact for beats
}

interface Creator {
  _id?: string
  id?: string
  name: string
  type: string
  followers?: number
  followersCount?: number
  avatar: string
  verified?: boolean
}

interface Album {
  id: string
  title: string
  artist: string
  coverImage: string
  year: number
  tracks: number
}
// Separate component for the main content that uses useSearchParams
interface Playlist {
  id: string
  name: string
  description: string
  creator: string
  coverImage: string
  tracks: number
  isPublic: boolean
}

function SearchResultsContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const [searchQuery, setSearchQuery] = useState(query)
  const [activeTab, setActiveTab] = useState<'tracks' | 'artists' | 'albums' | 'playlists'>('tracks')
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [tracks, setTracks] = useState<SearchTrack[]>([])
  const [artists, setArtists] = useState<Creator[]>([])
  const [albums, setAlbums] = useState<Album[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [following, setFollowing] = useState<Record<string, boolean>>({})
  const { isAuthenticated } = useAuth()
  const { playTrack } = useAudioPlayer()
  
  // Genre list for filtering
  const genres = [
    { id: 'afrobeat', name: 'Afrobeat' },
    { id: 'amapiano', name: 'Amapiano' },
    { id: 'gakondo', name: 'Gakondo' },
    { id: 'amapiyano', name: 'Amapiano' },
    { id: 'afro gako', name: 'Afro Gako' },
    { id: 'hiphop', name: 'Hip Hop' },
    { id: 'rnb', name: 'R&B' },
    { id: 'afropop', name: 'Afropop' },
    { id: 'gospel', name: 'Gospel' },
    { id: 'traditional', name: 'Traditional' },
    { id: 'dancehall', name: 'Dancehall' },
    { id: 'reggae', name: 'Reggae' },
    { id: 'soul', name: 'Soul' },
    { id: 'jazz', name: 'Jazz' },
    { id: 'blues', name: 'Blues' },
    { id: 'pop', name: 'Pop' },
    { id: 'rock', name: 'Rock' },
    { id: 'electronic', name: 'Electronic' },
    { id: 'house', name: 'House' },
    { id: 'techno', name: 'Techno' },
    { id: 'drill', name: 'Drill' },
    { id: 'trap', name: 'Trap' },
    { id: 'lofi', name: 'Lo-Fi' },
    { id: 'ambient', name: 'Ambient' }
  ]
  
  // Fetch search results from API
  const fetchSearchResults = async (searchTerm: string) => {
    if (!searchTerm.trim() && !selectedGenre) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (searchTerm.trim()) {
        params.append('q', searchTerm.trim());
      }
      params.append('type', 'all');
      if (selectedGenre) {
        params.append('genre', selectedGenre);
      }
      // Don't add limit to get all results
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/search?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch search results')
      }
      
      const data = await response.json()
      
      setTracks(data.tracks || [])
      setArtists(data.artists || [])
      setAlbums(data.albums || [])
      setPlaylists(data.playlists || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }
  
  // Fetch results when query or genre changes
  useEffect(() => {
    if (query || selectedGenre) {
      fetchSearchResults(query)
    }
  }, [query, selectedGenre])
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Update URL with new search query
      window.history.pushState({}, '', `/search?q=${encodeURIComponent(searchQuery.trim())}`)
      fetchSearchResults(searchQuery.trim())
    }
  }

  // Handle following an artist
  const handleFollowArtist = async (artistId: string) => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      return;
    }

    try {
      // Call the follow creator service
      await followCreator(artistId);
      
      // Update the following state
      setFollowing(prev => ({
        ...prev,
        [artistId]: !prev[artistId]
      }));
      
      // Show success feedback
      console.log('Successfully followed creator');
    } catch (error) {
      console.error('Error following artist:', error);
      alert('Failed to follow creator. Please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black py-8 sm:py-12">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#FF4D67]/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#FFCB2B]/10 rounded-full blur-3xl -z-10"></div>
      
      <div className="container mx-auto px-4 sm:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Search Header */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF4D67] to-[#FFCB2B] mb-4">
              Search Results
            </h1>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search music, artists, albums..."
                  className="w-full px-4 py-3 sm:py-4 pl-12 pr-20 bg-gray-800/50 border border-gray-700 rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF4D67] focus:border-transparent text-sm sm:text-base transition-all"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
                <button 
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 sm:py-2 bg-[#FF4D67] hover:bg-[#FF4D67]/80 text-white rounded-full text-sm font-medium transition-colors"
                >
                  Search
                </button>
              </div>
            </form>
            
            {/* Genre Filter */}
            <div className="mt-6 max-w-4xl mx-auto">
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                    selectedGenre === null
                      ? 'bg-[#FF4D67] text-white'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                  }`}
                  onClick={() => setSelectedGenre(null)}
                >
                  All Genres
                </button>
                
                {genres.slice(0, 10).map((genre) => (
                  <button
                    key={genre.id}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                      selectedGenre === genre.id
                        ? 'bg-[#FF4D67] text-white'
                        : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                    }`}
                    onClick={() => setSelectedGenre(genre.id)}
                  >
                    {genre.name}
                  </button>
                ))}
                
                {/* Show more genres dropdown for smaller screens */}
                <div className="relative md:hidden">
                  <select 
                    value={selectedGenre || ''}
                    onChange={(e) => setSelectedGenre(e.target.value || null)}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-gray-800/50 text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF4D67]"
                  >
                    <option value="">All Genres</option>
                    {genres.map((genre) => (
                      <option key={genre.id} value={genre.id}>
                        {genre.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* More genres button for larger screens */}
                <div className="hidden md:block relative">
                  {genres.length > 10 && (
                    <details className="group">
                      <summary className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 cursor-pointer list-none">
                        More Genres
                      </summary>
                      <div className="absolute z-10 mt-2 p-2 bg-gray-800 rounded-lg shadow-lg grid grid-cols-2 sm:grid-cols-3 gap-2 w-64">
                        {genres.slice(10).map((genre) => (
                          <button
                            key={genre.id}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                              selectedGenre === genre.id
                                ? 'bg-[#FF4D67] text-white'
                                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                            }`}
                            onClick={() => {
                              setSelectedGenre(genre.id);
                              // Close the dropdown
                              const details = document.querySelector('details');
                              if (details) details.removeAttribute('open');
                            }}
                          >
                            {genre.name}
                          </button>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Results Info */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <p className="text-gray-400">
              {loading ? 'Searching...' : selectedGenre 
                ? `Found ${tracks.length + artists.length + albums.length + playlists.length} results for "${query || 'all'}" in ${genres.find(g => g.id === selectedGenre)?.name || selectedGenre}`
                : `Found ${tracks.length + artists.length + albums.length + playlists.length} results for "${query}"`}
            </p>
            
            {/* Tabs */}
            <div className="flex border-b border-gray-800">
              <button
                className={`py-2 px-4 font-medium text-sm sm:text-base transition-colors ${
                  activeTab === 'tracks'
                    ? 'text-[#FF4D67] border-b-2 border-[#FF4D67]'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('tracks')}
              >
                Tracks ({tracks.length})
              </button>
              <button
                className={`py-2 px-4 font-medium text-sm sm:text-base transition-colors ${
                  activeTab === 'artists'
                    ? 'text-[#FF4D67] border-b-2 border-[#FF4D67]'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('artists')}
              >
                Artists ({artists.length})
              </button>
              <button
                className={`py-2 px-4 font-medium text-sm sm:text-base transition-colors ${
                  activeTab === 'albums'
                    ? 'text-[#FF4D67] border-b-2 border-[#FF4D67]'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('albums')}
              >
                Albums ({albums.length})
              </button>
              <button
                className={`py-2 px-4 font-medium text-sm sm:text-base transition-colors ${
                  activeTab === 'playlists'
                    ? 'text-[#FF4D67] border-b-2 border-[#FF4D67]'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('playlists')}
              >
                Playlists ({playlists.length})
              </button>
            </div>
          </div>
          
          {/* Search Results */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FF4D67]"></div>
              <p className="mt-4 text-gray-400">Searching for "{query}"...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <h3 className="mt-4 text-lg font-medium text-white">Error loading search results</h3>
              <p className="mt-2 text-gray-400">{error}</p>
              <button 
                onClick={() => fetchSearchResults(query)}
                className="mt-4 px-4 py-2 bg-[#FF4D67] hover:bg-[#FF4D67]/80 text-white rounded-full text-sm font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : searchQuery ? (
            <>
              {/* Tracks Tab */}
              {activeTab === 'tracks' && (
                <div className="space-y-4">
                  {tracks.length > 0 ? (
                    tracks.map((track) => (
                      <div key={track.id} className="flex items-center gap-4 p-4 card-bg rounded-xl hover:bg-gray-800/50 transition-colors group">
                        <div className="relative">
                          <img 
                            src={track.coverImage || '/placeholder-track.png'} 
                            alt={track.title} 
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          {/* Beat indicator badge */}
                          {track.type === 'beat' && (
                            <div className="absolute -top-2 -left-2">
                              <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                                BEAT
                              </span>
                            </div>
                          )}
                          {/* Payment type indicator for beats */}
                          {track.type === 'beat' && (
                            <div className="absolute -top-2 -right-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${track.paymentType === 'paid' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
                                {track.paymentType === 'paid' ? 'PAID' : 'FREE'}
                              </span>
                            </div>
                          )}
                          {track.type === 'beat' && track.paymentType === 'paid' && track.price && (
                            <div className="absolute -bottom-2 -right-2">
                              <span className="px-2 py-1 text-xs rounded-full bg-yellow-600 text-white">
                                {track.price.toLocaleString()} RWF
                              </span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                // Format the track to match the PlayerTrack interface in AudioPlayerContext
                                const formattedTrack: PlayerTrack = {
                                  id: track.id,
                                  title: track.title,
                                  artist: track.artist,
                                  coverImage: track.coverImage,
                                  audioUrl: track.audioURL, // Use the audioURL from the track
                                  duration: undefined, // Duration is optional
                                  creatorId: track.creatorId, // Creator ID from search results
                                  albumId: undefined, // Album ID is optional
                                  plays: track.plays,
                                  likes: track.likes,
                                  type: track.type || 'song', // Include track type
                                  paymentType: track.paymentType, // Include payment type
                                  price: track.price, // Include price
                                  creatorWhatsapp: track.creatorWhatsapp // Include WhatsApp contact
                                };
                                playTrack(formattedTrack);
                              }}
                              className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white truncate">{track.title}</h3>
                          <p className="text-gray-400 text-sm truncate">{track.artist}</p>
                          {track.album && <p className="text-gray-500 text-xs truncate">{track.album}</p>}
                        </div>
                        
                        <div className="text-right">
                          <p className="text-gray-500 text-xs sm:text-sm">{track.plays.toLocaleString()} plays</p>
                          <div className="flex items-center gap-1 mt-1 justify-end">
                            <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M3.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span className="text-gray-500 text-xs sm:text-sm">{track.likes}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <h3 className="mt-4 text-lg font-medium text-white">No tracks found</h3>
                      <p className="mt-2 text-gray-400">Try adjusting your search to find what you're looking for.</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Artists Tab */}
              {activeTab === 'artists' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {artists.length > 0 ? (
                    artists.map((artist) => (
                      <Link key={artist._id || artist.id} href={`/artists/${artist._id || artist.id}`} className="group card-bg rounded-xl p-4 transition-all duration-300 hover:border-[#FFCB2B]/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-[#FFCB2B]/10 block">
                        <div className="flex flex-col items-center text-center">
                          <div className="relative mb-3">
                            <img 
                              src={artist.avatar || '/placeholder-avatar.png'} 
                              alt={artist.name} 
                              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover mx-auto"
                            />
                            {artist.verified && (
                              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#FF4D67] border-2 border-gray-900 flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                </svg>
                              </div>
                            )}
                          </div>
                          <h3 className="font-bold text-white text-sm sm:text-base truncate w-full">{artist.name}</h3>
                          <p className="text-[#FFCB2B] text-xs sm:text-sm mb-2">{artist.type}</p>
                          <p className="text-gray-500 text-xs">
                            {artist.followers.toLocaleString()} followers
                          </p>
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              handleFollowArtist(artist._id || artist.id || '');
                            }}
                            disabled={!isAuthenticated}
                            className={`mt-2 w-full px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                              following[artist._id || artist.id || ''] 
                                ? 'bg-[#FF4D67] text-white' 
                                : isAuthenticated
                                  ? 'bg-transparent border border-[#FFCB2B] text-[#FFCB2B] hover:bg-[#FFCB2B]/10'
                                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {following[artist._id || artist.id || ''] 
                              ? 'Following' 
                              : isAuthenticated 
                                ? 'Follow' 
                                : 'Login to Follow'}
                          </button>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <svg className="w-16 h-16 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <h3 className="mt-4 text-lg font-medium text-white">No artists found</h3>
                      <p className="mt-2 text-gray-400">Try adjusting your search to find what you're looking for.</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Albums Tab */}
              {activeTab === 'albums' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {albums.length > 0 ? (
                    albums.map((album) => (
                      <div key={album.id} className="group card-bg rounded-xl overflow-hidden transition-all duration-300 hover:border-[#FF4D67]/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-[#FF4D67]/10">
                        <div className="relative">
                          <img 
                            src={album.coverImage || '/placeholder-album.png'} 
                            alt={album.title} 
                            className="w-full aspect-square object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button 
                              onClick={() => {
                                // TODO: Implement album play functionality
                                // This would require fetching full album data with tracks
                                alert('Album playback coming soon!');
                              }}
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full gradient-primary flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        <div className="p-3">
                          <h3 className="font-bold text-white text-sm sm:text-base mb-1 truncate">{album.title}</h3>
                          <p className="text-gray-400 text-xs sm:text-sm truncate">{album.artist}</p>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-gray-500 text-xs">{album.year}</span>
                            <span className="text-gray-500 text-xs">{album.tracks} tracks</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <svg className="w-16 h-16 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <h3 className="mt-4 text-lg font-medium text-white">No albums found</h3>
                      <p className="mt-2 text-gray-400">Try adjusting your search to find what you're looking for.</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Playlists Tab */}
              {activeTab === 'playlists' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {playlists.length > 0 ? (
                    playlists.map((playlist) => (
                      <div key={playlist.id} className="group card-bg rounded-xl overflow-hidden transition-all duration-300 hover:border-[#FF4D67]/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-[#FF4D67]/10">
                        <div className="relative">
                          <img 
                            src={playlist.coverImage || '/placeholder-playlist.png'} 
                            alt={playlist.name} 
                            className="w-full aspect-square object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button 
                              onClick={() => {
                                // TODO: Implement playlist play functionality
                                // This would require fetching full playlist data with tracks
                                alert('Playlist playback coming soon!');
                              }}
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full gradient-primary flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        <div className="p-3">
                          <h3 className="font-bold text-white text-sm sm:text-base mb-1 truncate">{playlist.name}</h3>
                          <p className="text-gray-400 text-xs sm:text-sm truncate">
                            {playlist.description ? `${playlist.description.substring(0, 40)}...` : 'Playlist'}
                          </p>
                          <p className="text-gray-500 text-xs mb-2">by {playlist.creator}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-xs">{playlist.tracks} tracks</span>
                            <span className="text-gray-500 text-xs capitalize">{playlist.isPublic ? 'Public' : 'Private'}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <svg className="w-16 h-16 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <h3 className="mt-4 text-lg font-medium text-white">No playlists found</h3>
                      <p className="mt-2 text-gray-400">Try adjusting your search to find what you're looking for.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              <h3 className="mt-4 text-lg font-medium text-white">Start searching</h3>
              <p className="mt-2 text-gray-400">Enter a search term to find music, artists, and albums.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Loading fallback component
function SearchLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black flex items-center justify-center">
      <div className="text-white">Loading search results...</div>
    </div>
  )
}

export default function SearchResults() {
  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchResultsContent />
    </Suspense>
  )
}
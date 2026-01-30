'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { fetchCreatorAnalytics, fetchCreatorTracks } from '../../services/creatorService'
import { getAlbumsByCreator, deleteAlbum } from '../../services/albumService'
import { deleteTrack } from '../../services/trackService'
import { ITrack } from '../../types'
import { useAudioPlayer } from '../../contexts/AudioPlayerContext'
import { getFollowedCreators } from '../../services/trackService'
import { getRecentlyPlayed } from '../../services/recentlyPlayedService'
// Import UploadCare components
import { FileUploaderRegular } from "@uploadcare/react-uploader";
import "@uploadcare/react-uploader/core.css";

// Define the possible active tab types
type ActiveTab = 'profile' | 'favorites' | 'analytics' | 'tracks' | 'albums' | 'whatsapp' | 'following' | 'recently-played';

interface CreatorAnalytics {
  totalTracks: number
  totalPlays: number
  totalLikes: number
  tracks: number
  topCountries?: Array<{ country: string; count: number }>
}

interface ProfileAlbum {
  id: string;
  title: string;
  artist: string;
  coverImage: string;
  year: number;
  tracks: number;
  createdAt: string;
}

// Extend the Album interface to match backend data structure
interface Album {
  _id: string;
  id: string;
  title: string;
  creatorId: {
    _id: string;
    name: string;
    avatar?: string;
  } | string;
  coverURL: string;
  releaseDate: string;
  tracks: Array<any>;
  createdAt: string;
  updatedAt: string;
}

export default function Profile() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile')
  const [analytics, setAnalytics] = useState<CreatorAnalytics | null>(null)
  const [tracks, setTracks] = useState<ITrack[]>([])
  const [albums, setAlbums] = useState<ProfileAlbum[]>([])
  const [filteredTracks, setFilteredTracks] = useState<ITrack[]>([])
  const [filteredAlbums, setFilteredAlbums] = useState<ProfileAlbum[]>([])
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [loadingTracks, setLoadingTracks] = useState(false)
  const [loadingAlbums, setLoadingAlbums] = useState(false)
  const [tracksPage, setTracksPage] = useState(1)
  const [tracksTotalPages, setTracksTotalPages] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{type: 'track' | 'album', id: string, title: string} | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [bio, setBio] = useState('')
  const [genres, setGenres] = useState<string[]>([])
  const [followedCreators, setFollowedCreators] = useState<any[]>([])
  const [loadingFollowed, setLoadingFollowed] = useState(false)
  const [newGenre, setNewGenre] = useState('')
  const [whatsappContact, setWhatsappContact] = useState('') // Add WhatsApp contact state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null) // Add avatar URL state
  const [recentlyPlayedTracks, setRecentlyPlayedTracks] = useState<any[]>([])
  const [loadingRecentlyPlayed, setLoadingRecentlyPlayed] = useState(false)
  const { currentTrack, isPlaying, playTrack, setCurrentPlaylist, favorites, addToFavorites, removeFromFavorites } = useAudioPlayer()
  const router = useRouter()
  const { isAuthenticated, user, isLoading, updateProfile, updateWhatsAppContact } = useAuth() // Import both functions

  // Check authentication on component mount
  useEffect(() => {
    // Don't redirect while loading
    if (!isLoading && !isAuthenticated) {
      // If not authenticated, redirect to login
      router.push('/login')
    }
  }, [isAuthenticated, router, isLoading]) // Add isLoading to dependency array

  // Check URL parameters to set active tab
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    
    if (tabParam === 'whatsapp' && user?.role === 'creator') {
      setActiveTab('whatsapp');
    }
  }, [user]);

  // Fetch user data when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setBio(user.bio || '')
      setGenres(user.genres || [])
      setAvatarUrl(user.avatar || null)
      // Properly initialize WhatsApp contact - check if it's an object or string
      let whatsappNumber = '';
      if (typeof user.whatsappContact === 'string') {
        whatsappNumber = user.whatsappContact;
      } else if (user.whatsappContact && typeof user.whatsappContact === 'object') {
        // If it's an object, try to extract the actual WhatsApp number
        whatsappNumber = (user.whatsappContact as any).whatsappContact || '';
      }
      console.log('Initializing WhatsApp contact:', whatsappNumber, typeof whatsappNumber)
      setWhatsappContact(whatsappNumber)
      
      // Fetch analytics for creators
      if (user.role === 'creator') {
        fetchAnalytics()
        fetchTracks(1)
        fetchAlbums()
      }
      
      // Fetch recently played tracks for all users
      fetchRecentlyPlayed();
    }
    
    // Fetch followed creators
    fetchFollowedCreators();
  }, [isAuthenticated, user])
  
  const fetchFollowedCreators = async () => {
    if (!isAuthenticated || !user) return;
    
    setLoadingFollowed(true);
    try {
      const creators = await getFollowedCreators();
      setFollowedCreators(creators);
    } catch (error) {
      console.error('Failed to fetch followed creators:', error);
    } finally {
      setLoadingFollowed(false);
    }
  }

  // Fetch recently played tracks
  const fetchRecentlyPlayed = async () => {
    setLoadingRecentlyPlayed(true);
    try {
      const tracksData = await getRecentlyPlayed();
      
      // Transform the data to match our Track interface
      const transformedTracks = tracksData.map((track: any) => ({
        _id: track._id,
        id: track._id,
        title: track.title,
        artist: typeof track.creatorId === 'object' && track.creatorId !== null ? track.creatorId.name : 'Unknown Artist',
        album: '',
        plays: track.plays,
        likes: track.likes,
        coverImage: track.coverURL || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
        coverURL: track.coverURL,
        duration: undefined,
        audioUrl: track.audioURL,
        creatorId: typeof track.creatorId === 'object' && track.creatorId !== null ? track.creatorId._id : track.creatorId,
        playedAt: track.playedAt
      }));

      setRecentlyPlayedTracks(transformedTracks);
    } catch (error) {
      console.error('Error fetching recently played tracks:', error);
    } finally {
      setLoadingRecentlyPlayed(false);
    }
  }

  // Add a separate effect to update WhatsApp contact when user changes
  useEffect(() => {
    if (user && user.whatsappContact !== undefined) {
      // Properly extract WhatsApp contact - check if it's an object or string
      let whatsappNumber = '';
      if (typeof user.whatsappContact === 'string') {
        whatsappNumber = user.whatsappContact;
      } else if (user.whatsappContact && typeof user.whatsappContact === 'object') {
        // If it's an object, try to extract the actual WhatsApp number
        whatsappNumber = (user.whatsappContact as any).whatsappContact || '';
      }
      console.log('Updating WhatsApp contact from user change:', whatsappNumber, typeof whatsappNumber)
      setWhatsappContact(whatsappNumber)
    }
  }, [user?.whatsappContact])

  // Listen for track updates (when favorites are added/removed)
  useEffect(() => {
    const handleTrackUpdate = (event: CustomEvent) => {
      const detail = event.detail;
      if (detail && detail.trackId) {
        // Also refresh analytics since total likes may have changed
        fetchAnalytics()
      }
    };
    
    // Listen for analytics updates specifically
    const handleAnalyticsUpdate = () => {
      fetchAnalytics();
    };

    // Add event listeners
    window.addEventListener('trackUpdated', handleTrackUpdate as EventListener);
    window.addEventListener('analyticsUpdated', handleAnalyticsUpdate);

    // Clean up event listeners
    return () => {
      window.removeEventListener('trackUpdated', handleTrackUpdate as EventListener);
      window.removeEventListener('analyticsUpdated', handleAnalyticsUpdate);
    }
  }, [user, tracksPage]);

  const fetchAnalytics = async () => {
    if (!user || user.role !== 'creator') return
    
    setLoadingAnalytics(true)
    setError(null)
    
    try {
      const data = await fetchCreatorAnalytics()
      setAnalytics(data)
    } catch (err: any) {
      console.error('Failed to fetch analytics:', err)
      setError(`Failed to fetch analytics: ${err.message || 'Unknown error'}`)
    } finally {
      setLoadingAnalytics(false)
    }
  }

  const fetchTracks = async (page: number = 1) => {
    if (!user || user.role !== 'creator') return
    
    setLoadingTracks(true)
    setError(null)
    
    try {
      const data = await fetchCreatorTracks(page, 6) // 6 items per page
      setTracks(data.tracks)
      setFilteredTracks(data.tracks)
      setTracksTotalPages(data.pages)
      setTracksPage(data.page)
    } catch (err: any) {
      console.error('Failed to fetch tracks:', err)
      setError(`Failed to fetch tracks: ${err.message || 'Unknown error'}`)
    } finally {
      setLoadingTracks(false)
    }
  }

  const fetchAlbums = async () => {
    if (!user || user.role !== 'creator') return
  
    setLoadingAlbums(true)
    setError(null)
    
    try {
      const albumsData = await getAlbumsByCreator(user.id) // Pass actual user ID instead of empty string
      // Transform the data to match our interface
      const transformedAlbums = albumsData.map((album: any) => ({
        id: album._id,
        title: album.title,
        artist: (typeof album.creatorId === 'object' && album.creatorId !== null && 'name' in album.creatorId) ? (album.creatorId as any).name : 'Unknown Artist',
        coverImage: album.coverURL,
        year: new Date(album.releaseDate || album.createdAt).getFullYear(),
        tracks: album.tracks?.length || 0,
        createdAt: album.createdAt
      }))
      setAlbums(transformedAlbums)
      setFilteredAlbums(transformedAlbums)
    } catch (err: any) {
      console.error('Failed to fetch albums:', err)
      setError(`Failed to fetch albums: ${err.message || 'Unknown error'}`)
    } finally {
      setLoadingAlbums(false)
    }
  }

  // Handle avatar upload success
  const handleAvatarUploadSuccess = (info: any) => {
    console.log('Avatar uploaded successfully:', info);
    if (info && info.cdnUrl) {
      setAvatarUrl(info.cdnUrl);
      // Update the user's avatar in the database
      updateProfile({ avatar: info.cdnUrl });
    }
  };

  const handlePageChange = (newPage: number, type: 'tracks' | 'albums') => {
    if (type === 'tracks') {
      fetchTracks(newPage)
    }
  }

  // Map ITrack to Track interface for audio player
  const mapTrackForPlayer = (track: ITrack) => ({
    id: track._id,
    title: track.title,
    artist: (typeof track.creatorId === 'object' && track.creatorId !== null && 'name' in track.creatorId) ? (track.creatorId as any).name : 'Unknown Artist', // This would need to be fetched from the creator data
    coverImage: track.coverURL,
    audioUrl: track.audioURL,
    duration: 0, // Would need to calculate or fetch duration
    creatorId: track.creatorId,
    likes: track.likes,
    type: track.type, // Include track type for WhatsApp functionality
    creatorWhatsapp: (typeof track.creatorId === 'object' && track.creatorId !== null 
      ? (track.creatorId as any).whatsappContact 
      : undefined) // Include creator's WhatsApp contact
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const form = e.target as HTMLFormElement
      const name = (form.elements.namedItem('name') as HTMLInputElement)?.value || ''
      const email = (form.elements.namedItem('email') as HTMLInputElement)?.value || ''
      const bio = (form.elements.namedItem('bio') as HTMLTextAreaElement)?.value || ''
      
      const currentPasswordInput = form.elements.namedItem('currentPassword') as HTMLInputElement
      const passwordInput = form.elements.namedItem('password') as HTMLInputElement
      
      const currentPassword = currentPasswordInput?.value || ''
      const password = passwordInput?.value || ''
      
      // Prepare update data
      const updateData: any = {
        name: name.trim(),
        email: email.trim(),
        bio: bio.trim(),
        genres: genres, // Use the genres from state directly
        avatar: avatarUrl // Include avatar URL
      }
      
      // Only include fields that have values
      if (name.trim()) updateData.name = name.trim();
      if (email.trim()) updateData.email = email.trim();
      if (bio.trim()) updateData.bio = bio.trim();
      if (genres.length > 0) updateData.genres = genres;
      if (avatarUrl) updateData.avatar = avatarUrl;
      
      // Only include password fields if they have values
      if (currentPassword) {
        updateData.currentPassword = currentPassword
      }
      
      if (password) {
        updateData.password = password
      }
      
      // Call the update profile function from AuthContext
      const success = await updateProfile(updateData)
      
      if (success) {
        // Refresh tracks to show updated creator name
        if (user?.role === 'creator') {
          await fetchTracks()
        }
        
        alert('Profile updated successfully!')
      } else {
        alert('Failed to update profile. Please try again.')
      }
      
      // Clear password fields
      if (currentPasswordInput) {
        currentPasswordInput.value = ''
      }
      if (passwordInput) {
        passwordInput.value = ''
      }
    } catch (error: any) {
      console.error('Failed to update profile:', error)
      // Show more specific error messages
      if (error.message && error.message.includes('duplicate key')) {
        alert('Email is already in use by another account')
      } else {
        alert(`Failed to update profile: ${error.message || 'Unknown error'}`)
      }
    }
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return

    try {
      if (itemToDelete.type === 'track') {
        // Delete track with token refresh
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/${itemToDelete.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Failed to delete track')
        }
        
        setTracks(prevTracks => prevTracks.filter(track => track._id !== itemToDelete.id))
        setFilteredTracks(prevFilteredTracks => prevFilteredTracks.filter(track => track._id !== itemToDelete.id))
      } else if (itemToDelete.type === 'album') {
        // Delete album with token refresh
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/albums/${itemToDelete.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Failed to delete album')
        }
        
        setAlbums(prevAlbums => prevAlbums.filter(album => album.id !== itemToDelete.id))
        setFilteredAlbums(prevFilteredAlbums => prevFilteredAlbums.filter(album => album.id !== itemToDelete.id))
      }
      setShowDeleteModal(false)
      setItemToDelete(null) // Clear the item to delete
    } catch (error: any) {
      console.error(`Failed to delete ${itemToDelete.type}:`, error)
      setError(`Failed to delete ${itemToDelete.type}: ${error.message || 'Unknown error'}`)
      // Keep the modal open so user can see the error
    }
  }

  
  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  // Don't render the profile if not authenticated
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black py-6 sm:py-8 md:py-12 overflow-x-hidden">
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-1/2 max-w-96 h-1/2 max-h-96 sm:w-96 sm:h-96 bg-[#FF4D67]/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-1/2 max-w-96 h-1/2 max-h-96 sm:w-96 sm:h-96 bg-[#FFCB2B]/10 rounded-full blur-3xl -z-10"></div>
      
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8 md:mb-12">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF4D67] to-[#FFCB2B]">
                {user?.role === 'creator' ? 'Creator Dashboard' : 'Your Profile'}
              </h1>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push('/playlists')}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-transparent border border-[#FFCB2B] text-[#FFCB2B] hover:bg-[#FFCB2B]/10 rounded-full text-xs sm:text-sm font-medium transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
                  </svg>
                  <span>Playlists</span>
                </button>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      localStorage.removeItem('user');
                      localStorage.removeItem('accessToken');
                      localStorage.removeItem('refreshToken');
                    }
                    router.push('/login');
                  }}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-transparent border border-[#FF4D67] text-[#FF4D67] hover:bg-[#FF4D67]/10 rounded-full text-xs sm:text-sm font-medium transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              {user?.role === 'creator' 
                ? 'Manage your content, view analytics, and engage with your audience' 
                : 'Manage your account settings and preferences'}
            </p>
          </div>

          {/* Profile Card */}
          <div className="card-bg rounded-2xl p-5 sm:p-6 mb-6 border border-gray-700/50">
            <div className="flex flex-col sm:flex-row items-center gap-5 mb-5">
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-r from-[#FF4D67] to-[#FFCB2B] flex items-center justify-center relative overflow-hidden">
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl sm:text-3xl font-bold text-white z-10">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/20"></div>
                </div>
              </div>
              <div className="text-center sm:text-left flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-white">{user?.name || 'User'}</h2>
                <p className="text-gray-400 mb-2 text-sm">{user?.email || 'user@example.com'}</p>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-800/50 text-gray-300 text-xs">
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                  {user?.role === 'creator' ? 'Creator Account' : 'Fan Account'}
                </div>
                {user?.role === 'creator' && user?.creatorType && (
                  <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-gray-800/50 text-gray-300 text-xs">
                    {user.creatorType.charAt(0).toUpperCase() + user.creatorType.slice(1)}
                  </div>
                )}
                {user?.role === 'creator' && (
                  <div className="mt-4 flex flex-wrap gap-2 justify-center sm:justify-start">
                    <button 
                      onClick={() => router.push('/upload')}
                      className="px-4 py-2 bg-[#FF4D67] text-white rounded-lg hover:bg-[#FF4D67]/80 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"></path>
                      </svg>
                      Upload Track
                    </button>
                    <button 
                      onClick={() => router.push('/create-album')}
                      className="px-4 py-2 bg-[#FFCB2B] text-gray-900 rounded-lg hover:bg-[#FFCB2B]/80 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z"></path>
                      </svg>
                      Create Album
                    </button>
                    <button 
                      onClick={() => router.push('/monetization')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                      </svg>
                      Monetization
                    </button>
                  </div>
                )}
              </div>
            </div>
            {/* Profile Picture Upload Button - Moved to a cleaner location */}
            <div className="flex justify-center sm:justify-start">
              <FileUploaderRegular
                pubkey={process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY || "YOUR_PUBLIC_KEY_HERE"}
                onFileUploadSuccess={handleAvatarUploadSuccess}
                multiple={false}
                className="my-config"
              />
            </div>

            {/* Bio Section */}
            {user?.role === 'creator' && (
              <div className="mb-5">
                <h3 className="text-gray-400 text-xs mb-2">Bio</h3>
                <p className="text-white text-sm">{bio || 'No bio added yet. Tell your fans about yourself!'}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="card-bg rounded-xl p-4 border border-gray-700/30">
                  <h3 className="text-gray-400 text-xs mb-1">Member Since</h3>
                  <p className="text-white font-medium text-sm">January 2024</p>
                </div>
                <div className="card-bg rounded-xl p-4 border border-gray-700/30">
                  <h3 className="text-gray-400 text-xs mb-1">Favorite Genres</h3>
                  <p className="text-white font-medium text-sm">
                    {genres && genres.length > 0 ? genres.join(', ') : 'Not specified'}
                  </p>
                </div>
                <div 
                  className="card-bg rounded-xl p-4 border border-gray-700/30 cursor-pointer hover:border-[#FFCB2B]/50 transition-colors"
                  onClick={() => router.push('/')}
                >
                  <h3 className="text-gray-400 text-xs mb-1">Following</h3>
                  <p className="text-white font-medium text-sm">
                    {user?.followingCount?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="card-bg rounded-xl p-4 border border-gray-700/30">
                  <h3 className="text-gray-400 text-xs mb-1">Followers</h3>
                  <p className="text-white font-medium text-sm">
                    {user?.followersCount?.toLocaleString() || '0'}
                  </p>
                </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex overflow-x-auto border-b border-gray-800 mb-6 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <button
              className={`py-3 px-4 sm:px-6 font-medium text-sm sm:text-base transition-colors whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'text-[#FF4D67] border-b-2 border-[#FF4D67]'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('profile')}
            >
              Profile Settings
            </button>
            <Link 
              href="/favorites"
              className={`py-3 px-4 sm:px-6 font-medium text-sm sm:text-base transition-colors whitespace-nowrap ${
                activeTab === 'favorites'
                  ? 'text-[#FF4D67] border-b-2 border-[#FF4D67]'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Favorites
            </Link>
            <button
              className={`py-3 px-4 sm:px-6 font-medium text-sm sm:text-base transition-colors whitespace-nowrap ${
                activeTab === 'recently-played'
                  ? 'text-[#FF4D67] border-b-2 border-[#FF4D67]'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('recently-played')}
            >
              Recently Played
            </button>
            <button
              className={`py-3 px-4 sm:px-6 font-medium text-sm sm:text-base transition-colors whitespace-nowrap ${
                activeTab === 'following'
                  ? 'text-[#FF4D67] border-b-2 border-[#FF4D67]'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('following')}
            >
              Following
            </button>
            {user?.role === 'creator' && (
              <>
                <button
                  className={`py-3 px-4 sm:px-6 font-medium text-sm sm:text-base transition-colors whitespace-nowrap ${
                    activeTab === 'analytics'
                      ? 'text-[#FF4D67] border-b-2 border-[#FF4D67]'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('analytics')}
                >
                  Analytics
                </button>
                <button
                  className={`py-3 px-4 sm:px-6 font-medium text-sm sm:text-base transition-colors whitespace-nowrap ${
                    activeTab === 'tracks'
                      ? 'text-[#FF4D67] border-b-2 border-[#FF4D67]'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('tracks')}
                >
                  My Tracks
                </button>
                <button
                  className={`py-3 px-4 sm:px-6 font-medium text-sm sm:text-base transition-colors whitespace-nowrap ${
                    activeTab === 'albums'
                      ? 'text-[#FF4D67] border-b-2 border-[#FF4D67]'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('albums')}
                >
                  My Albums
                </button>
                <button
                  className={`py-3 px-4 sm:px-6 font-medium text-sm sm:text-base transition-colors whitespace-nowrap ${
                    activeTab === 'whatsapp'
                      ? 'text-[#FF4D67] border-b-2 border-[#FF4D67]'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('whatsapp')}
                >
                  WhatsApp Contact
                </button>
              </>
            )}
          </div>

          {/* Profile Settings Tab */}
          {activeTab === 'profile' && (
            <div className="card-bg rounded-2xl p-5 sm:p-6 border border-gray-700/50">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-5">Account Settings</h3>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Avatar Upload Section */}
                <div className="pt-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Profile Picture
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#FF4D67] to-[#FFCB2B] flex items-center justify-center relative overflow-hidden">
                      {avatarUrl ? (
                        <img 
                          src={avatarUrl} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-bold text-white z-10">
                          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/20"></div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      {!avatarUrl ? (
                        <FileUploaderRegular
                          pubkey={process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY || "YOUR_PUBLIC_KEY_HERE"}
                          onFileUploadSuccess={handleAvatarUploadSuccess}
                          multiple={false}
                          className="my-config"
                        />
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                          <button 
                            type="button"
                            onClick={() => setAvatarUrl(null)}
                            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium w-full sm:w-auto"
                          >
                            Remove
                          </button>
                          <FileUploaderRegular
                            pubkey={process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY || "YOUR_PUBLIC_KEY_HERE"}
                            onFileUploadSuccess={handleAvatarUploadSuccess}
                            multiple={false}
                            className="my-config"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    defaultValue={user?.name || ''}
                    className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF4D67] focus:border-transparent transition-all text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    defaultValue={user?.email || ''}
                    className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF4D67] focus:border-transparent transition-all text-sm"
                  />
                </div>

                {user?.role === 'creator' && (
                  <>
                    {/* Bio Field */}
                    <div>
                      <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-2">
                        Bio
                      </label>
                      <textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell your fans about yourself..."
                        className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF4D67] focus:border-transparent transition-all text-sm min-h-[100px]"
                      />
                    </div>

                    {/* Genres Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Favorite Genres
                      </label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {genres.map((genre, index) => (
                          <div key={index} className="flex items-center bg-gray-700 rounded-full px-3 py-1 text-sm">
                            <span className="text-white">{genre}</span>
                            <button 
                              type="button"
                              onClick={() => setGenres(genres.filter((_, i) => i !== index))}
                              className="ml-2 text-gray-400 hover:text-white"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex">
                        <input
                          type="text"
                          value={newGenre}
                          onChange={(e) => setNewGenre(e.target.value)}
                          placeholder="Add a genre..."
                          className="flex-1 px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-l-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF4D67] focus:border-transparent transition-all text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newGenre.trim() && !genres.includes(newGenre.trim())) {
                                setGenres([...genres, newGenre.trim()]);
                                setNewGenre('');
                              }
                            }
                          }}
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            if (newGenre.trim() && !genres.includes(newGenre.trim())) {
                              setGenres([...genres, newGenre.trim()]);
                              setNewGenre('');
                            }
                          }}
                          className="px-4 bg-[#FF4D67] text-white rounded-r-lg hover:bg-[#FF4D67]/80 transition-colors text-sm font-medium"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    placeholder="Enter current password"
                    className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF4D67] focus:border-transparent transition-all text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    placeholder="Enter new password"
                    className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF4D67] focus:border-transparent transition-all text-sm"
                  />
                </div>

                {user?.role !== 'creator' && (
                  <div className="card-bg rounded-xl p-4 border-l-4 border-[#FFCB2B]">
                    <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#FFCB2B]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 101 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                      </svg>
                      Want to become a creator?
                    </h4>
                    <p className="text-xs text-gray-400 mb-3">
                      Upgrade your account to upload music and connect with fans.
                    </p>
                    <button 
                      onClick={() => router.push('/upload')}
                      className="px-3 py-1.5 bg-transparent border border-[#FFCB2B] text-[#FFCB2B] hover:bg-[#FFCB2B]/10 rounded-full text-xs font-medium transition-colors"
                      type="button"
                    >
                      Upgrade to Creator
                    </button>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button 
                    type="submit"
                    className="px-5 py-2.5 gradient-primary rounded-lg text-white font-medium hover:opacity-90 transition-opacity text-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
              
              {/* Legal & Informational Pages */}
              <div className="mt-8 pt-6 border-t border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#FF4D67]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  Legal & Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link href="/about" className="flex items-center justify-between p-3 bg-gray-800/30 hover:bg-gray-700/50 rounded-lg border border-gray-700 transition-colors group">
                    <span className="text-gray-300 group-hover:text-white">About Us</span>
                    <svg className="w-4 h-4 text-gray-500 group-hover:text-[#FF4D67]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </Link>
                  <Link href="/contact" className="flex items-center justify-between p-3 bg-gray-800/30 hover:bg-gray-700/50 rounded-lg border border-gray-700 transition-colors group">
                    <span className="text-gray-300 group-hover:text-white">Contact Us</span>
                    <svg className="w-4 h-4 text-gray-500 group-hover:text-[#FF4D67]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </Link>
                  <Link href="/faq" className="flex items-center justify-between p-3 bg-gray-800/30 hover:bg-gray-700/50 rounded-lg border border-gray-700 transition-colors group">
                    <span className="text-gray-300 group-hover:text-white">FAQ</span>
                    <svg className="w-4 h-4 text-gray-500 group-hover:text-[#FF4D67]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </Link>
                  <Link href="/terms" className="flex items-center justify-between p-3 bg-gray-800/30 hover:bg-gray-700/50 rounded-lg border border-gray-700 transition-colors group">
                    <span className="text-gray-300 group-hover:text-white">Terms of Use</span>
                    <svg className="w-4 h-4 text-gray-500 group-hover:text-[#FF4D67]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </Link>
                  <Link href="/privacy" className="flex items-center justify-between p-3 bg-gray-800/30 hover:bg-gray-700/50 rounded-lg border border-gray-700 transition-colors group">
                    <span className="text-gray-300 group-hover:text-white">Privacy Policy</span>
                    <svg className="w-4 h-4 text-gray-500 group-hover:text-[#FF4D67]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </Link>
                  <Link href="/copyright" className="flex items-center justify-between p-3 bg-gray-800/30 hover:bg-gray-700/50 rounded-lg border border-gray-700 transition-colors group">
                    <span className="text-gray-300 group-hover:text-white">Copyright Policy</span>
                    <svg className="w-4 h-4 text-gray-500 group-hover:text-[#FF4D67]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Creator Analytics Tab */}
          {activeTab === 'analytics' && user?.role === 'creator' && (
            <div className="card-bg rounded-2xl p-5 sm:p-6 border border-gray-700/50">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-5">Performance Analytics</h3>
              
              {error && (
                <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-5">
                  <div className="text-red-300 text-sm">{error}</div>
                  <button 
                    onClick={fetchAnalytics}
                    className="mt-2 px-3 py-1.5 bg-red-700 text-white rounded hover:bg-red-600 text-sm"
                  >
                    Retry
                  </button>
                </div>
              )}
              
              {loadingAnalytics ? (
                <div className="flex justify-center items-center h-40">
                  <div className="text-white text-sm">Loading analytics...</div>
                </div>
              ) : analytics ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="card-bg rounded-xl p-5 border border-gray-700/30 text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-[#FF4D67] mb-2">{analytics.totalTracks}</div>
                      <div className="text-gray-400 text-sm">Total Tracks</div>
                    </div>
                    <div className="card-bg rounded-xl p-5 border border-gray-700/30 text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-[#FFCB2B] mb-2">{analytics.totalPlays.toLocaleString()}</div>
                      <div className="text-gray-400 text-sm">Total Plays</div>
                    </div>
                    <div className="card-bg rounded-xl p-5 border border-gray-700/30 text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-[#6C63FF] mb-2">{analytics.totalLikes.toLocaleString()}</div>
                      <div className="text-gray-400 text-sm">Total Likes</div>
                    </div>
                  </div>
                  
                  {/* Geography Data */}
                  {analytics.topCountries && analytics.topCountries.length > 0 && (
                    <div className="card-bg rounded-xl p-5 border border-gray-700/30 mb-6">
                      <h4 className="text-lg font-bold text-white mb-4">Top Listener Locations</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {analytics.topCountries.map((countryData, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#FF4D67] to-[#FFCB2B] flex items-center justify-center text-white text-xs font-bold mr-3">
                                {index + 1}
                              </div>
                              <span className="text-white font-medium">{countryData.country}</span>
                            </div>
                            <span className="text-gray-400 text-sm">{countryData.count} listeners</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 text-xs text-gray-500">
                        Based on IP address tracking of listeners
                      </div>
                    </div>
                  )}
                </>
              ) : !error ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No analytics data available
                </div>
              ) : null}
            </div>
          )}

          {/* Creator Tracks Tab */}
          {activeTab === 'tracks' && user?.role === 'creator' && (
            <div className="card-bg rounded-2xl p-5 sm:p-6 border border-gray-700/50">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg sm:text-xl font-bold text-white">My Tracks</h3>
                <button 
                  onClick={() => router.push('/upload')}
                  className="px-4 py-2 bg-[#FF4D67] text-white rounded-lg hover:bg-[#FF4D67]/80 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"></path>
                  </svg>
                  Upload Track
                </button>
              </div>

              {error && (
                <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-5">
                  <div className="text-red-300 text-sm">{error}</div>
                  <button 
                    onClick={() => fetchTracks(tracksPage)}
                    className="mt-2 px-3 py-1.5 bg-red-700 text-white rounded hover:bg-red-600 text-sm"
                  >
                    Retry
                  </button>
                </div>
              )}

              {loadingTracks ? (
                <div className="flex justify-center items-center h-40">
                  <div className="text-white text-sm">Loading tracks...</div>
                </div>
              ) : tracks && tracks.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTracks.map((track) => (
                      <div key={track._id} className="card-bg rounded-xl p-4 border border-gray-700/30 hover:border-[#FF4D67]/50 transition-colors group">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-[#FF4D67] to-[#FFCB2B] flex items-center justify-center overflow-hidden">
                            {track.coverURL ? (
                              <img 
                                src={track.coverURL} 
                                alt={track.title} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-white font-bold text-xs">
                                {track.title.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white truncate">{track.title}</h4>
                            <p className="text-gray-400 text-xs truncate">{(typeof track.creatorId === 'object' && track.creatorId !== null && 'name' in track.creatorId) ? (track.creatorId as any).name : 'Unknown Artist'}</p>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs text-gray-400 mb-3">
                          <span>{new Date(track.createdAt).toLocaleDateString()}</span>
                          <span>{track.likes || 0} likes</span>
                        </div>
                        
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              // Map tracks to the format expected by the audio player
                              const mappedTracks = filteredTracks.map(mapTrackForPlayer);
                              setCurrentPlaylist(mappedTracks);
                              playTrack(mapTrackForPlayer(track));
                            }}
                            className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium"
                          >
                            Play
                          </button>
                          <button 
                            onClick={() => router.push(`/edit-track/${track._id}`)}
                            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                          </button>
                          <button 
                            onClick={() => {
                              setItemToDelete({
                                type: 'track',
                                id: track._id,
                                title: track.title
                              });
                              setShowDeleteModal(true);
                            }}
                            className="px-3 py-2 bg-red-900/50 hover:bg-red-900 text-red-400 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {tracksTotalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-6">
                      <button
                        onClick={() => handlePageChange(Math.max(1, tracksPage - 1), 'tracks')}
                        disabled={tracksPage === 1}
                        className="px-3 py-1.5 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors text-sm"
                      >
                        Previous
                      </button>
                      
                      <span className="text-white text-sm">
                        Page {tracksPage} of {tracksTotalPages}
                      </span>
                      
                      <button
                        onClick={() => handlePageChange(Math.min(tracksTotalPages, tracksPage + 1), 'tracks')}
                        disabled={tracksPage === tracksTotalPages}
                        className="px-3 py-1.5 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors text-sm"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              ) : !error ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
                    </svg>
                  </div>
                  <h4 className="text-white font-medium mb-2">No tracks yet</h4>
                  <p className="text-gray-400 text-sm mb-4">Start uploading your music to share with fans</p>
                  <button 
                    onClick={() => router.push('/upload')}
                    className="px-4 py-2 bg-[#FF4D67] text-white rounded-lg hover:bg-[#FF4D67]/80 transition-colors text-sm font-medium"
                  >
                    Upload Your First Track
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* Creator Albums Tab */}
          {activeTab === 'albums' && user?.role === 'creator' && (
            <div className="card-bg rounded-2xl p-5 sm:p-6 border border-gray-700/50">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg sm:text-xl font-bold text-white">My Albums</h3>
                <button 
                  onClick={() => router.push('/create-album')}
                  className="px-4 py-2 bg-[#FFCB2B] text-gray-900 rounded-lg hover:bg-[#FFCB2B]/80 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z"></path>
                  </svg>
                  Create Album
                </button>
              </div>

              {error && (
                <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-5">
                  <div className="text-red-300 text-sm">{error}</div>
                  <button 
                    onClick={fetchAlbums}
                    className="mt-2 px-3 py-1.5 bg-red-700 text-white rounded hover:bg-red-600 text-sm"
                  >
                    Retry
                  </button>
                </div>
              )}

              {loadingAlbums ? (
                <div className="flex justify-center items-center h-40">
                  <div className="text-white text-sm">Loading albums...</div>
                </div>
              ) : albums && albums.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAlbums.map((album) => (
                    <div key={album.id} className="card-bg rounded-xl p-4 border border-gray-700/30 hover:border-[#FFCB2B]/50 transition-colors group">
                      <div className="relative mb-3">
                        <div className="aspect-square rounded-lg bg-gradient-to-r from-[#FF4D67] to-[#FFCB2B] flex items-center justify-center overflow-hidden">
                          {album.coverImage ? (
                            <img 
                              src={album.coverImage} 
                              alt={album.title} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-bold text-2xl">
                              {album.title.charAt(0)}
                            </span>
                          )}
                        </div>
                        <button 
                          onClick={() => {
                            // View album tracks
                            router.push(`/album/${album.id}`);
                          }}
                          className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                        >
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                        </button>
                      </div>
                      
                      <h4 className="font-medium text-white truncate mb-1">{album.title}</h4>
                      <p className="text-gray-400 text-xs mb-2">{album.artist}</p>
                      <div className="flex justify-between items-center text-xs text-gray-400">
                        <span>{album.year}</span>
                        <span>{album.tracks} tracks</span>
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        <button 
                          onClick={() => router.push(`/edit-album/${album.id}`)}
                          className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => {
                            setItemToDelete({
                              type: 'album',
                              id: album.id,
                              title: album.title
                            });
                            setShowDeleteModal(true);
                          }}
                          className="px-3 py-2 bg-red-900/50 hover:bg-red-900 text-red-400 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : !error ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z"></path>
                    </svg>
                  </div>
                  <h4 className="text-white font-medium mb-2">No albums yet</h4>
                  <p className="text-gray-400 text-sm mb-4">Create your first album to showcase your music collection</p>
                  <button 
                    onClick={() => router.push('/create-album')}
                    className="px-4 py-2 bg-[#FFCB2B] text-gray-900 rounded-lg hover:bg-[#FFCB2B]/80 transition-colors text-sm font-medium"
                  >
                    Create Your First Album
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && itemToDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="card-bg rounded-2xl p-6 max-w-md w-full border border-gray-700/50">
            <h3 className="text-lg font-bold text-white mb-2">Confirm Deletion</h3>
            <p className="text-gray-400 text-sm mb-6">
              Are you sure you want to delete "{itemToDelete.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setItemToDelete(null);
                }}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Contact Tab */}
      {activeTab === 'whatsapp' && user?.role === 'creator' && (
        <div className="card-bg rounded-2xl p-5 sm:p-6 border border-gray-700/50">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-5">WhatsApp Contact Information</h3>
          
          <div className="max-w-2xl">
            <p className="text-gray-400 text-sm mb-6">
              Fans can contact you via WhatsApp for beats and collaborations. This information will be visible to other users when they view your profile or tracks marked as beats.
            </p>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              // Use the new WhatsApp contact update function
              const success = await updateWhatsAppContact(whatsappContact.trim());
              if (success) {
                alert('WhatsApp contact updated successfully!');
              } else {
                alert('Failed to update WhatsApp contact. Please try again.');
              }
            }} className="space-y-6">
              <div>
                <label htmlFor="whatsappContact" className="block text-sm font-medium text-gray-300 mb-2">
                  WhatsApp Number
                </label>
                <input
                  type="text"
                  id="whatsappContact"
                  value={whatsappContact}
                  onChange={(e) => setWhatsappContact(e.target.value)}
                  placeholder="Enter your WhatsApp number (e.g., +1234567890)"
                  className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF4D67] focus:border-transparent transition-all text-sm"
                />
                <p className="mt-2 text-xs text-gray-400">
                  Include country code. Leave empty if you don't want to be contacted via WhatsApp.
                </p>
              </div>
              
              <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
                <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.480-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.87 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  How it works
                </h4>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• Users can contact you directly via WhatsApp for beats</li>
                  <li>• Your number is only visible for tracks marked as "beats"</li>
                  <li>• You can update this information at any time</li>
                  <li>• Leave empty to disable WhatsApp contact</li>
                </ul>
              </div>
              
              <div className="flex justify-end pt-2">
                <button 
                  type="submit"
                  className="px-5 py-2.5 gradient-primary rounded-lg text-white font-medium hover:opacity-90 transition-opacity text-sm"
                >
                  Save WhatsApp Number
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recently Played Tab */}
      {activeTab === 'recently-played' && (
        <div className="card-bg rounded-2xl p-5 sm:p-6 border border-gray-700/50">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg sm:text-xl font-bold text-white">Recently Played</h3>
            <button 
              onClick={() => router.push('/explore')}
              className="px-4 py-2 bg-[#FF4D67] text-white rounded-lg hover:bg-[#FF4D67]/80 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
              </svg>
              View New Tracks
            </button>
          </div>
                    
          {loadingRecentlyPlayed ? (
            <div className="flex justify-center items-center h-40">
              <div className="text-white text-sm">Loading recently played tracks...</div>
            </div>
          ) : recentlyPlayedTracks.length > 0 ? (
            <div className="space-y-4">
              {recentlyPlayedTracks.map((track) => (
                <div key={track.id} className="card-bg rounded-xl p-4 flex items-center gap-4 transition-all hover:border-[#FF4D67]/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50">
                  <div className="relative">
                    <img 
                      src={track.coverImage} 
                      alt={track.title} 
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <button 
                      onClick={() => {
                        playTrack(track);
                                  
                        // Set the current playlist to all recently played tracks
                        setCurrentPlaylist(recentlyPlayedTracks);
                      }}
                      className="absolute inset-0 w-full h-full rounded-lg bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                      </svg>
                    </button>
                  </div>
                            
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-sm sm:text-base truncate">{track.title}</h3>
                    <p className="text-gray-400 text-xs sm:text-sm truncate">{track.artist}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      Played {new Date(track.playedAt).toLocaleDateString()}
                    </p>
                  </div>
                            
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 text-xs sm:text-sm hidden sm:block">
                      {track.duration ? `${Math.floor(track.duration / 60)}:${Math.floor(track.duration % 60).toString().padStart(2, '0')}` : '3:45'}
                    </span>
                    <button 
                      onClick={() => {
                        // Toggle favorite status for the track
                        const isFavorite = Object.values(favorites).some((fav: any) => fav.id === track.id);
                        if (isFavorite) {
                          removeFromFavorites(track.id);
                        } else {
                          addToFavorites(track);
                        }
                      }}
                      className="p-1.5 sm:p-2 rounded-full hover:bg-gray-800/50 transition-all duration-300 hover:scale-110"
                    >
                      <svg 
                        className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-200 ${Object.values(favorites).some((fav: any) => fav.id === track.id) ? 'text-red-500 fill-current scale-110' : 'text-[#FF4D67] stroke-current'}`}
                        fill={Object.values(favorites).some((fav: any) => fav.id === track.id) ? "currentColor" : "none"}
                        stroke="currentColor"
                        viewBox="0 0 24 24" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card-bg rounded-2xl p-8 sm:p-12 text-center border border-gray-700/50">
              <div className="mx-auto w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">No recently played tracks</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Start listening to music and your recently played tracks will appear here
              </p>
              <button 
                onClick={() => router.push('/explore')}
                className="px-5 py-2.5 sm:px-6 sm:py-3 gradient-primary rounded-lg text-white font-medium hover:opacity-90 transition-opacity text-sm sm:text-base"
              >
                Explore Music
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Following Tab */}
      {activeTab === 'following' && (
        <div className="card-bg rounded-2xl p-5 sm:p-6 border border-gray-700/50">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-5">Following</h3>
                    
          {loadingFollowed ? (
            <div className="flex justify-center items-center h-40">
              <div className="text-white text-sm">Loading followed creators...</div>
            </div>
          ) : followedCreators && followedCreators.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {followedCreators.map((creator) => (
                <div 
                  key={creator._id} 
                  className="card-bg rounded-xl p-4 border border-gray-700/30 hover:border-[#FF4D67]/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/artists/${creator._id}`)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#FF4D67] to-[#FFCB2B] flex items-center justify-center overflow-hidden">
                      {creator.avatar ? (
                        <img 
                          src={creator.avatar} 
                          alt={creator.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-bold text-xs">
                          {creator.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white truncate">{creator.name}</h4>
                      <p className="text-gray-400 text-xs truncate capitalize">{creator.creatorType}</p>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{creator.followersCount || 0} followers</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
              </div>
              <h4 className="text-white font-medium mb-2">Not following anyone yet</h4>
              <p className="text-gray-400 text-sm mb-4">Start following creators to see them here</p>
              <button 
                onClick={() => router.push('/explore')}
                className="px-4 py-2 bg-[#FF4D67] text-white rounded-lg hover:bg-[#FF4D67]/80 transition-colors text-sm font-medium"
              >
                Explore Creators
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
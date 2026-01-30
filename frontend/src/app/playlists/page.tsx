'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { useAudioPlayer } from '../../contexts/AudioPlayerContext'
import { getUserPlaylists, deletePlaylist, addTrackToPlaylist } from '../../services/userService'

interface PlaylistTrack {
  _id: string
  title: string
  creatorId: {
    name: string
  }
  plays: number
  coverURL?: string
  audioURL?: string  // Add audioURL field
  audioUrl?: string  // Alternative naming
  url?: string      // Alternative naming
  coverImage?: string // Alternative naming
  audio?: string     // Another possible naming
  src?: string       // Another possible naming
}

interface Playlist {
  _id: string
  name: string
  description: string
  userId: {
    _id: string
    name: string
  }
  tracks: PlaylistTrack[]
  isPublic: boolean
  createdAt: string
}

export default function PublicPlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [filteredPlaylists, setFilteredPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('recent') // recent, popular, tracks
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('')
  const [newPlaylistPublic, setNewPlaylistPublic] = useState(true)
  const [creatingPlaylist, setCreatingPlaylist] = useState(false)
  const [selectedTracksForNewPlaylist, setSelectedTracksForNewPlaylist] = useState<PlaylistTrack[]>([])
  const [showTrackSelector, setShowTrackSelector] = useState(false)
  const [showTracksModal, setShowTracksModal] = useState(false)
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)
  const [addingTrackId, setAddingTrackId] = useState<string | null>(null)
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false)
  const [selectedTrackToAdd, setSelectedTrackToAdd] = useState<PlaylistTrack | null>(null)
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { playTrack, setCurrentPlaylist } = useAudioPlayer()
  const hasFetchedRef = useRef(false)

  // Reset the fetch ref when auth state changes significantly
  useEffect(() => {
    // Reset fetch flag when auth loading starts or auth state changes significantly
    if (authLoading || (hasFetchedRef.current && !isAuthenticated)) {
      hasFetchedRef.current = false;
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    console.log('Auth loading effect triggered:', { authLoading, isAuthenticated, hasFetched: hasFetchedRef.current });
    // Only fetch playlists when authentication state is fully loaded AND we haven't fetched yet
    if (!authLoading && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchPlaylists();
    }
  }, [authLoading, isAuthenticated])

  useEffect(() => {
    filterAndSortPlaylists()
  }, [playlists, searchQuery, sortBy])
  
  // Debug logs
  useEffect(() => {
    console.log('Playlists page debug:', {
      isAuthenticated,
      playlistsLength: playlists.length,
      filteredPlaylistsLength: filteredPlaylists.length,
      searchQuery
    });
  }, [isAuthenticated, playlists.length, filteredPlaylists.length, searchQuery]);

  const fetchPlaylists = async () => {
    try {
      setLoading(true)
      setError('')
      
      console.log('fetchPlaylists called with:', { isAuthenticated, authLoading });
      
      // Fetch both public playlists and user's personal playlists when authenticated
      let publicPlaylists = [];
      let userPlaylists = [];
      
      // Always fetch public playlists
      try {
        const publicResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/public/playlists`);
        if (publicResponse.ok) {
          const publicData = await publicResponse.json();
          publicPlaylists = publicData.playlists || [];
        }
      } catch (error) {
        console.error('Error fetching public playlists:', error);
        // Continue with empty public playlists
      }
      
      // Fetch user's personal playlists if authenticated
      if (isAuthenticated) {
        try {
          userPlaylists = await getUserPlaylists();
        } catch (error) {
          console.error('Error fetching user playlists:', error);
          // Continue with empty user playlists
        }
      }
      
      // Combine both sets of playlists (prefer user playlists to avoid duplicates)
      let allPlaylists = [...publicPlaylists];
      
      // Add user playlists that aren't already in public playlists
      for (const userPlaylist of userPlaylists) {
        if (!allPlaylists.some(pl => pl._id === userPlaylist._id)) {
          allPlaylists.push(userPlaylist);
        }
      }
      
      // Structure the response like the API response
      const data = { playlists: allPlaylists };
      
      console.log('Fetched public playlists:', publicPlaylists.length, 'and user playlists:', userPlaylists.length);
      
      // Filter out default/mock playlists
      const filteredPlaylists = (data.playlists || []).filter((playlist: Playlist) => {
        // Exclude default/favorite playlists (more specific matching)
        const lowerName = playlist.name.toLowerCase();
        return !(lowerName.includes('favorite') && lowerName.includes('playlist')) && 
               !lowerName.includes('dox ') && !lowerName.includes('dox_') &&
               !lowerName.startsWith('dox') &&
               playlist.name.toLowerCase() !== 'default' && 
               playlist.name.toLowerCase() !== 'mock';
      });
      setPlaylists(filteredPlaylists);
    } catch (err: any) {
      console.error('Error fetching playlists:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortPlaylists = () => {
    let filtered = [...playlists]
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(playlist => 
        playlist.name.toLowerCase().includes(query) ||
        playlist.description.toLowerCase().includes(query) ||
        playlist.userId?.name?.toLowerCase().includes(query) ||
        playlist.tracks.some(track => 
          track.title.toLowerCase().includes(query) ||
          track.creatorId?.name?.toLowerCase().includes(query)
        )
      )
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.tracks.reduce((sum, track) => sum + (track.plays || 0), 0) - 
                 a.tracks.reduce((sum, track) => sum + (track.plays || 0), 0)
        case 'tracks':
          return b.tracks.length - a.tracks.length
        case 'recent':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })
    
    setFilteredPlaylists(filtered)
  }

  const handlePlayPlaylist = async (playlist: Playlist) => {
    if (playlist.tracks.length > 0) {
      // Since the playlist tracks might not have audio URLs, we need to fetch complete track details
      // We'll build the player tracks with available info and try to enhance with full track data
      
      // Build initial player tracks with available data
      const playerTracks: any[] = [];
      
      for (const track of playlist.tracks) {
        // Try to get audio URL from the available track data
        let audioUrl = track.audioURL || track.audioUrl || track.url || track.audio || track.src || '';
        
        // If no audio URL is available in the playlist track data, we need to fetch it
        if (!audioUrl) {
          try {
            // Fetch the complete track data by ID to get the audio URL
            const trackResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/${track._id}`);
            if (trackResponse.ok) {
              const fullTrack = await trackResponse.json();
              audioUrl = fullTrack.audioURL || fullTrack.audioUrl || fullTrack.url || fullTrack.audio || fullTrack.src || '';
            }
          } catch (error) {
            console.error('Error fetching full track data:', error);
          }
        }
        
        // Only add to player tracks if we have an audio URL
        if (audioUrl) {
          playerTracks.push({
            id: track._id,
            title: track.title || 'Unknown Title',
            artist: playlist.userId?.name === 'admin' || playlist.userId?.name?.toLowerCase().includes('muzikax') ? 'MuzikaX' : track.creatorId?.name || 'MuzikaX', // Use 'MuzikaX' for admin playlists
            coverImage: track.coverURL || track.coverImage || '',
            audioUrl: audioUrl,
            creatorId: (track.creatorId as any)?._id || '',
            type: 'song' as const
          });
        }
      }
      
      if (playerTracks.length > 0) {
        // Set the current playlist
        setCurrentPlaylist(playerTracks)
        
        // Play the first track
        playTrack(playerTracks[0], playerTracks)
      }
    }
  }
  
  const handleSharePlaylist = async (playlist: Playlist) => {
    try {
      // Create a shareable link
      const shareUrl = `${window.location.origin}/playlists#${playlist._id}`;
      const shareText = `Check out this playlist: ${playlist.name} by ${playlist.userId?.name || 'MuzikaX'} on MuzikaX!`;
      
      // Try to use the Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: playlist.name,
          text: shareText,
          url: shareUrl
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        alert('Playlist link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing playlist:', error);
      // Fallback: copy to clipboard
      try {
        const shareUrl = `${window.location.origin}/playlists#${playlist._id}`;
        const shareText = `Check out this playlist: ${playlist.name} by ${playlist.userId?.name || 'MuzikaX'} on MuzikaX!`;
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        alert('Playlist link copied to clipboard!');
      } catch (copyError) {
        console.error('Error copying to clipboard:', copyError);
      }
    }
  }
  
  const handlePlayFromTrack = async (playlist: Playlist, startIndex: number) => {
    // Build the full playlist with audio URLs
    const playerTracks: any[] = [];
    
    for (let i = 0; i < playlist.tracks.length; i++) {
      const track = playlist.tracks[i];
      
      // Try to get audio URL from the available track data
      let audioUrl = track.audioURL || track.audioUrl || track.url || track.audio || track.src || '';
      
      // If no audio URL is available in the playlist track data, we need to fetch it
      if (!audioUrl) {
        try {
          // Fetch the complete track data by ID to get the audio URL
          const trackResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/${track._id}`);
          if (trackResponse.ok) {
            const fullTrack = await trackResponse.json();
            audioUrl = fullTrack.audioURL || fullTrack.audioUrl || fullTrack.url || fullTrack.audio || fullTrack.src || '';
          }
        } catch (error) {
          console.error('Error fetching full track data:', error);
        }
      }
      
      // Only add to player tracks if we have an audio URL
      if (audioUrl) {
        playerTracks.push({
          id: track._id,
          title: track.title || 'Unknown Title',
          artist: playlist.userId?.name === 'admin' || playlist.userId?.name?.toLowerCase().includes('muzikax') ? 'MuzikaX' : track.creatorId?.name || 'MuzikaX', // Use 'MuzikaX' for admin playlists
          coverImage: track.coverURL || track.coverImage || '',
          audioUrl: audioUrl,
          creatorId: (track.creatorId as any)?._id || '',
          type: 'song' as const
        });
      }
    }
    
    if (playerTracks.length > 0 && startIndex < playerTracks.length) {
      // Set the current playlist
      setCurrentPlaylist(playerTracks);
      
      // Play from the selected track
      playTrack(playerTracks[startIndex], playerTracks);
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getTotalPlays = (playlist: Playlist) => {
    return playlist.tracks.reduce((sum, track) => sum + (track.plays || 0), 0)
  }
  
  const handleDeletePlaylist = async (playlistId: string, playlistName: string) => {
    if (!confirm(`Are you sure you want to delete the playlist "${playlistName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const result = await deletePlaylist(playlistId);
      if (result) {
        // Remove the deleted playlist from the state
        setPlaylists(playlists.filter(p => p._id !== playlistId));
        setFilteredPlaylists(filteredPlaylists.filter(p => p._id !== playlistId));
        alert('Playlist deleted successfully!');
      } else {
        alert('Failed to delete playlist. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting playlist:', error);
      alert('An error occurred while deleting the playlist. Please try again.');
    }
  };
  
  const handleAddTrackToPlaylist = async (track: PlaylistTrack) => {
    if (!isAuthenticated) {
      alert('Please log in to add tracks to playlists');
      router.push('/login');
      return;
    }
    
    setSelectedTrackToAdd(track);
    setShowAddToPlaylistModal(true);
  };
  
  const handleConfirmAddToPlaylist = async (playlistId: string) => {
    if (!selectedTrackToAdd) return;
    
    setAddingTrackId(selectedTrackToAdd._id);
    
    try {
      const result = await addTrackToPlaylist(playlistId, selectedTrackToAdd._id);
      if (result) {
        alert('Track added to playlist successfully!');
        setShowAddToPlaylistModal(false);
        setSelectedTrackToAdd(null);
      } else {
        alert('Failed to add track to playlist. Please try again.');
      }
    } catch (error) {
      console.error('Error adding track to playlist:', error);
      alert('An error occurred while adding track to playlist');
    } finally {
      setAddingTrackId(null);
    }
  };
  
  const [trackSearchQuery, setTrackSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaylistTrack[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Function to search for tracks
  const searchTracks = async () => {
    if (!trackSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    setSearchLoading(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/search?q=${encodeURIComponent(trackSearchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        // Transform the search result tracks to match the expected structure
        const transformedTracks = (data.tracks || []).map((track: any) => ({

          _id: track.id,
          title: track.title,
          creatorId: {
            name: track.artist
          },
          coverURL: track.coverImage,
          audioURL: track.audioURL,
          plays: track.plays
        }));
        setSearchResults(transformedTracks);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching tracks:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };
  
  // Function to toggle track selection for new playlist
  const toggleTrackSelection = (track: PlaylistTrack) => {
    setSelectedTracksForNewPlaylist(prev => {
      const isSelected = prev.some(t => t._id === track._id);
      if (isSelected) {
        return prev.filter(t => t._id !== track._id);
      } else {
        return [...prev, track];
      }
    });
  };
  
  const createPlaylist = async () => {
    if (!newPlaylistName.trim()) {
      alert('Playlist name is required');
      return;
    }
    
    if (selectedTracksForNewPlaylist.length === 0) {
      alert('Please select at least one track for your playlist');
      return;
    }
    
    setCreatingPlaylist(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/playlists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          name: newPlaylistName,
          description: newPlaylistDescription,
          isPublic: newPlaylistPublic,
          trackIds: selectedTracksForNewPlaylist.map(track => track._id)
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create playlist');
      }
      
      const data = await response.json();
      alert('Playlist created successfully!');
      setShowCreateModal(false);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      setNewPlaylistPublic(true);
      setSelectedTracksForNewPlaylist([]);
      
      // Optionally refresh the playlists list
      fetchPlaylists();
    } catch (error: any) {
      console.error('Error creating playlist:', error);
      alert(`Error creating playlist: ${error.message}`);
    } finally {
      setCreatingPlaylist(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF4D67]"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-8">
          <div className="text-center py-12">
            <div className="text-red-500 text-xl mb-4">Error loading playlists</div>
            <button 
              onClick={fetchPlaylists}
              className="px-4 py-2 bg-[#FF4D67] hover:bg-[#FF4D67]/90 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black py-8 sm:py-12 overflow-x-hidden">
      <div className="absolute -top-40 left-0 w-96 h-96 bg-[#FF4D67]/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute -bottom-40 right-0 w-96 h-96 bg-[#FFCB2B]/10 rounded-full blur-3xl -z-10"></div>
      
      <div className="container mx-auto px-4 sm:px-8 max-w-full">
        {/* Header */}
        <div className="mb-8 sm:mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF4D67] to-[#FFCB2B] mb-3">
              Your Playlists
            </h1>
            <p className="text-gray-400 text-lg">
              Create and manage your own playlists. Share with the world or keep private.
            </p>
          </div>
          <button 
            onClick={() => {
              if (isAuthenticated) {
                setShowCreateModal(true);
              } else {
                router.push('/login');
              }
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-[#FF4D67] to-[#FFCB2B] hover:opacity-90 text-white font-medium rounded-lg transition-all self-start min-w-fit"
          >
            Create Playlist
          </button>
        </div>

        {/* Search and Filters */}
        <div className="card-bg rounded-2xl p-4 sm:p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-400 mb-1">
                Search Playlists
              </label>
              <input
                type="text"
                id="search"
                placeholder="Search by playlist name, creator, or track..."
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF4D67]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Sort */}
            <div>
              <label htmlFor="sort" className="block text-sm font-medium text-gray-400 mb-1">
                Sort By
              </label>
              <select
                id="sort"
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FF4D67]"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="recent">Most Recent</option>
                <option value="popular">Most Popular</option>
                <option value="tracks">Most Tracks</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-6">
          <p className="text-gray-400">
            Showing {filteredPlaylists.length} of {playlists.length} playlists
          </p>
        </div>

        {/* Playlists Grid */}
        {filteredPlaylists.length === 0 ? (
          <div className="card-bg rounded-2xl p-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No playlists found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery ? 'Try adjusting your search terms' : 'Be the first to create a public playlist!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPlaylists.map((playlist) => (
              <div 
                key={playlist._id} 
                className="card-bg rounded-2xl p-4 transition-all duration-300 hover:border-[#FF4D67]/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 group cursor-pointer"
                onClick={() => handlePlayPlaylist(playlist)}
              >
                {/* Playlist Cover */}
                <div className="relative mb-4 rounded-xl overflow-hidden bg-gray-800 aspect-square">
                  {playlist.tracks.length > 0 && playlist.tracks[0]?.coverURL ? (
                    <img 
                      src={playlist.tracks[0].coverURL}
                      alt={playlist.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#FF4D67] to-[#FFCB2B] flex items-center justify-center">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
                      </svg>
                    </div>
                  )}
                  
                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Track Count Badge */}
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                    {playlist.tracks.length} tracks
                  </div>
                  
                  {/* Owner Actions - Edit and Delete buttons for user's own playlists */}
                  {user && playlist.userId._id === user.id && (
                    <div className="absolute top-2 left-2 flex gap-1">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering the playlist click
                          // Navigate to playlist edit page
                          router.push(`/playlists/${playlist._id}`);
                        }}
                        className="w-8 h-8 rounded-full bg-black/70 flex items-center justify-center hover:bg-blue-600 transition-colors"
                        aria-label="Edit playlist"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering the playlist click
                          handleDeletePlaylist(playlist._id, playlist.name);
                        }}
                        className="w-8 h-8 rounded-full bg-black/70 flex items-center justify-center hover:bg-red-600 transition-colors"
                        aria-label="Delete playlist"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                  
                  {/* Share Button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the playlist click
                      handleSharePlaylist(playlist);
                    }}
                    className="absolute top-2 right-10 w-8 h-8 rounded-full bg-black/70 flex items-center justify-center hover:bg-black/90 transition-colors"
                    aria-label="Share playlist"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                  
                  {/* View Tracks Button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the playlist click
                      setSelectedPlaylist(playlist);
                      setShowTracksModal(true);
                    }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 flex items-center justify-center hover:bg-black/90 transition-colors"
                    aria-label="View tracks"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>
                
                {/* Playlist Info */}
                <div className="mb-3">
                  <h3 className="font-bold text-white text-lg mb-1 truncate group-hover:text-[#FF4D67] transition-colors">
                    {playlist.name}
                  </h3>
                  <p className="text-gray-400 text-sm mb-2">
                    by {playlist.userId?.name || 'Unknown Creator'}
                  </p>
                  {playlist.description && (
                    <p className="text-gray-500 text-sm line-clamp-2">
                      {playlist.description}
                    </p>
                  )}
                </div>
                
                {/* Stats */}
                <div className="flex justify-between text-xs text-gray-500 pt-3 border-t border-gray-800">
                  <span>{getTotalPlays(playlist).toLocaleString()} plays</span>
                  <span>{formatDate(playlist.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Create New Playlist</h3>
              <button 
                onClick={() => {
                  setShowCreateModal(false);
                  setNewPlaylistName('');
                  setNewPlaylistDescription('');
                  setNewPlaylistPublic(true);
                }}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Playlist Name *</label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Enter playlist name"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF4D67]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                <textarea
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  placeholder="Enter playlist description"
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF4D67] resize-none"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={newPlaylistPublic}
                  onChange={(e) => setNewPlaylistPublic(e.target.checked)}
                  className="w-4 h-4 text-[#FF4D67] bg-gray-800 border-gray-700 rounded focus:ring-[#FF4D67]"
                />
                <label htmlFor="isPublic" className="ml-2 text-sm text-gray-300">
                  Make this playlist public
                </label>
              </div>
              
              {/* Selected Tracks Preview */}
              <div className="pt-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-400">Selected Tracks</label>
                  <span className="text-sm text-gray-500">{selectedTracksForNewPlaylist.length} tracks</span>
                </div>
                
                {selectedTracksForNewPlaylist.length > 0 ? (
                  <div className="max-h-32 overflow-y-auto bg-gray-800 rounded-lg p-2">
                    {selectedTracksForNewPlaylist.map((track, index) => (
                      <div key={track._id} className="flex items-center justify-between py-2 px-2 hover:bg-gray-700 rounded">
                        <div className="flex items-center">
                          <span className="text-gray-500 text-xs mr-2">{index + 1}.</span>
                          <span className="text-sm text-white truncate max-w-[160px]">{track.title}</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => toggleTrackSelection(track)}
                          className="text-red-500 hover:text-red-400 p-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No tracks selected yet
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={() => setShowTrackSelector(true)}
                  className="mt-2 w-full py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                >
                  {selectedTracksForNewPlaylist.length > 0 ? 'Add More Tracks' : 'Select Tracks'}
                </button>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewPlaylistName('');
                  setNewPlaylistDescription('');
                  setNewPlaylistPublic(true);
                  setSelectedTracksForNewPlaylist([]);
                }}
                className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createPlaylist}
                disabled={creatingPlaylist || selectedTracksForNewPlaylist.length === 0}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#FF4D67] to-[#FFCB2B] hover:opacity-90 text-white rounded-lg transition-opacity disabled:opacity-50"
              >
                {creatingPlaylist ? 'Creating...' : `Create (${selectedTracksForNewPlaylist.length} tracks)`}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Tracks Modal */}
      {showTracksModal && selectedPlaylist && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-sm sm:max-w-lg md:max-w-2xl border border-gray-800 max-h-[80vh] flex flex-col">
            <div className="p-4 sm:p-6 pb-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg sm:text-xl font-bold text-white truncate">{selectedPlaylist.name} Tracks</h3>
                <button 
                  onClick={() => {
                    setShowTracksModal(false);
                    setSelectedPlaylist(null);
                  }}
                  className="text-gray-400 hover:text-white p-1"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4">
              <div className="space-y-3">
                {selectedPlaylist.tracks.map((track, index) => (
                  <div 
                    key={track._id}
                    className="flex items-center p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-md overflow-hidden mr-3 sm:mr-4">
                      {track.coverURL ? (
                        <img 
                          src={track.coverURL} 
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#FF4D67] to-[#FFCB2B] flex items-center justify-center">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => {
                        handlePlayFromTrack(selectedPlaylist, index);
                        setShowTracksModal(false);
                        setSelectedPlaylist(null);
                      }}
                    >
                      <h4 className="font-medium text-white truncate text-sm sm:text-base">{track.title}</h4>
                      <p className="text-xs sm:text-sm text-gray-400 truncate">
                        by {selectedPlaylist.userId?.name === 'admin' || selectedPlaylist.userId?.name?.toLowerCase().includes('muzikax') ? 'MuzikaX' : track.creatorId?.name || 'MuzikaX'}
                      </p>
                    </div>
                    <div className="ml-3 sm:ml-4 text-xs text-gray-500 mr-2">
                      {index + 1}
                    </div>
                    {isAuthenticated && (
                      <button
                        onClick={() => handleAddTrackToPlaylist(track)}
                        disabled={addingTrackId === track._id}
                        className="p-2 rounded-full bg-[#FF4D67] hover:bg-[#FF4D67]/90 text-white transition-colors disabled:opacity-50"
                        title="Add to playlist"
                      >
                        {addingTrackId === track._id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
            
      {/* Track Selector Modal */}
      {showTrackSelector && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-2xl border border-gray-800 max-h-[80vh] flex flex-col">
            <div className="p-6 pb-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold text-white">Select Tracks for Playlist</h3>
                <button 
                  onClick={() => {
                    setShowTrackSelector(false);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
                    
              {/* Search Bar */}
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    value={trackSearchQuery}
                    onChange={(e) => setTrackSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchTracks()}
                    placeholder="Search tracks by title, artist..."
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF4D67]"
                  />
                  <button
                    onClick={searchTracks}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-white"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                  </button>
                </div>
              </div>
                    
              {/* Selected Tracks Summary */}
              <div className="mb-4 p-3 bg-gray-800 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Selected Tracks</span>
                  <span className="text-sm font-medium text-white">{selectedTracksForNewPlaylist.length} tracks</span>
                </div>
              </div>
            </div>
                  
            <div className="flex-1 overflow-y-auto px-6 pb-4">
              <div className="space-y-3">
                {(trackSearchQuery ? searchResults : selectedTracksForNewPlaylist).map((track) => (
                  <div 
                    key={track._id}
                    className={`flex items-center p-3 rounded-lg transition-colors ${selectedTracksForNewPlaylist.some(t => t._id === track._id) ? 'bg-[#FF4D67]/20 border border-[#FF4D67]/50' : 'bg-gray-800 hover:bg-gray-700'}`}
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-md overflow-hidden mr-3">
                      {track.coverURL ? (
                        <img 
                          src={track.coverURL} 
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#FF4D67] to-[#FFCB2B] flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white truncate">{track.title}</h4>
                      <p className="text-xs text-gray-400 truncate">
                        by {track.creatorId?.name || 'Unknown Artist'}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleTrackSelection(track)}
                      className={`p-2 rounded-full transition-colors ${selectedTracksForNewPlaylist.some(t => t._id === track._id) ? 'bg-[#FF4D67] text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                    >
                      {selectedTracksForNewPlaylist.some(t => t._id === track._id) ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>
                          
              {trackSearchQuery && searchResults.length === 0 && !searchLoading && (
                <div className="text-center py-8 text-gray-500">
                  No tracks found for "{trackSearchQuery}".
                </div>
              )}
                          
              {!trackSearchQuery && selectedTracksForNewPlaylist.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No tracks selected yet. Search and add tracks to your playlist.
                </div>
              )}
                          
              {searchLoading && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#FF4D67]"></div>
                </div>
              )}
            </div>
                  
            <div className="p-6 pt-3">
              <button
                onClick={() => {
                  setShowTrackSelector(false);
                }}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-[#FF4D67] to-[#FFCB2B] hover:opacity-90 text-white rounded-lg transition-opacity"
              >
                Done ({selectedTracksForNewPlaylist.length} tracks)
              </button>
            </div>
          </div>
        </div>
      )}
            
      {/* Add to Playlist Modal */}
      {showAddToPlaylistModal && selectedTrackToAdd && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Add to Playlist</h3>
              <button 
                onClick={() => {
                  setShowAddToPlaylistModal(false);
                  setSelectedTrackToAdd(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
                  
            <div className="mb-4">
              <p className="text-gray-300 mb-2">Select a playlist to add:</p>
              <div className="p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-10 h-10 rounded-md overflow-hidden mr-3">
                    {selectedTrackToAdd.coverURL ? (
                      <img 
                        src={selectedTrackToAdd.coverURL} 
                        alt={selectedTrackToAdd.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#FF4D67] to-[#FFCB2B] flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{selectedTrackToAdd.title}</h4>
                    <p className="text-sm text-gray-400">
                      by {selectedPlaylist?.userId?.name === 'admin' || selectedPlaylist?.userId?.name?.toLowerCase().includes('muzikax') ? 'MuzikaX' : selectedTrackToAdd.creatorId?.name || 'MuzikaX'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
                  
            <div className="space-y-3 max-h-60 overflow-y-auto mb-6">
              {playlists.filter(pl => pl.userId?._id === user?.id).length > 0 ? (
                playlists
                  .filter(pl => pl.userId?._id === user?.id)
                  .map((playlist) => (
                    <button
                      key={playlist._id}
                      onClick={() => handleConfirmAddToPlaylist(playlist._id)}
                      disabled={addingTrackId === selectedTrackToAdd._id}
                      className="w-full text-left p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium text-white">{playlist.name}</h4>
                          <p className="text-sm text-gray-400">{playlist.tracks.length} tracks</p>
                        </div>
                        {addingTrackId === selectedTrackToAdd._id && (
                          <div className="w-5 h-5 border-2 border-[#FF4D67] border-t-transparent rounded-full animate-spin"></div>
                        )}
                      </div>
                    </button>
                  ))
              ) : (
                <div className="text-center py-8">
                  <div className="mx-auto w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
                    </svg>
                  </div>
                  <p className="text-gray-400 mb-4">You don't have any playlists yet</p>
                  <button
                    onClick={() => {
                      setShowAddToPlaylistModal(false);
                      setSelectedTrackToAdd(null);
                      setShowCreateModal(true);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-[#FF4D67] to-[#FFCB2B] hover:opacity-90 text-white rounded-lg transition-opacity"
                  >
                    Create New Playlist
                  </button>
                </div>
              )}
            </div>
                  
            <button
              onClick={() => {
                setShowAddToPlaylistModal(false);
                setSelectedTrackToAdd(null);
              }}
              className="w-full px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  )
}


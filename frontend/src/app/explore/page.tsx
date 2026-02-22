'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useTrendingTracks, usePopularCreators } from '@/hooks/useTracks'
import { useAudioPlayer } from '@/contexts/AudioPlayerContext'
import { Suspense } from 'react'
import { followCreator, unfollowCreator, checkFollowStatus } from '@/services/trackService'

interface Album {
  _id: string
  id: string
  title: string
  artist: string
  coverImage?: string
  coverURL?: string
  releaseDate?: string
  tracks?: any[]
  plays: number
}

interface Playlist {
  _id: string
  id: string
  name: string
  description?: string
  userId: {
    _id: string
    name: string
  }
  tracks: any[]
  isPublic: boolean
  createdAt: string
}

interface Track {  
  _id?: string
  id: string
  title: string
  artist: string
  plays: number
  likes: number
  coverImage?: string
  coverURL?: string
  category: string
  duration?: string
  audioURL?: string
  type?: 'song' | 'beat' | 'mix'
  paymentType?: 'free' | 'paid'
  price?: number
  creatorId?: string
  creatorWhatsapp?: string
}

interface Creator {
  _id: string
  id: string
  name: string
  creatorType: string
  followersCount: number
  avatar: string
  verified?: boolean
}

// Removed duplicate categories definition - keeping only the one at the top level

// Separate component for the main content that uses useSearchParams
function ExploreContent() {
  const [activeTab, setActiveTab] = useState<'tracks' | 'beats' | 'creators' | 'albums' | 'playlists'>('tracks')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const searchParams = useSearchParams()
  const router = useRouter()
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const { tracks: trendingTracksData, loading: trendingLoading, refresh: refreshTrendingTracks } = useTrendingTracks(0); // 0 means fetch all tracks without limit

  // Handle data loading - fetch all tracks at once
  useEffect(() => {
    if (trendingTracksData.length > 0 && !trendingLoading) {
      const newTracks: Track[] = trendingTracksData.map(track => ({
        id: track._id,
        _id: track._id,
        title: track.title,
        artist: typeof track.creatorId === "object" && track.creatorId !== null
          ? (track.creatorId as any).name
          : "Unknown Artist",
        album: "",
        plays: track.plays,
        likes: track.likes,
        coverImage: track.coverURL || "",
        coverURL: track.coverURL,
        duration: "",
        category: track.type,
        type: track.type as 'song' | 'beat' | 'mix',
        paymentType: track.paymentType,
        creatorId: typeof track.creatorId === "object" && track.creatorId !== null
          ? (track.creatorId as any)._id
          : track.creatorId
      }));
      setAllTracks(newTracks);
    }
  }, [trendingTracksData, trendingLoading]);
  const { creators: popularCreatorsData, loading: creatorsLoading, refresh: refreshCreators } = usePopularCreators(20)
  const { currentTrack, isPlaying, playTrack, setCurrentPlaylist, favorites, favoritesLoading, addToFavorites, removeFromFavorites, addToQueue } = useAudioPlayer()

  // State for albums and playlists
  const [albums, setAlbums] = useState<Album[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [beats, setBeats] = useState<Track[]>([])
  const [albumsLoading, setAlbumsLoading] = useState<boolean>(true)
  const [playlistsLoading, setPlaylistsLoading] = useState<boolean>(true)
  const [beatsLoading, setBeatsLoading] = useState<boolean>(true)

  // State for tracking which tracks are favorited
  const [favoriteStatus, setFavoriteStatus] = useState<Record<string, boolean>>({});

  // State for tracking follow status for creators
  const [followStatus, setFollowStatus] = useState<Record<string, boolean>>({});

  // Define categories array
  const categories = [
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
    { id: 'ambient', name: 'Ambient' },
    { id: 'beats', name: 'Beats' },
    { id: 'mixes', name: 'Mixes' }
  ];

  // Update favorite status when favorites change or when favorites are loaded
  useEffect(() => {
    if (!favoritesLoading) {
      const status: Record<string, boolean> = {};
      favorites.forEach(track => {
        status[track.id] = true;
      });
      setFavoriteStatus(status);
    }
  }, [favorites, favoritesLoading]);

  // Fetch albums data
  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        setAlbumsLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/albums`);
        if (response.ok) {
          const data = await response.json();
          const albumsData = Array.isArray(data) ? data : (data.albums || []);
          setAlbums(albumsData.map((album: any) => ({
            _id: album._id,
            id: album._id,
            title: album.title,
            artist: album.creatorId ? 
              (typeof album.creatorId === 'object' ? album.creatorId.name : 'Unknown Artist') : 
              'Unknown Artist',
            coverImage: album.coverURL || '',
            coverURL: album.coverURL || '',
            releaseDate: album.releaseDate,
            tracks: album.tracks || [],
            plays: album.plays || 0
          })));
        }
      } catch (error) {
        console.error('Error fetching albums:', error);
      } finally {
        setAlbumsLoading(false);
      }
    };

    fetchAlbums();
  }, []);

  // Fetch playlists data
  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        setPlaylistsLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/public/playlists/recommended`);
        if (response.ok) {
          const data = await response.json();
          const playlistsData = data.popular || data.recent || [];
          setPlaylists(playlistsData.map((playlist: any) => ({
            _id: playlist._id,
            id: playlist._id,
            name: playlist.name,
            description: playlist.description || '',
            userId: playlist.userId || { _id: '', name: 'Unknown Creator' },
            tracks: playlist.tracks || [],
            isPublic: playlist.isPublic || true,
            createdAt: playlist.createdAt
          })));
        }
      } catch (error) {
        console.error('Error fetching playlists:', error);
      } finally {
        setPlaylistsLoading(false);
      }
    };

    fetchPlaylists();
  }, []);

  // Fetch beats data
  useEffect(() => {
    const fetchBeats = async () => {
      try {
        setBeatsLoading(true);
        // Fetch beats - tracks with type 'beat'
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/type?type=beat&limit=20`);
        if (response.ok) {
          const data = await response.json();
          const beatsData = Array.isArray(data) ? data : (data.tracks || []);
          
          // Filter out tracks without audio URLs
          const filteredBeatsData = beatsData.filter((beat: any) => 
            beat.audioURL && beat.audioURL.trim() !== ''
          );
          
          setBeats(filteredBeatsData.map((beat: any) => ({
            _id: beat._id,
            id: beat._id,
            title: beat.title,
            artist: typeof beat.creatorId === 'object' && beat.creatorId !== null ? 
              (beat.creatorId as any).name : 'Unknown Artist',
            plays: beat.plays || 0,
            likes: beat.likes || 0,
            coverImage: beat.coverURL || '',
            coverURL: beat.coverURL || '',
            category: beat.genre || 'afrobeat',
            duration: beat.duration || '',
            audioURL: beat.audioURL || '',
            type: beat.type || 'beat',
            paymentType: beat.paymentType || 'free',
            price: beat.price || 0,
            creatorId: typeof beat.creatorId === 'object' && beat.creatorId !== null ? 
              (beat.creatorId as any)._id : beat.creatorId,
            creatorWhatsapp: typeof beat.creatorId === 'object' && beat.creatorId !== null ? 
              (beat.creatorId as any).whatsappContact : undefined
          })));
        }
      } catch (error) {
        console.error('Error fetching beats:', error);
      } finally {
        setBeatsLoading(false);
      }
    };

    fetchBeats();
  }, []);

  // Update follow status for creators when they are loaded
  useEffect(() => {
    const loadFollowStatus = async () => {
      if (popularCreatorsData && popularCreatorsData.length > 0) {
        const status: Record<string, boolean> = {};
        
        // Check follow status for each creator
        for (const creator of popularCreatorsData) {
          try {
            const isFollowing = await checkFollowStatus(creator._id);
            status[creator._id] = isFollowing;
          } catch (error) {
            console.error(`Error checking follow status for creator ${creator._id}:`, error);
            status[creator._id] = false; // Default to not following
          }
        }
        
        setFollowStatus(status);
      }
    };
    
    loadFollowStatus();
  }, [popularCreatorsData]);

  // Listen for favorites loaded event to update favorite status
  useEffect(() => {
    const handleFavoritesLoaded = () => {
      const status: Record<string, boolean> = {};
      favorites.forEach(track => {
        status[track.id] = true;
      });
      setFavoriteStatus(status);
    };

    // Add event listener
    window.addEventListener('favoritesLoaded', handleFavoritesLoaded);

    // Clean up event listener
    return () => {
      window.removeEventListener('favoritesLoaded', handleFavoritesLoaded);
    };
  }, [favorites]);

  // Toggle favorite status for a track
  const toggleFavorite = (trackId: string, track: any) => {
    const isCurrentlyFavorite = favoriteStatus[trackId];
    
    if (isCurrentlyFavorite) {
      // Remove from favorites
      removeFromFavorites(trackId);
      // Optimistically update UI
      setFavoriteStatus(prev => ({
        ...prev,
        [trackId]: false
      }));
    } else {
      // Add to favorites
      addToFavorites({
        id: track._id,
        title: track.title,
        artist: typeof track.creatorId === 'object' && track.creatorId !== null 
          ? (track.creatorId as any).name 
          : 'Unknown Artist',
        coverImage: track.coverURL || '',
        audioUrl: track.audioURL || '',
        creatorId: typeof track.creatorId === 'object' && track.creatorId !== null 
          ? (track.creatorId as any)._id 
          : track.creatorId
      });
      // Optimistically update UI
      setFavoriteStatus(prev => ({
        ...prev,
        [trackId]: true
      }));
    }
    
    // Dispatch event to notify other components
    const event = new CustomEvent('trackUpdated', {
      detail: {
        trackId: trackId,
        isFavorite: !isCurrentlyFavorite
      }
    });
    window.dispatchEvent(event);
  };

  // Listen for track updates (when favorites are added/removed)
  useEffect(() => {
    const handleTrackUpdate = (event: CustomEvent) => {
      const detail = event.detail;
      if (detail && detail.trackId) {
        // Update favorite status if provided
        if (detail.isFavorite !== undefined) {
          setFavoriteStatus(prev => ({
            ...prev,
            [detail.trackId]: detail.isFavorite
          }));
        }
        
        // Refresh trending tracks to update like counts
        refreshTrendingTracks();
      }
    };

    // Add event listener
    window.addEventListener('trackUpdated', handleTrackUpdate as EventListener);

    // Clean up event listener
    return () => {
      window.removeEventListener('trackUpdated', handleTrackUpdate as EventListener);
    };
  }, [refreshTrendingTracks]);

  // Listen for toast notifications and forward them to player
  useEffect(() => {
    const handleShowToast = (event: CustomEvent) => {
      const { message, type } = event.detail;
      // Dispatch a custom event that the player page can listen to
      const playerToastEvent = new CustomEvent('playerToast', {
        detail: { message, type }
      });
      window.dispatchEvent(playerToastEvent);
    };

    // Add event listener
    window.addEventListener('showToast', handleShowToast as EventListener);

    // Clean up event listener
    return () => {
      window.removeEventListener('showToast', handleShowToast as EventListener);
    };
  }, []);
  
  // Get category from URL params
  const categoryParam = searchParams.get('category')
  
  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam)
    }
  }, [categoryParam])
  
  // Transform real tracks data to match existing interface
  // Note: This is now redundant since we're handling tracks in the useEffect above
  // Keeping it for backward compatibility but it's not used in the current implementation
  const existingTracks: Track[] = [];

  // Transform real creators data to match existing interface
  const allCreators: Creator[] = popularCreatorsData.map(creator => ({
    _id: creator._id,
    id: creator._id || 'unknown',
    name: creator.name,
    creatorType: creator.creatorType || 'artist',
    followersCount: creator.followersCount || 0,
    avatar: creator.avatar || 'https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    verified: true // Assuming all creators from backend are verified for now
  }))

  // Filter tracks based on selected category and search term
  const filteredTracks = allTracks.filter(track => {
    // Apply category filter if selected
    const categoryMatch = selectedCategory ? track.category === selectedCategory : true;
    
    // Apply search filter if search term exists
    const searchMatch = searchTerm 
      ? track.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        track.artist.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    
    return categoryMatch && searchMatch;
  });

  // Filter creators based on search term
  const filteredCreators = allCreators.filter(creator => {
    return searchTerm 
      ? creator.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        creator.creatorType.toLowerCase().includes(searchTerm.toLowerCase())
      : true; // Show all creators if no search term
  });

  const handleCategoryClick = (categoryId: string) => {
    if (selectedCategory === categoryId || (categoryId === '' && selectedCategory === null)) {
      // If clicking the same category or clicking 'All Categories' when already showing all
      setSelectedCategory(null)
      router.push('/explore')
    } else {
      // Set the new category filter
      if (categoryId === '') {
        setSelectedCategory(null)
        router.push('/explore')
      } else {
        setSelectedCategory(categoryId)
        router.push(`/explore?category=${categoryId}`)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black">
      {/* Hero Section */}
      <div className="relative py-8 sm:py-12 lg:py-16 overflow-hidden">
        {/* Background image with gradient overlay */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80)' }}></div>
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-gray-900/60"></div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#FF4D67]/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#FFCB2B]/10 rounded-full blur-3xl -z-10"></div>
        
        <div className="container mx-auto px-4 sm:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#FF4D67] to-[#FFCB2B] mb-3 sm:mb-4">
              Explore Rwandan Music
            </h1>
            <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto mb-6 sm:mb-8">
              Discover trending tracks and talented creators from Rwanda's vibrant music scene
            </p>
            
            <div className="relative max-w-xl mx-auto">
              <input
                type="text"
                placeholder="Search tracks, artists, albums..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2.5 sm:py-3 px-4 sm:px-6 pl-10 sm:pl-12 bg-gray-800/70 backdrop-blur-sm border border-gray-700/50 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF4D67] focus:border-transparent transition-all text-sm sm:text-base shadow-lg"
              />
              <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="container mx-auto px-4 sm:px-8 py-4">
        <div className="flex flex-wrap gap-1.5 xs:gap-2 justify-center max-w-full overflow-x-auto pb-2">
          <button
            className={`px-2.5 py-1.5 xs:px-3 xs:py-2 rounded-full text-xs xs:text-sm font-medium transition-colors flex-shrink-0 ${
              selectedCategory === null
                ? 'bg-gradient-to-r from-[#FF4D67] to-[#FF6B8B] text-white shadow-lg shadow-[#FF4D67]/20'
                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50'
            }`}
            onClick={() => handleCategoryClick('')}
          >
            All
          </button>
          
          {categories.slice(0, 5).map((category) => (
            <button
              key={category.id}
              className={`px-2.5 py-1.5 xs:px-3 xs:py-2 rounded-full text-xs xs:text-sm font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-[#FFCB2B] to-[#FFA726] text-gray-900 shadow-lg shadow-[#FFCB2B]/30 scale-105 ring-2 ring-[#FFCB2B]/40'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50 hover:scale-105 hover:text-white hover:shadow-md'
              }`}
              onClick={() => handleCategoryClick(category.id)}
            >
              {category.name}
            </button>
          ))}
          
          {/* More genres dropdown */}
          <div className="flex items-center flex-shrink-0 relative">
            <details className="group">
              <summary className="px-2.5 py-1.5 xs:px-3 xs:py-2 rounded-full text-xs xs:text-sm font-medium bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50 cursor-pointer list-none flex items-center gap-1">
                <span>More</span>
                <svg className="w-3 h-3 ml-1 transition-transform duration-300 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </summary>
              <div className="fixed z-50 inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8" onClick={(e) => e.stopPropagation()}>
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl shadow-[#FF4D67]/50 border border-gray-700/50 max-h-[80vh] w-full max-w-md overflow-hidden">
                  <div className="p-4 border-b border-gray-700/50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">More Genres</h3>
                    <button 
                      onClick={() => {
                        const details = document.querySelector('details');
                        if (details) details.removeAttribute('open');
                      }}
                      className="text-gray-400 hover:text-white"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>
                  <div className="p-4 max-h-[60vh] overflow-y-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {categories.slice(5).map((category) => (
                        <button
                          key={category.id}
                          className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                            selectedCategory === category.id
                              ? 'bg-gradient-to-r from-[#FFCB2B] to-[#FFA726] text-gray-900 shadow-lg shadow-[#FFCB2B]/20'
                              : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                          }`}
                          onClick={() => {
                            handleCategoryClick(category.id);
                            // Close the dropdown
                            const details = document.querySelector('details');
                            if (details) details.removeAttribute('open');
                          }}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="container mx-auto px-4 sm:px-8 py-8 sm:py-12 md:py-16 pb-32 flex-1">
        <div className="flex border-b border-gray-800 mb-8 sm:mb-10">
          <button
            className={`py-3 px-4 sm:px-6 font-medium text-sm sm:text-base transition-colors ${
              activeTab === 'tracks'
                ? 'text-[#FF4D67] border-b-2 border-[#FF4D67]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('tracks')}
          >
            Trending Tracks
          </button>
          <button
            className={`py-3 px-4 sm:px-6 font-medium text-sm sm:text-base transition-colors ${
              activeTab === 'beats'
                ? 'text-[#FF4D67] border-b-2 border-[#FF4D67]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('beats')}
          >
            Beats
          </button>
          <button
            className={`py-3 px-4 sm:px-6 font-medium text-sm sm:text-base transition-colors ${
              activeTab === 'albums'
                ? 'text-[#FF4D67] border-b-2 border-[#FF4D67]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('albums')}
          >
            Albums
          </button>
          <button
            className={`py-3 px-4 sm:px-6 font-medium text-sm sm:text-base transition-colors ${
              activeTab === 'playlists'
                ? 'text-[#FF4D67] border-b-2 border-[#FF4D67]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('playlists')}
          >
            Playlists
          </button>
          <button
            className={`py-3 px-4 sm:px-6 font-medium text-sm sm:text-base transition-colors ${
              activeTab === 'creators'
                ? 'text-[#FFCB2B] border-b-2 border-[#FFCB2B]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('creators')}
          >
            Top Creators
          </button>
        </div>

        {/* Beats Grid */}
        {activeTab === 'beats' && (
          <>
            {beatsLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-white">Loading beats...</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 xs:gap-4 sm:gap-5 md:gap-6 lg:gap-8">
                {beats.map((beat) => (
                  <div key={`beat-${beat.id}`} className="group card-bg rounded-lg xs:rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300 hover:border-[#FF4D67]/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-[#FF4D67]/10">
                    <div className="relative">
                      <img 
                        src={beat.coverImage || beat.coverURL || '/placeholder-track.png'} 
                        alt={beat.title} 
                        className="w-full aspect-square sm:h-48 md:h-56 object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-track.png';
                        }}
                      />
                      {/* Beat indicator badge */}
                      <div className="absolute top-3 left-3">
                        <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                          BEAT
                        </span>
                      </div>
                      {/* Payment type indicator */}
                      <div className="absolute top-3 right-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${beat.paymentType === 'paid' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
                          {beat.paymentType === 'paid' ? 'PAID' : 'FREE'}
                        </span>
                      </div>
                      {beat.paymentType === 'paid' && beat.price && (
                        <div className="absolute top-10 right-3">
                          <span className="px-2 py-1 text-xs rounded-full bg-yellow-600 text-white">
                            {beat.price.toLocaleString()} RWF
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={() => {
                            // Play the beat
                            if (beat.audioURL) {
                              playTrack({
                                id: beat.id,
                                title: beat.title,
                                artist: beat.artist,
                                coverImage: beat.coverImage || beat.coverURL || '/placeholder-track.png',
                                audioUrl: beat.audioURL,
                                plays: beat.plays || 0,
                                likes: beat.likes || 0,
                                creatorId: beat.creatorId,
                                type: beat.type,
                                paymentType: beat.paymentType,
                                price: beat.price,
                                creatorWhatsapp: beat.creatorWhatsapp
                              });
                              
                              // Set playlist to all beats
                              const beatTracks = beats
                                .filter(b => b.audioURL)
                                .map(b => ({
                                  id: b.id,
                                  title: b.title,
                                  artist: b.artist,
                                  coverImage: b.coverImage || b.coverURL || '/placeholder-track.png',
                                  audioUrl: b.audioURL || '',
                                  plays: b.plays || 0,
                                  likes: b.likes || 0,
                                  creatorId: b.creatorId,
                                  type: b.type,
                                  paymentType: b.paymentType,
                                  price: b.price,
                                  creatorWhatsapp: b.creatorWhatsapp
                                }));
                              setCurrentPlaylist(beatTracks);
                              
                              // Add all beats to queue
                              beatTracks.forEach((track: any) => {
                                try {
                                  addToQueue({
                                    id: track.id,
                                    title: track.title,
                                    artist: track.artist,
                                    coverImage: track.coverImage,
                                    audioUrl: track.audioUrl,
                                    plays: track.plays,
                                    likes: track.likes,
                                    creatorId: track.creatorId,
                                    type: track.type,
                                    paymentType: track.paymentType,
                                    price: track.price,
                                    creatorWhatsapp: track.creatorWhatsapp
                                  });
                                } catch (error) {
                                  console.error('Error adding beat to queue:', error);
                                }
                              });
                              
                              // Show success notification
                              const toastEvent = new CustomEvent('showToast', {
                                detail: {
                                  message: `Added ${beatTracks.length} beats to queue!`,
                                  type: 'success'
                                }
                              });
                              window.dispatchEvent(toastEvent);
                            }
                          }}
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#FF4D67] flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg hover:bg-[#ff2a4d] hover:scale-105">
                          <svg className="w-6 h-6 sm:w-7 sm:h-7 ml-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                          </svg>
                        </button>
                      </div>
                      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex flex-col gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(beat.id, beat);
                          }}
                          className="p-2 sm:p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-black/60 shadow-md"
                        >
                          <svg 
                            className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300 ${favoriteStatus[beat.id] ? 'text-red-500 fill-current scale-110' : 'stroke-current'}`}
                            fill={favoriteStatus[beat.id] ? "currentColor" : "none"}
                            stroke="currentColor"
                            strokeWidth="1.5"
                            viewBox="0 0 24 24" 
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4 4 0 000 6.364L12 20.364l7.682-7.682a4 4 0 00-6.364-6.364L12 7.636l-1.318-1.318a4 4 0 000-5.656z"></path>
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            try {
                              addToQueue({
                                id: beat.id,
                                title: beat.title,
                                artist: beat.artist,
                                coverImage: beat.coverImage || beat.coverURL || '/placeholder-track.png',
                                audioUrl: beat.audioURL || '',
                                duration: undefined,
                                creatorId: beat.creatorId,
                                type: beat.type,
                                paymentType: beat.paymentType,
                                price: beat.price,
                                creatorWhatsapp: beat.creatorWhatsapp
                              });
                              const toastEvent = new CustomEvent('showToast', {
                                detail: {
                                  message: `Added ${beat.title} to queue!`,
                                  type: 'success'
                                }
                              });
                              window.dispatchEvent(toastEvent);
                            } catch (error) {
                              console.error('Error adding beat to queue:', error);
                              const toastEvent = new CustomEvent('showToast', {
                                detail: {
                                  message: `Failed to add ${beat.title} to queue`,
                                  type: 'error'
                                }
                              });
                              window.dispatchEvent(toastEvent);
                            }
                          }}
                          className="p-2 sm:p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-black/60 shadow-md"
                          title={`Add ${beat.title} to queue`}
                        >
                          <svg 
                            className="w-5 h-5 sm:w-6 sm:h-6"
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24" 
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-3 xs:p-4 sm:p-5">
                      <h3 className="font-bold text-white text-xs xs:text-sm sm:text-lg mb-1 truncate">{beat.title}</h3>
                      <p className="text-gray-400 text-xs xs:text-sm sm:text-base mb-2 xs:mb-3 sm:mb-4">{beat.artist}</p>
                      
                      <div className="flex justify-between text-xs sm:text-sm text-gray-500">
                        <span className="text-xs">{beat.plays.toLocaleString()} plays</span>
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path>
                          </svg>
                          <span className="text-xs">{beat.likes}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Albums Grid */}
        {activeTab === 'albums' && (
          <>
            {albumsLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-white">Loading albums...</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 xs:gap-4 sm:gap-5 md:gap-6 lg:gap-8">
                {albums.map((album) => (
                  <div key={`album-${album.id}`} className="group card-bg rounded-lg xs:rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300 hover:border-[#FF4D67]/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-[#FF4D67]/10">
                    <div className="relative">
                      <img 
                        src={album.coverImage || album.coverURL || '/placeholder-album.png'} 
                        alt={album.title} 
                        className="w-full aspect-square sm:h-48 md:h-56 object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-album.png';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={() => {
                            // Play first track from album if available
                            if (album.tracks && album.tracks.length > 0) {
                              const firstTrack = album.tracks[0];
                              if (firstTrack.audioURL) {
                                playTrack({
                                  id: firstTrack._id || firstTrack.id,
                                  title: firstTrack.title,
                                  artist: album.artist,
                                  coverImage: album.coverImage || album.coverURL || '/placeholder-album.png',
                                  audioUrl: firstTrack.audioURL,
                                  plays: firstTrack.plays || 0,
                                  likes: firstTrack.likes || 0,
                                  creatorId: typeof firstTrack.creatorId === 'object' && firstTrack.creatorId !== null ? (firstTrack.creatorId as any)._id : firstTrack.creatorId,
                                });
                                
                                // Set playlist to all tracks in album
                                const albumTracks = album.tracks
                                  .filter((t: any) => t.audioURL)
                                  .map((t: any) => ({
                                    id: t._id || t.id || 'unknown',
                                    title: t.title,
                                    artist: album.artist,
                                    coverImage: album.coverImage || album.coverURL || '/placeholder-album.png',
                                    audioUrl: t.audioURL,
                                    plays: t.plays || 0,
                                    likes: t.likes || 0,
                                    creatorId: typeof t.creatorId === 'object' && t.creatorId !== null ? (t.creatorId as any)._id : t.creatorId,
                                  }));
                                setCurrentPlaylist(albumTracks);
                                
                                // Add all tracks to queue
                                albumTracks.forEach((track: any) => {
                                  try {
                                    addToQueue({
                                      id: track.id,
                                      title: track.title,
                                      artist: track.artist,
                                      coverImage: track.coverImage,
                                      audioUrl: track.audioUrl,
                                      plays: track.plays,
                                      likes: track.likes,
                                      creatorId: track.creatorId,
                                    });
                                  } catch (error) {
                                    console.error('Error adding track to queue:', error);
                                  }
                                });
                                
                                // Show success notification
                                const toastEvent = new CustomEvent('showToast', {
                                  detail: {
                                    message: `Added ${albumTracks.length} tracks from "${album.title}" to queue!`,
                                    type: 'success'
                                  }
                                });
                                window.dispatchEvent(toastEvent);
                              }
                            }
                          }}
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#FF4D67] flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg hover:bg-[#ff2a4d] hover:scale-105">
                          <svg className="w-6 h-6 sm:w-7 sm:h-7 ml-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-3 xs:p-4 sm:p-5">
                      <h3 className="font-bold text-white text-xs xs:text-sm sm:text-lg mb-1 truncate">{album.title}</h3>
                      <p className="text-gray-400 text-xs xs:text-sm sm:text-base mb-2 xs:mb-3 sm:mb-4">{album.artist}</p>
                      
                      <div className="flex justify-between text-xs sm:text-sm text-gray-500">
                        <span className="text-xs">{album.tracks?.length || 0} tracks</span>
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path>
                          </svg>
                          <span className="text-xs">{album.plays}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Playlists Grid */}
        {activeTab === 'playlists' && (
          <>
            {playlistsLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-white">Loading playlists...</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 xs:gap-4 sm:gap-5 md:gap-6 lg:gap-8">
                {playlists.map((playlist) => (
                  <div key={`playlist-${playlist.id}`} className="group card-bg rounded-lg xs:rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300 hover:border-[#FF4D67]/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-[#FF4D67]/10">
                    <div className="relative">
                      <img 
                        src={playlist.tracks && playlist.tracks.length > 0 ? 
                          (playlist.tracks[0].coverURL || '/placeholder-playlist.png') : 
                          '/placeholder-playlist.png'} 
                        alt={playlist.name} 
                        className="w-full aspect-square sm:h-48 md:h-56 object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-playlist.png';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={() => {
                            // Play first track from playlist if available
                            if (playlist.tracks && playlist.tracks.length > 0) {
                              const playableTracks = playlist.tracks.filter((t: any) => t.audioURL);
                              if (playableTracks.length > 0) {
                                const firstTrack = playableTracks[0];
                                playTrack({
                                  id: firstTrack._id || firstTrack.id,
                                  title: firstTrack.title,
                                  artist: typeof firstTrack.creatorId === 'object' && firstTrack.creatorId !== null ? 
                                    (firstTrack.creatorId as any).name : 'Unknown Artist',
                                  coverImage: firstTrack.coverURL || '/placeholder-playlist.png',
                                  audioUrl: firstTrack.audioURL,
                                  plays: firstTrack.plays || 0,
                                  likes: firstTrack.likes || 0,
                                  creatorId: typeof firstTrack.creatorId === 'object' && firstTrack.creatorId !== null ? 
                                    (firstTrack.creatorId as any)._id : firstTrack.creatorId,
                                });
                                
                                // Set playlist to all playable tracks
                                const formattedTracks = playableTracks.map((t: any) => ({
                                  id: t._id || t.id || 'unknown',
                                  title: t.title,
                                  artist: typeof t.creatorId === 'object' && t.creatorId !== null ? 
                                    (t.creatorId as any).name : 'Unknown Artist',
                                  coverImage: t.coverURL || '/placeholder-playlist.png',
                                  audioUrl: t.audioURL,
                                  plays: t.plays || 0,
                                  likes: t.likes || 0,
                                  creatorId: typeof t.creatorId === 'object' && t.creatorId !== null ? 
                                    (t.creatorId as any)._id : t.creatorId,
                                }));
                                setCurrentPlaylist(formattedTracks);
                                
                                // Add all tracks to queue
                                formattedTracks.forEach((track: any) => {
                                  try {
                                    addToQueue({
                                      id: track.id,
                                      title: track.title,
                                      artist: track.artist,
                                      coverImage: track.coverImage,
                                      audioUrl: track.audioUrl,
                                      plays: track.plays,
                                      likes: track.likes,
                                      creatorId: track.creatorId,
                                    });
                                  } catch (error) {
                                    console.error('Error adding track to queue:', error);
                                  }
                                });
                                
                                // Show success notification
                                const toastEvent = new CustomEvent('showToast', {
                                  detail: {
                                    message: `Added ${formattedTracks.length} tracks from "${playlist.name}" to queue!`,
                                    type: 'success'
                                  }
                                });
                                window.dispatchEvent(toastEvent);
                              }
                            }
                          }}
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#FF4D67] flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg hover:bg-[#ff2a4d] hover:scale-105">
                          <svg className="w-6 h-6 sm:w-7 sm:h-7 ml-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-3 xs:p-4 sm:p-5">
                      <h3 className="font-bold text-white text-xs xs:text-sm sm:text-lg mb-1 truncate">{playlist.name}</h3>
                      <p className="text-gray-400 text-xs xs:text-sm sm:text-base mb-2 xs:mb-3 sm:mb-4">
                        {playlist.description ? `${playlist.description.substring(0, 60)}...` : 'Playlist'}
                      </p>
                      <p className="text-gray-500 text-xs mb-2 xs:mb-3">by {playlist.userId?.name || 'Unknown Creator'}</p>
                      
                      <div className="flex justify-between text-xs sm:text-sm text-gray-500">
                        <span>{playlist.tracks?.length || 0} tracks</span>
                        <span className="capitalize">{playlist.isPublic ? 'Public' : 'Private'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Tracks Grid */}
        {activeTab === 'tracks' && (
          <>
            {trendingLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-white">Loading tracks...</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 xs:gap-4 sm:gap-5 md:gap-6 lg:gap-8">
                {filteredTracks.map((track) => (
                  <div key={`track-${track.id}`} className="group card-bg rounded-lg xs:rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300 hover:border-[#FF4D67]/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-[#FF4D67]/10">
                    <div className="relative">
                      <img 
                        src={track.coverImage || track.coverURL || '/placeholder-track.png'} 
                        alt={track.title} 
                        className="w-full aspect-square sm:h-48 md:h-56 object-cover"
                        onError={(e) => {
                          // Handle broken images gracefully
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-track.png';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={() => {
                            // Find the full track object to get the audioURL
                            const fullTrack = trendingTracksData.find(t => t._id === track._id);
                            if (fullTrack && fullTrack.audioURL) {
                              playTrack({
                                id: track.id,
                                title: track.title,
                                artist: track.artist,
                                coverImage: track.coverImage || track.coverURL || '/placeholder-track.png',
                                audioUrl: fullTrack.audioURL,
                                plays: fullTrack.plays || 0,
                                likes: fullTrack.likes || 0,
                                creatorId: typeof fullTrack.creatorId === 'object' && fullTrack.creatorId !== null ? (fullTrack.creatorId as any)._id : fullTrack.creatorId,
                                type: fullTrack.type, // Include track type for WhatsApp functionality
                                creatorWhatsapp: (typeof fullTrack.creatorId === 'object' && fullTrack.creatorId !== null 
                                  ? (fullTrack.creatorId as any).whatsappContact 
                                  : undefined) // Include creator's WhatsApp contact
                              });
                              
                              // Set the current playlist to all trending tracks
                              const playlistTracks = trendingTracksData
                                .filter(t => t.audioURL) // Only tracks with audio
                                .map(t => ({
                                  id: t._id || 'unknown',
                                  title: t.title,
                                  artist: typeof t.creatorId === 'object' && t.creatorId !== null ? (t.creatorId as any).name : 'Unknown Artist',
                                  coverImage: t.coverURL || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
                                  audioUrl: t.audioURL,
                                  plays: t.plays || 0,
                                  likes: t.likes || 0,
                                  creatorId: typeof t.creatorId === 'object' && t.creatorId !== null ? (t.creatorId as any)._id : t.creatorId,
                                  type: t.type, // Include track type for WhatsApp functionality
                                  creatorWhatsapp: (typeof t.creatorId === 'object' && t.creatorId !== null 
                                    ? (t.creatorId as any).whatsappContact 
                                    : undefined) // Include creator's WhatsApp contact
                                }));
                              setCurrentPlaylist(playlistTracks);
                            }
                          }}
                          className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 rounded-full bg-[#FF4D67] flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg hover:bg-[#ff2a4d] hover:scale-105">
                          {currentTrack?.id === track.id && isPlaying ? (
                            <svg className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path>
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 ml-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                            </svg>
                          )}
                        </button>
                      </div>
                      <div className="absolute top-2 right-2 xs:top-3 xs:right-3 sm:top-4 sm:right-4 flex flex-col gap-1.5 xs:gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const fullTrack = trendingTracksData.find(t => t._id === track._id);
                            if (fullTrack) {
                              toggleFavorite(track.id, fullTrack);
                            }
                          }}
                          className="p-1.5 xs:p-2 sm:p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-black/60 shadow-md"
                        >
                          <svg 
                            className={`w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 transition-all duration-300 ${favoriteStatus[track.id] ? 'text-red-500 fill-current scale-110' : 'stroke-current'}`}
                            fill={favoriteStatus[track.id] ? "currentColor" : "none"}
                            stroke="currentColor"
                            strokeWidth="1.5"
                            viewBox="0 0 24 24" 
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4 4 0 000 6.364L12 20.364l7.682-7.682a4 4 0 00-6.364-6.364L12 7.636l-1.318-1.318a4 4 0 000-5.656z"></path>
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const fullTrack = trendingTracksData.find(t => t._id === track._id);
                            if (fullTrack && fullTrack.audioURL) {
                              try {
                                addToQueue({
                                  id: track._id || track.id || 'unknown',
                                  title: track.title,
                                  artist: track.artist,
                                  coverImage: track.coverImage || track.coverURL || '/placeholder-track.png',
                                  audioUrl: fullTrack.audioURL,
                                  duration: fullTrack.duration ? (fullTrack.duration.includes(':') ? 
                                    (() => {
                                      const [mins, secs] = fullTrack.duration.split(':').map(Number);
                                      return mins * 60 + secs;
                                    })() : Number(fullTrack.duration)
                                  ) : undefined,
                                  creatorId: typeof fullTrack.creatorId === 'object' && fullTrack.creatorId !== null ? (fullTrack.creatorId as any)._id : fullTrack.creatorId,
                                  type: fullTrack.type,
                                  creatorWhatsapp: (typeof fullTrack.creatorId === 'object' && fullTrack.creatorId !== null 
                                    ? (fullTrack.creatorId as any).whatsappContact 
                                    : undefined)
                                });
                                const toastEvent = new CustomEvent('showToast', {
                                  detail: {
                                    message: `Added ${track.title} to queue!`,
                                    type: 'success'
                                  }
                                });
                                window.dispatchEvent(toastEvent);
                              } catch (error) {
                                console.error('Error adding to queue:', error);
                                const toastEvent = new CustomEvent('showToast', {
                                  detail: {
                                    message: `Failed to add ${track.title} to queue`,
                                    type: 'error'
                                  }
                                });
                                window.dispatchEvent(toastEvent);
                              }
                            } else {
                              const toastEvent = new CustomEvent('showToast', {
                                detail: {
                                  message: `Cannot add ${track.title} to queue - audio not available`,
                                  type: 'error'
                                }
                              });
                              window.dispatchEvent(toastEvent);
                            }
                          }}
                          className="p-1.5 xs:p-2 sm:p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-black/60 shadow-md"
                          title={`Add ${track.title} to queue`}
                        >
                          <svg 
                            className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6"
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24" 
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-3 xs:p-4 sm:p-5">
                      <h3 className="font-bold text-white text-xs xs:text-sm sm:text-lg mb-1 truncate">{track.title}</h3>
                      <p className="text-gray-400 text-xs xs:text-sm sm:text-base mb-2 xs:mb-3 sm:mb-4">{track.artist}</p>
                      
                      <div className="flex justify-between text-xs sm:text-sm text-gray-500">
                        <span>{track.plays.toLocaleString()} plays</span>
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path>
                          </svg>
                          <span>{track.likes}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            
            )}
          </>
        )}

        {/* Creators Grid */}
        {activeTab === 'creators' && (
          <>
            {creatorsLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-white">Loading creators...</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 xs:gap-4 sm:gap-5 md:gap-6">
                {filteredCreators.map((creator) => (
                  <div key={`creator-${creator._id || creator.id}`} className="group card-bg rounded-lg xs:rounded-xl sm:rounded-2xl p-3 xs:p-4 sm:p-5 md:p-6 transition-all duration-300 hover:border-[#FFCB2B]/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-[#FFCB2B]/10 cursor-pointer"
                    onClick={() => {
                      router.push(`/artists/${creator._id || creator.id}`);
                    }}>
                    <div className="flex flex-col items-center text-center mb-3 xs:mb-4">
                      <div className="relative mb-2 xs:mb-3">
                        <img 
                          src={creator.avatar} 
                          alt={creator.name} 
                          className="w-14 h-14 xs:w-16 xs:h-16 rounded-full object-cover"
                        />
                        {creator.verified && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 xs:w-6 xs:h-6 bg-[#FF4D67] rounded-full flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 xs:w-3 xs:h-3 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                            </svg>
                          </div>
                        )}
                      </div>
                      <h3 className="font-bold text-white text-xs xs:text-sm sm:text-base truncate w-full">{creator.name}</h3>
                      <p className="text-gray-400 text-xs sm:text-sm mb-1 xs:mb-2">{creator.creatorType}</p>
                    </div>
                    
                    <div className="flex justify-center text-xs xs:text-sm text-gray-500 mb-2 xs:mb-3">
                      <span>{creator.followersCount.toLocaleString()} followers</span>
                    </div>
                    
                    <button 
                      className={`w-full py-2 xs:py-2.5 sm:py-3 rounded-lg font-bold hover:opacity-90 transition-all duration-300 text-xs xs:text-sm sm:text-base shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${followStatus[creator._id || creator.id || ''] ? 'bg-gray-600 text-white' : 'bg-gradient-to-r from-[#FFCB2B] to-[#FFA726] text-gray-900'}`}
                      onClick={async (e) => {
                        e.stopPropagation();
                        const creatorId = creator._id || creator.id;
                        if (!creatorId) {
                          alert('Creator ID not found');
                          return;
                        }
                        try {
                          const currentFollowStatus = followStatus[creatorId];
                          if (currentFollowStatus) {
                            await unfollowCreator(creatorId);
                            
                            setFollowStatus(prev => ({
                              ...prev,
                              [creatorId]: false
                            }));
                          } else {
                            await followCreator(creatorId);
                            
                            setFollowStatus(prev => ({
                              ...prev,
                              [creatorId]: true
                            }));
                          }
                          
                          console.log(`Successfully ${currentFollowStatus ? 'unfollowed' : 'followed'} creator`);
                          
                          refreshCreators();
                        } catch (error) {
                          console.error(`Failed to ${followStatus[creatorId] ? 'unfollow' : 'follow'} creator:`, error);
                          alert(`Failed to ${followStatus[creatorId] ? 'unfollow' : 'follow'} creator. Please try again.`);
                        }
                      }}
                    >
                      {followStatus[creator._id || creator.id || ''] ? 'Following' : 'Follow'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function Explore() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ExploreContent />
    </Suspense>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useTrendingTracks, usePopularCreators } from '../../hooks/useTracks'
import { useAudioPlayer } from '../../contexts/AudioPlayerContext'
interface Track {
  id: string
  title: string
  artist: string
  album?: string
  plays: number
  likes: number
  coverImage: string
  duration?: string
  type?: 'song' | 'beat' | 'mix';
  category?: string;
  paymentType?: 'free' | 'paid';
  _id?: string;
}

export default function TracksPage() {
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'alphabetical'>('popular')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedPaymentType, setSelectedPaymentType] = useState<'all' | 'free' | 'paid'>('all')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const { tracks: trendingTracksData, loading: trendingLoading, refresh: refreshTrendingTracks } = useTrendingTracks(0); // 0 means no limit
  const { creators: popularCreatorsData, loading: creatorsLoading } = usePopularCreators(10)
  const { currentTrack, isPlaying, playTrack, setCurrentPlaylist, favorites, favoritesLoading, addToFavorites, removeFromFavorites, addToQueue } = useAudioPlayer()
  // State for tracking which tracks are favorited
  const [favoriteStatus, setFavoriteStatus] = useState<Record<string, boolean>>({});

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
    if (favoriteStatus[trackId]) {
      // Remove from favorites
      removeFromFavorites(trackId);
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
    }
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

  // Transform real tracks data to match existing interface (excluding beats)
  const trendingTracks: Track[] = trendingTracksData
    .filter(track => track.type !== 'beat') // Exclude beats from tracks page
    .map(track => ({
    id: track._id,
    _id: track._id,
    title: track.title,
    artist: typeof track.creatorId === 'object' && track.creatorId !== null ? (track.creatorId as any).name : 'Unknown Artist',
    album: '',
    plays: track.plays,
    likes: track.likes,
    coverImage: track.coverURL || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    duration: '',
    type: track.type,
    category: track.genre,
    paymentType: track.paymentType
  }));

  // Transform creators data to match existing interface
  const popularCreators: any[] = popularCreatorsData.map(creator => ({
    id: creator._id,
    name: creator.name,
    type: creator.creatorType || 'Artist',
    followers: creator.followersCount || 0,
    avatar: creator.avatar || 'https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    verified: true // For now, we'll assume all creators are verified
  }));
  // Filter tracks based on category, payment type, and search
  const filteredTracks = trendingTracks.filter(track => {
    // Category filter
    const categoryMatch = selectedCategory ? track.category === selectedCategory : true;
    
    // Payment type filter
    const paymentMatch = selectedPaymentType === 'all' 
      ? true 
      : (track.paymentType || 'free') === selectedPaymentType;
    
    // Search filter
    const searchMatch = searchTerm 
      ? track.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        track.artist.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    
    return categoryMatch && paymentMatch && searchMatch;
  });

  // Sort tracks based on selected option
  const sortedTracks = [...filteredTracks].sort((a, b) => {
    if (sortBy === 'popular') {
      return b.plays - a.plays
    } else if (sortBy === 'recent') {
      return (parseInt(b._id || b.id) || 0) - (parseInt(a._id || a.id) || 0)
    } else {
      return a.title.localeCompare(b.title)
    }
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black">
      {/* Hero Section */}
      <div className="relative py-8 sm:py-12 lg:py-16 overflow-hidden">
        {/* Background image with gradient overlay */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80)' }}></div>
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-gray-900/60"></div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#FF4D67]/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#FFCB2B]/10 rounded-full blur-3xl -z-10"></div>
        
        <div className="container mx-auto px-4 sm:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#FF4D67] to-[#FFCB2B] mb-3 sm:mb-4">
              All Tracks
            </h1>
            <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto mb-6 sm:mb-8">
              Browse all tracks across different categories and genres
            </p>
            
            <div className="relative max-w-xl mx-auto">
              <input
                type="text"
                placeholder="Search tracks, artists..."
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

      {/* Filter Section */}
      <div className="container mx-auto px-4 sm:px-8 py-6">
        {/* Genre/Category Filters */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-white mb-4 text-center">Filter by Genre</h2>
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                selectedCategory === null
                  ? 'bg-[#FFCB2B] text-gray-900'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => setSelectedCategory(null)}
            >
              All Genres
            </button>
            
            {genres.slice(0, 8).map((genre) => (
              <button
                key={genre.id}
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                  selectedCategory === genre.id
                    ? 'bg-[#FFCB2B] text-gray-900'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
                onClick={() => setSelectedCategory(genre.id)}
              >
                {genre.name}
              </button>
            ))}
          </div>
          
          {/* More genres dropdown */}
          <div className="mt-3 flex justify-center">
            <details className="group relative">
              <summary className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 cursor-pointer list-none">
                More Genres
              </summary>
              <div className="absolute z-10 mt-2 p-2 bg-gray-800 rounded-lg shadow-lg grid grid-cols-2 sm:grid-cols-3 gap-2 w-64">
                {genres.slice(8).map((genre) => (
                  <button
                    key={genre.id}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      selectedCategory === genre.id
                        ? 'bg-[#FFCB2B] text-gray-900'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    onClick={() => {
                      setSelectedCategory(genre.id);
                      const details = document.querySelector('details');
                      if (details) details.removeAttribute('open');
                    }}
                  >
                    {genre.name}
                  </button>
                ))}
              </div>
            </details>
          </div>
        </div>

        {/* Payment Type Filters */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-white mb-4 text-center">Filter by Type</h2>
          <div className="flex flex-wrap gap-2 justify-center">
            <button 
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedPaymentType === 'all' 
                  ? 'bg-[#FF4D67] text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => setSelectedPaymentType('all')}
            >
              All Tracks
            </button>
            <button 
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedPaymentType === 'free' 
                  ? 'bg-[#FF4D67] text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => setSelectedPaymentType('free')}
            >
              Free
            </button>
            <button 
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedPaymentType === 'paid' 
                  ? 'bg-[#FF4D67] text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => setSelectedPaymentType('paid')}
            >
              Paid
            </button>
          </div>
        </div>
        
        {/* Sort and Results Info */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-gray-400 text-sm">
            Showing {sortedTracks.length} of {trendingTracks.length} tracks
            {selectedCategory && ` • ${genres.find(g => g.id === selectedCategory)?.name}`}
            {selectedPaymentType !== 'all' && ` • ${selectedPaymentType.charAt(0).toUpperCase() + selectedPaymentType.slice(1)}`}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Sort by:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-gray-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D67]"
            >
              <option value="popular">Most Popular</option>
              <option value="recent">Most Recent</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tracks Grid */}
      <div className="container mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {trendingLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-white">Loading tracks...</div>
          </div>
        ) : sortedTracks.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 className="mt-4 text-lg font-medium text-white">No tracks found</h3>
            <p className="mt-2 text-gray-400">
              {selectedCategory || selectedPaymentType !== 'all' || searchTerm
                ? 'No tracks match your selected filters. Try changing your filters.'
                : 'No tracks available at the moment.'}
            </p>
            {(selectedCategory || selectedPaymentType !== 'all' || searchTerm) && (
              <button 
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedPaymentType('all');
                  setSearchTerm('');
                }}
                className="mt-4 px-4 py-2 bg-[#FF4D67] hover:bg-[#FF4D67]/80 text-white rounded-full text-sm font-medium transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedTracks.map((track) => (
              <div key={track.id} className="group card-bg rounded-xl overflow-hidden transition-all duration-300 hover:border-[#FF4D67]/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-[#FF4D67]/10">
                <div className="relative">
                  {/* Beat indicator (should not appear since we filter them out) */}
                  {track.type === 'beat' && (
                    <div className="absolute top-2 left-2 z-10">
                      <span className="px-2 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">
                        BEAT
                      </span>
                    </div>
                  )}
                  <img 
                    src={track.coverImage} 
                    alt={track.title} 
                    className="w-full aspect-square object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => {
                        // Find the full track object to get the audioURL
                        const fullTrack = trendingTracksData.find(t => t._id === track.id);
                        if (fullTrack && fullTrack.audioURL) {
                          playTrack({
                            id: track.id,
                            title: track.title,
                            artist: track.artist,
                            coverImage: track.coverImage,
                            audioUrl: fullTrack.audioURL,
                            creatorId: typeof fullTrack.creatorId === 'object' && fullTrack.creatorId !== null ? (fullTrack.creatorId as any)._id : fullTrack.creatorId,
                            type: fullTrack.type, // Include track type for WhatsApp functionality
                            paymentType: fullTrack.paymentType, // Include payment type
                            price: fullTrack.price, // Include price
                            creatorWhatsapp: (typeof fullTrack.creatorId === 'object' && fullTrack.creatorId !== null 
                              ? (fullTrack.creatorId as any).whatsappContact 
                              : undefined) // Include creator's WhatsApp contact
                          });
                          
                          // Set the current playlist to all trending tracks
                          const playlistTracks = trendingTracksData
                            .filter(t => t.audioURL) // Only tracks with audio
                            .map(t => ({
                              id: t._id,
                              title: t.title,
                              artist: typeof t.creatorId === 'object' && t.creatorId !== null ? (t.creatorId as any).name : 'Unknown Artist',
                              coverImage: t.coverURL || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
                              audioUrl: t.audioURL,
                              creatorId: typeof t.creatorId === 'object' && t.creatorId !== null ? (t.creatorId as any)._id : t.creatorId,
                              type: t.type, // Include track type for WhatsApp functionality
                              paymentType: t.paymentType, // Include payment type
                              price: t.price, // Include price
                              creatorWhatsapp: (typeof t.creatorId === 'object' && t.creatorId !== null 
                                ? (t.creatorId as any).whatsappContact 
                                : undefined) // Include creator's WhatsApp contact
                            }));
                          setCurrentPlaylist(playlistTracks);
                        }
                      }}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full gradient-primary flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                      {currentTrack?.id === track.id && isPlaying ? (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-bold text-white text-base mb-1 truncate">{track.title}</h3>
                  <p className="text-gray-400 text-sm truncate">{track.artist}</p>
                  {track.album && <p className="text-gray-500 text-xs mt-1 truncate">{track.album}</p>}
                  
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-gray-500 text-xs">{track.plays.toLocaleString()} plays</span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          // Find the full track object
                          const fullTrack = trendingTracksData.find(t => t._id === track.id);
                          if (fullTrack) {
                            toggleFavorite(track.id, fullTrack);
                          }
                        }}
                        className="flex items-center gap-1 hover:scale-105 transition-transform duration-200"
                      >
                        <svg 
                          className={`w-4 h-4 transition-all duration-200 ${favoriteStatus[track.id] ? 'text-red-500 fill-current scale-110' : 'text-red-500 stroke-current'}`}
                          fill={favoriteStatus[track.id] ? "currentColor" : "none"}
                          stroke="currentColor"
                          viewBox="0 0 24 24" 
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                        </svg>
                        <span className="text-gray-500 text-xs">{track.likes}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Add to queue functionality
                          const fullTrack = trendingTracksData.find(t => t._id === track.id);
                          if (fullTrack && fullTrack.audioURL) {
                            addToQueue({
                              id: track.id,
                              title: track.title,
                              artist: track.artist,
                              coverImage: track.coverImage,
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
                            // Show toast notification
                            const toastEvent = new CustomEvent('showToast', {
                              detail: {
                                message: `Added ${track.title} to queue!`,
                                type: 'success'
                              }
                            });
                            window.dispatchEvent(toastEvent);
                          }
                        }}
                        className="flex items-center gap-1 hover:scale-105 transition-transform duration-200 text-gray-500 hover:text-white"
                        title={`Add ${track.title} to queue`}
                      >
                        <svg 
                          className="w-4 h-4"
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTracksByType } from '../../hooks/useTracks'
import { useAudioPlayer } from '../../contexts/AudioPlayerContext'
import { usePayment } from '../../contexts/PaymentContext'
import { ITrack } from '@/types'
import PesaPalPayment from '@/components/PesaPalPayment'

interface Track {
  id: string
  title: string
  artist: string
  album?: string
  plays: number
  likes: number
  coverImage: string
  duration?: string
  category?: string
  type?: 'song' | 'beat' | 'mix'
  paymentType?: 'free' | 'paid'
  creatorWhatsapp?: string
}

export default function BeatsPage() {
  const { tracks: allBeatTracks, loading: beatsLoading, refresh: refreshBeats } = useTracksByType('beat', 0); // 0 means no limit
  const { favorites, favoritesLoading, addToFavorites, removeFromFavorites, playTrack, setCurrentPlaylist } = useAudioPlayer()
  const { showPayment } = usePayment()

  // State for tracking which tracks are favorited
  const [favoriteStatus, setFavoriteStatus] = useState<Record<string, boolean>>({})
  
  // MTN MoMo payment state
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentData, setPaymentData] = useState({
    trackId: '',
    trackTitle: '',
    price: 0
  })
  
  // Filter states
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'free' | 'paid'>('all')
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  
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
  
  // Filter tracks based on selected criteria
  const filteredTracks = allBeatTracks.filter(track => {
    // Payment type filter - handle missing paymentType field
    if (selectedFilter !== 'all') {
      // If paymentType is missing, treat as 'free' for backward compatibility
      const trackPaymentType = track.paymentType || 'free';
      
      if (selectedFilter === 'free' && trackPaymentType !== 'free') return false
      if (selectedFilter === 'paid' && trackPaymentType !== 'paid') return false
    }
    
    // Genre filter
    if (selectedGenre && track.genre !== selectedGenre) return false
    
    return true
  })
  
  const refreshTrendingTracks = refreshBeats; // Alias for compatibility with existing code

  // Update favorite status when favorites change or when favorites are loaded
  useEffect(() => {
    if (!favoritesLoading) {
      const status: Record<string, boolean> = {}
      favorites.forEach(track => {
        status[track.id] = true
      })
      setFavoriteStatus(status)
    }
  }, [favorites, favoritesLoading])

  // Listen for favorites loaded event to update favorite status
  useEffect(() => {
    const handleFavoritesLoaded = () => {
      const status: Record<string, boolean> = {}
      favorites.forEach(track => {
        status[track.id] = true
      })
      setFavoriteStatus(status)
    }

    // Add event listener
    window.addEventListener('favoritesLoaded', handleFavoritesLoaded)

    // Clean up event listener
    return () => {
      window.removeEventListener('favoritesLoaded', handleFavoritesLoaded)
    }
  }, [favorites])

  // Toggle favorite status for a track
  const toggleFavorite = (trackId: string, track: any) => {
    if (favoriteStatus[trackId]) {
      // Remove from favorites
      removeFromFavorites(trackId)
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
          : track.creatorId,
        type: track.type,
        paymentType: track.paymentType,
        creatorWhatsapp: (typeof track.creatorId === 'object' && track.creatorId !== null 
          ? (track.creatorId as any).whatsappContact 
          : undefined)
      })
    }
  }

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
        refreshTrendingTracks()
      }
    }
    
    // Add event listener
    window.addEventListener('trackUpdated', handleTrackUpdate as EventListener)
    
    // Clean up event listener
    return () => {
      window.removeEventListener('trackUpdated', handleTrackUpdate as EventListener)
    }
  }, [refreshTrendingTracks])

  // Listen for MTN MoMo payment requests
  useEffect(() => {
    const handleMomoPayment = (event: CustomEvent) => {
      const { trackId, trackTitle, price } = event.detail;
      setPaymentData({ trackId, trackTitle, price });
      setShowPaymentModal(true);
    };

    window.addEventListener('openMomoPayment', handleMomoPayment as EventListener);
    
    return () => {
      window.removeEventListener('openMomoPayment', handleMomoPayment as EventListener);
    };
  }, []);

  // Loading state
  if (beatsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black flex items-center justify-center">
        <div className="text-white">Loading beats...</div>
      </div>
    );
  }

  // Handle successful payment
  const handlePaymentSuccess = (downloadLink: string) => {
    // Automatically download the beat
    if (downloadLink) {
      const link = document.createElement('a');
      link.href = downloadLink;
      link.download = `${paymentData.trackTitle}.mp3`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black">
      {/* Hero Section */}
      <div className="relative py-8 sm:py-12 lg:py-16 overflow-hidden">
        {/* Background image with gradient overlay */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80)' }}></div>
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-gray-900/60"></div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#FF4D67]/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#FFCB2B]/10 rounded-full blur-3xl -z-10"></div>
        
        <div className="container mx-auto px-4 sm:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#FF4D67] to-[#FFCB2B] mb-3 sm:mb-4">
              Premium Beats
            </h1>
            <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto mb-6 sm:mb-8">
              Discover the hottest beats from Rwandan producers and beat makers. Download free beats or contact creators for premium ones.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="container mx-auto px-4 sm:px-8 py-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-4 text-center">Filter Beats</h2>
          
          {/* Payment Type Filters */}
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            <button 
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedFilter === 'all' 
                  ? 'bg-[#FF4D67] text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => setSelectedFilter('all')}
            >
              All Beats
            </button>
            <button 
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedFilter === 'free' 
                  ? 'bg-[#FF4D67] text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => setSelectedFilter('free')}
            >
              Free
            </button>
            <button 
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedFilter === 'paid' 
                  ? 'bg-[#FF4D67] text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => setSelectedFilter('paid')}
            >
              Paid
            </button>
          </div>
          
          {/* Genre Filters */}
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                  selectedGenre === null
                    ? 'bg-[#FFCB2B] text-gray-900'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
                onClick={() => setSelectedGenre(null)}
              >
                All Genres
              </button>
              
              {genres.slice(0, 8).map((genre) => (
                <button
                  key={genre.id}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                    selectedGenre === genre.id
                      ? 'bg-[#FFCB2B] text-gray-900'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                  onClick={() => setSelectedGenre(genre.id)}
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
                        selectedGenre === genre.id
                          ? 'bg-[#FFCB2B] text-gray-900'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
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
            </div>
          </div>
        </div>
        
        {/* Results info */}
        <div className="text-center text-gray-400 text-sm mb-4">
          Showing {filteredTracks.length} of {allBeatTracks.length} beats
          {selectedFilter !== 'all' && ` • ${selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1)}`}
          {selectedGenre && ` • ${genres.find(g => g.id === selectedGenre)?.name}`}
        </div>
      </div>

      {/* Beats Grid */}
      <div className="container mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {beatsLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FF4D67]"></div>
            <p className="mt-4 text-gray-400 text-lg">Loading beats...</p>
          </div>
        ) : filteredTracks.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 className="mt-4 text-lg font-medium text-white">No beats found</h3>
            <p className="mt-2 text-gray-400">
              {selectedFilter === 'all' && selectedGenre === null 
                ? 'No beats available at the moment.'
                : `No beats match your selected filters. Try changing your filters.`}
            </p>
            {(selectedFilter !== 'all' || selectedGenre !== null) && (
              <button 
                onClick={() => {
                  setSelectedFilter('all');
                  setSelectedGenre(null);
                }}
                className="mt-4 px-4 py-2 bg-[#FF4D67] hover:bg-[#FF4D67]/80 text-white rounded-full text-sm font-medium transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTracks.map((track: ITrack) => (
              <div key={track._id} className="group card-bg rounded-2xl overflow-hidden transition-all duration-300 hover:border-[#FF4D67]/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-[#FF4D67]/10">
                <div className="relative">
                  {/* Beat indicator badge */}
                  <div className="absolute top-3 left-3 z-10 flex gap-1">
                    <span className="px-2.5 py-1 bg-purple-600 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-lg">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                      </svg>
                      BEAT
                    </span>
                    {(track.paymentType || 'free') === 'paid' ? (
                      <span className="px-2 py-1 bg-green-600 text-white text-xs font-bold rounded-full shadow-lg">
                        PAID
                      </span>
                    ) : (track.paymentType || 'free') === 'free' ? (
                      <span className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded-full shadow-lg">
                        FREE
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full shadow-lg">
                        UNKNOWN
                      </span>
                    )}
                    {track.genre && (
                      <span className="px-2 py-1 bg-yellow-600 text-gray-900 text-xs font-bold rounded-full shadow-lg capitalize">
                        {track.genre}
                      </span>
                    )}
                  </div>
                        
                  <img 
                    src={track.coverURL || '/placeholder-cover.jpg'} 
                    alt={track.title} 
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-cover.jpg';
                    }}
                  />
                        
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Play the track
                        if (track.audioURL) {
                          playTrack({
                            id: track._id,
                            title: track.title,
                            artist: typeof track.creatorId === 'object' && track.creatorId !== null 
                              ? (track.creatorId as any).name 
                              : 'Unknown Artist',
                            coverImage: track.coverURL || '',
                            audioUrl: track.audioURL,
                            creatorId: typeof track.creatorId === 'object' && track.creatorId !== null 
                              ? (track.creatorId as any)._id 
                              : track.creatorId,
                            type: track.type,
                            paymentType: track.paymentType,
                            price: track.price,
                            creatorWhatsapp: (typeof track.creatorId === 'object' && track.creatorId !== null 
                              ? (track.creatorId as any).whatsappContact 
                              : undefined)
                          });
                                
                          // Set the current playlist to filtered beats
                          const playlistTracks = filteredTracks
                            .map((t: ITrack) => ({
                              id: t._id,
                              title: t.title,
                              artist: typeof t.creatorId === 'object' && t.creatorId !== null 
                                ? (t.creatorId as any).name 
                                : 'Unknown Artist',
                              coverImage: t.coverURL || '',
                              audioUrl: t.audioURL,
                              creatorId: typeof t.creatorId === 'object' && t.creatorId !== null 
                                ? (t.creatorId as any)._id 
                                : t.creatorId,
                              type: t.type,
                              paymentType: t.paymentType,
                              price: t.price,
                              creatorWhatsapp: (typeof t.creatorId === 'object' && t.creatorId !== null 
                                ? (t.creatorId as any).whatsappContact 
                                : undefined)
                            }));
                          setCurrentPlaylist(playlistTracks);
                        }
                      }}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full gradient-primary flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300"
                    >
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                      </svg>
                    </button>
                  </div>
                        
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Toggle favorite
                        const mockTrack = {
                          _id: track._id,
                          title: track.title,
                          creatorId: { name: typeof track.creatorId === 'object' && track.creatorId !== null ? (track.creatorId as any).name : 'Unknown Artist' },
                          coverURL: track.coverURL,
                          audioURL: track.audioURL,
                          type: track.type,
                          paymentType: track.paymentType,
                          creatorWhatsapp: (typeof track.creatorId === 'object' && track.creatorId !== null ? (track.creatorId as any).whatsappContact : undefined)
                        };
                        toggleFavorite(track._id, mockTrack);
                      }}
                      className="p-1.5 sm:p-2 rounded-full bg-black/30 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                    >
                      <svg 
                        className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-200 ${favoriteStatus[track._id] ? 'text-red-500 fill-current scale-110' : 'stroke-current'}`}
                        fill={favoriteStatus[track._id] ? "currentColor" : "none"}
                        stroke="currentColor"
                        viewBox="0 0 24 24" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                      </svg>
                    </button>
                  </div>
                </div>
                      
                <div className="p-4 sm:p-5">
                  <h3 className="font-bold text-white text-lg mb-1 truncate">{track.title}</h3>
                  <p className="text-gray-400 text-sm sm:text-base mb-1 truncate">
                    {typeof track.creatorId === 'object' && track.creatorId !== null 
                      ? (track.creatorId as any).name 
                      : 'Unknown Artist'}
                  </p>
                        
                  <div className="flex justify-between text-xs sm:text-sm text-gray-500 mb-3">
                    <span>{track.plays?.toLocaleString() || '0'} plays</span>
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path>
                      </svg>
                      <span>{track.likes}</span>
                    </div>
                  </div>
                  
                  {track.paymentType === 'paid' && track.price && (
                    <div className="text-sm text-green-400 font-semibold mb-3">
                      {track.price.toLocaleString()} RWF
                    </div>
                  )}
      
                  {/* Beat-specific buttons */}
                  <div className="flex gap-2">
                    {track.paymentType === 'paid' ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!track.price || track.price <= 0) {
                            alert('Price not available for this beat');
                            return;
                          }
                          showPayment({
                            trackId: track._id,
                            trackTitle: track.title,
                            price: track.price,
                            audioUrl: track.audioURL
                          });
                        }}
                        className="flex-1 py-1.5 px-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg text-xs flex items-center justify-center gap-1 transition-colors font-semibold"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        Buy - {track.price?.toLocaleString()} RWF
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          // Download free beat
                          if (track.audioURL) {
                            // Create temporary link for download
                            const link = document.createElement('a');
                            link.href = track.audioURL;
                            link.download = `${track.title}.mp3`;
                            link.target = '_blank';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          } else {
                            alert('Download link not available');
                          }
                        }}
                        className="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs flex items-center justify-center gap-1 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                        </svg>
                        Download
                      </button>
                    )}
                          
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Play the track (alternative way)
                        if (track.audioURL) {
                          playTrack({
                            id: track._id,
                            title: track.title,
                            artist: typeof track.creatorId === 'object' && track.creatorId !== null 
                              ? (track.creatorId as any).name 
                              : 'Unknown Artist',
                            coverImage: track.coverURL || '',
                            audioUrl: track.audioURL,
                            creatorId: typeof track.creatorId === 'object' && track.creatorId !== null 
                              ? (track.creatorId as any)._id 
                              : track.creatorId,
                            type: track.type,
                            paymentType: track.paymentType,
                            price: track.price,
                            creatorWhatsapp: (typeof track.creatorId === 'object' && track.creatorId !== null 
                              ? (track.creatorId as any).whatsappContact 
                              : undefined)
                          });
                                
                          // Set the current playlist to filtered beats
                          const playlistTracks = filteredTracks
                            .map((t: ITrack) => ({
                              id: t._id,
                              title: t.title,
                              artist: typeof t.creatorId === 'object' && t.creatorId !== null 
                                ? (t.creatorId as any).name 
                                : 'Unknown Artist',
                              coverImage: t.coverURL || '',
                              audioUrl: t.audioURL,
                              creatorId: typeof t.creatorId === 'object' && t.creatorId !== null 
                                ? (t.creatorId as any)._id 
                                : t.creatorId,
                              type: t.type,
                              paymentType: t.paymentType,
                              price: t.price,
                              creatorWhatsapp: (typeof t.creatorId === 'object' && t.creatorId !== null 
                                ? (t.creatorId as any).whatsappContact 
                                : undefined)
                            }));
                          setCurrentPlaylist(playlistTracks);
                        }
                      }}
                      className="p-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* MTN MoMo Payment Modal */}
      {showPaymentModal && (
        <PesaPalPayment
          trackId={paymentData.trackId}
          trackTitle={paymentData.trackTitle}
          price={paymentData.price}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  )
}
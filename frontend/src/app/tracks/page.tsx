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
}

export default function TracksPage() {
  const [activeTab, setActiveTab] = useState<'trending' | 'new' | 'popular'>('trending')
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'alphabetical'>('popular')
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
  
  // Transform real tracks data to match existing interface (excluding beats)
  const trendingTracks: Track[] = trendingTracksData
    .filter(track => track.type !== 'beat') // Exclude beats from tracks page
    .map(track => ({
    id: track._id,
    title: track.title,
    artist: typeof track.creatorId === 'object' && track.creatorId !== null ? (track.creatorId as any).name : 'Unknown Artist',
    album: '',
    plays: track.plays,
    likes: track.likes,
    coverImage: track.coverURL || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    duration: '',
    type: track.type // Include type for beat detection
  }));

  // For now, use trending tracks for new tracks as well
  const newTracks: Track[] = trendingTracks;

  // Transform creators data to match existing interface
  const popularCreators: any[] = popularCreatorsData.map(creator => ({
    id: creator._id,
    name: creator.name,
    type: creator.creatorType || 'Artist',
    followers: creator.followersCount || 0,
    avatar: creator.avatar || 'https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    verified: true // For now, we'll assume all creators are verified
  }));
  // Get current tracks based on active tab
  const currentTracks = activeTab === 'trending' ? trendingTracks : 
                      activeTab === 'new' ? newTracks : 
                      trendingTracks // For popular creators tab, we'll show trending tracks

  // Sort tracks based on selected option
  const sortedTracks = [...currentTracks].sort((a, b) => {
    if (sortBy === 'popular') {
      return b.plays - a.plays
    } else if (sortBy === 'recent') {
      return parseInt(b.id) - parseInt(a.id)
    } else {
      return a.title.localeCompare(b.title)
    }
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">All Tracks</h1>
            <p className="text-gray-400">Browse all tracks across different categories</p>
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
        
        {/* Tabs */}
        <div className="flex overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide mb-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="flex border-b border-gray-800 min-w-max">
            <button
              className={`py-3 px-4 sm:px-6 font-medium text-sm sm:text-base transition-colors whitespace-nowrap ${
                activeTab === 'trending'
                  ? 'text-[#FF4D67] border-b-2 border-[#FF4D67]'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('trending')}
            >
              Trending Now
            </button>
            <button
              className={`py-3 px-4 sm:px-6 font-medium text-sm sm:text-base transition-colors whitespace-nowrap ${
                activeTab === 'new'
                  ? 'text-[#FF4D67] border-b-2 border-[#FF4D67]'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('new')}
            >
              New Releases
            </button>
            <button
              className={`py-3 px-4 sm:px-6 font-medium text-sm sm:text-base transition-colors whitespace-nowrap ${
                activeTab === 'popular'
                  ? 'text-[#FF4D67] border-b-2 border-[#FF4D67]'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('popular')}
            >
              Popular Creators
            </button>
          </div>
        </div>
        
        {activeTab !== 'popular' ? (
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {popularCreators.map((creator) => (
              <div key={creator.id} className="group card-bg rounded-xl p-5 transition-all duration-300 hover:border-[#FFCB2B]/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-[#FFCB2B]/10">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <img 
                      src={creator.avatar} 
                      alt={creator.name} 
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover mx-auto"
                    />
                    {creator.verified && (
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#FF4D67] border-2 border-gray-900 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-white text-base truncate w-full">{creator.name}</h3>
                  <p className="text-[#FFCB2B] text-sm mb-3">{creator.type}</p>
                  <p className="text-gray-500 text-xs mb-4">
                    {creator.followers.toLocaleString()} followers
                  </p>
                  <button className="w-full px-4 py-2 bg-transparent border border-[#FFCB2B] text-[#FFCB2B] hover:bg-[#FFCB2B]/10 rounded-full text-sm font-medium transition-colors">
                    Follow
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
"use client";

import { Fragment, useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { useTrendingTracks, usePopularCreators, useTracksByType } from "../hooks/useTracks";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";
import { getAlbumById } from "../services/albumService";
import { followCreator, unfollowCreator, checkFollowStatus } from "../services/trackService";
import HorizontalScrollSection from "../components/HorizontalScrollSection";
import TrackCard from "../components/TrackCard";
import ArtistCard from "../components/ArtistCard";
import RecommendedPlaylists from "../components/RecommendedPlaylists";
import PartnerPromotion from "../components/PartnerPromotion";
import MixesHorizontalScroll from "../components/MixesHorizontalScroll";

interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  plays: number;
  likes: number;
  coverImage: string;
  duration?: string;
  category?: string;
  type?: 'song' | 'beat' | 'mix';
  paymentType?: 'free' | 'paid';
  price?: number;
  currency?: string;
  creatorId?: string;
}

interface Creator {
  _id?: string;
  id?: string;
  name: string;
  type: string;
  followers?: number;
  followersCount?: number;
  avatar: string;
  verified?: boolean;
}

interface Album {
  id: string;
  title: string;
  artist: string;
  coverImage: string;
  year: number;
  tracks: number;
}

// Function to generate avatar with first letter of name
const generateAvatar = (name: string) => {
  const firstLetter = name.charAt(0).toUpperCase()
  return (
    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-[#FF4D67] to-[#FFCB2B] flex items-center justify-center mx-auto">
      <span className="text-xl sm:text-2xl font-bold text-white">{firstLetter}</span>
    </div>
  )
}

// Albums are now fetched directly from the API, so we don't need this function anymore
export default function Home() {
  const router = useRouter();
  const { isAuthenticated, userRole } = useAuth();
  
  // Redirect admin users to admin dashboard immediately
  if (isAuthenticated && userRole === "admin") {
    console.log("Redirecting admin to /admin");
    router.replace("/admin");
    return null;
  }
  
  const [activeTab, setActiveTab] = useState<
    "trending" | "new" | "popular" | "beats" | "mixes"
  >("trending");
  const [currentSlide, setCurrentSlide] = useState(0);
  const { currentTrack, isPlaying, playTrack, setCurrentPlaylist, favorites, favoritesLoading, addToFavorites, removeFromFavorites, addToQueue } =
    useAudioPlayer();

  // State for tracking which tracks are favorited
  const [favoriteStatus, setFavoriteStatus] = useState<Record<string, boolean>>({});

  // State for tracking which creators are followed
  const [followStatus, setFollowStatus] = useState<Record<string, boolean>>({});

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

  // Hero slider images
  const heroSlides = [
    {
      id: 1,
      title: "Discover Rwandan Music",
      subtitle: "Explore the vibrant sounds of Rwanda",
      image:
        "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      cta: "Explore Music",
    },
    {
      id: 2,
      title: "Share Your Talent",
      subtitle: "Upload your music and connect with fans",
      image:
        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      cta: "Upload Track",
    }
  ];

  // Auto-advance slider
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Use pagination for lazy loading
  const [page, setPage] = useState(1);
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const { tracks: trendingTracksData, loading: trendingLoading, refresh: refreshTrendingTracks, total: totalTracks, pages: totalPages } =
    useTrendingTracks(50, page); // Load 50 tracks per page to ensure enough songs after filtering out beats

  // Handle infinite scroll
  useEffect(() => {
    if (trendingTracksData.length > 0 && !trendingLoading) {
      // Filter out tracks without audio URLs
      const filteredTracks = trendingTracksData.filter((track: any) => 
        track.audioURL && track.audioURL.trim() !== ''
      );
      
      const newTracks: Track[] = filteredTracks.map(track => ({
        id: track._id,
        title: track.title || 'Untitled Track',
        artist: typeof track.creatorId === "object" && track.creatorId !== null
          ? (track.creatorId as any).name
          : "Unknown Artist",
        album: typeof track.albumId === "object" && track.albumId !== null && 'title' in track.albumId
          ? (track.albumId as { _id: string; title: string }).title 
          : "", // Use actual album title if available
        plays: track.plays || 0,
        likes: track.likes || 0,
        coverImage: track.coverURL || "",
        duration: track.duration || "",
        category: track.type || 'song',
        type: (track.type as 'song' | 'beat' | 'mix') || 'song',
        paymentType: track.paymentType,
        price: track.price,
        currency: track.currency,
        creatorId: typeof track.creatorId === "object" && track.creatorId !== null
          ? (track.creatorId as any)._id
          : track.creatorId,
        audioUrl: track.audioURL || "", // Ensure audio URL is included
      }));
      setAllTracks(prev => [...prev, ...newTracks]);
    }
  }, [trendingTracksData, trendingLoading]);

  const loadMore = useCallback(() => {
    if (page < (totalPages || 1) && !trendingLoading) {
      setPage(prev => prev + 1);
    }
  }, [page, totalPages, trendingLoading]);

  // Fetch real popular creators
  const { creators: popularCreatorsData, loading: creatorsLoading } =
    usePopularCreators(6);

// Helper function to remove duplicate tracks by ID
  const removeDuplicateTracks = (tracks: Track[]): Track[] => {
    const seen = new Set<string>();
    return tracks.filter(track => {
      if (seen.has(track.id)) {
        return false;
      }
      seen.add(track.id);
      return true;
    });
  };

  // Helper function to remove duplicate ITrack items by _id
  const removeDuplicateITracks = (tracks: any[]): any[] => {
    const seen = new Set<string>();
    return tracks.filter(track => {
      if (seen.has(track._id)) {
        return false;
      }
      seen.add(track._id);
      return true;
    });
  };

  // Fetch beat tracks specifically (since trending excludes beats)
  const { tracks: beatTracksData, loading: beatsLoading } = useTracksByType('beat', 0); // 0 means no limit
  
  // Memoized sorted beat tracks for Popular Beats section
  // Memoized sorted beat tracks for Popular Beats section
  const sortedBeatTracks = useMemo(() => {
    const sorted = [...beatTracksData].sort((a, b) => (b.plays || 0) - (a.plays || 0));
    return removeDuplicateITracks(sorted);
  }, [beatTracksData]);

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

  // Listen for toast notifications
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

  // Use all tracks from infinite scroll
  const trendingTracks: Track[] = useMemo(() => removeDuplicateTracks(allTracks), [allTracks]);

  // For now, use trending tracks for new tracks as well
  const newTracks: Track[] = trendingTracks;

  // Transform creators data to match existing interface
  const popularCreators: Creator[] = popularCreatorsData.map((creator) => ({
    id: creator._id,
    name: creator.name,
    type: creator.creatorType || "Artist",
    followers: creator.followersCount || 0,
    avatar: creator.avatar || "", // Preserve empty values so we can show fallback in UI
    verified: true, // For now, we'll assume all creators are verified
  }));
  
  // Check follow status for each popular creator when creators load or user changes
  useEffect(() => {
    const checkFollowStatusForCreators = async () => {
      if (isAuthenticated && popularCreators.length > 0) {
        const newFollowStatus: Record<string, boolean> = {};
        for (const creator of popularCreators) {
          try {
            const isFollowing = await checkFollowStatus(creator.id);
            newFollowStatus[creator.id] = isFollowing;
          } catch (error) {
            console.error(`Error checking follow status for creator ${creator.id}:`, error);
            newFollowStatus[creator.id] = false;
          }
        }
        setFollowStatus(prev => ({ ...prev, ...newFollowStatus }));
      } else if (!isAuthenticated) {
        // Reset follow status when user is not authenticated
        setFollowStatus({});
      }
    };

    checkFollowStatusForCreators();
  }, [popularCreatorsData, isAuthenticated]); // Only run when popular creators data or authentication status changes
  
  // Fetch real albums from the API
  const [popularAlbums, setPopularAlbums] = useState<Album[]>([]);
  const [albumsLoading, setAlbumsLoading] = useState(true);
  const [playingAlbumId, setPlayingAlbumId] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/albums?page=1&limit=6`);
        if (response.ok) {
          const data = await response.json();
          const albums: Album[] = data.albums.map((album: any) => ({
            id: album._id,
            title: album.title,
            artist: typeof album.creatorId === "object" && album.creatorId !== null 
              ? album.creatorId.name 
              : "Unknown Artist",
            coverImage: album.coverURL || "",
            year: album.releaseDate ? new Date(album.releaseDate).getFullYear() : new Date().getFullYear(),
            tracks: album.tracks?.length || 0
          }));
          setPopularAlbums(albums);
        }
      } catch (error) {
        console.error('Error fetching albums:', error);
        // Set empty array if API fails
        setPopularAlbums([]);
      } finally {
        setAlbumsLoading(false);
      }
    };
    
    if (trendingTracksData.length > 0) {
      fetchAlbums();
    }
  }, [trendingTracksData]);

  // For You section - use monthly popular tracks for current month
  const [monthlyPopularTracks, setMonthlyPopularTracks] = useState<Track[]>([]);
  const [monthlyPopularLoading, setMonthlyPopularLoading] = useState(true);
  
  // Fetch monthly popular tracks
  useEffect(() => {
    const fetchMonthlyPopularTracks = async () => {
      try {
        setMonthlyPopularLoading(true);
        const { fetchMonthlyPopularTracks: fetchMonthly } = await import('@/services/trackService');
        const tracks = await fetchMonthly(20);
        
        // Ensure we have tracks to display
        if (tracks.length === 0) {
          // Fallback to trending tracks if no monthly popular tracks
          console.log('No monthly popular tracks found, using trending tracks as fallback');
          setMonthlyPopularTracks(trendingTracks.slice(0, 10));
        } else {
          setMonthlyPopularTracks(tracks);
        }
      } catch (error) {
        console.error('Error fetching monthly popular tracks:', error);
        // Fallback to trending tracks if monthly popular fails
        setMonthlyPopularTracks(trendingTracks.slice(0, 10));
      } finally {
        setMonthlyPopularLoading(false);
      }
    };
    
    if (trendingTracks.length > 0) {
      fetchMonthlyPopularTracks();
    }
  }, [trendingTracks]);
  
  // For You section - use monthly popular tracks
  const forYouTracks: Track[] = monthlyPopularTracks.slice(0, 10);

  // Utility function to shuffle an array
  const shuffleArray = (array: any[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };



  // Helper function to get tracks by taking the first N unique tracks
  const getUniqueTracks = (tracks: Track[], _usedTrackIds: Set<string>, count: number): Track[] => {
    // We ignore usedTrackIds to allow tracks to appear in multiple sections
    // Just return the first 'count' tracks from the sorted list
    return tracks.slice(0, count);
  };

  // Made for You section - use a mix of liked and recently added tracks for personalization
  // Only show tracks of type 'song', not beats
  const madeForYouTracks: Track[] = useMemo(() => {
    // Filter to only include song type tracks
    const songTracks = trendingTracks.filter(track => 
      track.type === 'song' || track.category === 'song'
    );
    
    const sortedTracks = [...songTracks].sort((a, b) => {
      // Weight by likes and recency, assuming newer tracks might be more relevant
      const aScore = (a.likes || 0) * 2 + (a.plays || 0) * 0.5;
      const bScore = (b.likes || 0) * 2 + (b.plays || 0) * 0.5;
      return bScore - aScore;
    });
    const uniqueSortedTracks = removeDuplicateTracks(sortedTracks);
    return uniqueSortedTracks.slice(0, 10);
  }, [trendingTracks]);

  // Popular Songs section - use tracks with highest play counts and engagement
  // Only show tracks of type 'song', not beats
  const popularSongs: Track[] = useMemo(() => {
    // Filter to only include song type tracks
    const songTracks = trendingTracks.filter(track => 
      track.type === 'song' || track.category === 'song'
    );
    
    const sortedTracks = [...songTracks].sort((a, b) => {
      // Combine plays with engagement (likes) for popularity
      const aPopularity = (a.plays || 0) * 0.7 + (a.likes || 0) * 0.3;
      const bPopularity = (b.plays || 0) * 0.7 + (b.likes || 0) * 0.3;
      return bPopularity - aPopularity;
    });
    const uniqueSortedTracks = removeDuplicateTracks(sortedTracks);
    return uniqueSortedTracks.slice(0, 10);
  }, [trendingTracks]);

  // New Releases section - prioritize recently added tracks
  // Only show tracks of type 'song', not beats
  const newReleases: Track[] = useMemo(() => {
    // Filter to only include song type tracks
    const songTracks = trendingTracks.filter(track => 
      track.type === 'song' || track.category === 'song'
    );
    
    // Since we don't have explicit date information in the Track interface,
    // we'll reverse the order to show newest tracks first (assuming last in array are newest)
    const reversedTracks = [...songTracks].reverse();
    const uniqueSortedTracks = removeDuplicateTracks(reversedTracks);
    return uniqueSortedTracks.slice(0, 10);
  }, [trendingTracks]);

  // Rising Tracks - tracks with increasing engagement (high likes relative to plays)
  // Only show tracks of type 'song', not beats
  const risingTracks: Track[] = useMemo(() => {
    // Filter to only include song type tracks
    const songTracks = trendingTracks.filter(track => 
      track.type === 'song' || track.category === 'song'
    );
    
    const sortedTracks = [...songTracks].sort((a, b) => {
      // Calculate engagement rate: likes relative to plays
      const aEngagement = a.plays ? (a.likes || 0) / a.plays : (a.likes || 0);
      const bEngagement = b.plays ? (b.likes || 0) / b.plays : (b.likes || 0);
      return bEngagement - aEngagement;
    });
    const uniqueSortedTracks = removeDuplicateTracks(sortedTracks);
    return uniqueSortedTracks.slice(0, 10);
  }, [trendingTracks]);

  // Based on Your Listening - personalized recommendations based on variety
  // Only show tracks of type 'song', not beats
  const basedOnListening: Track[] = useMemo(() => {
    // Filter to only include song type tracks
    const songTracks = trendingTracks.filter(track => 
      track.type === 'song' || track.category === 'song'
    );
    
    // Use a weighted algorithm that balances plays, likes, and other factors
    const sortedTracks = [...songTracks].sort((a, b) => {
      // Calculate a score based on multiple factors
      const aDurationNum = typeof a.duration === 'string' ? (a.duration.includes(':') ? parseFloat(a.duration.split(':')[0]) * 60 + parseFloat(a.duration.split(':')[1]) : parseFloat(a.duration)) : (a.duration || 0);
      const bDurationNum = typeof b.duration === 'string' ? (b.duration.includes(':') ? parseFloat(b.duration.split(':')[0]) * 60 + parseFloat(b.duration.split(':')[1]) : parseFloat(b.duration)) : (b.duration || 0);
      const aScore = (a.plays || 0) * 0.4 + (a.likes || 0) * 0.4 + (aDurationNum ? Math.min(aDurationNum, 300) * 0.2 : 0); // Duration weight for song length
      const bScore = (b.plays || 0) * 0.4 + (b.likes || 0) * 0.4 + (bDurationNum ? Math.min(bDurationNum, 300) * 0.2 : 0);
      return bScore - aScore;
    });
    const uniqueSortedTracks = removeDuplicateTracks(sortedTracks);
    return uniqueSortedTracks.slice(0, 10);
  }, [trendingTracks]);

  // Continue Listening - tracks with recent activity and high engagement
  // Only show tracks of type 'song', not beats
  const continueListening: Track[] = useMemo(() => {
    // Filter to only include song type tracks
    const songTracks = trendingTracks.filter(track => 
      track.type === 'song' || track.category === 'song'
    );
    
    // Prioritize tracks with recent activity indicators
    const sortedTracks = [...songTracks].sort((a, b) => {
      // Weight recent interactions - assuming tracks with recent likes or plays are more relevant
      const aRecency = (a.likes || 0) * 0.6 + (a.plays || 0) * 0.4;
      const bRecency = (b.likes || 0) * 0.6 + (b.plays || 0) * 0.4;
      return bRecency - aRecency;
    });
    const uniqueSortedTracks = removeDuplicateTracks(sortedTracks);
    return uniqueSortedTracks.slice(0, 10);
  }, [trendingTracks]);

  // Similar to Liked Songs - tracks similar to user's favorites (highly liked tracks)
  // Only show tracks of type 'song', not beats
  const similarToLiked: Track[] = useMemo(() => {
    // Filter to only include song type tracks
    const songTracks = trendingTracks.filter(track => 
      track.type === 'song' || track.category === 'song'
    );
    
    const sortedTracks = [...songTracks].sort((a, b) => (b.likes || 0) - (a.likes || 0));
    const uniqueSortedTracks = removeDuplicateTracks(sortedTracks);
    return uniqueSortedTracks.slice(0, 10);
  }, [trendingTracks]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black relative overflow-hidden">
      {/* Loading overlay for initial data fetch */}
      {trendingLoading && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="text-white text-xl">Loading...</div>
        </div>
      )}
      {/* Background decorative elements - repositioned to avoid overflow */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-[#FF4D67]/10 rounded-full blur-3xl -z-10 hidden md:block"></div>
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-[#FFCB2B]/10 rounded-full blur-3xl -z-10 hidden md:block"></div>

      {/* Mobile menu functionality is handled in the Navbar component */}

      {/* Main Content */}
      {/* Sidebar - Hidden on mobile, fixed when scrolling */}
      <aside className="hidden md:block w-64 bg-gray-900/50 border-r border-gray-800 p-6 overflow-y-auto fixed top-0 left-0 h-screen flex-shrink-0 z-30">
        <div className="mb-8">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF4D67] to-[#FFCB2B]">
            MUZIKAX
          </h1>
        </div>

        <nav className="space-y-2">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#FF4D67]/10 text-white"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              ></path>
            </svg>
            <span>Home</span>
          </Link>

          <Link
            href="/explore"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
            <span>Explore</span>
          </Link>

          {/* Conditional rendering based on user role */}
          {isAuthenticated ? (
            userRole === "creator" ? (
              <Link
                href="/upload"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  ></path>
                </svg>
                <span>Upload</span>
              </Link>
            ) : (
              <button
                onClick={() => {
                  // Redirect to upload page where they can upgrade
                  router.push("/upload");
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors w-full text-left"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  ></path>
                </svg>
                <span>Upload</span>
              </button>
            )
          ) : (
            <button
              onClick={() => {
                // Redirect to login page
                router.push("/login");
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors w-full text-left"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                ></path>
              </svg>
              <span>Upload</span>
            </button>
          )}


        </nav>

        <div className="mt-8">
          <h2 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">
            Categories
          </h2>
          <nav className="space-y-1">
            <Link
              href="/explore?category=afrobeat"
              className="block px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
            >
              Afrobeat
            </Link>
            <Link
              href="/explore?category=amapiano"
              className="block px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
            >
              Amapiano
            </Link>
            <Link
              href="/explore?category=hiphop"
              className="block px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
            >
              Hip Hop
            </Link>
            <Link
              href="/explore?category=rnb"
              className="block px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
            >
              R&B
            </Link>
            <Link
              href="/explore?category=afropop"
              className="block px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
            >
              Afropop
            </Link>
            <Link
              href="/explore?category=gospel"
              className="block px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
            >
              Gospel
            </Link>
            <Link
              href="/explore?category=dancehall"
              className="block px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
            >
              Dancehall
            </Link>
            <Link
              href="/explore?category=reggae"
              className="block px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
            >
              Reggae
            </Link>
            <Link
              href="/explore?category=soul"
              className="block px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
            >
              Soul
            </Link>
          </nav>
        </div>

        <div className="mt-8">
          <h2 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">
            Library
          </h2>
          <nav className="space-y-1">
            <Link
              href="/favorites"
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                ></path>
              </svg>
              <span>Favorites</span>
            </Link>
            <Link
              href="/recently-played"
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <span>Recently Played</span>
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main Content Area - This takes remaining space */}
      <main className="flex-1 flex flex-col min-h-screen ml-0 md:ml-64 overflow-y-auto">
        {/* Partner Promotion - Disabled to prevent redirects */}
        {/* <PartnerPromotion 
          variant="rewarded" 
          showAfterVisits={5}
          autoHideTimeout={30}
          rewardText="🎵 Support us by watching a quick video!"
        /> */}
        {/* Enhanced Hero Section with Image Slider */}
        <section className="relative py-8 md:py-12 lg:py-16 overflow-hidden">
          <div className="absolute inset-0">
            {heroSlides.map((slide, index) => (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  index === currentSlide ? "opacity-100" : "opacity-0"
                }`}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${slide.image})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/70 to-gray-900/30"></div>
                </div>
              </div>
            ))}
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#FF4D67] to-[#FFCB2B] mb-4 sm:mb-6 animate-fade-in">
                {heroSlides[currentSlide].title}
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-gray-200 mb-6 sm:mb-8 animate-fade-in-delay">
                {heroSlides[currentSlide].subtitle}
              </p>
              <div className="flex flex-wrap gap-3 sm:gap-4 md:gap-6 justify-center animate-fade-in-delay-2">
                <button
                  className="px-5 py-2.5 sm:px-6 sm:py-3 btn-primary font-medium rounded-lg transition-all hover:scale-105 text-sm sm:text-base"
                  onClick={() => {
                    // Primary CTA button functionality
                    if (heroSlides[currentSlide].cta === "Explore Music") {
                      router.push("/explore");
                    } else if (
                      heroSlides[currentSlide].cta === "Upload Track"
                    ) {
                      // Check authentication and role before allowing upload
                      if (!isAuthenticated) {
                        router.push("/login");
                      } else if (userRole === "creator") {
                        router.push("/upload");
                      } else {
                        // Fans can upgrade to creator, redirect to upload page
                        router.push("/upload");
                      }
                    } else {
                      router.push("/");
                    }
                  }}
                >
                  {heroSlides[currentSlide].cta}
                </button>

              </div>
            </div>
          </div>

          {/* Slider Indicators */}
          <div className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all ${
                  index === currentSlide
                    ? "bg-[#FF4D67] w-4 sm:w-6"
                    : "bg-white/50 hover:bg-white"
                }`}
              />
            ))}
          </div>

          {/* Navigation Arrows - Hidden on mobile */}
          <button
            onClick={() =>
              setCurrentSlide(
                (prev) => (prev - 1 + heroSlides.length) % heroSlides.length,
              )
            }
            className="hidden sm:flex absolute left-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-all"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              ></path>
            </svg>
          </button>

          <button
            onClick={() =>
              setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
            }
            className="hidden sm:flex absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-all"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              ></path>
            </svg>
          </button>
        </section>



        {/* Infinite Scroll Trigger */}
        {page < (totalPages || 1) && (
          <div className="flex justify-center py-8">
            <button
              onClick={loadMore}
              disabled={trendingLoading}
              className="px-6 py-3 bg-gradient-to-r from-[#FF4D67] to-[#FFCB2B] text-white rounded-full font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {trendingLoading ? 'Loading...' : 'Load More Tracks'}
            </button>
          </div>
        )}

        {/* For You Section - Monthly Popular Tracks */}
        <HorizontalScrollSection title="For You" viewAllLink="/tracks?sortBy=monthly">
          {monthlyPopularLoading ? (
            // Loading skeleton
            Array.from({ length: 10 }).map((_, index) => (
              <div
                key={`loading-${index}`}
                className="flex-shrink-0 w-48 sm:w-56"
              >
                <div className="bg-gray-700 rounded-lg h-48 sm:h-56 animate-pulse mb-3"></div>
                <div className="bg-gray-700 rounded h-4 w-3/4 animate-pulse mb-2"></div>
                <div className="bg-gray-700 rounded h-3 w-1/2 animate-pulse"></div>
              </div>
            ))
          ) : (
            forYouTracks.map((track) => {
              // Find the full track object to get additional properties
              // Try to match by _id first (for regular tracks), then by id (for transformed tracks)
              const fullTrack = trendingTracksData.find(t => t._id === track.id || t._id === (track as any)._id);
              return (
                <TrackCard 
                  key={`for-you-${track.id}`} 
                  track={track} 
                  fullTrackData={fullTrack}
                />
              );
            })
          )}
        </HorizontalScrollSection>

        {/* Recommended Playlists Section */}
        <RecommendedPlaylists />

        {/* New Releases Section */}
        <HorizontalScrollSection title="New Releases" viewAllLink="/tracks?sortBy=newest">
          {newReleases.map((track) => {
            // Find the full track object to get additional properties
            const fullTrack = trendingTracksData.find(t => t._id === track.id);
            return (
              <TrackCard 
                key={`new-releases-${track.id}`} 
                track={track} 
                fullTrackData={fullTrack}
              />
            );
          })}
        </HorizontalScrollSection>

        {/* Popular Artists Section */}
        <HorizontalScrollSection title="Popular Artists" viewAllLink="/artists">
          {popularCreators.map((creator) => (
            <ArtistCard 
              key={creator.id} 
              creator={creator} 
              followStatus={followStatus}
              setFollowStatus={setFollowStatus}
            />
          ))}
        </HorizontalScrollSection>

        {/* Popular Songs Section */}
        <HorizontalScrollSection title="Popular Songs" viewAllLink="/tracks?sortBy=popularity">
          {popularSongs.map((track) => {
            // Find the full track object to get additional properties
            const fullTrack = trendingTracksData.find(t => t._id === track.id);
            return (
              <TrackCard 
                key={`popular-${track.id}`} 
                track={track} 
                fullTrackData={fullTrack}
              />
            );
          })}
        </HorizontalScrollSection>

        {/* Popular Beats Section - Horizontal Scroll */}
        <HorizontalScrollSection title="Popular Beats" viewAllLink="/beats?sortBy=popularity">
          {sortedBeatTracks.slice(0, 15).map((track) => {
            return (
              <TrackCard 
                key={`beat-${track._id}`} 
                track={{
                  id: track._id,
                  title: track.title,
                  artist: typeof track.creatorId === "object" && track.creatorId !== null 
                    ? (track.creatorId as any).name 
                    : "Unknown Artist",
                  coverImage: track.coverURL || '',
                  plays: track.plays,
                  likes: track.likes,
                  duration: track.duration,
                  audioUrl: track.audioURL || '',
                  creatorId: typeof track.creatorId === 'object' && track.creatorId !== null 
                    ? (track.creatorId as any)._id 
                    : track.creatorId,
                  type: track.type as 'song' | 'beat' | 'mix' | undefined,
                  paymentType: track.paymentType as 'free' | 'paid' | undefined,
                  price: track.price,
                  currency: track.currency,
                  creatorWhatsapp: typeof track.creatorId === 'object' && track.creatorId !== null 
                    ? (track.creatorId as any).whatsappContact 
                    : undefined
                }}
                fullTrackData={track}
              />
            );
          })}
        </HorizontalScrollSection>

        {/* New Releases Section */}
        <HorizontalScrollSection title="New Releases" viewAllLink="/tracks?sortBy=newest">
          {newReleases.map((track) => {
            // Find the full track object to get additional properties
            const fullTrack = trendingTracksData.find(t => t._id === track.id);
            return (
              <TrackCard 
                key={`new-releases-${track.id}`} 
                track={track} 
                fullTrackData={fullTrack}
              />
            );
          })}
        </HorizontalScrollSection>

        {/* Rising Tracks Section */}
        <HorizontalScrollSection title="Rising Tracks" viewAllLink="/tracks?sortBy=engagement">
          {risingTracks.map((track) => {
            // Find the full track object to get additional properties
            const fullTrack = trendingTracksData.find(t => t._id === track.id);
            return (
              <TrackCard 
                key={`rising-${track.id}`} 
                track={track} 
                fullTrackData={fullTrack}
              />
            );
          })}
        </HorizontalScrollSection>

        {/* Based on Your Listening Section */}
        <HorizontalScrollSection title="Based on Your Listening" viewAllLink="/foryou">
          {basedOnListening.map((track) => {
            // Find the full track object to get additional properties
            const fullTrack = trendingTracksData.find(t => t._id === track.id);
            return (
              <TrackCard 
                key={`listening-${track.id}`} 
                track={track} 
                fullTrackData={fullTrack}
              />
            );
          })}
        </HorizontalScrollSection>

        {/* Continue Listening Section */}
        <HorizontalScrollSection title="Continue Listening" viewAllLink="/recently-played">
          {continueListening.map((track) => {
            // Find the full track object to get additional properties
            const fullTrack = trendingTracksData.find(t => t._id === track.id);
            return (
              <TrackCard 
                key={`continue-listening-${track.id}`} 
                track={track} 
                fullTrackData={fullTrack}
              />
            );
          })}
        </HorizontalScrollSection>

        {/* Popular Mixes Section */}
        <MixesHorizontalScroll title="Popular Mixes" viewAllLink="/mixes" />

        {/* Similar to Liked Songs Section */}
        <HorizontalScrollSection title="Similar to Liked Songs" viewAllLink="/favorites">
          {similarToLiked.map((track) => {
            // Find the full track object to get additional properties
            const fullTrack = trendingTracksData.find(t => t._id === track.id);
            return (
              <TrackCard 
                key={`similar-liked-${track.id}`} 
                track={track} 
                fullTrackData={fullTrack}
              />
            );
          })}
        </HorizontalScrollSection>
        {/* Popular Albums Section */}
        <section className="px-4 md:px-6 py-8 sm:py-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Popular Albums
            </h2>
            <a
              href="/albums"
              className="text-[#FF4D67] hover:text-[#FFCB2B] text-sm sm:text-base transition-colors"
            >
              View All
            </a>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,_minmax(250px,_1fr))] gap-4 sm:gap-6 md:gap-6">
            {albumsLoading ? (
              // Loading skeleton
              Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="group card-bg rounded-xl overflow-hidden transition-all duration-300"
                >
                  <div className="relative">
                    <div className="w-full aspect-square bg-gray-700 animate-pulse"></div>
                  </div>
                  
                  <div className="p-3">
                    <div className="h-4 bg-gray-700 rounded mb-2 animate-pulse"></div>
                    <div className="h-3 bg-gray-700 rounded w-3/4 animate-pulse"></div>
                    
                    <div className="flex justify-between items-center mt-2">
                      <div className="h-3 bg-gray-700 rounded w-1/3 animate-pulse"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/3 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              popularAlbums.map((album) => (
                <div
                  key={album.id}
                  className="group card-bg rounded-xl overflow-hidden transition-all duration-300 hover:border-[#FF4D67]/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-[#FF4D67]/10 cursor-pointer"
                  onClick={() => router.push(`/album/${album.id}`)}
                >
                <div className="relative">
                  {album.coverImage && album.coverImage.trim() !== '' ? (
                    <img
                      src={album.coverImage}
                      alt={album.title}
                      className="w-full aspect-square object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-gradient-to-br from-[#FF4D67] to-[#FFCB2B] flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full gradient-primary flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300"
                      onClick={async (e) => {
                        e.stopPropagation();
                        setPlayingAlbumId(album.id);
                        try {
                          // Fetch the full album data
                          const albumData = await getAlbumById(album.id);
                          
                          // Transform tracks to match player format
                          const tracks = (Array.isArray(albumData.tracks) ? albumData.tracks : []).map((track: any) => {
                            console.log('Home page - Raw track data:', JSON.stringify(track, null, 2));
                            const artist = (track.creatorId && typeof track.creatorId === "object" && track.creatorId !== null) 
                              ? (track.creatorId.name || "Unknown Artist")
                              : "Unknown Artist";
                            console.log('Home page - Processed artist:', artist);
                            return {
                              id: track._id || track.id,
                              title: track.title,
                              artist: artist,
                              coverImage: (track.coverURL || track.coverImage) || "",
                              audioUrl: track.audioURL,
                              creatorId: (track.creatorId && typeof track.creatorId === "object" && track.creatorId !== null) 
                                ? track.creatorId._id 
                                : track.creatorId,
                              type: track.type, // Include track type for WhatsApp functionality
                              paymentType: track.paymentType, // Include payment type for beat pricing
                              price: track.price, // Include price for paid beats
                              currency: track.currency, // Include currency for paid beats
                              creatorWhatsapp: (track.creatorId && typeof track.creatorId === "object" && track.creatorId !== null) 
                                ? track.creatorId.whatsappContact 
                                : undefined // Include creator's WhatsApp contact
                            };
                          });
                          
                          // Set the playlist and play the first track
                          if (tracks.length > 0) {
                            setCurrentPlaylist(tracks);
                            playTrack(tracks[0], tracks, { albumId: album.id, tracks });
                          }
                        } catch (error) {
                          console.error('Error playing album:', error);
                        } finally {
                          setPlayingAlbumId(null);
                        }
                      }}
                      aria-label={`Play album ${album.title}`}
                    >
                      {playingAlbumId === album.id ? (
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-3">
                  <h3 className="font-bold text-white text-sm sm:text-base mb-1 truncate">
                    {album.title}
                  </h3>
                  <p className="text-gray-400 text-xs sm:text-sm truncate">
                    {album.artist}
                  </p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-500 text-xs">{album.year}</span>
                    <span className="text-gray-500 text-xs">
                      {album.tracks} tracks
                    </span>
                  </div>
                </div>
              </div>
            ))
            )}
          </div>
        </section>




        {/* Music Lists */}
        <section className="px-4 md:px-6 py-8 sm:py-10 pb-8">
          {/* Tabs */}
          <div className="flex overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide mb-6">
            <div className="flex border-b border-gray-800 min-w-max">
              <button
                className={`py-3 px-4 sm:px-6 font-medium text-sm sm:text-base transition-colors whitespace-nowrap ${
                  activeTab === "trending"
                    ? "text-[#FF4D67] border-b-2 border-[#FF4D67]"
                    : "text-gray-500 hover:text-gray-300"
                }`}
                onClick={() => setActiveTab("trending")}
              >
                Trending Now
              </button>
              <button
                className={`py-3 px-4 sm:px-6 font-medium text-sm sm:text-base transition-colors whitespace-nowrap ${
                  activeTab === "new"
                    ? "text-[#FF4D67] border-b-2 border-[#FF4D67]"
                    : "text-gray-500 hover:text-gray-300"
                }`}
                onClick={() => setActiveTab("new")}
              >
                New Releases
              </button>
              <button
                className={`py-3 px-4 sm:px-6 font-medium text-sm sm:text-base transition-colors whitespace-nowrap ${
                  activeTab === "popular"
                    ? "text-[#FF4D67] border-b-2 border-[#FF4D67]"
                    : "text-gray-500 hover:text-gray-300"
                }`}
                onClick={() => setActiveTab("popular")}
              >
                Popular Creators
              </button>
              <button
                className={`py-3 px-4 sm:px-6 font-medium text-sm sm:text-base transition-colors whitespace-nowrap ${
                  activeTab === "beats"
                    ? "text-[#FF4D67] border-b-2 border-[#FF4D67]"
                    : "text-gray-500 hover:text-gray-300"
                }`}
                onClick={() => setActiveTab("beats")}
              >
                Beats
              </button>
          
              <a
                href="/tracks"
                className="py-3 px-4 sm:px-6 font-medium text-sm sm:text-base text-[#FF4D67] hover:text-[#FFCB2B] transition-colors whitespace-nowrap flex items-center"
              >
                View All
                <svg
                  className="w-4 h-4 ml-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  ></path>
                </svg>
              </a>
            </div>
          </div>

          {/* Trending Tracks */}
          {activeTab === "trending" && (
            <div className="grid grid-cols-[repeat(auto-fill,_minmax(250px,_1fr))] gap-4 sm:gap-6 md:gap-6">
              {trendingTracks.map((track) => (
                <div
                  key={`trending-tab-${track.id}`}
                  className="group card-bg rounded-2xl overflow-hidden transition-all duration-300 hover:border-[#FF4D67]/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-[#FF4D67]/10"
                >
                  <div className="relative">
                    {track.coverImage && track.coverImage.trim() !== '' ? (
                      <img
                        src={track.coverImage}
                        alt={track.title}
                        className="w-full h-40 sm:h-48 object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null; // Prevent infinite loop
                          target.style.display = 'none';
                          // Show fallback content
                          const parent = target.parentElement;
                          if (parent) {
                            const fallback = parent.querySelector('.image-fallback');
                            if (fallback) {
                              fallback.classList.remove('hidden');
                            }
                          }
                        }}
                        onLoad={(e) => {
                          const target = e.target as HTMLImageElement;
                          const parent = target.parentElement;
                          if (parent) {
                            const fallback = parent.querySelector('.image-fallback');
                            if (fallback) {
                              fallback.classList.add('hidden');
                            }
                          }
                        }}
                      />
                    ) : null}
                    <div className="image-fallback absolute inset-0 bg-gradient-to-br from-[#FF4D67] to-[#FFCB2B] flex items-center justify-center w-full h-40 sm:h-48">
                      <span className="text-2xl font-bold text-white">
                        {track.title && track.title.trim().length > 0
                          ? track.title.trim().charAt(0).toUpperCase()
                          : '?'}
                      </span>
                    </div>
                    
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => {
                          // Find the full track object to get the audioURL
                          const fullTrack = trendingTracksData.find(
                            (t) => t._id === track.id
                          );
                          if (fullTrack && fullTrack.audioURL) {
                            playTrack({
                              id: track.id,
                              title: track.title,
                              artist: track.artist,
                              coverImage: track.coverImage,
                              audioUrl: fullTrack.audioURL,
                              creatorId: typeof fullTrack.creatorId === 'object' && fullTrack.creatorId !== null ? (fullTrack.creatorId as any)._id : fullTrack.creatorId
                            });

                            // Set the current playlist to all trending tracks
                            const playlistTracks = trendingTracksData
                              .filter((t) => t.audioURL) // Only tracks with audio
                              .map((t) => ({
                                id: t._id,
                                title: t.title,
                                artist: typeof t.creatorId === "object" &&
                                  t.creatorId !== null
                                  ? (t.creatorId as any).name
                                  : "Unknown Artist",
                                coverImage: t.coverURL ||
                                  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
                                audioUrl: t.audioURL,
                                creatorId: typeof t.creatorId === 'object' && t.creatorId !== null ? (t.creatorId as any)._id : t.creatorId
                              }));
                            setCurrentPlaylist(playlistTracks);
                          }
                        }}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full gradient-primary flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300"
                        disabled={!trendingTracksData.find(t => t._id === track.id)?.audioURL}
                      >
                        {currentTrack?.id === track.id && isPlaying ? (
                          <svg
                            className="w-5 h-5 sm:w-6 sm:h-6"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            ></path>
                          </svg>
                        ) : (
                          <svg
                            className="w-5 h-5 sm:w-6 sm:h-6"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                              clipRule="evenodd"
                            ></path>
                          </svg>
                        )}
                      </button>
                    </div>
                    
                    {/* Favorite Button */}
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Find the full track object
                          const fullTrack = trendingTracksData.find(t => t._id === track.id);
                          if (fullTrack) {
                            toggleFavorite(track.id, fullTrack);
                          }
                        }}
                        className="p-1.5 sm:p-2 rounded-full bg-black/30 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                      >
                        <svg
                          className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-200 ${favoriteStatus[track.id] ? 'text-red-500 fill-current scale-110' : 'stroke-current'}`}
                          fill={favoriteStatus[track.id] ? "currentColor" : "none"}
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Track Info */}
                  <div className="p-4 sm:p-5">
                    <h3 className="font-bold text-white text-lg mb-1 truncate" title={track.title}>
                      {track.title || 'Untitled Track'}
                    </h3>
                    <p className="text-gray-400 text-sm sm:text-base mb-1 truncate" title={track.artist}>
                      {track.artist || 'Unknown Artist'}
                    </p>
                    
                    {/* Album info - only show if album exists and is not empty */}
                    {track.album && track.album.trim() !== '' && (
                      <p className="text-gray-500 text-xs sm:text-sm mb-3 truncate" title={track.album}>
                        {track.album}
                      </p>
                    )}
                    
                    {/* Stats */}
                    <div className="flex justify-between text-xs sm:text-sm text-gray-500">
                      <span>{(track.plays || 0).toLocaleString()} plays</span>
                      <div className="flex items-center gap-1">
                        <svg
                          className="w-3 h-3 sm:w-4 sm:h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                        <span>{track.likes || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* New Releases */}
          {activeTab === "new" && (
            <div className="grid grid-cols-[repeat(auto-fill,_minmax(250px,_1fr))] gap-4 sm:gap-6 md:gap-6">
              {newTracks.map((track) => (
                <Fragment key={`new-releases-tab-${track.id}`}><div
                  className="group card-bg rounded-2xl overflow-hidden transition-all duration-300 hover:border-[#FF4D67]/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-[#FF4D67]/10"
                >
                  <div className="relative">
                    {track.coverImage && track.coverImage.trim() !== '' ? (
                      <img
                        src={track.coverImage}
                        alt={track.title}
                        className="w-full h-40 sm:h-48 object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null; // Prevent infinite loop
                          target.style.display = 'none';
                          // Show fallback content
                          const parent = target.parentElement;
                          if (parent) {
                            const fallback = parent.querySelector('.image-fallback');
                            if (fallback) {
                              fallback.classList.remove('hidden');
                            }
                          }
                        } }
                        onLoad={(e) => {
                          const target = e.target as HTMLImageElement;
                          const parent = target.parentElement;
                          if (parent) {
                            const fallback = parent.querySelector('.image-fallback');
                            if (fallback) {
                              fallback.classList.add('hidden');
                            }
                          }
                        } } />
                    ) : null}
                    <div className="image-fallback absolute inset-0 bg-gradient-to-br from-[#FF4D67] to-[#FFCB2B] flex items-center justify-center w-full h-40 sm:h-48">
                      <span className="text-2xl font-bold text-white">
                        {track.title && track.title.trim().length > 0
                          ? track.title.trim().charAt(0).toUpperCase()
                          : '?'}
                      </span>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => {
                        // Find the full track object to get the audioURL
                        const fullTrack = trendingTracksData.find(
                          (t) => t._id === track.id
                        );
                        if (fullTrack && fullTrack.audioURL) {
                          playTrack({
                            id: track.id,
                            title: track.title,
                            artist: track.artist,
                            coverImage: track.coverImage,
                            audioUrl: fullTrack.audioURL,
                            creatorId: typeof fullTrack.creatorId === 'object' && fullTrack.creatorId !== null ? (fullTrack.creatorId as any)._id : fullTrack.creatorId
                          });

                          // Set the current playlist to all trending tracks
                          const playlistTracks = trendingTracksData
                            .filter((t) => t.audioURL) // Only tracks with audio
                            .map((t) => ({
                              id: t._id,
                              title: t.title,
                              artist: typeof t.creatorId === "object" &&
                                t.creatorId !== null
                                ? (t.creatorId as any).name
                                : "Unknown Artist",
                              coverImage: t.coverURL ||
                                "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
                              audioUrl: t.audioURL,
                              creatorId: typeof t.creatorId === 'object' && t.creatorId !== null ? (t.creatorId as any)._id : t.creatorId
                            }));
                          setCurrentPlaylist(playlistTracks);
                        }
                      } }
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full gradient-primary flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300"
                    >
                      {currentTrack?.id === track.id && isPlaying ? (
                        <svg
                          className="w-5 h-5 sm:w-6 sm:h-6"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 sm:w-6 sm:h-6"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Find the full track object
                        const fullTrack = trendingTracksData.find(t => t._id === track.id);
                        if (fullTrack) {
                          toggleFavorite(track.id, fullTrack);
                        }
                      } }
                      className="p-1.5 sm:p-2 rounded-full bg-black/30 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                    >
                      <svg
                        className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-200 ${favoriteStatus[track.id] ? 'text-red-500 fill-current scale-110' : 'stroke-current'}`}
                        fill={favoriteStatus[track.id] ? "currentColor" : "none"}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                      </svg>
                    </button>
                  </div>
                </div><div className="p-4 sm:p-5">
                    <h3 className="font-bold text-white text-lg mb-1 truncate">
                      {track.title}
                    </h3>
                    <p className="text-gray-400 text-sm sm:text-base mb-1 truncate">
                      {track.artist}
                    </p>
                    {track.album && (
                      <p className="text-gray-500 text-xs sm:text-sm mb-3 truncate">
                        {track.album}
                      </p>
                    )}

                    <div className="flex justify-between text-xs sm:text-sm text-gray-500">
                      <span>{track.plays.toLocaleString()} plays</span>
                      <div className="flex items-center gap-1">
                        <svg
                          className="w-3 h-3 sm:w-4 sm:h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                        <span>{track.likes}</span>
                      </div>
                    </div>
                  </div></Fragment>
              ))}
            </div>
          )}

          {/* Popular Creators */}
          {activeTab === "popular" && (
            <div className="grid grid-cols-[repeat(auto-fill,_minmax(250px,_1fr))] gap-4 sm:gap-6 md:gap-6">
              {popularCreators.map((creator) => (
                <div
                  key={creator._id || creator.id}
                  className="group card-bg rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:border-[#FFCB2B]/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-[#FFCB2B]/10 cursor-pointer"
                  onClick={() => router.push(`/artists/${creator._id || creator.id}`)}
                >
                  <div className="flex items-center gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-5">
                    <div className="relative">
                      {creator.avatar && creator.avatar.trim() !== '' ? (
                        <img
                          src={creator.avatar}
                          alt={creator.name}
                          className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover"
                        />
                      ) : (
                        generateAvatar(creator.name)
                      )}
                      {creator.verified && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#FF4D67] border-2 border-gray-900"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base sm:text-lg">
                        {creator.name}
                      </h3>
                      <p className="text-[#FFCB2B] text-xs sm:text-sm">
                        {creator.type}
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-5">
                    Creating amazing music that resonates with the heart of
                    Rwanda.
                  </p>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-xs sm:text-sm">
                      {(creator.followers || creator.followersCount || 0).toLocaleString()} followers
                    </span>
                    <button 
                      className={`px-3 py-1.5 sm:px-4 sm:py-2 ${followStatus[creator._id || creator.id || ''] ? 'bg-gray-600 hover:bg-gray-700 border-gray-600' : 'bg-transparent border border-[#FFCB2B] text-[#FFCB2B] hover:bg-[#FFCB2B]/10'} rounded-full text-xs sm:text-sm font-medium transition-colors`}
                      onClick={async (e) => {
                        e.stopPropagation();
                        const creatorId = creator._id || creator.id;
                        if (!creatorId) {
                          alert('Creator ID not found');
                          return;
                        }
                        if (!isAuthenticated) {
                          router.push('/login');
                        } else {
                          try {
                            if (followStatus[creatorId]) {
                              await unfollowCreator(creatorId);
                              
                              setFollowStatus(prev => ({
                                ...prev,
                                [creatorId]: false
                              }));
                              
                              console.log('Successfully unfollowed creator');
                            } else {
                              await followCreator(creatorId);
                              
                              setFollowStatus(prev => ({
                                ...prev,
                                [creatorId]: true
                              }));
                              
                              console.log('Successfully followed creator');
                            }
                          } catch (error) {
                            console.error('Failed to follow/unfollow creator:', error);
                            alert('Failed to follow/unfollow creator. Please try again.');
                          }
                        }
                      }}
                    >
                      {followStatus[creator._id || creator.id || ''] ? 'Unfollow' : 'Follow'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Beats */}
          {activeTab === "beats" && (
            <div className="grid grid-cols-[repeat(auto-fill,_minmax(250px,_1fr))] gap-4 sm:gap-6 md:gap-6">
              {beatsLoading ? (
                // Loading skeleton
                Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={`beat-skeleton-${index}`}
                    className="group card-bg rounded-2xl overflow-hidden transition-all duration-300"
                  >
                    <div className="relative">
                      <div className="w-full h-40 sm:h-48 bg-gray-700 animate-pulse"></div>
                    </div>
                    
                    <div className="p-4 sm:p-5">
                      <div className="h-4 bg-gray-700 rounded mb-2 animate-pulse"></div>
                      <div className="h-3 bg-gray-700 rounded w-3/4 animate-pulse"></div>
                      
                      <div className="flex justify-between items-center mt-3">
                        <div className="h-3 bg-gray-700 rounded w-1/3 animate-pulse"></div>
                        <div className="h-3 bg-gray-700 rounded w-1/3 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                beatTracksData.map((track) => {
                  // Transform the track to match the expected interface
                  const transformedTrack = {
                    id: track._id,
                    title: track.title,
                    artist: typeof track.creatorId === "object" && track.creatorId !== null
                      ? (track.creatorId as any).name
                      : "Unknown Artist",
                    album: "",
                    plays: track.plays || 0,
                    likes: track.likes || 0,
                    coverImage: track.coverURL || "",
                    duration: "",
                    category: track.type,
                    type: track.type,
                    paymentType: track.paymentType,
                    price: track.price, // Include price for paid beats
                    currency: track.currency, // Include currency for paid beats
                    creatorId: typeof track.creatorId === 'object' && track.creatorId !== null ? (track.creatorId as any)._id : track.creatorId
                  };
                  
                  return (
                    <div
                      key={transformedTrack.id}
                      className="group card-bg rounded-2xl overflow-hidden transition-all duration-300 hover:border-[#FF4D67]/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-[#FF4D67]/10"
                    >
                      <div className="relative">
                        {transformedTrack.coverImage && transformedTrack.coverImage.trim() !== '' ? (
                          <img
                            src={transformedTrack.coverImage}
                            alt={transformedTrack.title}
                            className="w-full h-40 sm:h-48 object-cover"
                          />
                        ) : (
                          <div className="w-full h-40 sm:h-48 bg-gradient-to-br from-[#FF4D67] to-[#FFCB2B] flex items-center justify-center">
                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                            </svg>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={() => {
                              // Use the track data directly
                              if (track.audioURL) {
                                playTrack({
                                  id: transformedTrack.id,
                                  title: transformedTrack.title,
                                  artist: transformedTrack.artist,
                                  coverImage: transformedTrack.coverImage,
                                  audioUrl: track.audioURL,
                                  creatorId: transformedTrack.creatorId,
                                  type: transformedTrack.type, // Include track type for WhatsApp functionality
                                  paymentType: transformedTrack.paymentType, // Include payment type for beat pricing
                                  price: transformedTrack.price, // Include price for paid beats
                                  currency: transformedTrack.currency, // Include currency for paid beats
                                  creatorWhatsapp: (typeof track.creatorId === 'object' && track.creatorId !== null 
                                    ? (track.creatorId as any).whatsappContact 
                                    : undefined) // Include creator's WhatsApp contact
                                });

                                // Set the current playlist to all beat tracks
                                const playlistTracks = beatTracksData
                                  .filter((t) => t.audioURL) // Only tracks with audio
                                  .map((t) => ({
                                    id: t._id,
                                    title: t.title,
                                    artist:
                                      typeof t.creatorId === "object" &&
                                      t.creatorId !== null
                                        ? (t.creatorId as any).name
                                        : "Unknown Artist",
                                    coverImage:
                                      t.coverURL ||
                                      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
                                    audioUrl: t.audioURL,
                                    creatorId: typeof t.creatorId === 'object' && t.creatorId !== null ? (t.creatorId as any)._id : t.creatorId,
                                    type: t.type, // Include track type for WhatsApp functionality
                                    paymentType: t.paymentType, // Include payment type for beat pricing
                                    price: t.price, // Include price for paid beats
                                    currency: t.currency, // Include currency for paid beats
                                    creatorWhatsapp: (typeof t.creatorId === 'object' && t.creatorId !== null 
                                      ? (t.creatorId as any).whatsappContact 
                                      : undefined) // Include creator's WhatsApp contact
                                  }));
                                setCurrentPlaylist(playlistTracks);
                              }
                            }}
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full gradient-primary flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300"
                          >
                            {currentTrack?.id === transformedTrack.id && isPlaying ? (
                              <svg
                                className="w-5 h-5 sm:w-6 sm:h-6"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                ></path>
                              </svg>
                            ) : (
                              <svg
                                className="w-5 h-5 sm:w-6 sm:h-6"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                  clipRule="evenodd"
                                ></path>
                              </svg>
                            )}
                          </button>
                        </div>
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              // Use the track data directly
                              toggleFavorite(transformedTrack.id, track);
                            }}
                            className="p-1.5 sm:p-2 rounded-full bg-black/30 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                          >
                            <svg 
                              className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-200 ${favoriteStatus[transformedTrack.id] ? 'text-red-500 fill-current scale-110' : 'stroke-current'}`}
                              fill={favoriteStatus[transformedTrack.id] ? "currentColor" : "none"}
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
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-bold text-white text-lg truncate flex-1">
                            {transformedTrack.title}
                          </h3>
                          {/* Beat indicator badge */}
                          {transformedTrack.type === 'beat' && (
                            <span className="ml-2 px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full whitespace-nowrap">
                              BEAT
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm sm:text-base mb-1 truncate">
                          {transformedTrack.artist}
                        </p>
                        {transformedTrack.album && (
                          <p className="text-gray-500 text-xs sm:text-sm mb-3 truncate">
                            {transformedTrack.album}
                          </p>
                        )}
                        
                        {/* Payment type indicator for beats */}
                        {transformedTrack.type === 'beat' && (
                          <div className="mt-2">
                            {(() => {
                              // Handle missing or null paymentType by defaulting to 'free'
                              const paymentType = transformedTrack.paymentType || 'free';
                              return (
                                <>
                                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${paymentType === 'paid' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
                                    {paymentType === 'paid' ? 'PAID BEAT' : 'FREE BEAT'}
                                  </span>
                                  {paymentType === 'paid' && transformedTrack.price && (
                                    <span className="ml-2 inline-block px-2 py-1 text-xs rounded-full bg-yellow-600 text-white">
                                      {transformedTrack.price.toLocaleString()} RWF
                                    </span>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        )}

                        <div className="flex justify-between text-xs sm:text-sm text-gray-500 mt-2">
                          <span>{transformedTrack.plays?.toLocaleString() || '0'} plays</span>
                          <div className="flex items-center gap-1">
                            <svg
                              className="w-3 h-3 sm:w-4 sm:h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                fillRule="evenodd"
                                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                                clipRule="evenodd"
                              ></path>
                            </svg>
                            <span>{transformedTrack.likes || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
              })
            )}
            </div>
          )}

          {/* Mixes */}
          {activeTab === "mixes" && (
            <div className="grid grid-cols-[repeat(auto-fill,_minmax(250px,_1fr))] gap-4 sm:gap-6 md:gap-6">
              {trendingTracks
                .filter((track: Track) => track.category === "mix")
                .map((track: Track) => (
                  <div
                    key={`mixes-tab-${track.id}`}
                    className="group card-bg rounded-2xl overflow-hidden transition-all duration-300 hover:border-[#FF4D67]/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-[#FF4D67]/10"
                  >
                    <div className="relative">
                      {track.coverImage && track.coverImage.trim() !== '' ? (
                        <img
                          src={track.coverImage}
                          alt={track.title}
                          className="w-full h-40 sm:h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-40 sm:h-48 bg-gradient-to-br from-[#FF4D67] to-[#FFCB2B] flex items-center justify-center">
                          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={() => {
                            // Find the full track object to get the audioURL
                            const fullTrack = trendingTracksData.find(
                              (t) => t._id === track.id,
                            );
                            if (fullTrack && fullTrack.audioURL) {
                              playTrack({
                                id: track.id,
                                title: track.title,
                                artist: track.artist,
                                coverImage: track.coverImage,
                                audioUrl: fullTrack.audioURL,
                                creatorId: typeof fullTrack.creatorId === 'object' && fullTrack.creatorId !== null ? (fullTrack.creatorId as any)._id : fullTrack.creatorId
                              });

                              // Set the current playlist to all trending tracks
                              const playlistTracks = trendingTracksData
                                .filter((t) => t.audioURL) // Only tracks with audio
                                .map((t) => ({
                                  id: t._id,
                                  title: t.title,
                                  artist:
                                    typeof t.creatorId === "object" &&
                                    t.creatorId !== null
                                      ? (t.creatorId as any).name
                                      : "Unknown Artist",
                                  coverImage:
                                    t.coverURL ||
                                    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
                                  audioUrl: t.audioURL,
                                  creatorId: typeof t.creatorId === 'object' && t.creatorId !== null ? (t.creatorId as any)._id : t.creatorId
                                }));
                              setCurrentPlaylist(playlistTracks);
                            }
                          }}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full gradient-primary flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300"
                        >
                          {currentTrack?.id === track.id && isPlaying ? (
                            <svg
                              className="w-5 h-5 sm:w-6 sm:h-6"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              ></path>
                            </svg>
                          ) : (
                            <svg
                              className="w-5 h-5 sm:w-6 sm:h-6"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                clipRule="evenodd"
                              ></path>
                            </svg>
                          )}
                        </button>
                      </div>
                      <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            // Find the full track object
                            const fullTrack = trendingTracksData.find(t => t._id === track.id);
                            if (fullTrack) {
                              toggleFavorite(track.id, fullTrack);
                            }
                          }}
                          className="p-1.5 sm:p-2 rounded-full bg-black/30 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                        >
                          <svg 
                            className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-200 ${favoriteStatus[track.id] ? 'text-red-500 fill-current scale-110' : 'stroke-current'}`}
                            fill={favoriteStatus[track.id] ? "currentColor" : "none"}
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
                      <h3 className="font-bold text-white text-lg mb-1 truncate">
                        {track.title}
                      </h3>
                      <p className="text-gray-400 text-sm sm:text-base mb-1 truncate">
                        {track.artist}
                      </p>
                      {track.album && (
                        <p className="text-gray-500 text-xs sm:text-sm mb-3 truncate">
                          {track.album}
                        </p>
                      )}

                      <div className="flex justify-between text-xs sm:text-sm text-gray-500">
                        <span>{track.plays?.toLocaleString() || '0'} plays</span>
                        <div className="flex items-center gap-1">
                          <svg
                            className="w-3 h-3 sm:w-4 sm:h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                              clipRule="evenodd"
                            ></path>
                          </svg>
                          <span>{track.likes || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>

        {/* Additional content to ensure enough height for testing sticky behavior */}
        <div className="h-96 md:h-[500px]"></div>

        {/* Removed duplicate footer - using global Footer component instead */}
          <div className="container mx-auto px-4">
            <><div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-1 md:col-span-2">
                <div className="mb-4 flex items-center">
                  <img src="/muzikax.png" alt="MuzikaX Logo" className="h-8 w-auto" />
                  <span className="ml-3 text-xl font-bold text-white">MuzikaX</span>
                </div>
                <p className="text-gray-400 mb-6">
                  Discover, share, and enjoy the best of Rwandan music. Connect
                  with talented creators and experience the rich sounds of our
                  culture.
                </p>
                <div className="flex space-x-4">
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </a>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </a>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                    </svg>
                  </a>
                </div>
              </div>

              <div>
                <h3 className="text-white font-semibold mb-4">Quick Links</h3>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="/"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Home
                    </a>
                  </li>
                  <li>
                    <a
                      href="/explore"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Explore
                    </a>
                  </li>
                  <li>
                    <a
                      href="/tracks"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Tracks
                    </a>
                  </li>
                  <li>
                    <a
                      href="/artists"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Artists
                    </a>
                  </li>
                  <li>
                    <a
                      href="/upload"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Upload
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-white font-semibold mb-4">Legal</h3>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="/terms"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Terms of Service
                    </a>
                  </li>
                  <li>
                    <a
                      href="/privacy"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a
                      href="/cookies"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Cookie Policy
                    </a>
                  </li>
                  <li>
                    <a
                      href="/copyright"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Copyright
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
                <p>
                  &copy; 2024 MuzikaX. All rights reserved. Made with ❤️ for
                  Rwandan Music.
                </p>
              </div></>
          </div>
        
      </main>
    </div>
  );
}

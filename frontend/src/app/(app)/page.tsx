"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { useTrendingTracks, usePopularCreators } from "../../hooks/useTracks";
import { useAudioPlayer } from "../../contexts/AudioPlayerContext";
import { getAlbumById } from "../../services/albumService";
import FloatingButtons from "../../components/FloatingButtons";

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
  creatorId?: string;
}

interface Creator {
  id: string;
  name: string;
  type: string;
  followers: number;
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
    "trending" | "new" | "popular" | "mixes"
  >("trending");
  const [currentSlide, setCurrentSlide] = useState(0);
  const { currentTrack, isPlaying, playTrack, setCurrentPlaylist, favorites, favoritesLoading, addToFavorites, removeFromFavorites } =
    useAudioPlayer();

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

  // Fetch real trending tracks
  const { tracks: trendingTracksData, loading: trendingLoading, refresh: refreshTrendingTracks } =
    useTrendingTracks(0); // 0 means no limit - get all tracks
  


  


  // Fetch real popular creators
  const { creators: popularCreatorsData, loading: creatorsLoading } =
    usePopularCreators(6);

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

  // Transform tracks data to match existing interface
  const trendingTracks: Track[] = trendingTracksData
    .map((track) => ({
    id: track._id,
    title: track.title,
    artist:
      typeof track.creatorId === "object" && track.creatorId !== null
        ? (track.creatorId as any).name
        : "Unknown Artist",
    album: "",
    plays: track.plays,
    likes: track.likes,
    coverImage: track.coverURL || "", // Preserve empty values so we can show fallback in UI
    duration: "",
    category: track.type,
    creatorId: typeof track.creatorId === 'object' && track.creatorId !== null ? (track.creatorId as any)._id : track.creatorId
  }));

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

  // For You section - use trending tracks for now
  const forYouTracks: Track[] = trendingTracks.slice(0, 4);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black w-full relative overflow-visible">
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
      <aside className="hidden md:block md:w-64 bg-gray-900/50 border-r border-gray-800 p-6 overflow-y-auto scrollbar-hide sidebar-scrollbar-hide fixed top-0 left-0 h-screen flex-shrink-0 z-30" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
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
              href="/explore?category=traditional"
              className="block px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
            >
              Traditional
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

      {/* Main Content Area - This takes remaining space, offset for fixed sidebar */}
      <main className="flex-1 flex flex-col w-full min-h-screen md:ml-64">
        {/* Enhanced Hero Section with Image Slider */}
        <section className="relative py-8 md:py-12 lg:py-16 overflow-hidden w-full">
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

          <div className="w-full px-4 md:px-8 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#FF4D67] to-[#FFCB2B] mb-4 sm:mb-6 animate-fade-in">
                {heroSlides[currentSlide].title}
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-gray-200 mb-6 sm:mb-8 animate-fade-in-delay">
                {heroSlides[currentSlide].subtitle}
              </p>
              <div className="flex flex-wrap gap-3 sm:gap-4 justify-center animate-fade-in-delay-2">
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

        {/* For You Section */}
        <section className="w-full px-4 md:px-8 py-8 sm:py-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              For You
            </h2>
            <a
              href="/foryou"
              className="text-[#FF4D67] hover:text-[#FFCB2B] text-sm sm:text-base transition-colors"
            >
              View All
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {forYouTracks.map((track) => (
              <div
                key={track.id}
                className="group card-bg rounded-xl overflow-hidden transition-all duration-300 hover:border-[#FF4D67]/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-[#FF4D67]/10"
              >
                <div className="relative">
                  {track.coverImage && track.coverImage.trim() !== '' ? (
                    <img
                      src={track.coverImage}
                      alt={track.title}
                      className="w-full aspect-square object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-gradient-to-br from-[#FF4D67] to-[#FFCB2B] flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
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
                              creatorWhatsapp: (typeof t.creatorId === 'object' && t.creatorId !== null 
                                ? (t.creatorId as any).whatsappContact 
                                : undefined) // Include creator's WhatsApp contact
                            }));
                          setCurrentPlaylist(playlistTracks);
                        }
                      }}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full gradient-primary flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300"
                    >
                      {currentTrack?.id === track.id && isPlaying ? (
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5"
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
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Find the full track object
                        const fullTrack = trendingTracksData.find(t => t._id === track.id);
                        if (fullTrack) {
                          toggleFavorite(track.id, fullTrack);
                        }
                      }}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:scale-110"
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

                <div className="p-3">
                  <h3 className="font-bold text-white text-sm sm:text-base mb-1 truncate">
                    {track.title}
                  </h3>
                  <p className="text-gray-400 text-xs sm:text-sm truncate">
                    {track.artist}
                  </p>
                  
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>{track.plays?.toLocaleString() || '0'} plays</span>
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path>
                      </svg>
                      <span>{track.likes || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Popular Artists Section */}
        <section className="w-full px-4 md:px-8 py-8 sm:py-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Popular Artists
            </h2>
            <a
              href="/artists"
              className="text-[#FF4D67] hover:text-[#FFCB2B] text-sm sm:text-base transition-colors"
            >
              View All
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {popularCreators.map((creator) => (
              <div
                key={creator.id}
                className="group card-bg rounded-xl p-4 transition-all duration-300 hover:border-[#FFCB2B]/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-[#FFCB2B]/10"
              >
                <div 
                  className="flex flex-col items-center text-center cursor-pointer"
                  onClick={() => router.push(`/artists/${creator.id}`)}
                >
                  <div className="relative mb-3">
                    {creator.avatar && creator.avatar.trim() !== '' ? (
                      <img
                        src={creator.avatar}
                        alt={creator.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover mx-auto"
                      />
                    ) : (
                      generateAvatar(creator.name)
                    )}
                    {creator.verified && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#FF4D67] border-2 border-gray-900 flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                      </div>
                    )}
                  </div>                  <h3 className="font-bold text-white text-sm sm:text-base truncate w-full">
                    {creator.name}
                  </h3>
                  <p className="text-[#FFCB2B] text-xs sm:text-sm mb-2">
                    {creator.type}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {creator.followers.toLocaleString()} followers
                  </p>
                  <button 
                    className="mt-2 w-full px-3 py-1.5 bg-transparent border border-[#FFCB2B] text-[#FFCB2B] hover:bg-[#FFCB2B]/10 rounded-full text-xs font-medium transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isAuthenticated) {
                        router.push('/login');
                      } else {
                        // Handle follow action here
                        console.log('Following', creator.name);
                        // In a real implementation, you would make an API call to follow the creator
                      }
                    }}
                  >
                    Follow
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
        {/* Popular Albums Section */}
        <section className="w-full px-4 md:px-8 py-8 sm:py-10">
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

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
                                : track.creatorId
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

        {/* Popular Beats Section */}
        {/* Popular Mixes Section */}
        <section className="w-full px-4 md:px-8 py-8 sm:py-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Popular Mixes
            </h2>
            <a
              href="/tracks?category=mixes"
              className="text-[#FF4D67] hover:text-[#FFCB2B] text-sm sm:text-base transition-colors"
            >
              View All
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {trendingTracks
              .filter((track) => track.category === "mix")
              .slice(0, 6)
              .map((track) => (
                <div
                  key={track.id}
                  className="group card-bg rounded-xl overflow-hidden transition-all duration-300 hover:border-[#FF4D67]/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-[#FF4D67]/10"
                >
                  <div className="relative">
                    {track.coverImage && track.coverImage.trim() !== '' ? (
                      <img
                        src={track.coverImage}
                        alt={track.title}
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
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full gradient-primary flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300"
                      >
                        {currentTrack?.id === track.id && isPlaying ? (
                          <svg
                            className="w-4 h-4 sm:w-5 sm:h-5"
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
                      {track.title}
                    </h3>
                    <p className="text-gray-400 text-xs sm:text-sm truncate">
                      {track.artist}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-gray-500 text-xs">
                        {track.duration}
                      </span>
                      <div className="flex items-center gap-1">
                        <svg
                          className="w-3 h-3 sm:w-4 sm:h-4 text-[#FF4D67]"
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
                        <span className="text-gray-500 text-xs">
                          {track.likes}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </section>

        {/* Music Lists */}
        <section className="w-full px-4 md:px-8 py-8 sm:py-10 pb-8">
          {/* Tabs */}
          <div className="flex overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide mb-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
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
                  activeTab === "mixes"
                    ? "text-[#FF4D67] border-b-2 border-[#FF4D67]"
                    : "text-gray-500 hover:text-gray-300"
                }`}
                onClick={() => setActiveTab("mixes")}
              >
                Mixes
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {trendingTracks.map((track) => (
                <div
                  key={track.id}
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
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* New Releases */}
          {activeTab === "new" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {newTracks.map((track) => (
                <div
                  key={track.id}
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
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Popular Creators */}
          {activeTab === "popular" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {popularCreators.map((creator) => (
                <div
                  key={creator.id}
                  className="group card-bg rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:border-[#FFCB2B]/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-[#FFCB2B]/10 cursor-pointer"
                  onClick={() => router.push(`/artists/${creator.id}`)}
                >
                  <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
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
                      {creator.followers.toLocaleString()} followers
                    </span>
                    <button 
                      className="px-3 py-1.5 sm:px-4 sm:py-2 bg-transparent border border-[#FFCB2B] text-[#FFCB2B] hover:bg-[#FFCB2B]/10 rounded-full text-xs sm:text-sm font-medium transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isAuthenticated) {
                          router.push('/login');
                        } else {
                          // Handle follow action here
                          console.log('Following', creator.name);
                          // In a real implementation, you would make an API call to follow the creator
                        }
                      }}
                    >
                      Follow
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}



          {/* Mixes */}
          {activeTab === "mixes" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {trendingTracks
                .filter((track) => track.category === "mix")
                .map((track) => (
                  <div
                    key={track.id}
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


        
      </main>
      {/* Spacer to push footer down */}
      <div className="flex-grow"></div>
    </div>
  );
}

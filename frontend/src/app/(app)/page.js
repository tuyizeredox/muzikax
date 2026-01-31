"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { useTrendingTracks, usePopularCreators } from "../../hooks/useTracks";
import { useAudioPlayer } from "../../contexts/AudioPlayerContext";
import { getAlbumById } from "../../services/albumService";
// Function to generate avatar with first letter of name
const generateAvatar = (name) => {
    const firstLetter = name.charAt(0).toUpperCase();
    return (_jsx("div", { className: "w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-[#FF4D67] to-[#FFCB2B] flex items-center justify-center mx-auto", children: _jsx("span", { className: "text-xl sm:text-2xl font-bold text-white", children: firstLetter }) }));
};
// Albums are now fetched directly from the API, so we don't need this function anymore
export default function Home() {
    const [activeTab, setActiveTab] = useState("trending");
    const [currentSlide, setCurrentSlide] = useState(0);
    const { isAuthenticated, userRole } = useAuth();
    const { currentTrack, isPlaying, playTrack, setCurrentPlaylist, favorites, favoritesLoading, addToFavorites, removeFromFavorites } = useAudioPlayer();
    const router = useRouter();
    // State for tracking which tracks are favorited
    const [favoriteStatus, setFavoriteStatus] = useState({});
    // Update favorite status when favorites change or when favorites are loaded
    useEffect(() => {
        if (!favoritesLoading) {
            const status = {};
            favorites.forEach(track => {
                status[track.id] = true;
            });
            setFavoriteStatus(status);
        }
    }, [favorites, favoritesLoading]);
    // Listen for favorites loaded event to update favorite status
    useEffect(() => {
        const handleFavoritesLoaded = () => {
            const status = {};
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
    const toggleFavorite = (trackId, track) => {
        if (favoriteStatus[trackId]) {
            // Remove from favorites
            removeFromFavorites(trackId);
        }
        else {
            // Add to favorites
            addToFavorites({
                id: track._id,
                title: track.title,
                artist: typeof track.creatorId === 'object' && track.creatorId !== null
                    ? track.creatorId.name
                    : 'Unknown Artist',
                coverImage: track.coverURL || '',
                audioUrl: track.audioURL || '',
                creatorId: typeof track.creatorId === 'object' && track.creatorId !== null
                    ? track.creatorId._id
                    : track.creatorId
            });
        }
    };
    // Redirect admin users to admin dashboard
    useEffect(() => {
        console.log("Checking admin redirect:", { isAuthenticated, userRole });
        if (isAuthenticated && userRole === "admin") {
            console.log("Redirecting admin to /admin");
            router.replace("/admin");
            return;
        }
    }, [isAuthenticated, userRole, router]);
    // Don't render home page content for admin users
    if (isAuthenticated && userRole === "admin") {
        console.log("Rendering null for admin user");
        return null;
    }
    // Hero slider images
    const heroSlides = [
        {
            id: 1,
            title: "Discover Rwandan Music",
            subtitle: "Explore the vibrant sounds of Rwanda",
            image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
            cta: "Explore Music",
        },
        {
            id: 2,
            title: "Share Your Talent",
            subtitle: "Upload your music and connect with fans",
            image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
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
    const { tracks: trendingTracksData, loading: trendingLoading, refresh: refreshTrendingTracks } = useTrendingTracks(0); // 0 means no limit - get all tracks
    // Fetch real popular creators
    const { creators: popularCreatorsData, loading: creatorsLoading } = usePopularCreators(6);
    // Listen for track updates (when favorites are added/removed)
    useEffect(() => {
        const handleTrackUpdate = (event) => {
            const detail = event.detail;
            if (detail && detail.trackId) {
                // Update favorite status if provided
                if (detail.isFavorite !== undefined) {
                    setFavoriteStatus(prev => (Object.assign(Object.assign({}, prev), { [detail.trackId]: detail.isFavorite })));
                }
                // Refresh trending tracks to update like counts
                refreshTrendingTracks();
            }
        };
        // Add event listener
        window.addEventListener('trackUpdated', handleTrackUpdate);
        // Clean up event listener
        return () => {
            window.removeEventListener('trackUpdated', handleTrackUpdate);
        };
    }, [refreshTrendingTracks]);
    // Transform tracks data to match existing interface
    const trendingTracks = trendingTracksData
        .map((track) => ({
        id: track._id,
        title: track.title,
        artist: typeof track.creatorId === "object" && track.creatorId !== null
            ? track.creatorId.name
            : "Unknown Artist",
        album: "",
        plays: track.plays,
        likes: track.likes,
        coverImage: track.coverURL || "", // Preserve empty values so we can show fallback in UI
        duration: "",
        category: track.type,
        creatorId: typeof track.creatorId === 'object' && track.creatorId !== null ? track.creatorId._id : track.creatorId
    }));
    // For now, use trending tracks for new tracks as well
    const newTracks = trendingTracks;
    // Transform creators data to match existing interface
    const popularCreators = popularCreatorsData.map((creator) => ({
        id: creator._id,
        name: creator.name,
        type: creator.creatorType || "Artist",
        followers: creator.followersCount || 0,
        avatar: creator.avatar || "", // Preserve empty values so we can show fallback in UI
        verified: true, // For now, we'll assume all creators are verified
    }));
    // Fetch real albums from the API
    const [popularAlbums, setPopularAlbums] = useState([]);
    const [albumsLoading, setAlbumsLoading] = useState(true);
    const [playingAlbumId, setPlayingAlbumId] = useState(null);
    useEffect(() => {
        const fetchAlbums = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/albums?page=1&limit=6`);
                if (response.ok) {
                    const data = await response.json();
                    const albums = data.albums.map((album) => {
                        var _a;
                        return ({
                            id: album._id,
                            title: album.title,
                            artist: typeof album.creatorId === "object" && album.creatorId !== null
                                ? album.creatorId.name
                                : "Unknown Artist",
                            coverImage: album.coverURL || "",
                            year: album.releaseDate ? new Date(album.releaseDate).getFullYear() : new Date().getFullYear(),
                            tracks: ((_a = album.tracks) === null || _a === void 0 ? void 0 : _a.length) || 0
                        });
                    });
                    setPopularAlbums(albums);
                }
            }
            catch (error) {
                console.error('Error fetching albums:', error);
                // Set empty array if API fails
                setPopularAlbums([]);
            }
            finally {
                setAlbumsLoading(false);
            }
        };
        if (trendingTracksData.length > 0) {
            fetchAlbums();
        }
    }, [trendingTracksData]);
    // For You section - use trending tracks for now
    const forYouTracks = trendingTracks.slice(0, 4);
    return (_jsxs("div", { className: "flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black w-full relative overflow-visible", children: [trendingLoading && (_jsx("div", { className: "fixed inset-0 bg-black/70 flex items-center justify-center z-50", children: _jsx("div", { className: "text-white text-xl", children: "Loading..." }) })), _jsx("div", { className: "absolute top-10 left-10 w-64 h-64 bg-[#FF4D67]/10 rounded-full blur-3xl -z-10 hidden md:block" }), _jsx("div", { className: "absolute bottom-10 right-10 w-64 h-64 bg-[#FFCB2B]/10 rounded-full blur-3xl -z-10 hidden md:block" }), _jsxs("aside", { className: "hidden md:block md:w-64 bg-gray-900/50 border-r border-gray-800 p-6 overflow-y-auto scrollbar-hide sidebar-scrollbar-hide fixed top-0 left-0 h-screen flex-shrink-0 z-30", style: { scrollbarWidth: 'none', msOverflowStyle: 'none' }, children: [_jsx("div", { className: "mb-8", children: _jsx("h1", { className: "text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF4D67] to-[#FFCB2B]", children: "MUZIKAX" }) }), _jsxs("nav", { className: "space-y-2", children: [_jsxs(Link, { href: "/", className: "flex items-center gap-3 px-4 py-3 rounded-lg bg-[#FF4D67]/10 text-white", children: [_jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" }) }), _jsx("span", { children: "Home" })] }), _jsxs(Link, { href: "/explore", className: "flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors", children: [_jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }) }), _jsx("span", { children: "Explore" })] }), isAuthenticated ? (userRole === "creator" ? (_jsxs(Link, { href: "/upload", className: "flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors", children: [_jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" }) }), _jsx("span", { children: "Upload" })] })) : (_jsxs("button", { onClick: () => {
                                    // Redirect to upload page where they can upgrade
                                    router.push("/upload");
                                }, className: "flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors w-full text-left", children: [_jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" }) }), _jsx("span", { children: "Upload" })] }))) : (_jsxs("button", { onClick: () => {
                                    // Redirect to login page
                                    router.push("/login");
                                }, className: "flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors w-full text-left", children: [_jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" }) }), _jsx("span", { children: "Upload" })] }))] }), _jsxs("div", { className: "mt-8", children: [_jsx("h2", { className: "text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3", children: "Categories" }), _jsxs("nav", { className: "space-y-1", children: [_jsx(Link, { href: "/explore?category=afrobeat", className: "block px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors", children: "Afrobeat" }), _jsx(Link, { href: "/explore?category=hiphop", className: "block px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors", children: "Hip Hop" }), _jsx(Link, { href: "/explore?category=rnb", className: "block px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors", children: "R&B" }), _jsx(Link, { href: "/explore?category=afropop", className: "block px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors", children: "Afropop" }), _jsx(Link, { href: "/explore?category=gospel", className: "block px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors", children: "Gospel" }), _jsx(Link, { href: "/explore?category=traditional", className: "block px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors", children: "Traditional" })] })] }), _jsxs("div", { className: "mt-8", children: [_jsx("h2", { className: "text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3", children: "Library" }), _jsxs("nav", { className: "space-y-1", children: [_jsxs(Link, { href: "/favorites", className: "flex items-center gap-3 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors", children: [_jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" }) }), _jsx("span", { children: "Favorites" })] }), _jsxs(Link, { href: "/recently-played", className: "flex items-center gap-3 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors", children: [_jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" }) }), _jsx("span", { children: "Recently Played" })] })] })] })] }), _jsxs("main", { className: "flex-1 flex flex-col w-full min-h-screen md:ml-64", children: [_jsxs("section", { className: "relative py-8 md:py-12 lg:py-16 overflow-hidden w-full", children: [_jsx("div", { className: "absolute inset-0", children: heroSlides.map((slide, index) => (_jsx("div", { className: `absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? "opacity-100" : "opacity-0"}`, children: _jsx("div", { className: "absolute inset-0 bg-cover bg-center", style: { backgroundImage: `url(${slide.image})` }, children: _jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/70 to-gray-900/30" }) }) }, slide.id))) }), _jsx("div", { className: "w-full px-4 md:px-8 relative z-10", children: _jsxs("div", { className: "max-w-3xl mx-auto text-center", children: [_jsx("h1", { className: "text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#FF4D67] to-[#FFCB2B] mb-4 sm:mb-6 animate-fade-in", children: heroSlides[currentSlide].title }), _jsx("p", { className: "text-lg sm:text-xl md:text-2xl text-gray-200 mb-6 sm:mb-8 animate-fade-in-delay", children: heroSlides[currentSlide].subtitle }), _jsx("div", { className: "flex flex-wrap gap-3 sm:gap-4 justify-center animate-fade-in-delay-2", children: _jsx("button", { className: "px-5 py-2.5 sm:px-6 sm:py-3 btn-primary font-medium rounded-lg transition-all hover:scale-105 text-sm sm:text-base", onClick: () => {
                                                    // Primary CTA button functionality
                                                    if (heroSlides[currentSlide].cta === "Explore Music") {
                                                        router.push("/explore");
                                                    }
                                                    else if (heroSlides[currentSlide].cta === "Upload Track") {
                                                        // Check authentication and role before allowing upload
                                                        if (!isAuthenticated) {
                                                            router.push("/login");
                                                        }
                                                        else if (userRole === "creator") {
                                                            router.push("/upload");
                                                        }
                                                        else {
                                                            // Fans can upgrade to creator, redirect to upload page
                                                            router.push("/upload");
                                                        }
                                                    }
                                                    else {
                                                        router.push("/");
                                                    }
                                                }, children: heroSlides[currentSlide].cta }) })] }) }), _jsx("div", { className: "absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2", children: heroSlides.map((_, index) => (_jsx("button", { onClick: () => setCurrentSlide(index), className: `w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all ${index === currentSlide
                                        ? "bg-[#FF4D67] w-4 sm:w-6"
                                        : "bg-white/50 hover:bg-white"}` }, index))) }), _jsx("button", { onClick: () => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length), className: "hidden sm:flex absolute left-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-all", children: _jsx("svg", { className: "w-5 h-5 sm:w-6 sm:h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M15 19l-7-7 7-7" }) }) }), _jsx("button", { onClick: () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length), className: "hidden sm:flex absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-all", children: _jsx("svg", { className: "w-5 h-5 sm:w-6 sm:h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9 5l7 7-7 7" }) }) })] }), _jsxs("section", { className: "w-full px-4 md:px-8 py-8 sm:py-10", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-xl sm:text-2xl font-bold text-white", children: "For You" }), _jsx("a", { href: "/foryou", className: "text-[#FF4D67] hover:text-[#FFCB2B] text-sm sm:text-base transition-colors", children: "View All" })] }), _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4", children: forYouTracks.map((track) => {
                                    var _a;
                                    return (_jsxs("div", { className: "group card-bg rounded-xl overflow-hidden transition-all duration-300 hover:border-[#FF4D67]/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-[#FF4D67]/10", children: [_jsxs("div", { className: "relative", children: [track.coverImage && track.coverImage.trim() !== '' ? (_jsx("img", { src: track.coverImage, alt: track.title, className: "w-full aspect-square object-cover" })) : (_jsx("div", { className: "w-full aspect-square bg-gradient-to-br from-[#FF4D67] to-[#FFCB2B] flex items-center justify-center", children: _jsx("svg", { className: "w-8 h-8 text-white", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" }) }) })), _jsxs("div", { className: "absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2", children: [_jsx("button", { onClick: () => {
                                                                    // Find the full track object to get the audioURL
                                                                    const fullTrack = trendingTracksData.find((t) => t._id === track.id);
                                                                    if (fullTrack && fullTrack.audioURL) {
                                                                        playTrack({
                                                                            id: track.id,
                                                                            title: track.title,
                                                                            artist: track.artist,
                                                                            coverImage: track.coverImage,
                                                                            audioUrl: fullTrack.audioURL,
                                                                            plays: fullTrack.plays || 0,
                                                                            likes: fullTrack.likes || 0,
                                                                            creatorId: typeof fullTrack.creatorId === 'object' && fullTrack.creatorId !== null ? fullTrack.creatorId._id : fullTrack.creatorId,
                                                                            type: fullTrack.type, // Include track type for WhatsApp functionality
                                                                            creatorWhatsapp: (typeof fullTrack.creatorId === 'object' && fullTrack.creatorId !== null
                                                                                ? fullTrack.creatorId.whatsappContact
                                                                                : undefined) // Include creator's WhatsApp contact
                                                                        });
                                                                        // Set the current playlist to all trending tracks
                                                                        const playlistTracks = trendingTracksData
                                                                            .filter((t) => t.audioURL) // Only tracks with audio
                                                                            .map((t) => ({
                                                                            id: t._id,
                                                                            title: t.title,
                                                                            artist: typeof t.creatorId === "object" &&
                                                                                t.creatorId !== null
                                                                                ? t.creatorId.name
                                                                                : "Unknown Artist",
                                                                            coverImage: t.coverURL ||
                                                                                "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
                                                                            audioUrl: t.audioURL,
                                                                            creatorId: typeof t.creatorId === 'object' && t.creatorId !== null ? t.creatorId._id : t.creatorId,
                                                                            type: t.type, // Include track type for WhatsApp functionality
                                                                            creatorWhatsapp: (typeof t.creatorId === 'object' && t.creatorId !== null
                                                                                ? t.creatorId.whatsappContact
                                                                                : undefined) // Include creator's WhatsApp contact
                                                                        }));
                                                                        setCurrentPlaylist(playlistTracks);
                                                                    }
                                                                }, className: "w-10 h-10 sm:w-12 sm:h-12 rounded-full gradient-primary flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300", children: (currentTrack === null || currentTrack === void 0 ? void 0 : currentTrack.id) === track.id && isPlaying ? (_jsx("svg", { className: "w-4 h-4 sm:w-5 sm:h-5", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z", clipRule: "evenodd" }) })) : (_jsx("svg", { className: "w-4 h-4 sm:w-5 sm:h-5", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z", clipRule: "evenodd" }) })) }), _jsx("button", { onClick: (e) => {
                                                                    e.stopPropagation();
                                                                    // Find the full track object
                                                                    const fullTrack = trendingTracksData.find(t => t._id === track.id);
                                                                    if (fullTrack) {
                                                                        toggleFavorite(track.id, fullTrack);
                                                                    }
                                                                }, className: "w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:scale-110", children: _jsx("svg", { className: `w-4 h-4 sm:w-5 sm:h-5 transition-all duration-200 ${favoriteStatus[track.id] ? 'text-red-500 fill-current scale-110' : 'stroke-current'}`, fill: favoriteStatus[track.id] ? "currentColor" : "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" }) }) })] })] }), _jsxs("div", { className: "p-3", children: [_jsx("h3", { className: "font-bold text-white text-sm sm:text-base mb-1 truncate", children: track.title }), _jsx("p", { className: "text-gray-400 text-xs sm:text-sm truncate", children: track.artist }), _jsxs("div", { className: "flex justify-between text-xs text-gray-500 mt-2", children: [_jsxs("span", { children: [((_a = track.plays) === null || _a === void 0 ? void 0 : _a.toLocaleString()) || '0', " plays"] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("svg", { className: "w-3 h-3", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z", clipRule: "evenodd" }) }), _jsx("span", { children: track.likes || 0 })] })] })] })] }, track.id));
                                }) })] }), _jsxs("section", { className: "w-full px-4 md:px-8 py-8 sm:py-10", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-xl sm:text-2xl font-bold text-white", children: "Popular Artists" }), _jsx("a", { href: "/artists", className: "text-[#FF4D67] hover:text-[#FFCB2B] text-sm sm:text-base transition-colors", children: "View All" })] }), _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4", children: popularCreators.map((creator) => (_jsx("div", { className: "group card-bg rounded-xl p-4 transition-all duration-300 hover:border-[#FFCB2B]/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-[#FFCB2B]/10", children: _jsxs("div", { className: "flex flex-col items-center text-center cursor-pointer", onClick: () => router.push(`/artists/${creator.id}`), children: [_jsxs("div", { className: "relative mb-3", children: [creator.avatar && creator.avatar.trim() !== '' ? (_jsx("img", { src: creator.avatar, alt: creator.name, className: "w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover mx-auto" })) : (generateAvatar(creator.name)), creator.verified && (_jsx("div", { className: "absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#FF4D67] border-2 border-gray-900 flex items-center justify-center", children: _jsx("svg", { className: "w-3 h-3 text-white", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z", clipRule: "evenodd" }) }) }))] }), "                  ", _jsx("h3", { className: "font-bold text-white text-sm sm:text-base truncate w-full", children: creator.name }), _jsx("p", { className: "text-[#FFCB2B] text-xs sm:text-sm mb-2", children: creator.type }), _jsxs("p", { className: "text-gray-500 text-xs", children: [creator.followers.toLocaleString(), " followers"] }), _jsx("button", { className: "mt-2 w-full px-3 py-1.5 bg-transparent border border-[#FFCB2B] text-[#FFCB2B] hover:bg-[#FFCB2B]/10 rounded-full text-xs font-medium transition-colors", onClick: (e) => {
                                                    e.stopPropagation();
                                                    if (!isAuthenticated) {
                                                        router.push('/login');
                                                    }
                                                    else {
                                                        // Handle follow action here
                                                        console.log('Following', creator.name);
                                                        // In a real implementation, you would make an API call to follow the creator
                                                    }
                                                }, children: "Follow" })] }) }, creator.id))) })] }), _jsxs("section", { className: "w-full px-4 md:px-8 py-8 sm:py-10", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-xl sm:text-2xl font-bold text-white", children: "Popular Albums" }), _jsx("a", { href: "/albums", className: "text-[#FF4D67] hover:text-[#FFCB2B] text-sm sm:text-base transition-colors", children: "View All" })] }), _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4", children: albumsLoading ? (
                                // Loading skeleton
                                Array.from({ length: 6 }).map((_, index) => (_jsxs("div", { className: "group card-bg rounded-xl overflow-hidden transition-all duration-300", children: [_jsx("div", { className: "relative", children: _jsx("div", { className: "w-full aspect-square bg-gray-700 animate-pulse" }) }), _jsxs("div", { className: "p-3", children: [_jsx("div", { className: "h-4 bg-gray-700 rounded mb-2 animate-pulse" }), _jsx("div", { className: "h-3 bg-gray-700 rounded w-3/4 animate-pulse" }), _jsxs("div", { className: "flex justify-between items-center mt-2", children: [_jsx("div", { className: "h-3 bg-gray-700 rounded w-1/3 animate-pulse" }), _jsx("div", { className: "h-3 bg-gray-700 rounded w-1/3 animate-pulse" })] })] })] }, index)))) : (popularAlbums.map((album) => (_jsxs("div", { className: "group card-bg rounded-xl overflow-hidden transition-all duration-300 hover:border-[#FF4D67]/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-[#FF4D67]/10 cursor-pointer", onClick: () => router.push(`/album/${album.id}`), children: [_jsxs("div", { className: "relative", children: [album.coverImage && album.coverImage.trim() !== '' ? (_jsx("img", { src: album.coverImage, alt: album.title, className: "w-full aspect-square object-cover" })) : (_jsx("div", { className: "w-full aspect-square bg-gradient-to-br from-[#FF4D67] to-[#FFCB2B] flex items-center justify-center", children: _jsx("svg", { className: "w-8 h-8 text-white", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" }) }) })), _jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center", children: _jsx("button", { className: "w-10 h-10 sm:w-12 sm:h-12 rounded-full gradient-primary flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300", onClick: async (e) => {
                                                            e.stopPropagation();
                                                            setPlayingAlbumId(album.id);
                                                            try {
                                                                // Fetch the full album data
                                                                const albumData = await getAlbumById(album.id);
                                                                // Transform tracks to match player format
                                                                const tracks = (Array.isArray(albumData.tracks) ? albumData.tracks : []).map((track) => {
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
                                                            }
                                                            catch (error) {
                                                                console.error('Error playing album:', error);
                                                            }
                                                            finally {
                                                                setPlayingAlbumId(null);
                                                            }
                                                        }, "aria-label": `Play album ${album.title}`, children: playingAlbumId === album.id ? (_jsxs("svg", { className: "w-4 h-4 sm:w-5 sm:h-5 animate-spin", fill: "none", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] })) : (_jsx("svg", { className: "w-4 h-4 sm:w-5 sm:h-5", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z", clipRule: "evenodd" }) })) }) })] }), _jsxs("div", { className: "p-3", children: [_jsx("h3", { className: "font-bold text-white text-sm sm:text-base mb-1 truncate", children: album.title }), _jsx("p", { className: "text-gray-400 text-xs sm:text-sm truncate", children: album.artist }), _jsxs("div", { className: "flex justify-between items-center mt-2", children: [_jsx("span", { className: "text-gray-500 text-xs", children: album.year }), _jsxs("span", { className: "text-gray-500 text-xs", children: [album.tracks, " tracks"] })] })] })] }, album.id)))) })] }), _jsxs("section", { className: "w-full px-4 md:px-8 py-8 sm:py-10", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-xl sm:text-2xl font-bold text-white", children: "Popular Mixes" }), _jsx("a", { href: "/tracks?category=mixes", className: "text-[#FF4D67] hover:text-[#FFCB2B] text-sm sm:text-base transition-colors", children: "View All" })] }), _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4", children: trendingTracks
                                    .filter((track) => track.category === "mix")
                                    .slice(0, 6)
                                    .map((track) => (_jsxs("div", { className: "group card-bg rounded-xl overflow-hidden transition-all duration-300 hover:border-[#FF4D67]/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-[#FF4D67]/10", children: [_jsxs("div", { className: "relative", children: [track.coverImage && track.coverImage.trim() !== '' ? (_jsx("img", { src: track.coverImage, alt: track.title, className: "w-full aspect-square object-cover" })) : (_jsx("div", { className: "w-full aspect-square bg-gradient-to-br from-[#FF4D67] to-[#FFCB2B] flex items-center justify-center", children: _jsx("svg", { className: "w-8 h-8 text-white", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" }) }) })), _jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center", children: _jsx("button", { onClick: () => {
                                                            // Find the full track object to get the audioURL
                                                            const fullTrack = trendingTracksData.find((t) => t._id === track.id);
                                                            if (fullTrack && fullTrack.audioURL) {
                                                                playTrack({
                                                                    id: track.id,
                                                                    title: track.title,
                                                                    artist: track.artist,
                                                                    coverImage: track.coverImage,
                                                                    audioUrl: fullTrack.audioURL,
                                                                    creatorId: typeof fullTrack.creatorId === 'object' && fullTrack.creatorId !== null ? fullTrack.creatorId._id : fullTrack.creatorId
                                                                });
                                                                // Set the current playlist to all trending tracks
                                                                const playlistTracks = trendingTracksData
                                                                    .filter((t) => t.audioURL) // Only tracks with audio
                                                                    .map((t) => ({
                                                                    id: t._id,
                                                                    title: t.title,
                                                                    artist: typeof t.creatorId === "object" &&
                                                                        t.creatorId !== null
                                                                        ? t.creatorId.name
                                                                        : "Unknown Artist",
                                                                    coverImage: t.coverURL ||
                                                                        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
                                                                    audioUrl: t.audioURL,
                                                                    creatorId: typeof t.creatorId === 'object' && t.creatorId !== null ? t.creatorId._id : t.creatorId
                                                                }));
                                                                setCurrentPlaylist(playlistTracks);
                                                            }
                                                        }, className: "w-10 h-10 sm:w-12 sm:h-12 rounded-full gradient-primary flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300", children: (currentTrack === null || currentTrack === void 0 ? void 0 : currentTrack.id) === track.id && isPlaying ? (_jsx("svg", { className: "w-4 h-4 sm:w-5 sm:h-5", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z", clipRule: "evenodd" }) })) : (_jsx("svg", { className: "w-4 h-4 sm:w-5 sm:h-5", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z", clipRule: "evenodd" }) })) }) })] }), _jsxs("div", { className: "p-3", children: [_jsx("h3", { className: "font-bold text-white text-sm sm:text-base mb-1 truncate", children: track.title }), _jsx("p", { className: "text-gray-400 text-xs sm:text-sm truncate", children: track.artist }), _jsxs("div", { className: "flex justify-between items-center mt-2", children: [_jsx("span", { className: "text-gray-500 text-xs", children: track.duration }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("svg", { className: "w-3 h-3 sm:w-4 sm:h-4 text-[#FF4D67]", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z", clipRule: "evenodd" }) }), _jsx("span", { className: "text-gray-500 text-xs", children: track.likes })] })] })] })] }, track.id))) })] }), _jsxs("section", { className: "w-full px-4 md:px-8 py-8 sm:py-10 pb-8", children: [_jsx("div", { className: "flex overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide mb-6", style: { scrollbarWidth: 'none', msOverflowStyle: 'none' }, children: _jsxs("div", { className: "flex border-b border-gray-800 min-w-max", children: [_jsx("button", { className: `py-3 px-4 sm:px-6 font-medium text-sm sm:text-base transition-colors whitespace-nowrap ${activeTab === "trending"
                                                ? "text-[#FF4D67] border-b-2 border-[#FF4D67]"
                                                : "text-gray-500 hover:text-gray-300"}`, onClick: () => setActiveTab("trending"), children: "Trending Now" }), _jsx("button", { className: `py-3 px-4 sm:px-6 font-medium text-sm sm:text-base transition-colors whitespace-nowrap ${activeTab === "new"
                                                ? "text-[#FF4D67] border-b-2 border-[#FF4D67]"
                                                : "text-gray-500 hover:text-gray-300"}`, onClick: () => setActiveTab("new"), children: "New Releases" }), _jsx("button", { className: `py-3 px-4 sm:px-6 font-medium text-sm sm:text-base transition-colors whitespace-nowrap ${activeTab === "popular"
                                                ? "text-[#FF4D67] border-b-2 border-[#FF4D67]"
                                                : "text-gray-500 hover:text-gray-300"}`, onClick: () => setActiveTab("popular"), children: "Popular Creators" }), _jsx("button", { className: `py-3 px-4 sm:px-6 font-medium text-sm sm:text-base transition-colors whitespace-nowrap ${activeTab === "mixes"
                                                ? "text-[#FF4D67] border-b-2 border-[#FF4D67]"
                                                : "text-gray-500 hover:text-gray-300"}`, onClick: () => setActiveTab("mixes"), children: "Mixes" }), _jsxs("a", { href: "/tracks", className: "py-3 px-4 sm:px-6 font-medium text-sm sm:text-base text-[#FF4D67] hover:text-[#FFCB2B] transition-colors whitespace-nowrap flex items-center", children: ["View All", _jsx("svg", { className: "w-4 h-4 ml-1", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9 5l7 7-7 7" }) })] })] }) }), activeTab === "trending" && (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6", children: trendingTracks.map((track) => (_jsxs("div", { className: "group card-bg rounded-2xl overflow-hidden transition-all duration-300 hover:border-[#FF4D67]/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-[#FF4D67]/10", children: [_jsxs("div", { className: "relative", children: [track.coverImage && track.coverImage.trim() !== '' ? (_jsx("img", { src: track.coverImage, alt: track.title, className: "w-full h-40 sm:h-48 object-cover" })) : (_jsx("div", { className: "w-full h-40 sm:h-48 bg-gradient-to-br from-[#FF4D67] to-[#FFCB2B] flex items-center justify-center", children: _jsx("svg", { className: "w-8 h-8 text-white", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" }) }) })), _jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center", children: _jsx("button", { onClick: () => {
                                                            // Find the full track object to get the audioURL
                                                            const fullTrack = trendingTracksData.find((t) => t._id === track.id);
                                                            if (fullTrack && fullTrack.audioURL) {
                                                                playTrack({
                                                                    id: track.id,
                                                                    title: track.title,
                                                                    artist: track.artist,
                                                                    coverImage: track.coverImage,
                                                                    audioUrl: fullTrack.audioURL,
                                                                    creatorId: typeof fullTrack.creatorId === 'object' && fullTrack.creatorId !== null ? fullTrack.creatorId._id : fullTrack.creatorId
                                                                });
                                                                // Set the current playlist to all trending tracks
                                                                const playlistTracks = trendingTracksData
                                                                    .filter((t) => t.audioURL) // Only tracks with audio
                                                                    .map((t) => ({
                                                                    id: t._id,
                                                                    title: t.title,
                                                                    artist: typeof t.creatorId === "object" &&
                                                                        t.creatorId !== null
                                                                        ? t.creatorId.name
                                                                        : "Unknown Artist",
                                                                    coverImage: t.coverURL ||
                                                                        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
                                                                    audioUrl: t.audioURL,
                                                                    creatorId: typeof t.creatorId === 'object' && t.creatorId !== null ? t.creatorId._id : t.creatorId
                                                                }));
                                                                setCurrentPlaylist(playlistTracks);
                                                            }
                                                        }, className: "w-12 h-12 sm:w-14 sm:h-14 rounded-full gradient-primary flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300", children: (currentTrack === null || currentTrack === void 0 ? void 0 : currentTrack.id) === track.id && isPlaying ? (_jsx("svg", { className: "w-5 h-5 sm:w-6 sm:h-6", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z", clipRule: "evenodd" }) })) : (_jsx("svg", { className: "w-5 h-5 sm:w-6 sm:h-6", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z", clipRule: "evenodd" }) })) }) }), _jsx("div", { className: "absolute top-2 right-2 sm:top-3 sm:right-3", children: _jsx("button", { onClick: (e) => {
                                                            e.stopPropagation();
                                                            // Find the full track object
                                                            const fullTrack = trendingTracksData.find(t => t._id === track.id);
                                                            if (fullTrack) {
                                                                toggleFavorite(track.id, fullTrack);
                                                            }
                                                        }, className: "p-1.5 sm:p-2 rounded-full bg-black/30 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110", children: _jsx("svg", { className: `w-4 h-4 sm:w-5 sm:h-5 transition-all duration-200 ${favoriteStatus[track.id] ? 'text-red-500 fill-current scale-110' : 'stroke-current'}`, fill: favoriteStatus[track.id] ? "currentColor" : "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" }) }) }) })] }), _jsxs("div", { className: "p-4 sm:p-5", children: [_jsx("h3", { className: "font-bold text-white text-lg mb-1 truncate", children: track.title }), _jsx("p", { className: "text-gray-400 text-sm sm:text-base mb-1 truncate", children: track.artist }), track.album && (_jsx("p", { className: "text-gray-500 text-xs sm:text-sm mb-3 truncate", children: track.album })), _jsxs("div", { className: "flex justify-between text-xs sm:text-sm text-gray-500", children: [_jsxs("span", { children: [track.plays.toLocaleString(), " plays"] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("svg", { className: "w-3 h-3 sm:w-4 sm:h-4", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z", clipRule: "evenodd" }) }), _jsx("span", { children: track.likes })] })] })] })] }, track.id))) })), activeTab === "new" && (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6", children: newTracks.map((track) => (_jsxs("div", { className: "group card-bg rounded-2xl overflow-hidden transition-all duration-300 hover:border-[#FF4D67]/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-[#FF4D67]/10", children: [_jsxs("div", { className: "relative", children: [track.coverImage && track.coverImage.trim() !== '' ? (_jsx("img", { src: track.coverImage, alt: track.title, className: "w-full h-40 sm:h-48 object-cover" })) : (_jsx("div", { className: "w-full h-40 sm:h-48 bg-gradient-to-br from-[#FF4D67] to-[#FFCB2B] flex items-center justify-center", children: _jsx("svg", { className: "w-8 h-8 text-white", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" }) }) })), _jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center", children: _jsx("button", { onClick: () => {
                                                            // Find the full track object to get the audioURL
                                                            const fullTrack = trendingTracksData.find((t) => t._id === track.id);
                                                            if (fullTrack && fullTrack.audioURL) {
                                                                playTrack({
                                                                    id: track.id,
                                                                    title: track.title,
                                                                    artist: track.artist,
                                                                    coverImage: track.coverImage,
                                                                    audioUrl: fullTrack.audioURL,
                                                                    creatorId: typeof fullTrack.creatorId === 'object' && fullTrack.creatorId !== null ? fullTrack.creatorId._id : fullTrack.creatorId
                                                                });
                                                                // Set the current playlist to all trending tracks
                                                                const playlistTracks = trendingTracksData
                                                                    .filter((t) => t.audioURL) // Only tracks with audio
                                                                    .map((t) => ({
                                                                    id: t._id,
                                                                    title: t.title,
                                                                    artist: typeof t.creatorId === "object" &&
                                                                        t.creatorId !== null
                                                                        ? t.creatorId.name
                                                                        : "Unknown Artist",
                                                                    coverImage: t.coverURL ||
                                                                        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
                                                                    audioUrl: t.audioURL,
                                                                    creatorId: typeof t.creatorId === 'object' && t.creatorId !== null ? t.creatorId._id : t.creatorId
                                                                }));
                                                                setCurrentPlaylist(playlistTracks);
                                                            }
                                                        }, className: "w-12 h-12 sm:w-14 sm:h-14 rounded-full gradient-primary flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300", children: (currentTrack === null || currentTrack === void 0 ? void 0 : currentTrack.id) === track.id && isPlaying ? (_jsx("svg", { className: "w-5 h-5 sm:w-6 sm:h-6", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z", clipRule: "evenodd" }) })) : (_jsx("svg", { className: "w-5 h-5 sm:w-6 sm:h-6", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z", clipRule: "evenodd" }) })) }) }), _jsx("div", { className: "absolute top-2 right-2 sm:top-3 sm:right-3", children: _jsx("button", { onClick: (e) => {
                                                            e.stopPropagation();
                                                            // Find the full track object
                                                            const fullTrack = trendingTracksData.find(t => t._id === track.id);
                                                            if (fullTrack) {
                                                                toggleFavorite(track.id, fullTrack);
                                                            }
                                                        }, className: "p-1.5 sm:p-2 rounded-full bg-black/30 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110", children: _jsx("svg", { className: `w-4 h-4 sm:w-5 sm:h-5 transition-all duration-200 ${favoriteStatus[track.id] ? 'text-red-500 fill-current scale-110' : 'stroke-current'}`, fill: favoriteStatus[track.id] ? "currentColor" : "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" }) }) }) })] }), _jsxs("div", { className: "p-4 sm:p-5", children: [_jsx("h3", { className: "font-bold text-white text-lg mb-1 truncate", children: track.title }), _jsx("p", { className: "text-gray-400 text-sm sm:text-base mb-1 truncate", children: track.artist }), track.album && (_jsx("p", { className: "text-gray-500 text-xs sm:text-sm mb-3 truncate", children: track.album })), _jsxs("div", { className: "flex justify-between text-xs sm:text-sm text-gray-500", children: [_jsxs("span", { children: [track.plays.toLocaleString(), " plays"] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("svg", { className: "w-3 h-3 sm:w-4 sm:h-4", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z", clipRule: "evenodd" }) }), _jsx("span", { children: track.likes })] })] })] })] }, track.id))) })), activeTab === "popular" && (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6", children: popularCreators.map((creator) => (_jsxs("div", { className: "group card-bg rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:border-[#FFCB2B]/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-[#FFCB2B]/10 cursor-pointer", onClick: () => router.push(`/artists/${creator.id}`), children: [_jsxs("div", { className: "flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5", children: [_jsxs("div", { className: "relative", children: [creator.avatar && creator.avatar.trim() !== '' ? (_jsx("img", { src: creator.avatar, alt: creator.name, className: "w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover" })) : (generateAvatar(creator.name)), creator.verified && (_jsx("div", { className: "absolute bottom-0 right-0 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#FF4D67] border-2 border-gray-900" }))] }), _jsxs("div", { children: [_jsx("h3", { className: "font-bold text-white text-base sm:text-lg", children: creator.name }), _jsx("p", { className: "text-[#FFCB2B] text-xs sm:text-sm", children: creator.type })] })] }), _jsx("p", { className: "text-gray-400 text-xs sm:text-sm mb-4 sm:mb-5", children: "Creating amazing music that resonates with the heart of Rwanda." }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("span", { className: "text-gray-500 text-xs sm:text-sm", children: [creator.followers.toLocaleString(), " followers"] }), _jsx("button", { className: "px-3 py-1.5 sm:px-4 sm:py-2 bg-transparent border border-[#FFCB2B] text-[#FFCB2B] hover:bg-[#FFCB2B]/10 rounded-full text-xs sm:text-sm font-medium transition-colors", onClick: (e) => {
                                                        e.stopPropagation();
                                                        if (!isAuthenticated) {
                                                            router.push('/login');
                                                        }
                                                        else {
                                                            // Handle follow action here
                                                            console.log('Following', creator.name);
                                                            // In a real implementation, you would make an API call to follow the creator
                                                        }
                                                    }, children: "Follow" })] })] }, creator.id))) })), activeTab === "mixes" && (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6", children: trendingTracks
                                    .filter((track) => track.category === "mix")
                                    .map((track) => {
                                    var _a;
                                    return (_jsxs("div", { className: "group card-bg rounded-2xl overflow-hidden transition-all duration-300 hover:border-[#FF4D67]/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-[#FF4D67]/10", children: [_jsxs("div", { className: "relative", children: [track.coverImage && track.coverImage.trim() !== '' ? (_jsx("img", { src: track.coverImage, alt: track.title, className: "w-full h-40 sm:h-48 object-cover" })) : (_jsx("div", { className: "w-full h-40 sm:h-48 bg-gradient-to-br from-[#FF4D67] to-[#FFCB2B] flex items-center justify-center", children: _jsx("svg", { className: "w-8 h-8 text-white", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" }) }) })), _jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center", children: _jsx("button", { onClick: () => {
                                                                // Find the full track object to get the audioURL
                                                                const fullTrack = trendingTracksData.find((t) => t._id === track.id);
                                                                if (fullTrack && fullTrack.audioURL) {
                                                                    playTrack({
                                                                        id: track.id,
                                                                        title: track.title,
                                                                        artist: track.artist,
                                                                        coverImage: track.coverImage,
                                                                        audioUrl: fullTrack.audioURL,
                                                                        creatorId: typeof fullTrack.creatorId === 'object' && fullTrack.creatorId !== null ? fullTrack.creatorId._id : fullTrack.creatorId
                                                                    });
                                                                    // Set the current playlist to all trending tracks
                                                                    const playlistTracks = trendingTracksData
                                                                        .filter((t) => t.audioURL) // Only tracks with audio
                                                                        .map((t) => ({
                                                                        id: t._id,
                                                                        title: t.title,
                                                                        artist: typeof t.creatorId === "object" &&
                                                                            t.creatorId !== null
                                                                            ? t.creatorId.name
                                                                            : "Unknown Artist",
                                                                        coverImage: t.coverURL ||
                                                                            "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
                                                                        audioUrl: t.audioURL,
                                                                        creatorId: typeof t.creatorId === 'object' && t.creatorId !== null ? t.creatorId._id : t.creatorId
                                                                    }));
                                                                    setCurrentPlaylist(playlistTracks);
                                                                }
                                                            }, className: "w-12 h-12 sm:w-14 sm:h-14 rounded-full gradient-primary flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300", children: (currentTrack === null || currentTrack === void 0 ? void 0 : currentTrack.id) === track.id && isPlaying ? (_jsx("svg", { className: "w-5 h-5 sm:w-6 sm:h-6", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z", clipRule: "evenodd" }) })) : (_jsx("svg", { className: "w-5 h-5 sm:w-6 sm:h-6", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z", clipRule: "evenodd" }) })) }) }), _jsx("div", { className: "absolute top-2 right-2 sm:top-3 sm:right-3", children: _jsx("button", { onClick: (e) => {
                                                                e.stopPropagation();
                                                                // Find the full track object
                                                                const fullTrack = trendingTracksData.find(t => t._id === track.id);
                                                                if (fullTrack) {
                                                                    toggleFavorite(track.id, fullTrack);
                                                                }
                                                            }, className: "p-1.5 sm:p-2 rounded-full bg-black/30 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110", children: _jsx("svg", { className: `w-4 h-4 sm:w-5 sm:h-5 transition-all duration-200 ${favoriteStatus[track.id] ? 'text-red-500 fill-current scale-110' : 'stroke-current'}`, fill: favoriteStatus[track.id] ? "currentColor" : "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" }) }) }) })] }), _jsxs("div", { className: "p-4 sm:p-5", children: [_jsx("h3", { className: "font-bold text-white text-lg mb-1 truncate", children: track.title }), _jsx("p", { className: "text-gray-400 text-sm sm:text-base mb-1 truncate", children: track.artist }), track.album && (_jsx("p", { className: "text-gray-500 text-xs sm:text-sm mb-3 truncate", children: track.album })), _jsxs("div", { className: "flex justify-between text-xs sm:text-sm text-gray-500", children: [_jsxs("span", { children: [((_a = track.plays) === null || _a === void 0 ? void 0 : _a.toLocaleString()) || '0', " plays"] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("svg", { className: "w-3 h-3 sm:w-4 sm:h-4", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z", clipRule: "evenodd" }) }), _jsx("span", { children: track.likes || 0 })] })] })] })] }, track.id));
                                }) }))] }), _jsx("div", { className: "h-96 md:h-[500px]" })] }), _jsx("div", { className: "flex-grow" })] }));
}

'use client';
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioPlayerProvider = exports.useAudioPlayer = void 0;
var react_1 = require("react");
var navigation_1 = require("next/navigation");
var trackService_1 = require("../services/trackService");
var userService_1 = require("../services/userService");
var recentlyPlayedService_1 = require("../services/recentlyPlayedService");
var recommendationService_1 = require("../services/recommendationService");
var trackCleanupService_1 = require("../services/trackCleanupService");
var AudioPlayerContext = (0, react_1.createContext)(undefined);
var useAudioPlayer = function () {
    var context = (0, react_1.useContext)(AudioPlayerContext);
    if (!context) {
        throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
    }
    return context;
};
exports.useAudioPlayer = useAudioPlayer;
var AudioPlayerProvider = function (_a) {
    var children = _a.children;
    var _b = (0, react_1.useState)(null), currentTrack = _b[0], setCurrentTrack = _b[1];
    var _c = (0, react_1.useState)(false), isPlaying = _c[0], setIsPlaying = _c[1];
    var _d = (0, react_1.useState)(false), isMinimized = _d[0], setIsMinimized = _d[1];
    var _e = (0, react_1.useState)(0), progress = _e[0], setProgress = _e[1];
    var _f = (0, react_1.useState)(0), duration = _f[0], setDuration = _f[1];
    var _g = (0, react_1.useState)([]), playlist = _g[0], setPlaylist = _g[1];
    var _h = (0, react_1.useState)([]), playlists = _h[0], setPlaylists = _h[1];
    var _j = (0, react_1.useState)([]), favorites = _j[0], setFavorites = _j[1];
    var _k = (0, react_1.useState)(true), favoritesLoading = _k[0], setFavoritesLoading = _k[1];
    var _l = (0, react_1.useState)([]), comments = _l[0], setComments = _l[1];
    var _m = (0, react_1.useState)(0), currentTrackIndex = _m[0], setCurrentTrackIndex = _m[1];
    var _o = (0, react_1.useState)(1), volume = _o[0], setVolume = _o[1];
    var _p = (0, react_1.useState)(1), playbackRate = _p[0], setPlaybackRate = _p[1];
    var _q = (0, react_1.useState)(false), isLooping = _q[0], setIsLooping = _q[1];
    var _r = (0, react_1.useState)([]), queue = _r[0], setQueue = _r[1]; // Queue for upcoming tracks
    var _s = (0, react_1.useState)(''), currentPlaylistName = _s[0], setCurrentPlaylistName = _s[1]; // Name of the current playlist being played
    var _t = (0, react_1.useState)(false), hasReachedTimeLimit = _t[0], setHasReachedTimeLimit = _t[1]; // State to track if time limit has been reached for paid beats
    var audioRef = (0, react_1.useRef)(null);
    var hasIncrementedPlayCount = (0, react_1.useRef)(new Set());
    var router = (0, navigation_1.useRouter)();
    var currentPlaybackContext = (0, react_1.useRef)({ type: 'single' });
    // Audio visualization refs
    var audioContextRef = (0, react_1.useRef)(null);
    var analyserRef = (0, react_1.useRef)(null);
    var sourceRef = (0, react_1.useRef)(null);
    var frequencyDataRef = (0, react_1.useRef)(null);
    var animationFrameRef = (0, react_1.useRef)(null);
    // Refs to hold current values for audio event handlers
    var currentTrackRef = (0, react_1.useRef)(null);
    var playlistRef = (0, react_1.useRef)([]);
    var currentTrackIndexRef = (0, react_1.useRef)(0);
    // Ref to store the original playlist when switching to single track context
    var originalPlaylistRef = (0, react_1.useRef)([]);
    // Store the original playlist before switching to single track context
    var storeOriginalPlaylist = function () {
        if (currentPlaybackContext.current.type !== 'single' && playlistRef.current.length > 0) {
            originalPlaylistRef.current = __spreadArray([], playlistRef.current, true);
            console.log('Stored original playlist with', originalPlaylistRef.current.length, 'tracks');
        }
    };
    // Function to display time limit message for paid beats
    var timeLimitMessage = function (track) {
        var message = "You've reached the 40-second preview for \"".concat(track.title, "\". To get the full version, please contact the creator via WhatsApp.");
        alert(message);
        // Open WhatsApp with pre-filled message
        if (track.creatorWhatsapp) {
            var whatsappMessage = "Hi, I'm interested in the full version of your beat \"".concat(track.title, "\" that I found on MuzikaX. I've listened to the 40-second preview and would like to purchase the full version.");
            window.open("https://wa.me/".concat(track.creatorWhatsapp, "?text=").concat(encodeURIComponent(whatsappMessage)), '_blank');
        }
        // Reset the time limit state to allow replaying or playing another track
        setHasReachedTimeLimit(false);
    };
    // Expose the playback context globally so it can be accessed from other components
    (0, react_1.useEffect)(function () {
        window.audioPlayerContext = currentPlaybackContext;
        return function () {
            delete window.audioPlayerContext;
        };
    }, []);
    // Load favorites and playlists from backend on mount
    (0, react_1.useEffect)(function () {
        var loadUserData = function () { return __awaiter(void 0, void 0, void 0, function () {
            var accessToken, userFavorites, userPlaylists, mappedPlaylists, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        accessToken = localStorage.getItem('accessToken');
                        if (!accessToken) {
                            console.log('No access token found, skipping user data load');
                            setFavoritesLoading(false);
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, (0, userService_1.getUserFavorites)()];
                    case 1:
                        userFavorites = _a.sent();
                        setFavorites(userFavorites);
                        setFavoritesLoading(false);
                        // Dispatch a custom event to notify that favorites have been loaded
                        window.dispatchEvent(new CustomEvent('favoritesLoaded'));
                        return [4 /*yield*/, (0, userService_1.getUserPlaylists)()];
                    case 2:
                        userPlaylists = _a.sent();
                        mappedPlaylists = userPlaylists.map(function (playlist) {
                            var _a;
                            return (__assign(__assign({}, playlist), { id: playlist._id || playlist.id, tracks: ((_a = playlist.tracks) === null || _a === void 0 ? void 0 : _a.map(function (track) { return (__assign(__assign({}, track), { id: track._id || track.id // Use _id if available, otherwise use id
                                 })); })) || [] }));
                        });
                        setPlaylists(mappedPlaylists);
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        console.error('Error loading user data:', error_1);
                        setFavoritesLoading(false);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        loadUserData();
    }, []);
    // Load comments when currentTrack changes
    (0, react_1.useEffect)(function () {
        var loadCommentsForTrack = function () { return __awaiter(void 0, void 0, void 0, function () {
            var trackComments, formattedComments, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(currentTrack === null || currentTrack === void 0 ? void 0 : currentTrack.id)) return [3 /*break*/, 5];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (0, trackService_1.fetchCommentsForTrack)(currentTrack.id)];
                    case 2:
                        trackComments = _a.sent();
                        formattedComments = trackComments.map(function (comment) { return ({
                            id: comment._id,
                            userId: comment.userId._id || comment.userId,
                            username: comment.userId.name || 'Unknown User',
                            text: comment.text,
                            timestamp: comment.createdAt
                        }); });
                        setComments(formattedComments);
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        console.error('Error loading comments:', error_2);
                        setComments([]);
                        return [3 /*break*/, 4];
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        setComments([]);
                        _a.label = 6;
                    case 6: return [2 /*return*/];
                }
            });
        }); };
        loadCommentsForTrack();
    }, [currentTrack === null || currentTrack === void 0 ? void 0 : currentTrack.id]);
    // Flag to track if the track was explicitly played by user
    var explicitlyPlayedRef = (0, react_1.useRef)(false);
    // Update audio playback rate when it changes
    (0, react_1.useEffect)(function () {
        if (audioRef.current) {
            audioRef.current.playbackRate = playbackRate;
        }
    }, [playbackRate]);
    // Navigate to full player page when a track is played and not minimized
    // Only navigate when explicitly playing a new track, not when auto-playing next track
    (0, react_1.useEffect)(function () {
        console.log('Navigation useEffect triggered');
        console.log('currentTrack:', currentTrack);
        console.log('isMinimized:', isMinimized);
        console.log('explicitlyPlayedRef.current:', explicitlyPlayedRef.current);
        if (currentTrack && !isMinimized && explicitlyPlayedRef.current) {
            console.log('Navigating to /player');
            router.push('/player');
            // Reset the flag after navigation
            explicitlyPlayedRef.current = false;
        }
        else {
            console.log('Not navigating to /player because:');
            if (!currentTrack)
                console.log('- No current track');
            if (isMinimized)
                console.log('- Player is minimized');
            if (!explicitlyPlayedRef.current)
                console.log('- Not explicitly played');
        }
    }, [currentTrack, isMinimized, router]);
    var playTrack = function (track, contextPlaylist, albumContext, isCycling) {
        if (isCycling === void 0) { isCycling = false; }
        console.log('PLAY TRACK CALLED with track:', track);
        console.log('Current track before playTrack:', currentTrack);
        console.log('Current track index before playTrack:', currentTrackIndex);
        console.log('Explicitly played ref:', explicitlyPlayedRef.current);
        console.log('Current playback context before setting:', currentPlaybackContext.current);
        console.log('Is cycling:', isCycling);
        // Reset time limit state when playing a new track
        setHasReachedTimeLimit(false);
        // Validate that we have a valid audio URL
        if (!track.audioUrl || track.audioUrl.trim() === '') {
            console.error('Cannot play track: Invalid audio URL', track);
            return;
        }
        // If we're already playing this track, just resume
        if ((currentTrack === null || currentTrack === void 0 ? void 0 : currentTrack.id) === track.id && audioRef.current) {
            console.log('Resuming existing track');
            audioRef.current.play().catch(function (error) {
                console.error('Error resuming track:', error);
            });
            setIsPlaying(true);
            console.log('Track resumed successfully');
            return;
        }
        // Stop current track if playing
        if (audioRef.current) {
            console.log('Stopping current audio');
            audioRef.current.pause();
            audioRef.current = null;
        }
        // Clean up previous audio context
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }
        // Set the playback context
        if (albumContext) {
            console.log('Setting album context');
            currentPlaybackContext.current = {
                type: 'album',
                data: albumContext,
                albumId: albumContext.albumId,
                albumComplete: false // Reset album completion flag
            };
            // Set the playlist to the album tracks
            setPlaylist(albumContext.tracks);
            // Update ref synchronously
            playlistRef.current = albumContext.tracks;
            var index_1 = albumContext.tracks.findIndex(function (t) { return t.id === track.id; });
            console.log('Setting album track index to:', index_1);
            setCurrentTrackIndex(index_1 >= 0 ? index_1 : 0);
            // Update ref synchronously
            currentTrackIndexRef.current = index_1 >= 0 ? index_1 : 0;
            // Add remaining album tracks to queue (excluding the current track)
            var remainingAlbumTracks_1 = albumContext.tracks
                .filter(function (t, i) { return i > index_1; }) // Only tracks after the current one
                .filter(function (t) { return !queue.some(function (qt) { return qt.id === t.id; }); }); // Avoid duplicates in queue
            if (remainingAlbumTracks_1.length > 0) {
                setQueue(function (prev) { return __spreadArray(__spreadArray([], prev, true), remainingAlbumTracks_1, true); });
                console.log("Added ".concat(remainingAlbumTracks_1.length, " remaining album tracks to queue"));
            }
        }
        else if (contextPlaylist && contextPlaylist.length > 0) {
            console.log('Setting playlist context with tracks:', contextPlaylist);
            // Extract playlist name from the contextPlaylist if it contains playlist info
            var playlistName = contextPlaylist.name || contextPlaylist.playlistName || 'Current Playlist';
            currentPlaybackContext.current = {
                type: 'playlist',
                data: contextPlaylist,
                playlistName: playlistName
            };
            setPlaylist(contextPlaylist);
            // Update ref synchronously
            playlistRef.current = contextPlaylist;
            // Only calculate the index if we're not cycling through tracks
            if (!isCycling) {
                var index = contextPlaylist.findIndex(function (t) { return t.id === track.id; });
                console.log('Setting playlist track index to:', index);
                setCurrentTrackIndex(index >= 0 ? index : 0);
                // Update ref synchronously
                currentTrackIndexRef.current = index >= 0 ? index : 0;
                // Add remaining tracks in the playlist to the queue (excluding the current track)
                var remainingTracks_1 = contextPlaylist
                    .slice(index + 1) // Get tracks after the current one
                    .filter(function (t) { return !queue.some(function (qt) { return qt.id === t.id; }); }); // Avoid duplicates in queue
                if (remainingTracks_1.length > 0) {
                    setQueue(function (prev) { return __spreadArray(__spreadArray([], prev, true), remainingTracks_1, true); });
                    console.log("Added ".concat(remainingTracks_1.length, " remaining playlist tracks to queue"));
                }
            }
            // Set the playlist name if available
            setCurrentPlaylistName(playlistName);
        }
        else {
            console.log('Setting single track context');
            // Store the original playlist before switching to single track context
            storeOriginalPlaylist();
            currentPlaybackContext.current = { type: 'single' };
            // For For single track, create a playlist with just this track
            setPlaylist([track]);
            // Update ref synchronously
            playlistRef.current = [track];
            setCurrentTrackIndex(0);
            // Update ref synchronously
            currentTrackIndexRef.current = 0;
        }
        console.log('Current playback context after setting:', currentPlaybackContext.current);
        // Create new audio element
        var audio = new Audio(track.audioUrl);
        audioRef.current = audio;
        // Set initial volume
        audio.volume = volume;
        // Set initial playback rate
        audio.playbackRate = playbackRate;
        // Set up event listeners
        audio.onplay = function () {
            console.log('Audio started playing');
            setIsPlaying(true);
        };
        audio.onpause = function () {
            console.log('Audio paused');
            setIsPlaying(false);
        };
        audio.onended = handleAudioEnded;
        audio.ontimeupdate = function () {
            if (audio.duration) {
                setProgress(audio.currentTime);
                setDuration(audio.duration);
                // Check if this is a paid beat and has reached the 40-second limit
                // Use the track variable instead of currentTrackRef.current since it's updated after this event
                if ((track === null || track === void 0 ? void 0 : track.paymentType) === 'paid' && audio.currentTime >= 40) {
                    if (!hasReachedTimeLimit) {
                        setHasReachedTimeLimit(true);
                        audio.pause();
                        timeLimitMessage(track);
                    }
                }
            }
        };
        audio.onloadedmetadata = function () {
            setDuration(audio.duration || 0);
        };
        audio.onerror = function (error) { return __awaiter(void 0, void 0, void 0, function () {
            var cleanupResult, cleanupError_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.error('Audio error occurred:', error);
                        if (!currentTrackRef.current) return [3 /*break*/, 4];
                        console.log("Reporting invalid track ".concat(currentTrackRef.current.id, " for cleanup"));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (0, trackCleanupService_1.reportInvalidTrack)(currentTrackRef.current.id)];
                    case 2:
                        cleanupResult = _a.sent();
                        if (cleanupResult.success && cleanupResult.removed) {
                            console.log("Successfully removed invalid track: ".concat(cleanupResult.trackTitle));
                        }
                        else if (cleanupResult.success) {
                            console.log("Track ".concat(cleanupResult.trackTitle, " validated as valid"));
                        }
                        else {
                            console.error('Failed to process track cleanup:', cleanupResult.message);
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        cleanupError_1 = _a.sent();
                        console.error('Error during track cleanup:', cleanupError_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        // Set the current track and index immediately
        console.log('Setting current track to:', track);
        setCurrentTrack(track);
        // Update ref synchronously
        currentTrackRef.current = track;
        // Only expand player when new track starts if it was explicitly played by user
        // If it's an automatic playback (next track), preserve the current minimized state
        if (explicitlyPlayedRef.current) {
            setIsMinimized(false); // Expand player when explicitly played by user
        }
        // If explicitlyPlayedRef.current is false, we preserve the current isMinimized state
        // Mark this as an explicit play action
        explicitlyPlayedRef.current = true;
        // Add to recently played (only for authenticated users)
        var accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            (0, recentlyPlayedService_1.addRecentlyPlayed)(track.id)
                .then(function () {
                console.log("Successfully added track ".concat(track.id, " to recently played"));
            })
                .catch(function (error) {
                console.error("Failed to add track ".concat(track.id, " to recently played:"), error);
            });
        }
        // Increment play count for this track (only once per session)
        if (!hasIncrementedPlayCount.current.has(track.id)) {
            hasIncrementedPlayCount.current.add(track.id);
            (0, trackService_1.incrementTrackPlayCount)(track.id)
                .then(function () {
                console.log("Successfully incremented play count for track ".concat(track.id));
            })
                .catch(function (error) {
                console.error("Failed to increment play count for track ".concat(track.id, ":"), error);
            });
        }
        // Start playing the audio
        audio.play().catch(function (error) {
            console.error('Error playing track:', error);
            // Even if play fails, we still set the track so UI reflects the current state
            setIsPlaying(false);
        });
        console.log('Audio play initiated');
    };
    var playNextTrack = function () { return __awaiter(void 0, void 0, void 0, function () {
        var nextIndex_1, nextTrack_1, contextToUse, contextType, nextIndex_2, recommendedTracks, newTracks, updatedPlaylist, nextIndex_3, nextTrack_2, error_3, recommendedTracks, nextTrack_3, track, currentIndex, nextIndex_4, nextTrack_4, nextTrack_5, error_4, currentIndex, nextIndex_5, nextTrack_6, recommendedTracks, newTracks, updatedPlaylist, nextIndex_6, nextTrack_7, error_5, nextIndex, nextTrack;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('PLAY NEXT TRACK CALLED');
                    console.log('Current track:', currentTrackRef.current);
                    console.log('Current track index:', currentTrackIndexRef.current);
                    console.log('Playlist:', playlistRef.current);
                    console.log('Playback context:', currentPlaybackContext.current);
                    console.log('Playback context type:', currentPlaybackContext.current.type);
                    console.log('Playback context data:', currentPlaybackContext.current.data);
                    console.log('Queue:', queue);
                    // Check if the player has been explicitly stopped
                    // If currentTrack is null, it means the player was explicitly stopped
                    if (currentTrackRef.current === null) {
                        console.log('Player has been explicitly stopped, not playing next track');
                        return [2 /*return*/];
                    }
                    // Check if we're in a playlist context and there are more tracks in the playlist
                    if (currentPlaybackContext.current.type === 'playlist' && playlistRef.current.length > 0) {
                        // Check if we're at the end of the playlist
                        if (currentTrackIndexRef.current + 1 < playlistRef.current.length) {
                            console.log('Playlist context, playing next track in playlist');
                            nextIndex_1 = currentTrackIndexRef.current + 1;
                            // Play the next track without expanding the player
                            explicitlyPlayedRef.current = false; // Mark as auto-played
                            playTrackAtIndex(nextIndex_1);
                            return [2 /*return*/];
                        }
                    }
                    // First, check if there are tracks in the queue and play the first one
                    if (queue.length > 0) {
                        console.log('Queue has tracks, playing first track in queue');
                        nextTrack_1 = queue[0];
                        // Remove the track from the queue
                        setQueue(function (prev) { return prev.slice(1); });
                        // Play the track without expanding the player
                        // Use the current playlist context or fall back to a single track context
                        explicitlyPlayedRef.current = false; // Mark as auto-played
                        contextToUse = playlistRef.current.length > 0 ? playlistRef.current : [nextTrack_1];
                        playTrack(nextTrack_1, contextToUse);
                        return [2 /*return*/];
                    }
                    contextType = currentPlaybackContext.current.type;
                    console.log('Direct context type value:', contextType);
                    console.log('Is context type equal to "single":', contextType === 'single');
                    console.log('Is context type equal to "album":', contextType === 'album');
                    console.log('Is context type equal to "playlist":', contextType === 'playlist');
                    console.log('Playlist length:', playlistRef.current.length);
                    // Add one more check to see if the context object itself has changed
                    console.log('Context object keys:', Object.keys(currentPlaybackContext.current));
                    console.log('Context object JSON:', JSON.stringify(currentPlaybackContext.current));
                    if (!(currentPlaybackContext.current.type === 'album')) return [3 /*break*/, 7];
                    console.log('Album context, ensuring tracks play within album until completion');
                    if (!(currentTrackIndexRef.current + 1 < playlistRef.current.length)) return [3 /*break*/, 1];
                    nextIndex_2 = currentTrackIndexRef.current + 1;
                    console.log('Playing next track in album at index:', nextIndex_2);
                    // Play the next track without expanding the player
                    explicitlyPlayedRef.current = false; // Mark as auto-played
                    playTrackAtIndex(nextIndex_2);
                    return [2 /*return*/];
                case 1:
                    // We've reached the end of the album
                    console.log('Reached end of album, marking album as complete');
                    // Update the context to indicate album is complete
                    currentPlaybackContext.current.albumComplete = true;
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 5, , 6]);
                    if (!currentTrackRef.current) return [3 /*break*/, 4];
                    return [4 /*yield*/, (0, recommendationService_1.fetchRecommendedTracks)(currentTrackRef.current.id, 10)];
                case 3:
                    recommendedTracks = _a.sent();
                    if (recommendedTracks && recommendedTracks.length > 0) {
                        console.log('Got', recommendedTracks.length, 'recommended tracks after album completion');
                        newTracks = recommendedTracks.map(function (nextTrack) { return ({
                            id: nextTrack._id,
                            title: nextTrack.title,
                            artist: (typeof nextTrack.creatorId === 'object' && nextTrack.creatorId !== null)
                                ? nextTrack.creatorId.name
                                : nextTrack.creatorId || 'Unknown Artist',
                            coverImage: nextTrack.coverURL || '',
                            audioUrl: nextTrack.audioURL || '',
                            duration: 0, // Duration is not available in ITrack interface
                            creatorId: (typeof nextTrack.creatorId === 'object' && nextTrack.creatorId !== null)
                                ? nextTrack.creatorId._id
                                : nextTrack.creatorId,
                            likes: nextTrack.likes,
                            type: nextTrack.type, // Include track type
                            creatorWhatsapp: (typeof nextTrack.creatorId === 'object' && nextTrack.creatorId !== null)
                                ? nextTrack.creatorId.whatsappContact
                                : undefined // Include creator's WhatsApp contact
                        }); });
                        updatedPlaylist = __spreadArray(__spreadArray([], playlistRef.current, true), newTracks, true);
                        setPlaylist(updatedPlaylist);
                        playlistRef.current = updatedPlaylist;
                        nextIndex_3 = playlistRef.current.length;
                        nextTrack_2 = updatedPlaylist[nextIndex_3];
                        // Change context to playlist since we're now playing non-album tracks
                        currentPlaybackContext.current.type = 'playlist';
                        // Play the next track without expanding the player
                        explicitlyPlayedRef.current = false; // Mark as auto-played
                        playTrackAtIndex(nextIndex_3);
                        return [2 /*return*/];
                    }
                    _a.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    error_3 = _a.sent();
                    console.error('Error fetching recommendations after album:', error_3);
                    return [3 /*break*/, 6];
                case 6:
                    // If no recommendations or error, stop playback
                    console.log('No recommendations available, stopping playback after album completion');
                    stopTrack();
                    return [2 /*return*/];
                case 7:
                    if (!(contextType === 'single')) return [3 /*break*/, 13];
                    console.log('Single track context, fetching recommendations');
                    _a.label = 8;
                case 8:
                    _a.trys.push([8, 11, , 12]);
                    if (!currentTrackRef.current) return [3 /*break*/, 10];
                    return [4 /*yield*/, (0, recommendationService_1.fetchRecommendedTracks)(currentTrackRef.current.id, 10)];
                case 9:
                    recommendedTracks = _a.sent();
                    if (recommendedTracks && recommendedTracks.length > 0) {
                        nextTrack_3 = recommendedTracks[0];
                        track = {
                            id: nextTrack_3._id,
                            title: nextTrack_3.title,
                            artist: (typeof nextTrack_3.creatorId === 'object' && nextTrack_3.creatorId !== null)
                                ? nextTrack_3.creatorId.name
                                : nextTrack_3.creatorId || 'Unknown Artist',
                            coverImage: nextTrack_3.coverURL || '',
                            audioUrl: nextTrack_3.audioURL || '',
                            duration: 0, // Duration is not available in ITrack interface
                            creatorId: (typeof nextTrack_3.creatorId === 'object' && nextTrack_3.creatorId !== null)
                                ? nextTrack_3.creatorId._id
                                : nextTrack_3.creatorId,
                            likes: nextTrack_3.likes,
                            type: nextTrack_3.type, // Include track type
                            creatorWhatsapp: (typeof nextTrack_3.creatorId === 'object' && nextTrack_3.creatorId !== null)
                                ? nextTrack_3.creatorId.whatsappContact
                                : undefined // Include creator's WhatsApp contact
                        };
                        // Play the recommended track
                        explicitlyPlayedRef.current = false; // Mark as auto-played
                        // For recommended tracks, we maintain the single track context but update the current track
                        // We don't create a new playlist as that would break the user's original playlist context
                        playTrack(track, playlistRef.current, undefined, true);
                        return [2 /*return*/];
                    }
                    else {
                        console.log('No recommendations found, checking other songs');
                        // If no recommendations found, check other songs from the original playlist
                        if (originalPlaylistRef.current.length > 0) {
                            currentIndex = originalPlaylistRef.current.findIndex(function (t) { var _a; return t.id === ((_a = currentTrackRef.current) === null || _a === void 0 ? void 0 : _a.id); });
                            if (currentIndex !== -1) {
                                nextIndex_4 = (currentIndex + 1) % originalPlaylistRef.current.length;
                                console.log('Playing next track from original playlist at index:', nextIndex_4);
                                nextTrack_4 = originalPlaylistRef.current[nextIndex_4];
                                // Play the next track from the original playlist
                                explicitlyPlayedRef.current = false; // Mark as auto-played
                                playTrack(nextTrack_4, originalPlaylistRef.current, undefined, true);
                                return [2 /*return*/];
                            }
                            else {
                                // If current track is not in the original playlist, play the first track
                                console.log('Current track not in original playlist, playing first track');
                                nextTrack_5 = originalPlaylistRef.current[0];
                                explicitlyPlayedRef.current = false; // Mark as auto-played
                                playTrack(nextTrack_5, originalPlaylistRef.current, undefined, true);
                                return [2 /*return*/];
                            }
                        }
                    }
                    _a.label = 10;
                case 10: return [3 /*break*/, 12];
                case 11:
                    error_4 = _a.sent();
                    console.error('Error fetching recommendations:', error_4);
                    // If recommendations failed, check other songs from the original playlist
                    if (originalPlaylistRef.current.length > 0) {
                        currentIndex = originalPlaylistRef.current.findIndex(function (t) { var _a; return t.id === ((_a = currentTrackRef.current) === null || _a === void 0 ? void 0 : _a.id); });
                        if (currentIndex !== -1) {
                            nextIndex_5 = (currentIndex + 1) % originalPlaylistRef.current.length;
                            console.log('Playing next track from original playlist at index (after recommendation error):', nextIndex_5);
                            nextTrack_6 = originalPlaylistRef.current[nextIndex_5];
                            // Play the next track from the original playlist
                            explicitlyPlayedRef.current = false; // Mark as auto-played
                            playTrack(nextTrack_6, originalPlaylistRef.current, undefined, true);
                            return [2 /*return*/];
                        }
                    }
                    return [3 /*break*/, 12];
                case 12:
                    // If we still can't find a track to play, stop playback
                    console.log('No tracks found to play, stopping playback');
                    stopTrack();
                    return [2 /*return*/];
                case 13:
                    // Check if we have a playlist and it's not empty
                    if (playlistRef.current.length === 0) {
                        console.log('No playlist, stopping playback');
                        stopTrack();
                        return [2 /*return*/];
                    }
                    if (!(currentTrackIndexRef.current + 1 >= playlistRef.current.length)) return [3 /*break*/, 18];
                    console.log('Reached end of playlist, fetching more recommendations');
                    _a.label = 14;
                case 14:
                    _a.trys.push([14, 17, , 18]);
                    if (!currentTrackRef.current) return [3 /*break*/, 16];
                    return [4 /*yield*/, (0, recommendationService_1.fetchRecommendedTracks)(currentTrackRef.current.id, 10)];
                case 15:
                    recommendedTracks = _a.sent();
                    if (recommendedTracks && recommendedTracks.length > 0) {
                        console.log('Got', recommendedTracks.length, 'new recommended tracks');
                        newTracks = recommendedTracks.map(function (nextTrack) { return ({
                            id: nextTrack._id,
                            title: nextTrack.title,
                            artist: (typeof nextTrack.creatorId === 'object' && nextTrack.creatorId !== null)
                                ? nextTrack.creatorId.name
                                : nextTrack.creatorId || 'Unknown Artist',
                            coverImage: nextTrack.coverURL || '',
                            audioUrl: nextTrack.audioURL || '',
                            duration: 0, // Duration is not available in ITrack interface
                            creatorId: (typeof nextTrack.creatorId === 'object' && nextTrack.creatorId !== null)
                                ? nextTrack.creatorId._id
                                : nextTrack.creatorId,
                            likes: nextTrack.likes,
                            type: nextTrack.type, // Include track type
                            creatorWhatsapp: (typeof nextTrack.creatorId === 'object' && nextTrack.creatorId !== null)
                                ? nextTrack.creatorId.whatsappContact
                                : undefined // Include creator's WhatsApp contact
                        }); });
                        updatedPlaylist = __spreadArray(__spreadArray([], playlistRef.current, true), newTracks, true);
                        setPlaylist(updatedPlaylist);
                        playlistRef.current = updatedPlaylist;
                        nextIndex_6 = currentTrackIndexRef.current + 1;
                        console.log('Playing next track at index:', nextIndex_6);
                        nextTrack_7 = updatedPlaylist[nextIndex_6];
                        // Play the next track without expanding the player
                        explicitlyPlayedRef.current = false; // Mark as auto-played
                        playTrackAtIndex(nextIndex_6);
                        return [2 /*return*/];
                    }
                    else {
                        console.log('No more recommendations available, stopping playback');
                        stopTrack();
                        return [2 /*return*/];
                    }
                    _a.label = 16;
                case 16: return [3 /*break*/, 18];
                case 17:
                    error_5 = _a.sent();
                    console.error('Error fetching more recommendations:', error_5);
                    // If recommendations failed, stop playback
                    stopTrack();
                    return [2 /*return*/];
                case 18:
                    nextIndex = currentTrackIndexRef.current + 1;
                    console.log('Next track index:', nextIndex);
                    nextTrack = playlistRef.current[nextIndex];
                    console.log('Next track:', nextTrack);
                    if (nextTrack) {
                        // Play the next track without expanding the player
                        explicitlyPlayedRef.current = false; // Mark as auto-played
                        // Preserve the current playlist context when playing the next track
                        // Pass the specific index to avoid recalculating it in playTrack
                        playTrackAtIndex(nextIndex);
                    }
                    else {
                        console.log('No next track found, stopping playback');
                        stopTrack();
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    var playPreviousTrack = function () {
        console.log('PLAY PREVIOUS TRACK CALLED');
        console.log('Current track:', currentTrackRef.current);
        console.log('Current track index:', currentTrackIndexRef.current);
        console.log('Playlist:', playlistRef.current);
        // Check if the player has been explicitly stopped
        // If currentTrack is null, it means the player was explicitly stopped
        if (currentTrackRef.current === null) {
            console.log('Player has been explicitly stopped, not playing previous track');
            return;
        }
        // Check if we have a playlist and it's not empty
        if (playlistRef.current.length === 0 || !currentTrackRef.current) {
            console.log('No playlist or current track, cannot play previous');
            return;
        }
        // Calculate previous track index with wrapping
        var prevIndex = currentTrackIndexRef.current - 1;
        // Handle wrapping to the end of the playlist if we're at the beginning
        if (prevIndex < 0) {
            prevIndex = playlistRef.current.length - 1;
        }
        console.log('Previous track index:', prevIndex);
        // Get previous track
        var prevTrack = playlistRef.current[prevIndex];
        console.log('Previous track:', prevTrack);
        if (prevTrack) {
            // Play the previous track without expanding the player
            explicitlyPlayedRef.current = false; // Mark as auto-played
            playTrackAtIndex(prevIndex);
        }
    };
    // Helper function to handle audio ended event
    var handleAudioEnded = function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('AUDIO ONENDED EVENT TRIGGERED');
                    console.log('Current track in onended:', currentTrackRef.current);
                    console.log('Current track index in onended:', currentTrackIndexRef.current);
                    console.log('Playlist in onended:', playlistRef.current);
                    console.log('Playback context in onended:', currentPlaybackContext.current);
                    console.log('Playback context type in onended:', currentPlaybackContext.current.type);
                    console.log('Playback context data in onended:', currentPlaybackContext.current.data);
                    console.log('Full context object in onended:', JSON.stringify(currentPlaybackContext.current));
                    console.log('Is looping:', isLooping);
                    setIsPlaying(false);
                    // Check if the player has been explicitly stopped
                    // If currentTrack is null, it means the player was explicitly stopped
                    if (currentTrackRef.current === null) {
                        console.log('Player has been explicitly stopped, not playing next track');
                        return [2 /*return*/];
                    }
                    // Check if loop is enabled
                    if (isLooping) {
                        console.log('Loop is enabled, replaying current track');
                        // If loop is enabled, replay the current track
                        playTrack(currentTrackRef.current, playlistRef.current);
                        return [2 /*return*/];
                    }
                    // According to the specification, we should NOT set currentTrack to null at the end of playback
                    // Instead, we should preserve the full track context including currentTrack, currentTrackIndex, and playback state
                    // Call playNextTrack first to ensure the context and playlist information is still available
                    return [4 /*yield*/, playNextTrack()];
                case 1:
                    // According to the specification, we should NOT set currentTrack to null at the end of playback
                    // Instead, we should preserve the full track context including currentTrack, currentTrackIndex, and playback state
                    // Call playNextTrack first to ensure the context and playlist information is still available
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    // Helper function to play a track at a specific index in the current playlist
    var playTrackAtIndex = function (index) {
        console.log('PLAY TRACK AT INDEX CALLED with index:', index);
        if (index < 0 || index >= playlistRef.current.length) {
            console.error('Invalid index for playTrackAtIndex:', index);
            return;
        }
        var track = playlistRef.current[index];
        console.log('Playing track at index:', track);
        // Stop current track if playing
        if (audioRef.current) {
            console.log('Stopping current audio');
            audioRef.current.pause();
            audioRef.current = null;
        }
        // Clean up previous audio context
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }
        // Create new audio element
        var audio = new Audio(track.audioUrl);
        audioRef.current = audio;
        // Set up event listeners
        audio.onplay = function () {
            console.log('Audio started playing');
            setIsPlaying(true);
        };
        audio.onpause = function () {
            console.log('Audio paused');
            setIsPlaying(false);
        };
        audio.onended = handleAudioEnded;
        audio.ontimeupdate = function () {
            if (audio.duration) {
                setProgress(audio.currentTime);
                setDuration(audio.duration);
            }
        };
        audio.onloadedmetadata = function () {
            setDuration(audio.duration || 0);
        };
        // Set the current track and index immediately
        console.log('Setting current track to:', track);
        setCurrentTrack(track);
        // Update ref synchronously
        currentTrackRef.current = track;
        console.log('Setting current track index to:', index);
        setCurrentTrackIndex(index);
        // Update ref synchronously
        currentTrackIndexRef.current = index;
        // Only expand player when new track starts if it was explicitly played by user
        // If it's an automatic playback (next track), preserve the current minimized state
        if (explicitlyPlayedRef.current) {
            setIsMinimized(false); // Expand player when explicitly played by user
        }
        // If explicitlyPlayedRef.current is false, we preserve the current isMinimized state
        // Mark this as an auto-played action (not explicitly played by user)
        explicitlyPlayedRef.current = false;
        // Add to recently played (only for authenticated users)
        var accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            (0, recentlyPlayedService_1.addRecentlyPlayed)(track.id)
                .then(function () {
                console.log("Successfully added track ".concat(track.id, " to recently played"));
            })
                .catch(function (error) {
                console.error("Failed to add track ".concat(track.id, " to recently played:"), error);
            });
        }
        // Increment play count for this track (only once per session)
        if (!hasIncrementedPlayCount.current.has(track.id)) {
            hasIncrementedPlayCount.current.add(track.id);
            (0, trackService_1.incrementTrackPlayCount)(track.id)
                .then(function () {
                console.log("Successfully incremented play count for track ".concat(track.id));
            })
                .catch(function (error) {
                console.error("Failed to increment play count for track ".concat(track.id, ":"), error);
            });
        }
        // Start playing the audio
        audio.play().catch(function (error) {
            console.error('Error playing track:', error);
            // Even if play fails, we still set the track so UI reflects the current state
            setIsPlaying(false);
        });
    };
    var pauseTrack = function () {
        console.log('PAUSE TRACK CALLED');
        console.log('Current audioRef state:', audioRef.current);
        console.log('Current isPlaying state:', isPlaying);
        if (audioRef.current) {
            try {
                audioRef.current.pause();
                setIsPlaying(false);
                console.log('Audio paused successfully');
            }
            catch (error) {
                console.error('Error pausing track:', error);
            }
        }
        else {
            console.log('No audio element to pause');
        }
    };
    var stopTrack = function () {
        console.log('STOP TRACK CALLED');
        if (audioRef.current) {
            console.log('Stopping and cleaning up audio element');
            audioRef.current.pause();
            audioRef.current = null;
        }
        // Clean up audio visualization
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }
        setIsPlaying(false);
        setProgress(0);
        setDuration(0);
        // According to the specification, at the end of playback, currentTrack should be set to null
        // but currentTrackIndex should retain its value
        // However, for normal playlist cycling, we should preserve the context
        // Only set currentTrack to null when explicitly stopping, not when cycling
        // For explicit stopping, we preserve the currentTrackIndex but set currentTrack to null
        setCurrentTrack(null);
        // Update ref synchronously
        currentTrackRef.current = null;
        // Note: We intentionally do NOT reset currentTrackIndex here to preserve playlist position
        console.log('STOP TRACK COMPLETED - currentTrack is now null');
    };
    var togglePlayPause = function () {
        console.log('TOGGLE PLAY PAUSE CALLED');
        console.log('Current track:', currentTrackRef.current);
        console.log('Is playing:', isPlaying);
        // Check if the player has been explicitly stopped
        // If currentTrack is null, it means the player was explicitly stopped
        if (currentTrackRef.current === null) {
            console.log('Player has been explicitly stopped, cannot toggle play/pause');
            return;
        }
        if (!currentTrackRef.current) {
            console.log('No current track, cannot toggle play/pause');
            return;
        }
        if (isPlaying) {
            pauseTrack();
        }
        else {
            playTrack(currentTrackRef.current, playlistRef.current);
        }
    };
    var toggleMinimize = function () {
        var willBeMinimized = !isMinimized;
        setIsMinimized(willBeMinimized);
    };
    var minimizeAndGoBack = function () {
        setIsMinimized(true);
        router.back();
    };
    var closePlayer = function () {
        console.log('CLOSE PLAYER CALLED');
        stopTrack();
        setIsMinimized(false);
        console.log('CLOSE PLAYER COMPLETED');
    };
    var addToPlaylist = function (track) {
        // Check if track already exists in the main playlist
        var existsInMainPlaylist = playlist.some(function (t) { return t.id === track.id; });
        if (!existsInMainPlaylist) {
            setPlaylist(function (prev) { return __spreadArray(__spreadArray([], prev, true), [track], false); });
        }
        // Also add to the first user playlist if it exists
        if (playlists.length > 0) {
            (0, userService_1.addTrackToPlaylist)(playlists[0].id, track.id)
                .then(function (result) {
                if (result) {
                    console.log('Track added to playlist');
                }
                else {
                    console.log('Failed to add track to playlist - user may not be authenticated');
                }
            })
                .catch(function (error) {
                console.error('Error adding track to playlist:', error);
            });
        }
    };
    var removeFromPlaylist = function (trackId) {
        setPlaylist(function (prev) { return prev.filter(function (track) { return track.id !== trackId; }); });
    };
    var createPlaylist = function (name) { return __awaiter(void 0, void 0, void 0, function () {
        var newPlaylist_1, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, userService_1.createPlaylist)(name)];
                case 1:
                    newPlaylist_1 = _a.sent();
                    // Add the new playlist to the playlists array
                    setPlaylists(function (prev) { return __spreadArray(__spreadArray([], prev, true), [newPlaylist_1], false); });
                    // Dispatch a custom event to notify that a playlist has been created
                    window.dispatchEvent(new CustomEvent('playlistCreated', { detail: newPlaylist_1 }));
                    return [3 /*break*/, 3];
                case 2:
                    error_6 = _a.sent();
                    console.error('Error creating playlist:', error_6);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var addToFavorites = function (track) {
        // Check if track already exists in favorites
        var existsInFavorites = favorites.some(function (t) { return t.id === track.id; });
        if (!existsInFavorites) {
            setFavorites(function (prev) { return __spreadArray(__spreadArray([], prev, true), [track], false); });
            // Also add to user's favorites in backend
            (0, userService_1.addTrackToFavorites)(track.id)
                .then(function (result) {
                if (result) {
                    console.log('Track added to favorites');
                    // Dispatch a custom event to notify that favorites have been updated
                    window.dispatchEvent(new CustomEvent('favoritesUpdated'));
                    // Also dispatch a specific event for analytics updates
                    window.dispatchEvent(new CustomEvent('analyticsUpdated'));
                }
                else {
                    console.log('Failed to add track to favorites - user may not be authenticated');
                }
            })
                .catch(function (error) {
                console.error('Error adding track to favorites:', error);
            });
        }
    };
    var removeFromFavorites = function (trackId) {
        setFavorites(function (prev) { return prev.filter(function (track) { return track.id !== trackId; }); });
        // Also remove from user's favorites in backend
        (0, userService_1.removeTrackFromFavorites)(trackId)
            .then(function (result) {
            if (result) {
                console.log('Track removed from favorites');
                // Dispatch a custom event to notify that favorites have been updated
                window.dispatchEvent(new CustomEvent('favoritesUpdated'));
                // Also dispatch a specific event for analytics updates
                window.dispatchEvent(new CustomEvent('analyticsUpdated'));
            }
            else {
                console.log('Failed to remove track from favorites - user may not be authenticated');
            }
        })
            .catch(function (error) {
            console.error('Error removing track from favorites:', error);
        });
    };
    var setCurrentPlaylist = function (tracks) {
        setPlaylist(tracks);
    };
    // Queue management functions
    var addToQueue = function (track) {
        // Ensure the track has all necessary properties to play
        var normalizedTrack = {
            id: track.id,
            title: track.title,
            artist: track.artist,
            coverImage: track.coverImage || '',
            audioUrl: track.audioUrl || track.audioURL || '',
            creatorId: track.creatorId,
            likes: track.likes || 0,
            type: track.type || 'song',
            creatorWhatsapp: track.creatorWhatsapp,
            // Include other necessary properties
            plays: track.plays || 0
        };
        setQueue(function (prev) {
            // Check if track is already in queue
            var exists = prev.some(function (t) { return t.id === normalizedTrack.id; });
            if (!exists) {
                return __spreadArray(__spreadArray([], prev, true), [normalizedTrack], false);
            }
            return prev;
        });
    };
    // Add recommendations to queue
    var addRecommendationsToQueue = function () {
        var args_1 = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args_1[_i] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([], args_1, true), void 0, function (limit) {
            var recommendedTracks, tracksToAdd_1, error_7;
            var _a;
            if (limit === void 0) { limit = 10; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, (0, recommendationService_1.fetchRecommendedTracks)((_a = currentTrackRef.current) === null || _a === void 0 ? void 0 : _a.id, limit)];
                    case 1:
                        recommendedTracks = _b.sent();
                        if (recommendedTracks && recommendedTracks.length > 0) {
                            tracksToAdd_1 = recommendedTracks.map(function (nextTrack) { return ({
                                id: nextTrack._id,
                                title: nextTrack.title,
                                artist: (typeof nextTrack.creatorId === 'object' && nextTrack.creatorId !== null)
                                    ? nextTrack.creatorId.name
                                    : nextTrack.creatorId || 'Unknown Artist',
                                coverImage: nextTrack.coverURL || '',
                                audioUrl: nextTrack.audioURL || '',
                                duration: 0, // Duration is not available in ITrack interface
                                creatorId: (typeof nextTrack.creatorId === 'object' && nextTrack.creatorId !== null)
                                    ? nextTrack.creatorId._id
                                    : nextTrack.creatorId,
                                likes: nextTrack.likes,
                                type: nextTrack.type, // Include track type
                                creatorWhatsapp: (typeof nextTrack.creatorId === 'object' && nextTrack.creatorId !== null)
                                    ? nextTrack.creatorId.whatsappContact
                                    : undefined // Include creator's WhatsApp contact
                            }); });
                            // Add the recommended tracks to the queue
                            setQueue(function (prev) {
                                // Filter out tracks that are already in the queue
                                var newTracks = tracksToAdd_1.filter(function (track) { return !prev.some(function (t) { return t.id === track.id; }); });
                                return __spreadArray(__spreadArray([], prev, true), newTracks, true);
                            });
                            return [2 /*return*/, tracksToAdd_1.length];
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_7 = _b.sent();
                        console.error('Error adding recommendations to queue:', error_7);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/, 0];
                }
            });
        });
    };
    var removeFromQueue = function (trackId) {
        setQueue(function (prev) { return prev.filter(function (track) { return track.id !== trackId; }); });
    };
    var clearQueue = function () {
        setQueue([]);
    };
    var moveQueueItem = function (fromIndex, toIndex) {
        setQueue(function (prev) {
            var newQueue = __spreadArray([], prev, true);
            var movedItem = newQueue.splice(fromIndex, 1)[0];
            newQueue.splice(toIndex, 0, movedItem);
            return newQueue;
        });
    };
    var playFromQueue = function (trackId) {
        var trackIndex = queue.findIndex(function (track) { return track.id === trackId; });
        if (trackIndex !== -1) {
            var track = queue[trackIndex];
            // Remove the track from the queue and play it
            setQueue(function (prev) { return prev.filter(function (_, idx) { return idx !== trackIndex; }); });
            // Play the track but maintain the current playlist context
            // If we're in a playlist/album context, continue using that context
            // Otherwise, use the current playlist or create a single track context
            var contextToUse = playlistRef.current.length > 0 ? playlistRef.current : [track];
            playTrack(track, contextToUse);
        }
    };
    // Function to add all tracks from an album to the queue
    var addAlbumToQueue = function (albumTracks) {
        // Filter out tracks that are already in the queue to avoid duplicates
        var newTracks = albumTracks.filter(function (track) {
            return !queue.some(function (queueTrack) { return queueTrack.id === track.id; });
        });
        if (newTracks.length > 0) {
            setQueue(function (prev) { return __spreadArray(__spreadArray([], prev, true), newTracks, true); });
            // Dispatch a toast notification
            var toastEvent = new CustomEvent('showToast', {
                detail: { message: "Added ".concat(newTracks.length, " tracks to queue"), type: 'success' }
            });
            window.dispatchEvent(toastEvent);
        }
    };
    // Add shufflePlaylist function
    var shufflePlaylist = function () {
        var _a;
        if (playlist.length <= 1) {
            // Dispatch event to notify UI that shuffle was attempted but playlist is too small
            window.dispatchEvent(new CustomEvent('shuffleAttempted', {
                detail: {
                    success: false,
                    reason: 'Playlist has only one track or is empty',
                    playlistLength: playlist.length
                }
            }));
            return;
        }
        // Create a copy of the current playlist
        var shuffledPlaylist = __spreadArray([], playlist, true);
        // Fisher-Yates shuffle algorithm
        for (var i = shuffledPlaylist.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            _a = [shuffledPlaylist[j], shuffledPlaylist[i]], shuffledPlaylist[i] = _a[0], shuffledPlaylist[j] = _a[1];
        }
        // Check if the playlist actually changed order
        var playlistChanged = false;
        for (var i = 0; i < playlist.length; i++) {
            if (playlist[i].id !== shuffledPlaylist[i].id) {
                playlistChanged = true;
                break;
            }
        }
        // Update the playlist state
        setPlaylist(shuffledPlaylist);
        playlistRef.current = shuffledPlaylist;
        // If we have a current track, find its new index in the shuffled playlist
        var newIndex = -1;
        if (currentTrack) {
            newIndex = shuffledPlaylist.findIndex(function (track) { return track.id === currentTrack.id; });
            if (newIndex !== -1) {
                setCurrentTrackIndex(newIndex);
                currentTrackIndexRef.current = newIndex;
            }
        }
        // Dispatch event to notify UI that shuffle was successful
        window.dispatchEvent(new CustomEvent('shuffleAttempted', {
            detail: {
                success: true,
                playlistChanged: playlistChanged,
                playlistLength: shuffledPlaylist.length,
                currentTrackNewIndex: newIndex
            }
        }));
    };
    // Add toggleLoop function
    var toggleLoop = function () {
        setIsLooping(function (prev) { return !prev; });
        console.log('Loop toggled, isLooping:', !isLooping);
    };
    var addComment = function (comment) { return __awaiter(void 0, void 0, void 0, function () {
        var newComment, formattedComment_1, error_8, fallbackComment_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(currentTrack === null || currentTrack === void 0 ? void 0 : currentTrack.id)) {
                        console.error('Cannot add comment: No current track');
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, trackService_1.addCommentToTrack)(currentTrack.id, comment.text)];
                case 2:
                    newComment = _a.sent();
                    formattedComment_1 = {
                        id: newComment._id,
                        userId: newComment.userId._id || newComment.userId,
                        username: newComment.userId.name || comment.username,
                        text: newComment.text,
                        timestamp: newComment.createdAt
                    };
                    // Update the comments state
                    setComments(function (prev) { return __spreadArray(__spreadArray([], prev, true), [formattedComment_1], false); });
                    return [3 /*break*/, 4];
                case 3:
                    error_8 = _a.sent();
                    console.error('Error adding comment:', error_8);
                    fallbackComment_1 = __assign(__assign({ id: Date.now().toString() }, comment), { timestamp: new Date().toISOString() });
                    setComments(function (prev) { return __spreadArray(__spreadArray([], prev, true), [fallbackComment_1], false); });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var removeComment = function (commentId) {
        setComments(function (prev) { return prev.filter(function (comment) { return comment.id !== commentId; }); });
    };
    // Function to clear all favorites (useful for removing mock/test data)
    var clearAllFavorites = function () { return __awaiter(void 0, void 0, void 0, function () {
        var currentFavorites, _i, currentFavorites_1, track, error_9;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // First clear the local state
                    setFavorites([]);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    currentFavorites = __spreadArray([], favorites, true);
                    _i = 0, currentFavorites_1 = currentFavorites;
                    _a.label = 2;
                case 2:
                    if (!(_i < currentFavorites_1.length)) return [3 /*break*/, 5];
                    track = currentFavorites_1[_i];
                    return [4 /*yield*/, (0, userService_1.removeTrackFromFavorites)(track.id)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    console.log("Removed ".concat(currentFavorites.length, " tracks from favorites"));
                    return [3 /*break*/, 7];
                case 6:
                    error_9 = _a.sent();
                    console.error('Error removing favorites from backend:', error_9);
                    return [3 /*break*/, 7];
                case 7:
                    // Also notify that favorites have been updated
                    window.dispatchEvent(new CustomEvent('favoritesUpdated'));
                    return [2 /*return*/];
            }
        });
    }); };
    // New function to load comments from backend
    var loadComments = function (trackId) { return __awaiter(void 0, void 0, void 0, function () {
        var trackComments, formattedComments, error_10;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, trackService_1.fetchCommentsForTrack)(trackId)];
                case 1:
                    trackComments = _a.sent();
                    formattedComments = trackComments.map(function (comment) { return ({
                        id: comment._id,
                        userId: comment.userId._id || comment.userId,
                        username: comment.userId.name || 'Unknown User',
                        text: comment.text,
                        timestamp: comment.createdAt
                    }); });
                    setComments(formattedComments);
                    return [3 /*break*/, 3];
                case 2:
                    error_10 = _a.sent();
                    console.error('Error loading comments:', error_10);
                    setComments([]);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    // Add setVolume function to update volume
    var updateVolume = function (newVolume) {
        setVolume(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
        }
    };
    // Add shareTrack function
    var shareTrack = function (platform) {
        if (!currentTrack)
            return;
        var trackUrl = "".concat(window.location.origin, "/tracks/").concat(currentTrack.id);
        var text = "Check out \"".concat(currentTrack.title, "\" by ").concat(currentTrack.artist, " on MuzikaX");
        switch (platform) {
            case 'facebook':
                window.open("https://www.facebook.com/sharer/sharer.php?u=".concat(encodeURIComponent(trackUrl)), '_blank');
                break;
            case 'twitter':
                window.open("https://twitter.com/intent/tweet?text=".concat(encodeURIComponent(text), "&url=").concat(encodeURIComponent(trackUrl)), '_blank');
                break;
            case 'whatsapp':
                window.open("https://wa.me/?text=".concat(encodeURIComponent("".concat(text, " ").concat(trackUrl))), '_blank');
                break;
            case 'linkedin':
                window.open("https://www.linkedin.com/shareArticle?mini=true&url=".concat(encodeURIComponent(trackUrl), "&title=").concat(encodeURIComponent(currentTrack.title), "&summary=").concat(encodeURIComponent(text)), '_blank');
                break;
            case 'copy':
                navigator.clipboard.writeText(trackUrl);
                break;
            default:
                console.warn('Unsupported sharing platform:', platform);
        }
    };
    // Add downloadTrack function
    var downloadTrack = function () { return __awaiter(void 0, void 0, void 0, function () {
        var isBeat, paymentType, creatorWhatsapp, fetchCreatorWhatsapp, whatsappResult, message, link_1, link;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!currentTrack)
                        return [2 /*return*/];
                    isBeat = currentTrack.type === 'beat' ||
                        (currentTrack.title && currentTrack.title.toLowerCase().includes('beat'));
                    if (!isBeat) return [3 /*break*/, 6];
                    paymentType = currentTrack.paymentType || 'free';
                    if (!(paymentType === 'paid')) return [3 /*break*/, 4];
                    creatorWhatsapp = currentTrack.creatorWhatsapp;
                    if (!(!creatorWhatsapp && currentTrack.creatorId)) return [3 /*break*/, 3];
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('@/services/trackService'); })];
                case 1:
                    fetchCreatorWhatsapp = (_a.sent()).fetchCreatorWhatsapp;
                    return [4 /*yield*/, fetchCreatorWhatsapp(currentTrack.creatorId)];
                case 2:
                    whatsappResult = _a.sent();
                    if (whatsappResult) {
                        creatorWhatsapp = whatsappResult;
                    }
                    _a.label = 3;
                case 3:
                    if (creatorWhatsapp) {
                        message = "Hi, I'm interested in your beat \"".concat(currentTrack.title, "\" that I found on MuzikaX.");
                        window.open("https://wa.me/".concat(creatorWhatsapp, "?text=").concat(encodeURIComponent(message)), '_blank');
                    }
                    else {
                        // No WhatsApp contact available
                        alert('This is a paid beat that requires contacting the creator via WhatsApp to obtain. Unfortunately, the creator has not provided their WhatsApp contact information.');
                    }
                    return [3 /*break*/, 5];
                case 4:
                    link_1 = document.createElement('a');
                    link_1.href = currentTrack.audioUrl;
                    link_1.download = "".concat(currentTrack.title.replace(/\s+/g, '_'), ".mp3"); // Suggest a filename
                    // Trigger the download
                    document.body.appendChild(link_1);
                    link_1.click();
                    document.body.removeChild(link_1);
                    _a.label = 5;
                case 5: return [2 /*return*/];
                case 6:
                    link = document.createElement('a');
                    link.href = currentTrack.audioUrl;
                    link.download = "".concat(currentTrack.title.replace(/\s+/g, '_'), ".mp3"); // Suggest a filename
                    // Trigger the download
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    return [2 /*return*/];
            }
        });
    }); };
    return (<AudioPlayerContext.Provider value={{
            currentTrack: currentTrack,
            isPlaying: isPlaying,
            isMinimized: isMinimized,
            queue: queue,
            currentPlaylistName: currentPlaylistName,
            playTrack: playTrack,
            playNextTrack: playNextTrack,
            playPreviousTrack: playPreviousTrack,
            pauseTrack: pauseTrack,
            stopTrack: stopTrack,
            togglePlayPause: togglePlayPause,
            toggleMinimize: toggleMinimize,
            minimizeAndGoBack: minimizeAndGoBack,
            closePlayer: closePlayer,
            progress: progress,
            duration: duration,
            setProgress: setProgress,
            playlist: playlist,
            playlists: playlists,
            favorites: favorites,
            favoritesLoading: favoritesLoading,
            comments: comments,
            addToPlaylist: addToPlaylist,
            removeFromPlaylist: removeFromPlaylist,
            createPlaylist: createPlaylist,
            addToFavorites: addToFavorites,
            removeFromFavorites: removeFromFavorites,
            setCurrentPlaylist: setCurrentPlaylist,
            shufflePlaylist: shufflePlaylist, // Export shufflePlaylist function
            toggleLoop: toggleLoop,
            isLooping: isLooping,
            currentTrackIndex: currentTrackIndex,
            audioRef: audioRef,
            addToQueue: addToQueue,
            removeFromQueue: removeFromQueue,
            clearQueue: clearQueue,
            moveQueueItem: moveQueueItem,
            playFromQueue: playFromQueue,
            addAlbumToQueue: addAlbumToQueue, // Export addAlbumToQueue function
            addRecommendationsToQueue: addRecommendationsToQueue,
            addComment: addComment,
            removeComment: removeComment,
            loadComments: loadComments,
            volume: volume,
            setVolume: updateVolume,
            playbackRate: playbackRate,
            setPlaybackRate: setPlaybackRate,
            shareTrack: shareTrack,
            downloadTrack: downloadTrack, // Export downloadTrack function
            clearAllFavorites: clearAllFavorites,
            // Music visualization properties
            audioAnalyser: analyserRef.current,
            audioContext: audioContextRef.current,
            frequencyData: frequencyDataRef.current
        }}>
      {children}
    </AudioPlayerContext.Provider>);
};
exports.AudioPlayerProvider = AudioPlayerProvider;

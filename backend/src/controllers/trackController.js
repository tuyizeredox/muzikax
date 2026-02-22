"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrendingTracks = exports.incrementPlayCount = exports.deleteTrack = exports.updateTrack = exports.getTracksByAuthUser = exports.getTracksByCreator = exports.getTracksByCreatorSimple = exports.getTrackById = exports.getAllTracks = exports.uploadTrack = void 0;
const Track_1 = require("../models/Track");
const ListenerGeography_1 = require("../models/ListenerGeography");
const User_1 = require("../models/User");
const geoip = require('geoip-lite');
const { handlePlaybackError } = require("../../cleanup_invalid_tracks");
// import User from '../models/User'; // Not used in this controller
// Upload track
const uploadTrack = async (req, res) => {
    try {
        const { title, description, genre, type, audioURL, coverURL, releaseDate, collaborators, copyrightAccepted } = req.body;
        const user = req.user;
        
        // Validate required fields
        if (!title || !audioURL) {
            res.status(400).json({ message: 'Title and audio URL are required' });
            return;
        }
        
        // Validate copyright policy acceptance
        if (copyrightAccepted !== true) {
            res.status(400).json({ message: 'Copyright policy must be accepted' });
            return;
        }
        
        const track = await Track_1.create({
            creatorId: user._id,
            creatorType: user.creatorType,
            title,
            description: description || '',
            genre: genre || 'afrobeat',
            type: type || 'song',
            audioURL,
            coverURL: coverURL || '',
            releaseDate: releaseDate || new Date(),
            collaborators: collaborators || [],
            copyrightAccepted: copyrightAccepted
        });
        
        res.status(201).json(track);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.uploadTrack = uploadTrack;
// Get all tracks
const getAllTracks = async (req, res) => {
    try {
        const page = parseInt(req.query['page']) || 1;
        const limit = parseInt(req.query['limit']) || 0; // 0 means no limit
        const skip = (page - 1) * limit;
        
        // Build the query object
        const query = {};
        
        // Search by title
        if (req.query['search']) {
            query.title = { $regex: req.query['search'], $options: 'i' };
        }
        
        // Filter by type
        if (req.query['type'] && req.query['type'] !== 'all') {
            const typeValue = req.query['type'];
            if (typeValue.toLowerCase() === 'beat') {
                query.type = { $in: ['beat', 'beta'] };
            } else {
                query.type = typeValue.toLowerCase();
            }
        }
        
        // Filter by payment type
        if (req.query['paymentType'] && req.query['paymentType'] !== 'all') {
            query.paymentType = req.query['paymentType'];
        }
        
        // Filter by genre
        if (req.query['genre'] && req.query['genre'] !== 'all') {
            query.genre = req.query['genre'];
        }
        
        // Filter by creator type
        if (req.query['creatorType'] && req.query['creatorType'] !== 'all') {
            // We need to join with User collection to filter by creatorType
            const usersWithCreatorType = await User_1.find({ creatorType: req.query['creatorType'] }).select('_id');
            const userIds = usersWithCreatorType.map(user => user._id);
            query.creatorId = { $in: userIds };
        }
        
        // Date range filtering
        if (req.query['dateFrom'] || req.query['dateTo']) {
            query.createdAt = {};
            if (req.query['dateFrom']) {
                query.createdAt.$gte = new Date(req.query['dateFrom']);
            }
            if (req.query['dateTo']) {
                query.createdAt.$lte = new Date(req.query['dateTo']);
            }
        }
        
        // Play count filtering
        if (req.query['playCountFilter'] && req.query['playCountFilter'] !== 'all') {
            const playFilter = req.query['playCountFilter'];
            switch (playFilter) {
                case 'high':
                    query.plays = { $gt: 1000 };
                    break;
                case 'medium':
                    query.plays = { $gte: 100, $lte: 1000 };
                    break;
                case 'low':
                    query.plays = { $lt: 100 };
                    break;
                case 'new':
                    query.plays = { $lt: 10 };
                    break;
            }
        }
        
        // Like count filtering
        if (req.query['likeCountFilter'] && req.query['likeCountFilter'] !== 'all') {
            const likeFilter = req.query['likeCountFilter'];
            switch (likeFilter) {
                case 'popular':
                    query.likes = { $gt: 100 };
                    break;
                case 'moderate':
                    query.likes = { $gte: 10, $lte: 100 };
                    break;
                case 'low':
                    query.likes = { $lt: 10 };
                    break;
            }
        }
        
        // Build sort object
        let sortObj = {};
        const sortBy = req.query['sortBy'] || 'createdAt';
        const sortOrder = req.query['sortOrder'] || 'desc';
        
        switch (sortBy) {
            case 'plays':
                sortObj.plays = sortOrder === 'desc' ? -1 : 1;
                break;
            case 'likes':
                sortObj.likes = sortOrder === 'desc' ? -1 : 1;
                break;
            case 'title':
                sortObj.title = sortOrder === 'desc' ? -1 : 1;
                break;
            default: // createdAt
                sortObj.createdAt = sortOrder === 'desc' ? -1 : 1;
                break;
        }
        
        const trackQuery = Track_1.find(query)
            .populate('creatorId', 'name avatar creatorType')
            .sort(sortObj);
            
        // Only apply skip and limit if limit > 0
        if (limit > 0) {
            trackQuery.skip(skip).limit(limit);
        }
        
        const tracks = await trackQuery;
            
        // Ensure all tracks have proper paymentType values
        const tracksWithDefaults = tracks.map(track => {
            // Convert Mongoose document to plain object to ensure all fields are accessible
            const trackObj = track.toObject ? track.toObject() : track;
            
            // Ensure paymentType defaults to 'free' if not present
            if (!trackObj.paymentType) {
                trackObj.paymentType = 'free';
            }
            
            return trackObj;
        });
        
        const total = await Track_1.countDocuments(query);
        res.json({
            tracks: tracksWithDefaults,
            page,
            pages: Math.ceil(total / limit),
            total
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getAllTracks = getAllTracks;
// Get track by ID
const getTrackById = async (req, res) => {
    try {
        const trackId = req.params['id'];
        
        // Validate that we have a track ID
        if (!trackId || trackId === 'undefined') {
            console.error('Invalid track ID received:', trackId);
            res.status(400).json({ message: 'Invalid track ID' });
            return;
        }
        
        const track = await Track_1.findById(trackId)
            .populate('creatorId', 'name avatar whatsappContact');
        if (!track) {
            res.status(404).json({ message: 'Track not found' });
            return;
        }
        
        // Convert Mongoose document to plain object to ensure all fields are accessible
        const trackObj = track.toObject ? track.toObject() : track;
        
        // Ensure paymentType defaults to 'free' if not present
        if (!trackObj.paymentType) {
            trackObj.paymentType = 'free';
        }
        
        res.json(trackObj);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getTrackById = getTrackById;
// Get all tracks by creator (without pagination)
const getTracksByCreatorSimple = async (req, res) => {
    try {
        const creatorId = req.params['creatorId'];
        
        if (!creatorId) {
            res.status(400).json({ message: 'Creator ID is required' });
            return;
        }
        
        let actualCreatorId;
        
        // Check if the ID is a valid ObjectId format
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(creatorId);
        if (isValidObjectId) {
            // If it's a valid ObjectId, use it directly
            actualCreatorId = creatorId;
        } else {
            // If it's not a valid ObjectId, search for the user by name to get their ObjectId
            const user = await User_1.findOne({ name: creatorId });
            if (!user) {
                res.status(404).json({ message: 'Creator not found' });
                return;
            }
            actualCreatorId = user._id;
        }
        
        const tracks = await Track_1.find({ creatorId: actualCreatorId })
            .sort({ createdAt: -1 })
            .populate('creatorId', 'name avatar');
            
        // Ensure all tracks have proper paymentType values
        const tracksWithDefaults = tracks.map(track => {
            // Convert Mongoose document to plain object to ensure all fields are accessible
            const trackObj = track.toObject ? track.toObject() : track;
            
            // Ensure paymentType defaults to 'free' if not present
            if (!trackObj.paymentType) {
                trackObj.paymentType = 'free';
            }
            
            return trackObj;
        });
        
        res.json(tracksWithDefaults);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getTracksByCreatorSimple = getTracksByCreatorSimple;
// Get tracks by creator
const getTracksByCreator = async (req, res) => {
    try {
        const creatorId = req.params['creatorId'];
        
        if (!creatorId) {
            res.status(400).json({ message: 'Creator ID is required' });
            return;
        }
        
        let actualCreatorId;
        
        // Check if the ID is a valid ObjectId format
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(creatorId);
        if (isValidObjectId) {
            // If it's a valid ObjectId, use it directly
            actualCreatorId = creatorId;
        } else {
            // If it's not a valid ObjectId, search for the user by name to get their ObjectId
            const user = await User_1.findOne({ name: creatorId });
            if (!user) {
                res.status(404).json({ message: 'Creator not found' });
                return;
            }
            actualCreatorId = user._id;
        }
        
        // Check if pagination parameters are provided
        const pageParam = req.query['page'];
        const limitParam = req.query['limit'];
        // If no pagination parameters, return all tracks
        if (pageParam === undefined && limitParam === undefined) {
            const tracks = await Track_1.find({ creatorId: actualCreatorId })
                .sort({ createdAt: -1 })
                .populate('creatorId', 'name avatar');
                
            // Ensure all tracks have proper paymentType values
            const tracksWithDefaults = tracks.map(track => {
                // Convert Mongoose document to plain object to ensure all fields are accessible
                const trackObj = track.toObject ? track.toObject() : track;
                
                // Ensure paymentType defaults to 'free' if not present
                if (!trackObj.paymentType) {
                    trackObj.paymentType = 'free';
                }
                
                return trackObj;
            });
            
            res.json(tracksWithDefaults);
            return;
        }
        // Otherwise, use pagination
        const page = parseInt(pageParam) || 1;
        const limit = parseInt(limitParam) || 10;
        const skip = (page - 1) * limit;
        const tracks = await Track_1.find({ creatorId: actualCreatorId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('creatorId', 'name avatar');
            
        // Ensure all tracks have proper paymentType values
        const tracksWithDefaults = tracks.map(track => {
            // Convert Mongoose document to plain object to ensure all fields are accessible
            const trackObj = track.toObject ? track.toObject() : track;
            
            // Ensure paymentType defaults to 'free' if not present
            if (!trackObj.paymentType) {
                trackObj.paymentType = 'free';
            }
            
            return trackObj;
        });
        
        const total = await Track_1.countDocuments({ creatorId: actualCreatorId });
        res.json({
            tracks: tracksWithDefaults,
            page,
            pages: Math.ceil(total / limit),
            total
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getTracksByCreator = getTracksByCreator;
// Get tracks by authenticated user (for profile page)
const getTracksByAuthUser = async (req, res) => {
    try {
        // Check if pagination parameters are provided
        const pageParam = req.query['page'];
        const limitParam = req.query['limit'];
        // Get creator ID from authenticated user
        const creatorId = req.user._id;
        // If no pagination parameters, return all tracks
        if (pageParam === undefined && limitParam === undefined) {
            const tracks = await Track_1.find({ creatorId })
                .sort({ createdAt: -1 })
                .populate('creatorId', 'name avatar');
                
            // Ensure all tracks have proper paymentType values
            const tracksWithDefaults = tracks.map(track => {
                // Convert Mongoose document to plain object to ensure all fields are accessible
                const trackObj = track.toObject ? track.toObject() : track;
                
                // Ensure paymentType defaults to 'free' if not present
                if (!trackObj.paymentType) {
                    trackObj.paymentType = 'free';
                }
                
                return trackObj;
            });
            
            res.json(tracksWithDefaults);
            return;
        }
        // Otherwise, use pagination
        const page = parseInt(pageParam) || 1;
        const limit = parseInt(limitParam) || 10;
        const skip = (page - 1) * limit;
        const tracks = await Track_1.find({ creatorId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('creatorId', 'name avatar');
            
        // Ensure all tracks have proper paymentType values
        const tracksWithDefaults = tracks.map(track => {
            // Convert Mongoose document to plain object to ensure all fields are accessible
            const trackObj = track.toObject ? track.toObject() : track;
            
            // Ensure paymentType defaults to 'free' if not present
            if (!trackObj.paymentType) {
                trackObj.paymentType = 'free';
            }
            
            return trackObj;
        });
        
        const total = await Track_1.countDocuments({ creatorId });
        res.json({
            tracks: tracksWithDefaults,
            page,
            pages: Math.ceil(total / limit),
            total
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getTracksByAuthUser = getTracksByAuthUser;
// Update track
const updateTrack = async (req, res) => {
    try {
        const { title, genre, coverURL, description, releaseDate, collaborators, copyrightAccepted } = req.body;
        const track = await Track_1.findById(req.params['id']);
        if (!track) {
            res.status(404).json({ message: 'Track not found' });
            return;
        }
        // Check if user is the creator
        // Handle both cases: when creatorId is populated (object) or not (ObjectId)
        const trackOwnerId = track.creatorId && typeof track.creatorId === 'object' && '_id' in track.creatorId ? 
            track.creatorId._id.toString() : 
            track.creatorId.toString();
        
        if (trackOwnerId !== req.user._id.toString()) {
            res.status(401).json({ 
                message: 'You are not authorized to edit this track.',
                trackOwnerId,
                userId: req.user._id.toString()
            });
            return;
        }
        // Update fields if provided
        if (title !== undefined)
            track.title = title;
        if (genre !== undefined)
            track.genre = genre;
        if (coverURL !== undefined)
            track.coverURL = coverURL;
        if (description !== undefined)
            track.description = description;
        if (releaseDate !== undefined)
            track.releaseDate = releaseDate;
        if (collaborators !== undefined)
            track.collaborators = collaborators;
        if (copyrightAccepted !== undefined)
            track.copyrightAccepted = copyrightAccepted;
        const updatedTrack = await track.save();
        res.json(updatedTrack);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.updateTrack = updateTrack;
// Delete track
const deleteTrack = async (req, res) => {
    try {
        const track = await Track_1.findById(req.params['id']);
        if (!track) {
            res.status(404).json({ message: 'Track not found' });
            return;
        }
        // Check if user is the creator or admin
        // Handle both cases: when creatorId is populated (object) or not (ObjectId)
        const trackOwnerId = track.creatorId && typeof track.creatorId === 'object' && '_id' in track.creatorId ? 
            track.creatorId._id.toString() : 
            track.creatorId.toString();
        
        if (trackOwnerId !== req.user._id.toString() &&
            req.user.role !== 'admin') {
            res.status(401).json({ 
                message: 'You are not authorized to delete this track.',
                trackOwnerId,
                userId: req.user._id.toString()
            });
            return;
        }
        // Get the creator ID for notification
        const creatorId = track.creatorId && typeof track.creatorId === 'object' ? 
            track.creatorId._id : 
            track.creatorId;
        
        // Get reason from request body or query if admin
        const reason = req.body?.reason || req.query?.reason || 'No reason provided';
        
        // Delete the track
        await track.deleteOne();
        
        // If deleted by admin, create a notification for the creator
        if (req.user.role === 'admin') {
            const { createTrackDeletionNotification } = require('./notificationController');
            await createTrackDeletionNotification(track._id, creatorId, req.user._id, reason);
        }
        
        res.json({ message: 'Track removed' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.deleteTrack = deleteTrack;
// Increment play count
const incrementPlayCount = async (req, res) => {
    try {
        const track = await Track_1.findByIdAndUpdate(req.params['id'], { $inc: { plays: 1 } }, { new: true });
        if (!track) {
            res.status(404).json({ message: 'Track not found' });
            return;
        }

        // Update earnings for the creator if they are monetized
        try {
            const { updateEarnings } = require('./monetizationController');
            await updateEarnings(track.creatorId, 1);
        } catch (earningsError) {
            console.error('Error updating earnings:', earningsError);
            // Don't fail the play count update if earnings update fails
        }

        // Capture IP address and store geography data
        const ipAddress = req.ip || req.connection.remoteAddress || '';
        if (ipAddress) {
            // Remove IPv6 prefix if present
            const cleanIpAddress = ipAddress.replace('::ffff:', '');
            
            // Get geography data from IP
            const geo = geoip.lookup(cleanIpAddress);
            
            if (geo) {
                // Store geography data
                await ListenerGeography_1.create({
                    trackId: track._id,
                    creatorId: track.creatorId,
                    ipAddress: cleanIpAddress,
                    country: geo.country,
                    region: geo.region,
                    city: geo.city,
                    latitude: geo.ll[0],
                    longitude: geo.ll[1],
                    timestamp: new Date()
                });
            }
        }

        // Track play history for monthly analytics
        const now = new Date();
        const PlayHistory = require('../models/PlayHistory');
        
        try {
            await PlayHistory.create({
                trackId: track._id,
                userId: req.user ? req.user._id : null,
                ipAddress: cleanIpAddress || ipAddress,
                userAgent: req.get('User-Agent'),
                timestamp: now,
                year: now.getFullYear(),
                month: now.getMonth() + 1 // JavaScript months are 0-indexed
            });
        } catch (playHistoryError) {
            console.error('Error recording play history:', playHistoryError);
            // Don't fail the main play count update if play history fails
        }

        res.json(track);
    }
    catch (error) {
        console.error('Error incrementing play count:', error);
        res.status(500).json({ message: error.message });
    }
};
exports.incrementPlayCount = incrementPlayCount;

// Get tracks sorted by monthly plays for current month
const getMonthlyPopularTracks = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
        
        const PlayHistory = require('../models/PlayHistory');
        
        // First, get all tracks and their basic info
        const allTracks = await Track_1.find({
            type: { $in: ['song', 'beat', 'mix'] }
        })
        .populate('creatorId', 'name')
        .lean();
        
        // Get play history for current month
        const monthlyPlayCounts = await PlayHistory.aggregate([
            {
                $match: {
                    year: currentYear,
                    month: currentMonth
                }
            },
            {
                $group: {
                    _id: "$trackId",
                    playCount: { $sum: 1 },
                    uniqueListeners: { $addToSet: "$ipAddress" }
                }
            }
        ]);
        
        // Combine track data with monthly play counts
        const tracksWithScores = allTracks.map(track => {
            const playData = monthlyPlayCounts.find(item => item._id.toString() === track._id.toString());
            const monthlyPlays = playData ? playData.playCount : 0;
            const uniqueListeners = playData ? playData.uniqueListeners.length : 0;
            
            // Calculate a score that combines:
            // 1. Monthly plays (primary factor)
            // 2. Overall plays (secondary factor)
            // 3. Recency bonus (newer tracks get a boost)
            const createdAt = new Date(track.createdAt);
            const daysOld = (now - createdAt) / (1000 * 60 * 60 * 24);
            
            // Recency bonus: newer tracks get higher scores
            // Tracks from this month get a significant boost
            let recencyBonus = 0;
            if (daysOld <= 30) {
                recencyBonus = 1000; // Strong boost for very new tracks
            } else if (daysOld <= 90) {
                recencyBonus = 500;  // Moderate boost for recent tracks
            } else if (daysOld <= 180) {
                recencyBonus = 100;  // Small boost for somewhat recent tracks
            }
            
            // Main scoring formula
            const score = (monthlyPlays * 100) + (track.plays * 0.1) + recencyBonus;
            
            return {
                ...track,
                monthlyPlays: monthlyPlays,
                uniqueListeners: uniqueListeners,
                score: score,
                daysOld: daysOld
            };
        });
        
        // Sort by score (highest first) and limit results
        tracksWithScores.sort((a, b) => b.score - a.score);
        const topTracks = tracksWithScores.slice(0, limit);
        
        res.json(topTracks);
    } catch (error) {
        console.error('Error getting monthly popular tracks:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getMonthlyPopularTracks = getMonthlyPopularTracks;
// Get trending tracks
const getTrendingTracks = async (req, res) => {
        try {
            const limitParam = req.query['limit'];
            const limit = limitParam !== undefined ? parseInt(limitParam) : 10;
            // Filter out beat and beta type tracks from trending (case-insensitive)
            const query = Track_1.find({
                type: { $nin: ['beat', 'BEAT', 'Beat', 'beta', 'BETA', 'Beta'] }  // Case-insensitive exclusion of types
            })
                .sort({ plays: -1, createdAt: -1 });
            
            // Only apply limit if limit > 0
            if (limit > 0) {
                query.limit(limit);
            }
            
            const tracks = await query.populate('creatorId', 'name avatar');
                
            // Ensure all tracks have proper paymentType values
            const tracksWithDefaults = tracks.map(track => {
                // Convert Mongoose document to plain object to ensure all fields are accessible
                const trackObj = track.toObject ? track.toObject() : track;
                
                // Ensure paymentType defaults to 'free' if not present
                if (!trackObj.paymentType) {
                    trackObj.paymentType = 'free';
                }
                
                return trackObj;
            });
            
            res.json(tracksWithDefaults);
        }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getTrendingTracks = getTrendingTracks;

// Get tracks by type (for specific type sections like beats)
const getTracksByType = async (req, res) => {
    try {
        const type = req.query.type;
        const limit = parseInt(req.query.limit) || 0; // 0 means no limit
        
        if (!type) {
            res.status(400).json({ message: 'Type parameter is required' });
            return;
        }
        
        // Handle the case where 'beat' should return both 'beat' and 'beta' types
        let query = {};
        if (type.toLowerCase() === 'beat') {
            query = { type: { $in: ['beat', 'beta'] } };
        } else {
            query = { type: type.toLowerCase() }; // Exact match
        }
        
        const trackQuery = Track_1.find(query)
            .sort({ plays: -1, createdAt: -1 })
            .populate('creatorId', 'name avatar whatsappContact');
            
        // Only apply limit if limit > 0
        if (limit > 0) {
            trackQuery.limit(limit);
        }
        
        const tracks = await trackQuery;
            
        // Ensure all tracks have proper paymentType values
        const tracksWithDefaults = tracks.map(track => {
            // Convert Mongoose document to plain object to ensure all fields are accessible
            const trackObj = track.toObject ? track.toObject() : track;
            
            // Ensure paymentType defaults to 'free' if not present
            if (!trackObj.paymentType) {
                trackObj.paymentType = 'free';
            }
            
            return trackObj;
        });
        
        res.json(tracksWithDefaults);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getTracksByType = getTracksByType;

// Handle playback error and remove invalid tracks
const handleInvalidTrack = async (req, res) => {
    try {
        const { id: trackId } = req.params;
        
        if (!trackId) {
            res.status(400).json({ message: 'Track ID is required' });
            return;
        }
        
        console.log(`Processing invalid track report for track ID: ${trackId}`);
        
        // Use the cleanup utility to handle the invalid track
        const result = await handlePlaybackError(trackId);
        
        if (result.success) {
            res.json({
                message: 'Invalid track removed from database',
                trackTitle: result.trackTitle,
                removed: true
            });
        } else if (result.error) {
            res.status(500).json({
                message: 'Error processing invalid track',
                error: result.error
            });
        } else {
            res.json({
                message: result.message || 'Track validation completed',
                trackTitle: result.trackTitle,
                removed: false
            });
        }
    } catch (error) {
        console.error('Error in handleInvalidTrack:', error);
        res.status(500).json({ 
            message: 'Internal server error',
            error: error.message 
        });
    }
};
exports.handleInvalidTrack = handleInvalidTrack;

//# sourceMappingURL=trackController.js.map
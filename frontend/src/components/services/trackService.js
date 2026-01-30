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
exports.getFollowedCreators = exports.deleteTrack = exports.incrementTrackPlayCount = exports.checkFollowStatus = exports.unfollowCreator = exports.followCreator = exports.addCommentToTrack = exports.fetchCommentsForTrack = exports.fetchPopularCreators = exports.fetchTracksByType = exports.fetchTracksByCreator = exports.fetchTracksByCreatorPublic = exports.fetchTrackById = exports.fetchTrendingTracks = exports.fetchAllTracks = exports.fetchCreatorWhatsapp = exports.fetchCreatorProfile = void 0;
// Helper function to refresh token
var refreshToken = function () { return __awaiter(void 0, void 0, void 0, function () {
    var refreshToken_1, response, data, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                refreshToken_1 = localStorage.getItem('refreshToken');
                if (!refreshToken_1) {
                    return [2 /*return*/, null];
                }
                return [4 /*yield*/, fetch("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/auth/refresh-token"), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ refreshToken: refreshToken_1 })
                    })];
            case 1:
                response = _a.sent();
                if (!response.ok) return [3 /*break*/, 3];
                return [4 /*yield*/, response.json()];
            case 2:
                data = _a.sent();
                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);
                return [2 /*return*/, data.accessToken];
            case 3: return [3 /*break*/, 5];
            case 4:
                error_1 = _a.sent();
                console.error('Error refreshing token:', error_1);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/, null];
        }
    });
}); };
// Helper function to make authenticated request with token refresh
var makeAuthenticatedRequest = function (url_1) {
    var args_1 = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args_1[_i - 1] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([url_1], args_1, true), void 0, function (url, options) {
        var accessToken, requestOptions, response, newToken;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    accessToken = localStorage.getItem('accessToken');
                    if (!accessToken) {
                        throw new Error('No access token found');
                    }
                    requestOptions = __assign(__assign({}, options), { headers: __assign(__assign({}, options.headers), { 'Content-Type': 'application/json', 'Authorization': "Bearer ".concat(accessToken) }) });
                    return [4 /*yield*/, fetch(url, requestOptions)];
                case 1:
                    response = _a.sent();
                    if (!(response.status === 401)) return [3 /*break*/, 4];
                    console.log('Token might be expired, attempting to refresh...');
                    return [4 /*yield*/, refreshToken()];
                case 2:
                    newToken = _a.sent();
                    if (!newToken) return [3 /*break*/, 4];
                    // Retry the request with new token
                    requestOptions.headers = __assign(__assign({}, requestOptions.headers), { 'Authorization': "Bearer ".concat(newToken) });
                    return [4 /*yield*/, fetch(url, requestOptions)];
                case 3:
                    response = _a.sent();
                    _a.label = 4;
                case 4: return [2 /*return*/, response];
            }
        });
    });
};
/**
 * Fetch a creator's public profile by ID
 */
var fetchCreatorProfile = function (creatorId) { return __awaiter(void 0, void 0, void 0, function () {
    var response, data, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, fetch("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/public/creators/").concat(creatorId))];
            case 1:
                response = _a.sent();
                if (!response.ok) {
                    throw new Error("Failed to fetch creator profile: ".concat(response.status, " ").concat(response.statusText));
                }
                return [4 /*yield*/, response.json()];
            case 2:
                data = _a.sent();
                return [2 /*return*/, data];
            case 3:
                error_2 = _a.sent();
                console.error('Error fetching creator profile:', error_2);
                throw error_2;
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.fetchCreatorProfile = fetchCreatorProfile;
/**
 * Fetch a creator's WhatsApp contact by ID
 * Simplified approach to get just the WhatsApp number
 */
var fetchCreatorWhatsapp = function (creatorId) { return __awaiter(void 0, void 0, void 0, function () {
    var response, data, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, fetch("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/public/creators/").concat(creatorId))];
            case 1:
                response = _a.sent();
                if (!response.ok) {
                    throw new Error("Failed to fetch creator WhatsApp: ".concat(response.status, " ").concat(response.statusText));
                }
                return [4 /*yield*/, response.json()];
            case 2:
                data = _a.sent();
                return [2 /*return*/, data.whatsappContact || null];
            case 3:
                error_3 = _a.sent();
                console.error('Error fetching creator WhatsApp:', error_3);
                return [2 /*return*/, null];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.fetchCreatorWhatsapp = fetchCreatorWhatsapp;
/**
 * Fetch all tracks with pagination
 */
var fetchAllTracks = function () {
    var args_1 = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args_1[_i] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([], args_1, true), void 0, function (page, limit) {
        var response, data, error_4;
        if (page === void 0) { page = 1; }
        if (limit === void 0) { limit = 10; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/tracks?limit=").concat(limit, "&page=").concat(page))];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("Failed to fetch tracks: ".concat(response.status, " ").concat(response.statusText));
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    return [2 /*return*/, data];
                case 3:
                    error_4 = _a.sent();
                    console.error('Error fetching tracks:', error_4);
                    throw error_4;
                case 4: return [2 /*return*/];
            }
        });
    });
};
exports.fetchAllTracks = fetchAllTracks;
/**
 * Fetch trending tracks
 */
var fetchTrendingTracks = function () {
    var args_1 = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args_1[_i] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([], args_1, true), void 0, function (limit) {
        var response, data, error_5;
        if (limit === void 0) { limit = 10; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/tracks/trending?limit=").concat(limit))];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("Failed to fetch trending tracks: ".concat(response.status, " ").concat(response.statusText));
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    return [2 /*return*/, data];
                case 3:
                    error_5 = _a.sent();
                    console.error('Error fetching trending tracks:', error_5);
                    throw error_5;
                case 4: return [2 /*return*/];
            }
        });
    });
};
exports.fetchTrendingTracks = fetchTrendingTracks;
/**
 * Fetch a single track by ID
 */
var fetchTrackById = function (id) { return __awaiter(void 0, void 0, void 0, function () {
    var apiUrl, url, response, data, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                // Validate the ID before making the request
                if (!id || id === "undefined") {
                    throw new Error("Invalid track ID: ".concat(id));
                }
                apiUrl = process.env.NEXT_PUBLIC_API_URL;
                url = "".concat(apiUrl, "/api/tracks/").concat(id);
                console.log("Fetching track with ID: ".concat(id, ", URL: ").concat(url));
                return [4 /*yield*/, fetch(url)];
            case 1:
                response = _a.sent();
                if (!response.ok) {
                    throw new Error("Failed to fetch track: ".concat(response.status, " ").concat(response.statusText));
                }
                return [4 /*yield*/, response.json()];
            case 2:
                data = _a.sent();
                return [2 /*return*/, data];
            case 3:
                error_6 = _a.sent();
                console.error('Error fetching track:', error_6);
                throw error_6;
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.fetchTrackById = fetchTrackById;
/**
 * Fetch tracks by creator ID (public endpoint)
 */
var fetchTracksByCreatorPublic = function (creatorId) { return __awaiter(void 0, void 0, void 0, function () {
    var response, tracks, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, fetch("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/tracks/creator/").concat(creatorId, "/simple"))];
            case 1:
                response = _a.sent();
                if (!response.ok) {
                    throw new Error("Failed to fetch creator tracks: ".concat(response.status, " ").concat(response.statusText));
                }
                return [4 /*yield*/, response.json()];
            case 2:
                tracks = _a.sent();
                // Map the fields to match the Track interface used in the frontend
                return [2 /*return*/, tracks.map(function (track) {
                        var _a, _b;
                        return (__assign(__assign({}, track), { audioUrl: track.audioURL || '', coverArt: track.coverURL || '', artist: ((_a = track.creatorId) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown Artist', duration: track.duration || 0, type: track.type || 'song', creatorWhatsapp: ((_b = track.creatorId) === null || _b === void 0 ? void 0 : _b.whatsappContact) ||
                                ((track.creatorId && typeof track.creatorId === 'object' && track.creatorId !== null)
                                    ? track.creatorId.whatsappContact
                                    : undefined) // Include creator's WhatsApp contact
                         }));
                    })];
            case 3:
                error_7 = _a.sent();
                console.error('Error fetching creator tracks:', error_7);
                throw error_7;
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.fetchTracksByCreatorPublic = fetchTracksByCreatorPublic;
/**
 * Fetch tracks by creator ID
 */
var fetchTracksByCreator = function (creatorId_1) {
    var args_1 = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args_1[_i - 1] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([creatorId_1], args_1, true), void 0, function (creatorId, page, limit) {
        var response, data, error_8;
        if (page === void 0) { page = 1; }
        if (limit === void 0) { limit = 10; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/tracks/creator/").concat(creatorId, "?limit=").concat(limit, "&page=").concat(page))];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("Failed to fetch creator tracks: ".concat(response.status, " ").concat(response.statusText));
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    return [2 /*return*/, data];
                case 3:
                    error_8 = _a.sent();
                    console.error('Error fetching creator tracks:', error_8);
                    throw error_8;
                case 4: return [2 /*return*/];
            }
        });
    });
};
exports.fetchTracksByCreator = fetchTracksByCreator;
/**
 * Fetch popular creators (users with role 'creator')
 */
var fetchTracksByType = function (type_1) {
    var args_1 = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args_1[_i - 1] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([type_1], args_1, true), void 0, function (type, limit) {
        var response, data, error_9;
        if (limit === void 0) { limit = 10; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/tracks/type?type=").concat(type, "&limit=").concat(limit))];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("Failed to fetch tracks by type: ".concat(response.status, " ").concat(response.statusText));
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    return [2 /*return*/, data];
                case 3:
                    error_9 = _a.sent();
                    console.error('Error fetching tracks by type:', error_9);
                    throw error_9;
                case 4: return [2 /*return*/];
            }
        });
    });
};
exports.fetchTracksByType = fetchTracksByType;
var fetchPopularCreators = function () {
    var args_1 = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args_1[_i] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([], args_1, true), void 0, function (limit) {
        var response, data, error_10;
        if (limit === void 0) { limit = 10; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/public/creators?limit=").concat(limit))];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("Failed to fetch popular creators: ".concat(response.status, " ").concat(response.statusText));
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    return [2 /*return*/, data.users];
                case 3:
                    error_10 = _a.sent();
                    console.error('Error fetching popular creators:', error_10);
                    throw error_10;
                case 4: return [2 /*return*/];
            }
        });
    });
};
exports.fetchPopularCreators = fetchPopularCreators;
/**
 * Fetch comments for a track
 */
var fetchCommentsForTrack = function (trackId) { return __awaiter(void 0, void 0, void 0, function () {
    var response, data, error_11;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, fetch("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/comments/track/").concat(trackId))];
            case 1:
                response = _a.sent();
                if (!response.ok) {
                    throw new Error("Failed to fetch comments: ".concat(response.status, " ").concat(response.statusText));
                }
                return [4 /*yield*/, response.json()];
            case 2:
                data = _a.sent();
                return [2 /*return*/, data];
            case 3:
                error_11 = _a.sent();
                console.error('Error fetching comments:', error_11);
                throw error_11;
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.fetchCommentsForTrack = fetchCommentsForTrack;
/**
 * Add a comment to a track
 */
var addCommentToTrack = function (trackId, text) { return __awaiter(void 0, void 0, void 0, function () {
    var response, errorData, data, error_12;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                return [4 /*yield*/, makeAuthenticatedRequest("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/comments"), {
                        method: 'POST',
                        body: JSON.stringify({ trackId: trackId, text: text })
                    })];
            case 1:
                response = _a.sent();
                if (!!response.ok) return [3 /*break*/, 3];
                return [4 /*yield*/, response.json()];
            case 2:
                errorData = _a.sent();
                throw new Error(errorData.message || 'Failed to add comment');
            case 3: return [4 /*yield*/, response.json()];
            case 4:
                data = _a.sent();
                return [2 /*return*/, data];
            case 5:
                error_12 = _a.sent();
                console.error('Error adding comment:', error_12);
                throw error_12;
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.addCommentToTrack = addCommentToTrack;
/**
 * Follow a creator
 */
var followCreator = function (creatorId) { return __awaiter(void 0, void 0, void 0, function () {
    var accessToken, response, refreshToken_2, refreshResponse, refreshData, errorData, error_13;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 11, , 12]);
                accessToken = localStorage.getItem('accessToken');
                if (!accessToken) {
                    throw new Error('No access token found');
                }
                return [4 /*yield*/, fetch("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/following/follow/").concat(creatorId), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': "Bearer ".concat(accessToken)
                        }
                    })];
            case 1:
                response = _a.sent();
                if (!(response.status === 401)) return [3 /*break*/, 8];
                refreshToken_2 = localStorage.getItem('refreshToken');
                if (!refreshToken_2) return [3 /*break*/, 7];
                return [4 /*yield*/, fetch("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/auth/refresh-token"), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ refreshToken: refreshToken_2 })
                    })];
            case 2:
                refreshResponse = _a.sent();
                if (!refreshResponse.ok) return [3 /*break*/, 5];
                return [4 /*yield*/, refreshResponse.json()];
            case 3:
                refreshData = _a.sent();
                // Save new tokens
                localStorage.setItem('accessToken', refreshData.accessToken);
                localStorage.setItem('refreshToken', refreshData.refreshToken);
                // Retry the original request with new token
                accessToken = refreshData.accessToken;
                return [4 /*yield*/, fetch("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/following/follow/").concat(creatorId), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': "Bearer ".concat(accessToken)
                        }
                    })];
            case 4:
                response = _a.sent();
                return [3 /*break*/, 6];
            case 5: throw new Error('Token refresh failed');
            case 6: return [3 /*break*/, 8];
            case 7: throw new Error('No refresh token found');
            case 8:
                if (!!response.ok) return [3 /*break*/, 10];
                return [4 /*yield*/, response.json()];
            case 9:
                errorData = _a.sent();
                throw new Error(errorData.message || 'Failed to follow creator');
            case 10: return [2 /*return*/, true];
            case 11:
                error_13 = _a.sent();
                console.error('Error following creator:', error_13);
                throw error_13;
            case 12: return [2 /*return*/];
        }
    });
}); };
exports.followCreator = followCreator;
/**
 * Unfollow a creator
 */
var unfollowCreator = function (creatorId) { return __awaiter(void 0, void 0, void 0, function () {
    var accessToken, response, refreshToken_3, refreshResponse, refreshData, errorData, error_14;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 11, , 12]);
                accessToken = localStorage.getItem('accessToken');
                if (!accessToken) {
                    throw new Error('No access token found');
                }
                return [4 /*yield*/, fetch("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/following/unfollow/").concat(creatorId), {
                        method: 'DELETE', // Using DELETE method for unfollow
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': "Bearer ".concat(accessToken)
                        }
                    })];
            case 1:
                response = _a.sent();
                if (!(response.status === 401)) return [3 /*break*/, 8];
                refreshToken_3 = localStorage.getItem('refreshToken');
                if (!refreshToken_3) return [3 /*break*/, 7];
                return [4 /*yield*/, fetch("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/auth/refresh-token"), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ refreshToken: refreshToken_3 })
                    })];
            case 2:
                refreshResponse = _a.sent();
                if (!refreshResponse.ok) return [3 /*break*/, 5];
                return [4 /*yield*/, refreshResponse.json()];
            case 3:
                refreshData = _a.sent();
                // Save new tokens
                localStorage.setItem('accessToken', refreshData.accessToken);
                localStorage.setItem('refreshToken', refreshData.refreshToken);
                // Retry the original request with new token
                accessToken = refreshData.accessToken;
                return [4 /*yield*/, fetch("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/following/unfollow/").concat(creatorId), {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': "Bearer ".concat(accessToken)
                        }
                    })];
            case 4:
                response = _a.sent();
                return [3 /*break*/, 6];
            case 5: throw new Error('Token refresh failed');
            case 6: return [3 /*break*/, 8];
            case 7: throw new Error('No refresh token found');
            case 8:
                if (!!response.ok) return [3 /*break*/, 10];
                return [4 /*yield*/, response.json()];
            case 9:
                errorData = _a.sent();
                throw new Error(errorData.message || 'Failed to unfollow creator');
            case 10: return [2 /*return*/, true];
            case 11:
                error_14 = _a.sent();
                console.error('Error unfollowing creator:', error_14);
                throw error_14;
            case 12: return [2 /*return*/];
        }
    });
}); };
exports.unfollowCreator = unfollowCreator;
/**
 * Check if user is following a creator
 */
var checkFollowStatus = function (creatorId) { return __awaiter(void 0, void 0, void 0, function () {
    var accessToken, response, refreshToken_4, refreshResponse, refreshData, data, error_15;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 10, , 11]);
                accessToken = localStorage.getItem('accessToken');
                if (!accessToken) {
                    // If not authenticated, user is not following
                    return [2 /*return*/, false];
                }
                return [4 /*yield*/, fetch("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/following/status/").concat(creatorId), {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': "Bearer ".concat(accessToken)
                        }
                    })];
            case 1:
                response = _a.sent();
                if (!(response.status === 401)) return [3 /*break*/, 8];
                refreshToken_4 = localStorage.getItem('refreshToken');
                if (!refreshToken_4) return [3 /*break*/, 7];
                return [4 /*yield*/, fetch("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/auth/refresh-token"), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ refreshToken: refreshToken_4 })
                    })];
            case 2:
                refreshResponse = _a.sent();
                if (!refreshResponse.ok) return [3 /*break*/, 5];
                return [4 /*yield*/, refreshResponse.json()];
            case 3:
                refreshData = _a.sent();
                // Save new tokens
                localStorage.setItem('accessToken', refreshData.accessToken);
                localStorage.setItem('refreshToken', refreshData.refreshToken);
                // Retry the original request with new token
                accessToken = refreshData.accessToken;
                return [4 /*yield*/, fetch("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/following/status/").concat(creatorId), {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': "Bearer ".concat(accessToken)
                        }
                    })];
            case 4:
                response = _a.sent();
                return [3 /*break*/, 6];
            case 5: throw new Error('Token refresh failed');
            case 6: return [3 /*break*/, 8];
            case 7: throw new Error('No refresh token found');
            case 8:
                if (!response.ok) {
                    // If there's an error, assume not following
                    return [2 /*return*/, false];
                }
                return [4 /*yield*/, response.json()];
            case 9:
                data = _a.sent();
                return [2 /*return*/, data.isFollowing || false];
            case 10:
                error_15 = _a.sent();
                console.error('Error checking follow status:', error_15);
                return [2 /*return*/, false];
            case 11: return [2 /*return*/];
        }
    });
}); };
exports.checkFollowStatus = checkFollowStatus;
/**
 * Increment track play count
 */
var incrementTrackPlayCount = function (trackId) { return __awaiter(void 0, void 0, void 0, function () {
    var response, errorData, error_16;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                return [4 /*yield*/, fetch("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/tracks/").concat(trackId, "/play"), {
                        method: 'PUT'
                    })];
            case 1:
                response = _a.sent();
                if (!!response.ok) return [3 /*break*/, 3];
                return [4 /*yield*/, response.json()];
            case 2:
                errorData = _a.sent();
                throw new Error(errorData.message || 'Failed to increment play count');
            case 3: return [2 /*return*/, true];
            case 4:
                error_16 = _a.sent();
                console.error('Error incrementing track play count:', error_16);
                throw error_16;
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.incrementTrackPlayCount = incrementTrackPlayCount;
/**
 * Delete track
 */
var deleteTrack = function (trackId) { return __awaiter(void 0, void 0, void 0, function () {
    var response, errorData, error_17;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                return [4 /*yield*/, makeAuthenticatedRequest("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/tracks/").concat(trackId), {
                        method: 'DELETE'
                    })];
            case 1:
                response = _a.sent();
                if (!!response.ok) return [3 /*break*/, 3];
                return [4 /*yield*/, response.json()];
            case 2:
                errorData = _a.sent();
                throw new Error(errorData.message || 'Failed to delete track');
            case 3: return [2 /*return*/, true];
            case 4:
                error_17 = _a.sent();
                console.error('Error deleting track:', error_17);
                throw error_17;
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.deleteTrack = deleteTrack;
/**
 * Get followed creators for a user
 */
var getFollowedCreators = function () { return __awaiter(void 0, void 0, void 0, function () {
    var accessToken, response, refreshToken_5, refreshResponse, refreshData, errorData, data, error_18;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 12, , 13]);
                accessToken = localStorage.getItem('accessToken');
                if (!accessToken) {
                    throw new Error('No access token found');
                }
                return [4 /*yield*/, fetch("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/following"), {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': "Bearer ".concat(accessToken)
                        }
                    })];
            case 1:
                response = _a.sent();
                if (!(response.status === 401)) return [3 /*break*/, 8];
                refreshToken_5 = localStorage.getItem('refreshToken');
                if (!refreshToken_5) return [3 /*break*/, 7];
                return [4 /*yield*/, fetch("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/auth/refresh-token"), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ refreshToken: refreshToken_5 })
                    })];
            case 2:
                refreshResponse = _a.sent();
                if (!refreshResponse.ok) return [3 /*break*/, 5];
                return [4 /*yield*/, refreshResponse.json()];
            case 3:
                refreshData = _a.sent();
                // Save new tokens
                localStorage.setItem('accessToken', refreshData.accessToken);
                localStorage.setItem('refreshToken', refreshData.refreshToken);
                // Retry the original request with new token
                accessToken = refreshData.accessToken;
                return [4 /*yield*/, fetch("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/following"), {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': "Bearer ".concat(accessToken)
                        }
                    })];
            case 4:
                response = _a.sent();
                return [3 /*break*/, 6];
            case 5: throw new Error('Token refresh failed');
            case 6: return [3 /*break*/, 8];
            case 7: throw new Error('No refresh token found');
            case 8:
                if (!!response.ok) return [3 /*break*/, 10];
                return [4 /*yield*/, response.json()];
            case 9:
                errorData = _a.sent();
                throw new Error(errorData.message || 'Failed to get followed creators');
            case 10: return [4 /*yield*/, response.json()];
            case 11:
                data = _a.sent();
                return [2 /*return*/, data.creators || []];
            case 12:
                error_18 = _a.sent();
                console.error('Error getting followed creators:', error_18);
                throw error_18;
            case 13: return [2 /*return*/];
        }
    });
}); };
exports.getFollowedCreators = getFollowedCreators;

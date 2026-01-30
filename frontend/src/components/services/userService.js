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
exports.updatePlaylistMetadata = exports.deletePlaylist = exports.getUserWhatsAppContact = exports.updateUserWhatsAppContact = exports.updateUserProfile = exports.getUserPlaylists = exports.addTrackToPlaylist = exports.createPlaylist = exports.getUserFavorites = exports.removeTrackFromFavorites = exports.addTrackToFavorites = void 0;
// Helper function to refresh token
var refreshToken = function () { return __awaiter(void 0, void 0, void 0, function () {
    var refreshToken_1, response, data, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                refreshToken_1 = localStorage.getItem('refreshToken');
                if (!refreshToken_1) {
                    // Clear user data if no refresh token is available
                    localStorage.removeItem('user');
                    localStorage.removeItem('accessToken');
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
            case 3:
                // If refresh token is invalid, clear user data and redirect to login
                localStorage.removeItem('user');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                _a.label = 4;
            case 4: return [3 /*break*/, 6];
            case 5:
                error_1 = _a.sent();
                console.error('Error refreshing token:', error_1);
                // Clear user data on refresh error
                localStorage.removeItem('user');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/, null];
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
                        // Instead of throwing an error, return a response object with status 401
                        // This allows calling functions to handle the lack of authentication gracefully
                        return [2 /*return*/, new Response(JSON.stringify({ message: 'No access token found' }), { status: 401, headers: { 'Content-Type': 'application/json' } })];
                    }
                    requestOptions = __assign(__assign({}, options), { headers: __assign(__assign({}, options.headers), { 'Content-Type': 'application/json', 'Authorization': "Bearer ".concat(accessToken) }) });
                    return [4 /*yield*/, fetch(url, requestOptions)];
                case 1:
                    response = _a.sent();
                    if (!(response.status === 401)) return [3 /*break*/, 5];
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
                    return [3 /*break*/, 5];
                case 4:
                    // If token refresh failed, redirect to login
                    if (typeof window !== 'undefined') {
                        window.location.href = '/login';
                    }
                    _a.label = 5;
                case 5: return [2 /*return*/, response];
            }
        });
    });
};
/**
 * Add track to user's favorites
 */
var addTrackToFavorites = function (trackId) { return __awaiter(void 0, void 0, void 0, function () {
    var response, errorData, data, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                return [4 /*yield*/, makeAuthenticatedRequest("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/favorites"), {
                        method: 'POST',
                        body: JSON.stringify({ trackId: trackId })
                    })];
            case 1:
                response = _a.sent();
                // If user is not authenticated (401), return null
                if (response.status === 401) {
                    return [2 /*return*/, null];
                }
                if (!!response.ok) return [3 /*break*/, 3];
                return [4 /*yield*/, response.json()];
            case 2:
                errorData = _a.sent();
                throw new Error(errorData.message || 'Failed to add track to favorites');
            case 3: return [4 /*yield*/, response.json()];
            case 4:
                data = _a.sent();
                return [2 /*return*/, data];
            case 5:
                error_2 = _a.sent();
                console.error('Error adding track to favorites:', error_2);
                return [2 /*return*/, null];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.addTrackToFavorites = addTrackToFavorites;
/**
 * Remove track from user's favorites
 */
var removeTrackFromFavorites = function (trackId) { return __awaiter(void 0, void 0, void 0, function () {
    var response, errorData, data, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                return [4 /*yield*/, makeAuthenticatedRequest("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/favorites"), {
                        method: 'DELETE',
                        body: JSON.stringify({ trackId: trackId })
                    })];
            case 1:
                response = _a.sent();
                // If user is not authenticated (401), return null
                if (response.status === 401) {
                    return [2 /*return*/, null];
                }
                if (!!response.ok) return [3 /*break*/, 3];
                return [4 /*yield*/, response.json()];
            case 2:
                errorData = _a.sent();
                throw new Error(errorData.message || 'Failed to remove track from favorites');
            case 3: return [4 /*yield*/, response.json()];
            case 4:
                data = _a.sent();
                return [2 /*return*/, data];
            case 5:
                error_3 = _a.sent();
                console.error('Error removing track from favorites:', error_3);
                return [2 /*return*/, null];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.removeTrackFromFavorites = removeTrackFromFavorites;
/**
 * Get user's favorite tracks
 */
var getUserFavorites = function () { return __awaiter(void 0, void 0, void 0, function () {
    var response, errorData, data, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                return [4 /*yield*/, makeAuthenticatedRequest("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/favorites"))];
            case 1:
                response = _a.sent();
                // If user is not authenticated (401), return empty array
                if (response.status === 401) {
                    return [2 /*return*/, []];
                }
                if (!!response.ok) return [3 /*break*/, 3];
                return [4 /*yield*/, response.json()];
            case 2:
                errorData = _a.sent();
                throw new Error(errorData.message || 'Failed to fetch favorites');
            case 3: return [4 /*yield*/, response.json()];
            case 4:
                data = _a.sent();
                return [2 /*return*/, data.favorites];
            case 5:
                error_4 = _a.sent();
                console.error('Error fetching favorites:', error_4);
                // Return empty array instead of throwing error to prevent app crashes
                return [2 /*return*/, []];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.getUserFavorites = getUserFavorites;
/**
 * Create a new playlist
 */
var createPlaylist = function (name_1) {
    var args_1 = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args_1[_i - 1] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([name_1], args_1, true), void 0, function (name, description, isPublic, trackIds) {
        var response, errorData, data, error_5;
        if (description === void 0) { description = ''; }
        if (isPublic === void 0) { isPublic = true; }
        if (trackIds === void 0) { trackIds = []; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    return [4 /*yield*/, makeAuthenticatedRequest("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/playlists"), {
                            method: 'POST',
                            body: JSON.stringify({ name: name, description: description, isPublic: isPublic, trackIds: trackIds })
                        })];
                case 1:
                    response = _a.sent();
                    // If user is not authenticated (401), return null
                    if (response.status === 401) {
                        return [2 /*return*/, null];
                    }
                    if (!!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.json()];
                case 2:
                    errorData = _a.sent();
                    throw new Error(errorData.message || 'Failed to create playlist');
                case 3: return [4 /*yield*/, response.json()];
                case 4:
                    data = _a.sent();
                    return [2 /*return*/, data.playlist];
                case 5:
                    error_5 = _a.sent();
                    console.error('Error creating playlist:', error_5);
                    return [2 /*return*/, null];
                case 6: return [2 /*return*/];
            }
        });
    });
};
exports.createPlaylist = createPlaylist;
/**
 * Add track to playlist
 */
var addTrackToPlaylist = function (playlistId, trackId) { return __awaiter(void 0, void 0, void 0, function () {
    var response, errorData, data, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                return [4 /*yield*/, makeAuthenticatedRequest("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/playlists/add-track"), {
                        method: 'POST',
                        body: JSON.stringify({ playlistId: playlistId, trackId: trackId })
                    })];
            case 1:
                response = _a.sent();
                // If user is not authenticated (401), return null
                if (response.status === 401) {
                    return [2 /*return*/, null];
                }
                if (!!response.ok) return [3 /*break*/, 3];
                return [4 /*yield*/, response.json()];
            case 2:
                errorData = _a.sent();
                throw new Error(errorData.message || 'Failed to add track to playlist');
            case 3: return [4 /*yield*/, response.json()];
            case 4:
                data = _a.sent();
                return [2 /*return*/, data];
            case 5:
                error_6 = _a.sent();
                console.error('Error adding track to playlist:', error_6);
                return [2 /*return*/, null];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.addTrackToPlaylist = addTrackToPlaylist;
/**
 * Get user's playlists
 */
var getUserPlaylists = function () { return __awaiter(void 0, void 0, void 0, function () {
    var response, errorData, data, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                return [4 /*yield*/, makeAuthenticatedRequest("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/playlists"))];
            case 1:
                response = _a.sent();
                // If user is not authenticated (401), return empty array
                if (response.status === 401) {
                    return [2 /*return*/, []];
                }
                if (!!response.ok) return [3 /*break*/, 3];
                return [4 /*yield*/, response.json()];
            case 2:
                errorData = _a.sent();
                throw new Error(errorData.message || 'Failed to fetch playlists');
            case 3: return [4 /*yield*/, response.json()];
            case 4:
                data = _a.sent();
                return [2 /*return*/, data.playlists];
            case 5:
                error_7 = _a.sent();
                console.error('Error fetching playlists:', error_7);
                // Return empty array instead of throwing error to prevent app crashes
                return [2 /*return*/, []];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.getUserPlaylists = getUserPlaylists;
/**
 * Update user profile
 */
var updateUserProfile = function (profileData) { return __awaiter(void 0, void 0, void 0, function () {
    var response, errorData, data, error_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                return [4 /*yield*/, makeAuthenticatedRequest("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/profile/me"), {
                        method: 'PUT',
                        body: JSON.stringify(profileData)
                    })];
            case 1:
                response = _a.sent();
                // If user is not authenticated (401), return null
                if (response.status === 401) {
                    return [2 /*return*/, null];
                }
                if (!!response.ok) return [3 /*break*/, 3];
                return [4 /*yield*/, response.json()];
            case 2:
                errorData = _a.sent();
                throw new Error(errorData.message || 'Failed to update profile');
            case 3: return [4 /*yield*/, response.json()];
            case 4:
                data = _a.sent();
                return [2 /*return*/, data];
            case 5:
                error_8 = _a.sent();
                console.error('Error updating profile:', error_8);
                return [2 /*return*/, null];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.updateUserProfile = updateUserProfile;
/**
 * Update user's WhatsApp contact
 */
var updateUserWhatsAppContact = function (whatsappContact) { return __awaiter(void 0, void 0, void 0, function () {
    var response, errorData, data, error_9;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                return [4 /*yield*/, makeAuthenticatedRequest("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/whatsapp/contact"), {
                        method: 'PUT',
                        body: JSON.stringify({ whatsappContact: whatsappContact })
                    })];
            case 1:
                response = _a.sent();
                // If user is not authenticated (401), return null
                if (response.status === 401) {
                    return [2 /*return*/, null];
                }
                if (!!response.ok) return [3 /*break*/, 3];
                return [4 /*yield*/, response.json()];
            case 2:
                errorData = _a.sent();
                throw new Error(errorData.message || 'Failed to update WhatsApp contact');
            case 3: return [4 /*yield*/, response.json()];
            case 4:
                data = _a.sent();
                return [2 /*return*/, data];
            case 5:
                error_9 = _a.sent();
                console.error('Error updating WhatsApp contact:', error_9);
                return [2 /*return*/, null];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.updateUserWhatsAppContact = updateUserWhatsAppContact;
/**
 * Get user's WhatsApp contact
 */
var getUserWhatsAppContact = function () { return __awaiter(void 0, void 0, void 0, function () {
    var response, errorData, data, error_10;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                return [4 /*yield*/, makeAuthenticatedRequest("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/whatsapp/contact"), {
                        method: 'GET'
                    })];
            case 1:
                response = _a.sent();
                // If user is not authenticated (401), return empty string
                if (response.status === 401) {
                    return [2 /*return*/, ''];
                }
                if (!!response.ok) return [3 /*break*/, 3];
                return [4 /*yield*/, response.json()];
            case 2:
                errorData = _a.sent();
                throw new Error(errorData.message || 'Failed to fetch WhatsApp contact');
            case 3: return [4 /*yield*/, response.json()];
            case 4:
                data = _a.sent();
                return [2 /*return*/, data.whatsappContact || ''];
            case 5:
                error_10 = _a.sent();
                console.error('Error fetching WhatsApp contact:', error_10);
                return [2 /*return*/, ''];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.getUserWhatsAppContact = getUserWhatsAppContact;
/**
 * Delete a playlist
 */
var deletePlaylist = function (playlistId) { return __awaiter(void 0, void 0, void 0, function () {
    var response, errorData, data, error_11;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                return [4 /*yield*/, makeAuthenticatedRequest("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/playlists/").concat(playlistId), {
                        method: 'DELETE'
                    })];
            case 1:
                response = _a.sent();
                // If user is not authenticated (401), return null
                if (response.status === 401) {
                    return [2 /*return*/, null];
                }
                if (!!response.ok) return [3 /*break*/, 3];
                return [4 /*yield*/, response.json()];
            case 2:
                errorData = _a.sent();
                throw new Error(errorData.message || 'Failed to delete playlist');
            case 3: return [4 /*yield*/, response.json()];
            case 4:
                data = _a.sent();
                return [2 /*return*/, data];
            case 5:
                error_11 = _a.sent();
                console.error('Error deleting playlist:', error_11);
                return [2 /*return*/, null];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.deletePlaylist = deletePlaylist;
/**
 * Update playlist metadata
 */
var updatePlaylistMetadata = function (playlistId, name, description, isPublic) { return __awaiter(void 0, void 0, void 0, function () {
    var response, errorData, data, error_12;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                return [4 /*yield*/, makeAuthenticatedRequest("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/playlists/").concat(playlistId), {
                        method: 'PATCH',
                        body: JSON.stringify({ name: name, description: description, isPublic: isPublic })
                    })];
            case 1:
                response = _a.sent();
                // If user is not authenticated (401), return null
                if (response.status === 401) {
                    return [2 /*return*/, null];
                }
                if (!!response.ok) return [3 /*break*/, 3];
                return [4 /*yield*/, response.json()];
            case 2:
                errorData = _a.sent();
                throw new Error(errorData.message || 'Failed to update playlist metadata');
            case 3: return [4 /*yield*/, response.json()];
            case 4:
                data = _a.sent();
                return [2 /*return*/, data];
            case 5:
                error_12 = _a.sent();
                console.error('Error updating playlist metadata:', error_12);
                return [2 /*return*/, null];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.updatePlaylistMetadata = updatePlaylistMetadata;

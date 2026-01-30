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
exports.fetchSimilarTracks = exports.fetchRecommendedTracks = void 0;
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
 * Get user's location for location-based recommendations
 */
var getUserLocation = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        try {
            // Try to get location from Geolocation API
            if (navigator.geolocation) {
                return [2 /*return*/, new Promise(function (resolve) {
                        navigator.geolocation.getCurrentPosition(function (position) {
                            var lat = position.coords.latitude;
                            var lon = position.coords.longitude;
                            // Use a reverse geocoding service to get location name
                            fetch("https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=".concat(lat, "&longitude=").concat(lon, "&localityLanguage=en"))
                                .then(function (response) { return response.json(); })
                                .then(function (data) {
                                var country = data.countryCode || 'global';
                                resolve(country);
                            })
                                .catch(function () { return resolve('global'); });
                        }, function () { return resolve('global'); }, // If location permission denied, default to global
                        { timeout: 5000 });
                    })];
            }
            return [2 /*return*/, 'global'];
        }
        catch (error) {
            console.error('Error getting user location:', error);
            return [2 /*return*/, 'global'];
        }
        return [2 /*return*/];
    });
}); };
/**
 * Fetch ML-powered recommended tracks based on user preferences and listening history
 * This implements an advanced ML recommendation algorithm with genre, location, and behavior factors
 */
var fetchRecommendedTracks = function (currentTrackId_1) {
    var args_1 = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args_1[_i - 1] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([currentTrackId_1], args_1, true), void 0, function (currentTrackId, limit, sortBy) {
        var userLocation, params, accessToken, userId, tokenParts, payload, mlApiUrl, mlResponse, mlData, errorData, mlError_1, personalizedParams, response_1, data_1, authError_1, fallbackParams, response, data, error_2;
        if (limit === void 0) { limit = 10; }
        if (sortBy === void 0) { sortBy = 'recent'; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 19, , 20]);
                    return [4 /*yield*/, getUserLocation()];
                case 1:
                    userLocation = _a.sent();
                    params = new URLSearchParams();
                    params.append('limit', limit.toString());
                    params.append('sortBy', sortBy); // Use the specified sort option
                    if (currentTrackId) {
                        params.append('currentTrackId', currentTrackId);
                    }
                    accessToken = localStorage.getItem('accessToken');
                    userId = null;
                    if (accessToken) {
                        try {
                            tokenParts = accessToken.split('.');
                            if (tokenParts.length === 3) {
                                payload = JSON.parse(atob(tokenParts[1]));
                                userId = payload.userId || payload.sub;
                            }
                        }
                        catch (error) {
                            console.warn('Could not decode user token:', error);
                        }
                    }
                    mlApiUrl = "".concat(process.env.NEXT_PUBLIC_API_URL, "/api/recommendations/ml-recommendations/personalized?").concat(params.toString());
                    if (userId) {
                        mlApiUrl += "&userId=".concat(userId);
                    }
                    if (userLocation) {
                        mlApiUrl += "&location=".concat(encodeURIComponent(userLocation));
                    }
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 9, , 10]);
                    return [4 /*yield*/, fetch(mlApiUrl)];
                case 3:
                    mlResponse = _a.sent();
                    if (!mlResponse.ok) return [3 /*break*/, 5];
                    return [4 /*yield*/, mlResponse.json()];
                case 4:
                    mlData = _a.sent();
                    console.log('ML recommendations received:', mlData.count, 'tracks');
                    return [2 /*return*/, mlData.tracks || []];
                case 5:
                    if (!(mlResponse.status === 503)) return [3 /*break*/, 7];
                    return [4 /*yield*/, mlResponse.json()];
                case 6:
                    errorData = _a.sent();
                    if (errorData.fallback) {
                        console.log('Python ML service unavailable, falling back to traditional recommendations');
                    }
                    else {
                        console.warn('ML API failed, falling back to traditional recommendations:', mlResponse.status);
                    }
                    return [3 /*break*/, 8];
                case 7:
                    console.warn('ML API failed, falling back to traditional recommendations:', mlResponse.status);
                    _a.label = 8;
                case 8: return [3 /*break*/, 10];
                case 9:
                    mlError_1 = _a.sent();
                    console.warn('ML API error, falling back to traditional recommendations:', mlError_1);
                    return [3 /*break*/, 10];
                case 10:
                    if (!accessToken) return [3 /*break*/, 16];
                    _a.label = 11;
                case 11:
                    _a.trys.push([11, 15, , 16]);
                    personalizedParams = new URLSearchParams(params);
                    personalizedParams.set('limit', limit.toString());
                    personalizedParams.set('sortBy', sortBy); // Use the specified sort option
                    return [4 /*yield*/, makeAuthenticatedRequest("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/recommendations/personalized?").concat(personalizedParams.toString()))];
                case 12:
                    response_1 = _a.sent();
                    if (!response_1.ok) return [3 /*break*/, 14];
                    return [4 /*yield*/, response_1.json()];
                case 13:
                    data_1 = _a.sent();
                    return [2 /*return*/, data_1.tracks || []];
                case 14: return [3 /*break*/, 16];
                case 15:
                    authError_1 = _a.sent();
                    console.warn('Could not fetch traditional personalized recommendations:', authError_1);
                    return [3 /*break*/, 16];
                case 16:
                    fallbackParams = new URLSearchParams(params);
                    fallbackParams.set('limit', limit.toString());
                    fallbackParams.set('sortBy', sortBy); // Use the specified sort option
                    // Exclude beats from general recommendations
                    fallbackParams.set('excludeType', 'beat');
                    return [4 /*yield*/, fetch("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/recommendations/general?").concat(fallbackParams.toString()))];
                case 17:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("Failed to fetch recommendations: ".concat(response.status, " ").concat(response.statusText));
                    }
                    return [4 /*yield*/, response.json()];
                case 18:
                    data = _a.sent();
                    return [2 /*return*/, data.tracks || []];
                case 19:
                    error_2 = _a.sent();
                    console.error('Error fetching recommended tracks:', error_2);
                    throw error_2;
                case 20: return [2 /*return*/];
            }
        });
    });
};
exports.fetchRecommendedTracks = fetchRecommendedTracks;
/**
 * Get recommendations based on a specific track (similar tracks)
 */
var fetchSimilarTracks = function (trackId_1) {
    var args_1 = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args_1[_i - 1] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([trackId_1], args_1, true), void 0, function (trackId, limit, sortBy) {
        var response, data, error_3;
        if (limit === void 0) { limit = 10; }
        if (sortBy === void 0) { sortBy = 'recent'; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/recommendations/similar/").concat(trackId, "?limit=").concat(limit, "&sortBy=").concat(sortBy))];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("Failed to fetch similar tracks: ".concat(response.status, " ").concat(response.statusText));
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    return [2 /*return*/, data.tracks || []];
                case 3:
                    error_3 = _a.sent();
                    console.error('Error fetching similar tracks:', error_3);
                    throw error_3;
                case 4: return [2 /*return*/];
            }
        });
    });
};
exports.fetchSimilarTracks = fetchSimilarTracks;

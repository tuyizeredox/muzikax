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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthProvider = AuthProvider;
exports.useAuth = useAuth;
var react_1 = require("react");
var userService_1 = require("@/services/userService");
var AuthContext = (0, react_1.createContext)(undefined);
function AuthProvider(_a) {
    var _this = this;
    var children = _a.children;
    var _b = (0, react_1.useState)(null), user = _b[0], setUser = _b[1];
    var _c = (0, react_1.useState)(true), isLoading = _c[0], setIsLoading = _c[1];
    (0, react_1.useEffect)(function () {
        // Check if we're in the browser before accessing localStorage
        if (typeof window !== 'undefined') {
            var storedUser = localStorage.getItem('user');
            console.log('AuthProvider - storedUser:', storedUser);
            if (storedUser) {
                try {
                    var parsedUser = JSON.parse(storedUser);
                    console.log('AuthProvider - parsedUser:', parsedUser);
                    // Ensure whatsappContact is a string, not an object
                    if (parsedUser && parsedUser.whatsappContact) {
                        if (typeof parsedUser.whatsappContact === 'object' && parsedUser.whatsappContact !== null) {
                            // If it's an object, extract the actual WhatsApp number
                            parsedUser.whatsappContact = parsedUser.whatsappContact.whatsappContact || '';
                        }
                    }
                    setUser(parsedUser);
                    // Fetch complete user profile to ensure followers count and other data is up to date
                    fetchUserProfile();
                }
                catch (error) {
                    console.error('Error parsing user data:', error);
                }
            }
            else {
                setIsLoading(false);
            }
        }
        else {
            // On the server, just set loading to false
            setIsLoading(false);
        }
    }, []);
    var login = function (userData) {
        console.log('AuthProvider - login called with:', userData);
        setUser(userData);
        // Check if we're in the browser before accessing localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(userData));
        }
    };
    // Function to fetch and update the complete user profile
    var fetchUserProfile = function () { return __awaiter(_this, void 0, void 0, function () {
        var accessToken, response, refreshToken, refreshResponse, refreshData, retryResponse, updatedUserData_1, whatsappContactValue_1, completeUser_1, updatedUserData, whatsappContactValue, completeUser, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Check if we're in the browser before accessing localStorage
                    if (typeof window === 'undefined') {
                        console.log('Not running in browser, skipping fetchUserProfile');
                        return [2 /*return*/, false];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 10, , 11]);
                    accessToken = localStorage.getItem('accessToken');
                    if (!accessToken) {
                        console.error('No access token found');
                        return [2 /*return*/, false];
                    }
                    return [4 /*yield*/, fetch("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/auth/me"), {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': "Bearer ".concat(accessToken)
                            }
                        })];
                case 2:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 8];
                    if (!(response.status === 401)) return [3 /*break*/, 7];
                    refreshToken = localStorage.getItem('refreshToken');
                    if (!refreshToken) return [3 /*break*/, 7];
                    return [4 /*yield*/, fetch("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/auth/refresh-token"), {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ refreshToken: refreshToken })
                        })];
                case 3:
                    refreshResponse = _a.sent();
                    if (!refreshResponse.ok) return [3 /*break*/, 7];
                    return [4 /*yield*/, refreshResponse.json()];
                case 4:
                    refreshData = _a.sent();
                    localStorage.setItem('accessToken', refreshData.accessToken);
                    localStorage.setItem('refreshToken', refreshData.refreshToken);
                    return [4 /*yield*/, fetch("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/auth/me"), {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': "Bearer ".concat(refreshData.accessToken)
                            }
                        })];
                case 5:
                    retryResponse = _a.sent();
                    if (!retryResponse.ok) {
                        console.error('Failed to fetch user profile after token refresh');
                        setIsLoading(false);
                        return [2 /*return*/, false];
                    }
                    return [4 /*yield*/, retryResponse.json()];
                case 6:
                    updatedUserData_1 = _a.sent();
                    whatsappContactValue_1 = updatedUserData_1.whatsappContact || '';
                    if (typeof whatsappContactValue_1 === 'object' && whatsappContactValue_1 !== null) {
                        // If it's an object, extract the actual WhatsApp number
                        whatsappContactValue_1 = whatsappContactValue_1.whatsappContact || '';
                    }
                    completeUser_1 = __assign(__assign({}, updatedUserData_1), { id: updatedUserData_1._id, whatsappContact: whatsappContactValue_1 });
                    setUser(completeUser_1);
                    localStorage.setItem('user', JSON.stringify(completeUser_1));
                    setIsLoading(false);
                    return [2 /*return*/, true];
                case 7:
                    console.error('Failed to fetch user profile:', response.status);
                    setIsLoading(false);
                    return [2 /*return*/, false];
                case 8: return [4 /*yield*/, response.json()];
                case 9:
                    updatedUserData = _a.sent();
                    whatsappContactValue = updatedUserData.whatsappContact || '';
                    if (typeof whatsappContactValue === 'object' && whatsappContactValue !== null) {
                        // If it's an object, extract the actual WhatsApp number
                        whatsappContactValue = whatsappContactValue.whatsappContact || '';
                    }
                    completeUser = __assign(__assign({}, updatedUserData), { id: updatedUserData._id, whatsappContact: whatsappContactValue });
                    setUser(completeUser);
                    localStorage.setItem('user', JSON.stringify(completeUser));
                    setIsLoading(false);
                    return [2 /*return*/, true];
                case 10:
                    error_1 = _a.sent();
                    console.error('Error fetching user profile:', error_1);
                    setIsLoading(false);
                    return [2 /*return*/, false];
                case 11: return [2 /*return*/];
            }
        });
    }); };
    var logout = function () {
        console.log('AuthProvider - logout called');
        setUser(null);
        // Check if we're in the browser before accessing localStorage
        if (typeof window !== 'undefined') {
            localStorage.removeItem('user');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            // Redirect to login page
            window.location.href = '/login';
        }
    };
    var upgradeToCreator = function (creatorType) { return __awaiter(_this, void 0, void 0, function () {
        var accessToken, response, refreshToken, refreshResponse, refreshData, errorData, updatedUserData, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Check if we're in the browser before accessing localStorage
                    if (typeof window === 'undefined') {
                        console.log('Not running in browser, cannot upgrade user');
                        return [2 /*return*/, false];
                    }
                    if (!user) {
                        console.error('No user found for upgrade');
                        return [2 /*return*/, false];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 13, , 14]);
                    console.log('Attempting to upgrade to creator:', { creatorType: creatorType });
                    accessToken = localStorage.getItem('accessToken');
                    if (!accessToken) {
                        console.error('No access token found');
                        alert('Authentication error. Please log in again.');
                        logout(); // Clear user data and redirect to login
                        return [2 /*return*/, false];
                    }
                    return [4 /*yield*/, fetch("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/upgrade/to-creator"), {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': "Bearer ".concat(accessToken)
                            },
                            body: JSON.stringify({ creatorType: creatorType })
                        })];
                case 2:
                    response = _a.sent();
                    console.log('Upgrade response status:', response.status);
                    if (!(response.status === 401)) return [3 /*break*/, 9];
                    console.log('Token might be expired, attempting to refresh...');
                    refreshToken = localStorage.getItem('refreshToken');
                    if (!refreshToken) return [3 /*break*/, 8];
                    return [4 /*yield*/, fetch("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/auth/refresh-token"), {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ refreshToken: refreshToken })
                        })];
                case 3:
                    refreshResponse = _a.sent();
                    if (!refreshResponse.ok) return [3 /*break*/, 6];
                    return [4 /*yield*/, refreshResponse.json()];
                case 4:
                    refreshData = _a.sent();
                    localStorage.setItem('accessToken', refreshData.accessToken);
                    localStorage.setItem('refreshToken', refreshData.refreshToken);
                    accessToken = refreshData.accessToken;
                    return [4 /*yield*/, fetch("".concat(process.env.NEXT_PUBLIC_API_URL, "/api/upgrade/to-creator"), {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': "Bearer ".concat(accessToken)
                            },
                            body: JSON.stringify({ creatorType: creatorType })
                        })];
                case 5:
                    response = _a.sent();
                    return [3 /*break*/, 7];
                case 6:
                    console.error('Token refresh failed');
                    alert('Session expired. Please log in again.');
                    logout();
                    return [2 /*return*/, false];
                case 7: return [3 /*break*/, 9];
                case 8:
                    console.error('No refresh token found');
                    alert('Session expired. Please log in again.');
                    logout();
                    return [2 /*return*/, false];
                case 9:
                    if (!!response.ok) return [3 /*break*/, 11];
                    return [4 /*yield*/, response.json()];
                case 10:
                    errorData = _a.sent();
                    console.error('Failed to upgrade to creator:', errorData.message);
                    alert("Upgrade failed: ".concat(errorData.message || 'Unknown error'));
                    return [2 /*return*/, false];
                case 11: return [4 /*yield*/, response.json()];
                case 12:
                    updatedUserData = _a.sent();
                    console.log('Upgrade successful:', updatedUserData);
                    setUser(updatedUserData);
                    localStorage.setItem('user', JSON.stringify(updatedUserData));
                    return [2 /*return*/, true];
                case 13:
                    error_2 = _a.sent();
                    console.error('Error upgrading to creator:', error_2);
                    alert('An error occurred while upgrading your account. Please try again.');
                    return [2 /*return*/, false];
                case 14: return [2 /*return*/];
            }
        });
    }); };
    var updateProfile = function (updatedData) { return __awaiter(_this, void 0, void 0, function () {
        var updatedUser, accessToken, whatsappContactValue, newUser, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Check if we're in the browser before accessing localStorage
                    if (typeof window === 'undefined') {
                        console.log('Not running in browser, cannot update profile');
                        return [2 /*return*/, false];
                    }
                    if (!user) {
                        console.error('No user found for profile update');
                        return [2 /*return*/, false];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, userService_1.updateUserProfile)(updatedData)];
                case 2:
                    updatedUser = _a.sent();
                    if (!updatedUser) {
                        console.error('Failed to update profile on backend');
                        accessToken = localStorage.getItem('accessToken');
                        if (!accessToken) {
                            logout();
                        }
                        return [2 /*return*/, false];
                    }
                    whatsappContactValue = updatedUser.whatsappContact || '';
                    if (typeof whatsappContactValue === 'object' && whatsappContactValue !== null) {
                        // If it's an object, extract the actual WhatsApp number
                        whatsappContactValue = whatsappContactValue.whatsappContact || '';
                    }
                    newUser = __assign(__assign(__assign({}, user), updatedData), { id: updatedUser._id, name: updatedUser.name, email: updatedUser.email, role: updatedUser.role, creatorType: updatedUser.creatorType, avatar: updatedUser.avatar, bio: updatedUser.bio, genres: updatedUser.genres, followersCount: updatedUser.followersCount, whatsappContact: whatsappContactValue // Ensure it's a string
                     });
                    setUser(newUser);
                    localStorage.setItem('user', JSON.stringify(newUser));
                    return [2 /*return*/, true];
                case 3:
                    error_3 = _a.sent();
                    console.error('Error updating profile:', error_3);
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var updateWhatsAppContact = function (whatsappContact) { return __awaiter(_this, void 0, void 0, function () {
        var updatedUser, updatedWhatsAppContact, newUser, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Check if we're in the browser before accessing localStorage
                    if (typeof window === 'undefined') {
                        console.log('Not running in browser, cannot update WhatsApp contact');
                        return [2 /*return*/, false];
                    }
                    if (!user) {
                        console.log('No user found for WhatsApp contact update');
                        return [2 /*return*/, false];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, userService_1.updateUserWhatsAppContact)(whatsappContact)];
                case 2:
                    updatedUser = _a.sent();
                    if (!updatedUser) {
                        console.log('Failed to update WhatsApp contact on backend');
                        return [2 /*return*/, false];
                    }
                    updatedWhatsAppContact = updatedUser.whatsappContact || '';
                    if (typeof updatedWhatsAppContact === 'object' && updatedWhatsAppContact !== null) {
                        // If it's an object, extract the actual WhatsApp number
                        updatedWhatsAppContact = updatedWhatsAppContact.whatsappContact || '';
                    }
                    newUser = __assign(__assign({}, user), { whatsappContact: updatedWhatsAppContact });
                    setUser(newUser);
                    localStorage.setItem('user', JSON.stringify(newUser));
                    return [2 /*return*/, true];
                case 3:
                    error_4 = _a.sent();
                    console.error('Error updating WhatsApp contact:', error_4);
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var isAuthenticated = !!user;
    var userRole = (user === null || user === void 0 ? void 0 : user.role) || null;
    (0, react_1.useEffect)(function () {
        // Only log in the browser
        if (typeof window !== 'undefined') {
            console.log('AuthContext values:', { user: user, isAuthenticated: isAuthenticated, userRole: userRole, isLoading: isLoading });
        }
    }, [user, isAuthenticated, userRole, isLoading]);
    return (<AuthContext.Provider value={{ user: user, login: login, logout: logout, upgradeToCreator: upgradeToCreator, updateProfile: updateProfile, updateWhatsAppContact: updateWhatsAppContact, fetchUserProfile: fetchUserProfile, isAuthenticated: isAuthenticated, userRole: userRole, isLoading: isLoading }}>
      {children}
    </AuthContext.Provider>);
}
function useAuth() {
    var context = (0, react_1.useContext)(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

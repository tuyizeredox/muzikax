'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { communityPostService, communityCommentService, circleService, challengeService, liveRoomService } from '../services/communityService';
import { useAuth } from './AuthContext';

const CommunityContext = createContext();

const initialState = {
  posts: [],
  trendingPosts: [],
  circles: [],
  challenges: [],
  trendingChallenges: [],
  liveRooms: [],
  comments: {},
  currentTab: 'trending',
  loading: {
    posts: false,
    circles: false,
    challenges: false,
    liveRooms: false,
    postCreation: false,
    commentCreation: false,
    commentsFetching: {}
  },
  error: null,
  pagination: {
    posts: { page: 1, limit: 20, total: 0, hasMore: true },
    circles: { page: 1, limit: 20, total: 0, hasMore: true },
    challenges: { page: 1, limit: 20, total: 0, hasMore: true },
    liveRooms: { page: 1, limit: 20, total: 0, hasMore: true }
  },
  filters: {
    posts: { circleId: '', postType: '', language: '', location: '', genre: '' },
    circles: { type: '', genre: '', location: '', isPublic: true },
    challenges: { type: '', genre: '', isActive: true },
    liveRooms: { isLive: false, genre: '', language: '' }
  }
};

const communityReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CURRENT_TAB':
      return {
        ...state,
        currentTab: action.payload
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.section]: action.payload.loading
        }
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };
    
    case 'SET_POSTS':
      return {
        ...state,
        posts: action.payload,
        loading: { ...state.loading, posts: false }
      };
    
    case 'ADD_POST':
      return {
        ...state,
        posts: [action.payload, ...state.posts]
      };
    
    case 'UPDATE_POST_LIKES':
      return {
        ...state,
        posts: state.posts.map(post =>
          post.id === action.payload.postId
            ? { ...post, likes: action.payload.likes, liked: action.payload.liked }
            : post
        )
      };
    
    case 'SET_TRENDING_POSTS':
      return {
        ...state,
        trendingPosts: action.payload
      };
    
    case 'SET_CIRCLES':
      return {
        ...state,
        circles: action.payload,
        loading: { ...state.loading, circles: false }
      };
    
    case 'ADD_CIRCLE':
      return {
        ...state,
        circles: [action.payload, ...state.circles]
      };
    
    case 'UPDATE_CIRCLE_MEMBERS':
      return {
        ...state,
        circles: state.circles.map(circle =>
          circle.id === action.payload.circleId
            ? { ...circle, memberCount: action.payload.memberCount, isMember: action.payload.isMember }
            : circle
        )
      };
    
    case 'SET_CHALLENGES':
      return {
        ...state,
        challenges: action.payload,
        loading: { ...state.loading, challenges: false }
      };
    
    case 'SET_TRENDING_CHALLENGES':
      return {
        ...state,
        trendingChallenges: action.payload
      };
    
    case 'ADD_CHALLENGE_PARTICIPANT':
      return {
        ...state,
        challenges: state.challenges.map(challenge =>
          challenge.id === action.payload.challengeId
            ? { 
                ...challenge, 
                participants: [...challenge.participants, action.payload.participant],
                hasParticipated: true
              }
            : challenge
        )
      };
    
    case 'SET_LIVE_ROOMS':
      return {
        ...state,
        liveRooms: action.payload,
        loading: { ...state.loading, liveRooms: false }
      };
    
    case 'UPDATE_LIVE_ROOM_LISTENERS':
      return {
        ...state,
        liveRooms: state.liveRooms.map(room =>
          room.id === action.payload.roomId
            ? { ...room, currentListeners: action.payload.currentListeners }
            : room
        )
      };
    
    case 'UPDATE_FILTERS':
      return {
        ...state,
        filters: {
          ...state.filters,
          [action.payload.section]: {
            ...state.filters[action.payload.section],
            ...action.payload.filters
          }
        }
      };
    
    case 'UPDATE_PAGINATION':
      return {
        ...state,
        pagination: {
          ...state.pagination,
          [action.payload.section]: {
            ...state.pagination[action.payload.section],
            ...action.payload.pagination
          }
        }
      };
    
    case 'SET_COMMENTS':
      return {
        ...state,
        comments: {
          ...state.comments,
          [action.payload.postId]: action.payload.comments
        },
        loading: {
          ...state.loading,
          commentsFetching: {
            ...state.loading.commentsFetching,
            [action.payload.postId]: false
          }
        }
      };
    
    case 'SET_COMMENTS_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          commentsFetching: {
            ...state.loading.commentsFetching,
            [action.payload.postId]: action.payload.loading
          }
        }
      };
    
    case 'ADD_COMMENT_TO_POST':
      return {
        ...state,
        comments: {
          ...state.comments,
          [action.payload.postId]: [...(state.comments[action.payload.postId] || []), action.payload.comment]
        }
      };
    
    case 'DELETE_COMMENT':
      return {
        ...state,
        comments: {
          ...state.comments,
          [action.payload.postId]: state.comments[action.payload.postId]?.filter(
            comment => comment.id !== action.payload.commentId
          ) || []
        }
      };
    
    case 'UPDATE_COMMENT_LIKES':
      return {
        ...state,
        comments: {
          ...state.comments,
          [action.payload.postId]: state.comments[action.payload.postId]?.map(comment =>
            comment.id === action.payload.commentId
              ? { ...comment, likes: action.payload.likes, liked: action.payload.liked }
              : comment
          ) || []
        }
      };
    
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
};

export const CommunityProvider = ({ children }) => {
  const [state, dispatch] = useReducer(communityReducer, initialState);
  const { user } = useAuth();

  // Fetch initial data
  useEffect(() => {
    fetchTrendingPosts();
    fetchTrendingChallenges();
    fetchLiveRooms();
  }, []);

  // Fetch trending posts
  const fetchTrendingPosts = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { section: 'posts', loading: true } });
      const response = await communityPostService.getTrendingPosts();
      dispatch({ type: 'SET_TRENDING_POSTS', payload: response.posts });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [dispatch]);

  // Fetch posts
  const fetchPosts = useCallback(async (page = 1, filters = {}) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { section: 'posts', loading: true } });
      
      const params = {
        limit: state.pagination.posts.limit,
        offset: (page - 1) * state.pagination.posts.limit,
        ...filters
      };
      
      const response = await communityPostService.getPosts(params);
      dispatch({ type: 'SET_POSTS', payload: response.posts });
      
      // Update pagination
      dispatch({
        type: 'UPDATE_PAGINATION',
        payload: {
          section: 'posts',
          pagination: {
            page,
            limit: state.pagination.posts.limit,
            total: response.pagination.total,
            hasMore: response.pagination.hasMore
          }
        }
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [dispatch, state.pagination.posts.limit]);

  // Create post
  const createPost = useCallback(async (postData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { section: 'postCreation', loading: true } });
      const response = await communityPostService.createPost(postData);
      dispatch({ type: 'ADD_POST', payload: response.post });
      return response;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { section: 'postCreation', loading: false } });
    }
  }, [dispatch]);

  // Like post
  const likePost = useCallback(async (postId) => {
    try {
      const response = await communityPostService.likePost(postId);
      dispatch({
        type: 'UPDATE_POST_LIKES',
        payload: { postId, likes: response.likes, liked: response.liked }
      });
      return response;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, [dispatch]);

  // Fetch circles
  const fetchCircles = useCallback(async (page = 1, filters = {}) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { section: 'circles', loading: true } });
      
      const params = {
        limit: state.pagination.circles.limit,
        offset: (page - 1) * state.pagination.circles.limit,
        ...filters
      };
      
      const response = await circleService.getCircles(params);
      dispatch({ type: 'SET_CIRCLES', payload: response.circles });
      
      // Update pagination
      dispatch({
        type: 'UPDATE_PAGINATION',
        payload: {
          section: 'circles',
          pagination: {
            page,
            limit: state.pagination.circles.limit,
            total: response.pagination.total,
            hasMore: response.pagination.hasMore
          }
        }
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [dispatch, state.pagination.circles.limit]);

  // Join circle
  const joinCircle = useCallback(async (circleId) => {
    try {
      const response = await circleService.joinCircle(circleId);
      dispatch({
        type: 'UPDATE_CIRCLE_MEMBERS',
        payload: { circleId, memberCount: response.memberCount, isMember: true }
      });
      return response;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, [dispatch]);

  // Leave circle
  const leaveCircle = useCallback(async (circleId) => {
    try {
      const response = await circleService.leaveCircle(circleId);
      dispatch({
        type: 'UPDATE_CIRCLE_MEMBERS',
        payload: { circleId, memberCount: response.memberCount, isMember: false }
      });
      return response;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, [dispatch]);

  // Fetch challenges
  const fetchChallenges = useCallback(async (page = 1, filters = {}) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { section: 'challenges', loading: true } });
      
      const params = {
        limit: state.pagination.challenges.limit,
        offset: (page - 1) * state.pagination.challenges.limit,
        ...filters
      };
      
      const response = await challengeService.getChallenges(params);
      dispatch({ type: 'SET_CHALLENGES', payload: response.challenges });
      
      // Update pagination
      dispatch({
        type: 'UPDATE_PAGINATION',
        payload: {
          section: 'challenges',
          pagination: {
            page,
            limit: state.pagination.challenges.limit,
            total: response.pagination.total,
            hasMore: response.pagination.hasMore
          }
        }
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [dispatch, state.pagination.challenges.limit]);

  // Fetch trending challenges
  const fetchTrendingChallenges = useCallback(async () => {
    try {
      const response = await challengeService.getTrendingChallenges();
      dispatch({ type: 'SET_TRENDING_CHALLENGES', payload: response.challenges });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [dispatch]);

  // Participate in challenge
  const participateInChallenge = useCallback(async (challengeId, submission) => {
    try {
      const response = await challengeService.participateInChallenge(challengeId, submission);
      dispatch({
        type: 'ADD_CHALLENGE_PARTICIPANT',
        payload: { 
          challengeId, 
          participant: { 
            userId: user?.id, 
            submission, 
            submittedAt: new Date(),
            votes: 0 
          } 
        }
      });
      return response;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, [dispatch, user?.id]);

  // Fetch live rooms
  const fetchLiveRooms = useCallback(async (page = 1, filters = {}) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { section: 'liveRooms', loading: true } });
      
      const params = {
        limit: state.pagination.liveRooms.limit,
        offset: (page - 1) * state.pagination.liveRooms.limit,
        ...filters
      };
      
      const response = await liveRoomService.getLiveRooms(params);
      dispatch({ type: 'SET_LIVE_ROOMS', payload: response.liveRooms });
      
      // Update pagination
      dispatch({
        type: 'UPDATE_PAGINATION',
        payload: {
          section: 'liveRooms',
          pagination: {
            page,
            limit: state.pagination.liveRooms.limit,
            total: response.pagination.total,
            hasMore: response.pagination.hasMore
          }
        }
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [dispatch, state.pagination.liveRooms.limit]);

  // Join live room
  const joinLiveRoom = useCallback(async (roomId) => {
    try {
      const response = await liveRoomService.joinLiveRoom(roomId);
      dispatch({
        type: 'UPDATE_LIVE_ROOM_LISTENERS',
        payload: { roomId, currentListeners: response.currentListeners }
      });
      return response;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, [dispatch]);

  // Fetch comments for a post
  const fetchComments = useCallback(async (postId, options = {}) => {
    try {
      dispatch({ 
        type: 'SET_COMMENTS_LOADING', 
        payload: { postId, loading: true } 
      });
      
      const { limit = 20, offset = 0, sortBy = 'createdAt', sortOrder = 'desc', includeReplies = true } = options;
      const params = new URLSearchParams({
        limit,
        offset,
        sortBy,
        sortOrder,
        includeReplies
      });
      
      const response = await communityCommentService.getComments(postId, { limit, offset, sortBy, sortOrder, includeReplies });
      
      dispatch({ 
        type: 'SET_COMMENTS', 
        payload: { postId, comments: response.comments || [] } 
      });
      return response;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, [dispatch]);

  // Add a comment to a post
  const addComment = useCallback(async (postId, text, parentId = null) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { section: 'commentCreation', loading: true } });
      
      const response = await communityCommentService.addComment(postId, text, parentId);
      
      dispatch({
        type: 'ADD_COMMENT_TO_POST',
        payload: { postId, comment: response.comment }
      });
      
      return response;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { section: 'commentCreation', loading: false } });
    }
  }, [dispatch]);

  // Delete a comment
  const deleteComment = useCallback(async (postId, commentId) => {
    try {
      const response = await communityCommentService.deleteComment(commentId);
      
      dispatch({
        type: 'DELETE_COMMENT',
        payload: { postId, commentId }
      });
      
      return response;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, [dispatch]);

  // Like/unlike a comment
  const likeComment = useCallback(async (postId, commentId) => {
    try {
      const response = await communityCommentService.likeComment(commentId);
      
      dispatch({
        type: 'UPDATE_COMMENT_LIKES',
        payload: { postId, commentId, likes: response.likes, liked: response.liked }
      });
      
      return response;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, [dispatch]);

  // Update filters
  const updateFilters = useCallback((section, filters) => {
    dispatch({
      type: 'UPDATE_FILTERS',
      payload: { section, filters }
    });
  }, [dispatch]);

  // Set current tab
  const setCurrentTab = useCallback((tab) => {
    dispatch({
      type: 'SET_CURRENT_TAB',
      payload: tab
    });
  }, [dispatch]);

  // Reset context state
  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, [dispatch]);

  const value = {
    ...state,
    fetchPosts,
    createPost,
    likePost,
    fetchCircles,
    joinCircle,
    leaveCircle,
    fetchChallenges,
    participateInChallenge,
    fetchLiveRooms,
    joinLiveRoom,
    fetchComments,
    addComment,
    deleteComment,
    likeComment,
    updateFilters,
    setCurrentTab,
    resetState,
    fetchTrendingPosts,
    fetchTrendingChallenges
  };

  return (
    <CommunityContext.Provider value={value}>
      {children}
    </CommunityContext.Provider>
  );
};

export const useCommunity = () => {
  const context = useContext(CommunityContext);
  if (!context) {
    throw new Error('useCommunity must be used within a CommunityProvider');
  }
  return context;
};
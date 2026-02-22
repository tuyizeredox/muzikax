import { ITrack } from '../types';

export interface PaginatedTracks {
  tracks: ITrack[];
  page: number;
  pages: number;
  total: number;
}

// Helper function to refresh token
const refreshToken = async (): Promise<string | null> => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return null;
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken })
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      return data.accessToken;
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
  }
  return null;
};

// Helper function to make authenticated request with token refresh
const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}): Promise<Response> => {
  let accessToken = localStorage.getItem('accessToken');
  
  if (!accessToken) {
    throw new Error('No access token found');
  }

  // Add authorization header to options
  const requestOptions = {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    }
  };

  // Make initial request
  let response = await fetch(url, requestOptions);

  // If token is expired, try to refresh it
  if (response.status === 401) {
    console.log('Token might be expired, attempting to refresh...');
    const newToken = await refreshToken();
    
    if (newToken) {
      // Retry the request with new token
      requestOptions.headers = {
        ...requestOptions.headers,
        'Authorization': `Bearer ${newToken}`
      };
      
      response = await fetch(url, requestOptions);
    }
  }

  return response;
};

/**
 * Fetch a creator's public profile by ID
 */
export const fetchCreatorProfile = async (creatorId: string): Promise<any> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/public/creators/${creatorId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch creator profile: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching creator profile:', error);
    throw error;
  }
};

/**
 * Fetch a creator's WhatsApp contact by ID
 * Simplified approach to get just the WhatsApp number
 */
export const fetchCreatorWhatsapp = async (creatorId: string): Promise<string | null> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/public/creators/${creatorId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch creator WhatsApp: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.whatsappContact || null;
  } catch (error) {
    console.error('Error fetching creator WhatsApp:', error);
    return null;
  }
};

/**
 * Fetch all tracks with pagination
 * Filters out incomplete tracks (those without audio URLs)
 */
export const fetchAllTracks = async (page: number = 1, limit: number = 10): Promise<PaginatedTracks> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks?limit=${limit}&page=${page}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch tracks: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Filter out tracks without audio URLs
    if (data.tracks && Array.isArray(data.tracks)) {
      data.tracks = data.tracks.filter((track: any) => 
        track.audioURL && track.audioURL.trim() !== ''
      );
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching tracks:', error);
    throw error;
  }
};

/**
 * Fetch trending tracks
 * Filters out incomplete tracks (those without audio URLs)
 */
export const fetchTrendingTracks = async (limit: number = 10): Promise<ITrack[]> => {
  try {
    const url = limit > 0 
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/tracks/trending?limit=${limit}`
      : `${process.env.NEXT_PUBLIC_API_URL}/api/tracks/trending?limit=0`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch trending tracks: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Filter out tracks without audio URLs
    return data.filter((track: any) => 
      track.audioURL && track.audioURL.trim() !== ''
    );
  } catch (error) {
    console.error('Error fetching trending tracks:', error);
    throw error;
  }
};

/**
 * Fetch tracks sorted by monthly plays for current month
 * Filters out incomplete tracks (those without audio URLs)
 */
export const fetchMonthlyPopularTracks = async (limit: number = 10): Promise<any[]> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/monthly-popular?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch monthly popular tracks: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Filter out tracks without audio URLs and map fields to match frontend Track interface
    return data
      .filter((track: any) => track.audioURL && track.audioURL.trim() !== '')
      .map((track: any) => ({
        id: track._id,
        title: track.title,
        artist: track.creatorId?.name || 'Unknown Artist',
        album: track.albumTitle || '',
        plays: track.plays || 0,
        likes: track.likes || 0,
        coverImage: track.coverURL || '',
        duration: track.duration || '',
        category: track.type || 'song',
        type: track.type || 'song',
        paymentType: track.paymentType || 'free',
        price: track.price,
        currency: track.currency,
        creatorId: track.creatorId?._id || track.creatorId || '',
        audioUrl: track.audioURL || '',
        monthlyPlays: track.monthlyPlays || 0,
        score: track.score || 0,
        daysOld: track.daysOld || 0
      }));
  } catch (error) {
    console.error('Error fetching monthly popular tracks:', error);
    throw error;
  }
};

/**
 * Fetch a single track by ID
 */
export const fetchTrackById = async (id: string): Promise<ITrack> => {
  try {
    // Validate the ID before making the request
    if (!id || id === "undefined") {
      throw new Error(`Invalid track ID: ${id}`);
    }
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${apiUrl}/api/tracks/${id}`;
    
    console.log(`Fetching track with ID: ${id}, URL: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch track: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching track:', error);
    throw error;
  }
};

/**
 * Fetch tracks by creator ID (public endpoint)
 * Filters out incomplete tracks (those without audio URLs)
 */
export const fetchTracksByCreatorPublic = async (creatorId: string): Promise<any[]> => {
  try {
    // Use the new simple public endpoint that doesn't require authentication
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/creator/${creatorId}/simple`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch creator tracks: ${response.status} ${response.statusText}`);
    }

    let tracks = await response.json();
    
    // Filter out tracks without audio URLs
    tracks = tracks.filter((track: any) => 
      track.audioURL && track.audioURL.trim() !== ''
    );
    
    // Map the fields to match the Track interface used in the frontend
    return tracks.map((track: any) => ({
      ...track,
      audioUrl: track.audioURL || '',
      coverArt: track.coverURL || '',
      artist: track.creatorId?.name || 'Unknown Artist',
      duration: track.duration || 0,
      type: track.type || 'song', // Include track type for WhatsApp functionality
      creatorWhatsapp: track.creatorId?.whatsappContact || 
        ((track.creatorId && typeof track.creatorId === 'object' && track.creatorId !== null) 
          ? track.creatorId.whatsappContact 
          : undefined) // Include creator's WhatsApp contact
    }));
  } catch (error) {
    console.error('Error fetching creator tracks:', error);
    throw error;
  }
};

/**
 * Fetch tracks by creator ID
 * Filters out incomplete tracks (those without audio URLs)
 */
export const fetchTracksByCreator = async (creatorId: string, page: number = 1, limit: number = 10): Promise<PaginatedTracks> => {
  try {
    // This endpoint might require authentication depending on privacy settings
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/creator/${creatorId}?limit=${limit}&page=${page}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch creator tracks: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Filter out tracks without audio URLs
    if (data.tracks && Array.isArray(data.tracks)) {
      data.tracks = data.tracks.filter((track: any) => 
        track.audioURL && track.audioURL.trim() !== ''
      );
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching creator tracks:', error);
    throw error;
  }
};

/**
 * Fetch popular creators (users with role 'creator')
 */
export const fetchTracksByType = async (type: string, limit: number = 10): Promise<ITrack[]> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/type?type=${type}&limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch tracks by type: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching tracks by type:', error);
    throw error;
  }
};

export const fetchPopularCreators = async (limit: number = 10): Promise<any[]> => {
  try {
    // Use the new public creators endpoint that doesn't require any authentication
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/public/creators?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch popular creators: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.users;
  } catch (error) {
    console.error('Error fetching popular creators:', error);
    throw error;
  }
};

/**
 * Fetch comments for a track
 */
export const fetchCommentsForTrack = async (trackId: string): Promise<any[]> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/comments/track/${trackId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch comments: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};

/**
 * Add a comment to a track
 */
export const addCommentToTrack = async (trackId: string, text: string): Promise<any> => {
  try {
    const response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_URL}/api/comments`, {
      method: 'POST',
      body: JSON.stringify({ trackId, text })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to add comment');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

/**
 * Follow a creator
 */
export const followCreator = async (creatorId: string): Promise<boolean> => {
  try {
    // Get access token from localStorage
    let accessToken = localStorage.getItem('accessToken');
    
    if (!accessToken) {
      throw new Error('No access token found');
    }

    // Make API call to follow creator
    let response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/following/follow/${creatorId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    // If token is expired, try to refresh it
    if (response.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        // Try to refresh the token
        const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken })
        });
        
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          // Save new tokens
          localStorage.setItem('accessToken', refreshData.accessToken);
          localStorage.setItem('refreshToken', refreshData.refreshToken);
          
          // Retry the original request with new token
          accessToken = refreshData.accessToken;
          response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/following/follow/${creatorId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            }
          });
        } else {
          throw new Error('Token refresh failed');
        }
      } else {
        throw new Error('No refresh token found');
      }
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to follow creator');
    }

    return true;
  } catch (error) {
    console.error('Error following creator:', error);
    throw error;
  }
};

/**
 * Unfollow a creator
 */
export const unfollowCreator = async (creatorId: string): Promise<boolean> => {
  try {
    // Get access token from localStorage
    let accessToken = localStorage.getItem('accessToken');
    
    if (!accessToken) {
      throw new Error('No access token found');
    }

    // Make API call to unfollow creator
    let response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/following/unfollow/${creatorId}`, {
      method: 'DELETE',  // Using DELETE method for unfollow
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    // If token is expired, try to refresh it
    if (response.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        // Try to refresh the token
        const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken })
        });
        
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          // Save new tokens
          localStorage.setItem('accessToken', refreshData.accessToken);
          localStorage.setItem('refreshToken', refreshData.refreshToken);
          
          // Retry the original request with new token
          accessToken = refreshData.accessToken;
          response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/following/unfollow/${creatorId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            }
          });
        } else {
          throw new Error('Token refresh failed');
        }
      } else {
        throw new Error('No refresh token found');
      }
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to unfollow creator');
    }

    return true;
  } catch (error) {
    console.error('Error unfollowing creator:', error);
    throw error;
  }
};

/**
 * Check if user is following a creator
 */
export const checkFollowStatus = async (creatorId: string): Promise<boolean> => {
  try {
    let accessToken = localStorage.getItem('accessToken');
    
    if (!accessToken) {
      // If not authenticated, user is not following
      return false;
    }

    let response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/following/status/${creatorId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    // If token is expired, try to refresh it
    if (response.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        // Try to refresh the token
        const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken })
        });
        
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          // Save new tokens
          localStorage.setItem('accessToken', refreshData.accessToken);
          localStorage.setItem('refreshToken', refreshData.refreshToken);
          
          // Retry the original request with new token
          accessToken = refreshData.accessToken;
          response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/following/status/${creatorId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            }
          });
        } else {
          throw new Error('Token refresh failed');
        }
      } else {
        throw new Error('No refresh token found');
      }
    }

    if (!response.ok) {
      // If there's an error, assume not following
      return false;
    }

    const data = await response.json();
    return data.isFollowing || false;
  } catch (error) {
    console.error('Error checking follow status:', error);
    return false;
  }
};

/**
 * Increment track play count
 */
export const incrementTrackPlayCount = async (trackId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/${trackId}/play`, {
      method: 'PUT'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to increment play count');
    }

    return true;
  } catch (error) {
    console.error('Error incrementing track play count:', error);
    throw error;
  }
};

/**
 * Delete track
 */
export const deleteTrack = async (trackId: string): Promise<boolean> => {
  try {
    const response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/${trackId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete track');
    }

    return true;
  } catch (error) {
    console.error('Error deleting track:', error);
    throw error;
  }
};

/**
 * Get followed creators for a user
 */
export const getFollowedCreators = async (): Promise<any[]> => {
  try {
    let accessToken = localStorage.getItem('accessToken');
    
    if (!accessToken) {
      throw new Error('No access token found');
    }

    let response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/following`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    // If token is expired, try to refresh it
    if (response.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        // Try to refresh the token
        const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken })
        });
        
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          // Save new tokens
          localStorage.setItem('accessToken', refreshData.accessToken);
          localStorage.setItem('refreshToken', refreshData.refreshToken);
          
          // Retry the original request with new token
          accessToken = refreshData.accessToken;
          response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/following`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            }
          });
        } else {
          throw new Error('Token refresh failed');
        }
      } else {
        throw new Error('No refresh token found');
      }
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to get followed creators');
    }

    const data = await response.json();
    return data.creators || [];
  } catch (error) {
    console.error('Error getting followed creators:', error);
    throw error;
  }
};